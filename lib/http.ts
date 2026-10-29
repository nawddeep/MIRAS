import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const CLIENT_COOKIE = "miras_cid";
const COOKIE_ID = /^[A-Za-z0-9_-]{24,64}$/;
const ANON = "anon";

/** Behind cloudflared or ngrok set TRUST_PROXY=true. Otherwise forwarded headers are ignored: any client can forge them. */
const trustProxy = () => process.env.TRUST_PROXY === "true";

function cookieId(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${CLIENT_COOKIE}=`));
  const value = match?.slice(CLIENT_COOKIE.length + 1);
  return value && COOKIE_ID.test(value) ? value : undefined;
}

/**
 * Best-effort client key for rate limiting.
 * TRUST_PROXY=true: cf-connecting-ip, else the LAST x-forwarded-for hop (the one our proxy added), never the first.
 * Otherwise: an anonymous httpOnly cookie id. A request without a valid cookie shares one "anon" bucket and is given a
 * cookie for next time, so clearing cookies gains nothing. A forged cookie only gets its own bucket; the global ceiling bounds that.
 */
export async function clientKey(req: Request): Promise<string> {
  if (trustProxy()) {
    const cf = req.headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
    const hops = req.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
    const last = hops?.[hops.length - 1];
    if (last) return last;
    return req.headers.get("x-real-ip") || ANON;
  }
  const id = cookieId(req);
  if (id) return `c:${id}`;
  try {
    (await cookies()).set(CLIENT_COOKIE, randomBytes(18).toString("base64url"), { httpOnly: true, sameSite: "lax", path: "/" });
  } catch {
    // Outside a request (unit tests) or cookies unavailable: the visitor still gets the shared bucket.
  }
  return ANON;
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
