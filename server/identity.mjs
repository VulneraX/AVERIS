import {
  createHmac,
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  const bits = [...randomBytes(20)]
    .map((n) => n.toString(2).padStart(8, "0"))
    .join("");
  return bits
    .match(/.{5}/g)
    .map((b) => alphabet[parseInt(b, 2)])
    .join("");
}
export function totp(secret, step = Math.floor(Date.now() / 30000)) {
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac("sha1", key).update(counter).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export function seal(value, secret) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    nonce,
  );
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), data]).toString("base64");
}
export function unseal(value, secret) {
  const bytes = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    bytes.subarray(0, 12),
  );
  cipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([
    cipher.update(bytes.subarray(28)),
    cipher.final(),
  ]).toString("utf8");
}
export function verifyMfa(db, userId, code, secret) {
  const policy = db
    .prepare("SELECT * FROM identity_policy WHERE user_id=?")
    .get(userId);
  if (!policy?.mfa_enabled) return true;
  if (!/^\d{6}$/.test(code || "")) return false;
  const key = unseal(policy.mfa_secret, secret);
  const current = Math.floor(Date.now() / 30000);
  for (const step of [current, current - 1, current + 1]) {
    if (step <= (policy.last_totp_step || 0)) continue;
    if (timingSafeEqual(Buffer.from(totp(key, step)), Buffer.from(code))) {
      return Boolean(
        db
          .prepare(
            "UPDATE identity_policy SET last_totp_step=? WHERE user_id=? AND (last_totp_step IS NULL OR last_totp_step<?)",
          )
          .run(step, userId, step).changes,
      );
    }
  }
  return false;
}
