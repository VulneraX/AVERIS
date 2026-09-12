import { useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Link2,
  Plus,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import {
  Button,
  Dialog,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
} from "../ui";
import { act, useIntelligence } from "./shared";
export function Connections() {
  const r = useIntelligence("/integrations");
  const [create, setCreate] = useState(false);
  const [secret, setSecret] = useState<any>(null);
  const [revoke, setRevoke] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="AVERIS SENSE"
        title="Integrations"
        description="Connect verified security signals. Named connectors are shown only as implemented or planned."
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={15} />
            Create signal connector
          </Button>
        }
      />
      <div className="intel-privacy-note">
        <ShieldCheck size={17} />
        Identity and exposure remain unmeasured until a source provides relevant
        evidence. No data is inferred from an unconnected integration.
      </div>
      <Loading resource={r}>
        <div className="intel-connections-grid">
          {r.data?.integrations.map((integration: any) => (
            <div className="sheet" key={integration.name}>
              <Link2 size={20} />
              <h3>{integration.name}</h3>
              <p>{integration.category}</p>
              <span
                className={`intel-status ${integration.status === "Configured" || integration.status === "Available" ? "positive" : ""}`}
              >
                {integration.status}
              </span>
            </div>
          ))}
        </div>
        <section className="sheet section">
          <div className="section-head">
            <h2>Incoming signal connectors</h2>
            <span className="intel-status">Signed webhook / REST API</span>
          </div>
          {r.data?.connectors.length ? (
            r.data.connectors.map((c: any) => (
              <div className="intel-activity-row" key={c.id}>
                <KeyRound size={18} />
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {c.last_seen_at
                      ? `Last signal: ${new Date(c.last_seen_at).toLocaleString()}`
                      : "No signals received yet"}
                  </small>
                </div>
                <span className="intel-status">
                  {c.active ? "Active" : "Revoked"}
                </span>
                {c.active && (
                  <Button variant="secondary" onClick={() => setRevoke(c)}>
                    Revoke
                  </Button>
                )}
              </div>
            ))
          ) : (
            <Empty
              title="No incoming connector configured"
              description="Create a scoped connector for verified identity, exposure, and behavioral signals. Each request requires a token, timestamp, delivery ID, and HMAC signature."
            />
          )}
        </section>
        <details className="sheet section">
          <summary>Signal contract and signing</summary>
          <div className="intel-form">
            <p>
              POST to the connector endpoint with a JSON body containing an{" "}
              <code>events</code> array. Each event includes <code>userId</code>
              , <code>kind</code>, <code>topic</code>, <code>sourceId</code>,{" "}
              <code>description</code>, and ISO <code>occurredAt</code>.
              Exposure measurements also require a <code>value</code> from
              0–100.
            </p>
            <p>
              Use <code>Authorization: Bearer TOKEN</code>. Sign the exact body
              bytes with HMAC-SHA256 using the signing secret and prefix{" "}
              <code>timestamp.deliveryId.</code>. Send the hexadecimal signature
              in <code>X-AVERIS-Signature</code>, the millisecond timestamp in{" "}
              <code>X-AVERIS-Timestamp</code>, and a unique ID in{" "}
              <code>X-AVERIS-Delivery-Id</code>.
            </p>
            <p>
              Signatures expire after five minutes. Delivery IDs and source
              events are deduplicated. Employee IDs must belong to this
              connector’s organization. Full instructions are in the
              repository’s AVERIS 2.0 operations guide.
            </p>
          </div>
        </details>
      </Loading>
      <ErrorNotice error={error} />
      {create && (
        <Dialog
          title="Create a scoped signal connector"
          onClose={() => setCreate(false)}
        >
          <form
            className="intel-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                setSecret(await act("/connectors", { name: f.get("name") }));
                setCreate(false);
                r.reload();
              } catch (e) {
                setError(e);
              }
            }}
          >
            <Field label="Connector name">
              <input
                name="name"
                required
                minLength={3}
                maxLength={120}
                placeholder="Internal email-security telemetry"
              />
            </Field>
            <p>
              Credentials are displayed once. Store them in your secret manager.
            </p>
            <ErrorNotice error={error} />
            <Button>Create connector</Button>
          </form>
        </Dialog>
      )}
      {secret && (
        <Dialog
          title="Save these connector credentials"
          onClose={() => {
            setSecret(null);
            setCopied(false);
          }}
        >
          <div className="intel-form">
            <p>These secrets will not be displayed again.</p>
            {[
              ["Endpoint", secret.endpoint],
              ["Bearer token", secret.token],
              ["Signing secret", secret.signingSecret],
            ].map(([label, value]) => (
              <Field label={label} key={label}>
                <input
                  readOnly
                  value={value}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
            ))}
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    JSON.stringify(secret, null, 2),
                  );
                  setCopied(true);
                } catch {
                  setCopied(false);
                  setError(
                    new Error(
                      "Clipboard unavailable. Select and copy the fields manually.",
                    ),
                  );
                }
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy credentials"}
            </Button>
            <ErrorNotice error={error} />
          </div>
        </Dialog>
      )}
      {revoke && (
        <Dialog
          title="Revoke signal connector?"
          onClose={() => setRevoke(null)}
        >
          <div className="intel-form">
            <p>
              {revoke.name} will no longer be able to submit security signals.
              Existing evidence remains available under the retention policy.
            </p>
            <Button
              onClick={async () => {
                try {
                  await act(`/connectors/${revoke.id}/revoke`);
                  setRevoke(null);
                  r.reload();
                } catch (e) {
                  setError(e);
                }
              }}
            >
              <Unplug size={15} />
              Revoke connector
            </Button>
            <ErrorNotice error={error} />
          </div>
        </Dialog>
      )}
    </div>
  );
}
