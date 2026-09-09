import * as oidc from "openid-client";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { seal, unseal } from "./identity.mjs";

export const ssoConfigured = () =>
  [
    "OIDC_ISSUER",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "OIDC_ORG_SLUG",
    "PUBLIC_APP_URL",
  ].every((key) => Boolean(process.env[key]));
const digest = (value) => createHash("sha256").update(value).digest("hex");

// Single explicitly configured issuer and organization. This adapter does not
// provision users or infer a role from identity-provider claims.
export function registerSSO(
  app,
  { db, sessionSecret, writeAudit, loginLimiter },
) {
  let discovery;
  const config = async () => {
    if (!ssoConfigured()) throw new Error("SSO_NOT_CONFIGURED");
    const issuer = new URL(process.env.OIDC_ISSUER);
    const origin = new URL(process.env.PUBLIC_APP_URL);
    if (issuer.protocol !== "https:" || origin.protocol !== "https:")
      throw new Error("SSO_REQUIRES_HTTPS");
    if (!discovery)
      discovery = oidc
        .discovery(
          issuer,
          process.env.OIDC_CLIENT_ID,
          process.env.OIDC_CLIENT_SECRET,
          undefined,
          { execute: [oidc.enableNonRepudiationChecks], timeout: 10 },
        )
        .catch((error) => {
          discovery = undefined;
          throw error;
        });
    return discovery;
  };
  const callback = () =>
    new URL("/api/auth/sso/callback", process.env.PUBLIC_APP_URL).href;
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/sso",
    maxAge: 600000,
  };
  app.get("/api/auth/options", (_req, res) =>
    res.json({ ssoConfigured: ssoConfigured() }),
  );
  app.get("/api/auth/sso/start", loginLimiter, async (_req, res) => {
    res.set("Cache-Control", "no-store");
    if (!ssoConfigured())
      return res.status(503).json({
        error: {
          code: "SSO_NOT_CONFIGURED",
          message: "Single sign-on is not configured.",
        },
      });
    try {
      const client = await config();
      const state = oidc.randomState(),
        nonce = oidc.randomNonce(),
        verifier = oidc.randomPKCECodeVerifier();
      const now = new Date().toISOString();
      db.prepare("DELETE FROM sso_flows WHERE expires_at<?").run(now);
      db.prepare(
        "INSERT INTO sso_flows(state_hash,verifier,nonce,expires_at) VALUES (?,?,?,?)",
      ).run(
        digest(state),
        seal(verifier, sessionSecret),
        nonce,
        new Date(Date.now() + 600000).toISOString(),
      );
      res.cookie("averis_sso_flow", state, cookieOptions);
      res.redirect(
        oidc.buildAuthorizationUrl(client, {
          redirect_uri: callback(),
          scope: "openid email profile",
          state,
          nonce,
          code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
          code_challenge_method: "S256",
          response_mode: "query",
        }).href,
      );
    } catch {
      res.redirect("/?sso=unavailable");
    }
  });
  app.get("/api/auth/sso/callback", loginLimiter, async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.clearCookie("averis_sso_flow", cookieOptions);
    if (!ssoConfigured())
      return res.status(503).json({
        error: {
          code: "SSO_NOT_CONFIGURED",
          message: "Single sign-on is not configured.",
        },
      });
    try {
      const state = req.cookies.averis_sso_flow;
      if (typeof state !== "string" || state !== req.query.state)
        throw new Error("STATE");
      const flow = db
        .prepare(
          "DELETE FROM sso_flows WHERE state_hash=? AND expires_at>? RETURNING *",
        )
        .get(digest(state), new Date().toISOString());
      if (!flow) throw new Error("FLOW");
      const client = await config();
      // Use configured origin, never untrusted Host or redirect input.
      const current = new URL(callback());
      current.search = new URL(
        req.originalUrl,
        "https://callback.invalid",
      ).search;
      const tokens = await oidc.authorizationCodeGrant(client, current, {
        expectedState: state,
        expectedNonce: flow.nonce,
        pkceCodeVerifier: unseal(flow.verifier, sessionSecret),
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (
        !claims ||
        !claims.sub ||
        claims.email_verified !== true ||
        typeof claims.email !== "string"
      )
        throw new Error("CLAIMS");
      const linked = db
        .prepare(
          "SELECT u.* FROM oidc_identities i JOIN users u ON u.id=i.user_id JOIN organizations o ON o.id=u.organization_id WHERE i.issuer=? AND i.subject=? AND o.slug=?",
        )
        .get(claims.iss, claims.sub, process.env.OIDC_ORG_SLUG);
      const user =
        linked ||
        db
          .prepare(
            "SELECT u.* FROM users u JOIN organizations o ON o.id=u.organization_id WHERE lower(u.email)=? AND o.slug=?",
          )
          .get(claims.email.toLowerCase(), process.env.OIDC_ORG_SLUG);
      if (!user?.active) throw new Error("USER");
      const policy = db
        .prepare("SELECT * FROM identity_policy WHERE user_id=?")
        .get(user.id);
      if (
        policy?.mfa_enabled &&
        !(Array.isArray(claims.amr) && claims.amr.includes("mfa"))
      )
        throw new Error("MFA");
      db.transaction(() => {
        if (!linked)
          db.prepare(
            "INSERT INTO oidc_identities(issuer,subject,user_id,created_at) VALUES (?,?,?,?)",
          ).run(claims.iss, claims.sub, user.id, new Date().toISOString());
        const token = randomBytes(32).toString("base64url"),
          id = randomUUID(),
          duration = 12 * 60 * 60 * 1000;
        db.prepare(
          "INSERT INTO sessions(id,user_id,token_hash,expires_at,ip_address,user_agent) VALUES (?,?,?,?,?,?)",
        ).run(
          id,
          user.id,
          createHmac("sha256", sessionSecret).update(token).digest("hex"),
          new Date(Date.now() + duration).toISOString(),
          req.ip,
          req.get("user-agent")?.slice(0, 500) || null,
        );
        writeAudit({
          organizationId: user.organization_id,
          actorUserId: user.id,
          action: "auth.sso_login",
          entityType: "session",
          entityId: id,
          metadata: { issuer: claims.iss },
        });
        res.cookie("averis_session", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: duration,
        });
      })();
      res.redirect("/");
    } catch {
      res.redirect("/?sso=failed");
    }
  });
}
