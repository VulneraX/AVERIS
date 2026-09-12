import https from "node:https";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { problem } from "./service.mjs";
export function isPublicIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 2) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0)
  );
}
export async function fetchSource(url) {
  let target;
  try {
    target = new URL(url);
  } catch {
    problem(400, "INVALID_URL", "Enter a valid HTTPS source URL.");
  }
  if (
    target.protocol !== "https:" ||
    target.username ||
    target.password ||
    (target.port && target.port !== "443")
  )
    problem(
      400,
      "INVALID_URL",
      "Only public HTTPS sources on port 443 are supported.",
    );
  const records = await lookup(target.hostname, { all: true });
  if (!records.length || records.some((r) => !isPublicIPv4(r.address)))
    problem(
      400,
      "PRIVATE_SOURCE",
      "Use a publicly reachable IPv4 HTTPS source, or paste internal policy text.",
    );
  const address = records[0].address;
  return new Promise((resolve, reject) => {
    const request = https.get(
      target,
      {
        timeout: 8000,
        lookup: (_host, _options, callback) =>
          callback(null, [{ address, family: 4 }]),
        headers: {
          "User-Agent": "AVERIS-Source-Importer/2.0",
          Accept: "text/plain,text/html",
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(
            Object.assign(
              new Error(
                "The source could not be fetched. Redirects are not followed; use the final source URL.",
              ),
              { status: 400, code: "SOURCE_FETCH_FAILED" },
            ),
          );
          return;
        }
        if (
          !/text\/(?:plain|html)/i.test(response.headers["content-type"] || "")
        ) {
          response.resume();
          reject(
            Object.assign(
              new Error(
                "Use a text/HTML source URL or upload the document separately.",
              ),
              { status: 400, code: "SOURCE_TYPE" },
            ),
          );
          return;
        }
        let bytes = 0;
        const chunks = [];
        response.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 1000000) {
            request.destroy(new Error("Source exceeds the 1 MB import limit."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          const source = Buffer.concat(chunks)
            .toString("utf8")
            .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40000);
          resolve(source);
        });
      },
    );
    request.on("timeout", () =>
      request.destroy(new Error("Source import timed out.")),
    );
    request.on("error", () =>
      reject(
        Object.assign(
          new Error("The source could not be read. Paste its text instead."),
          { status: 400, code: "SOURCE_FETCH_FAILED" },
        ),
      ),
    );
  });
}
