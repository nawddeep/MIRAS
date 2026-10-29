import { beforeEach, describe, expect, it } from "vitest";
import { GET as mediaGET } from "@/app/api/media/[name]/route";
import { POST as cameraPOST } from "@/app/api/camera/match/route";
import { POST as draftPOST } from "@/app/api/onboard/draft/route";
import { POST as momentsPOST } from "@/app/api/memories/moments/route";
import { POST as submitPOST } from "@/app/api/onboard/submit/route";
import { limits } from "@/lib/rate-limit";
import { audioMatchesDeclared, sniffAudio, sniffImage } from "@/lib/sniff";
import { place, withFixture } from "./helpers";

const pad = (head: number[], size = 5000) => Buffer.concat([Buffer.from(head), Buffer.alloc(size, 1)]);
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0]);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(100)]);
const WEBM = pad([0x1a, 0x45, 0xdf, 0xa3]);
const OGG = Buffer.concat([Buffer.from("OggS"), Buffer.alloc(5000, 1)]);
const M4A = Buffer.concat([Buffer.alloc(4), Buffer.from("ftypM4A "), Buffer.alloc(5000, 1)]);
const TEXT = Buffer.from("this is plain text, not a picture or a recording ".repeat(200));

const file = (data: Buffer, name: string, type: string) => new File([new Uint8Array(data)], name, { type });
const post = (url: string, form: FormData) => new Request(`http://t${url}`, { method: "POST", body: form });

beforeEach(() => Object.values(limits).forEach((l) => l.reset()));

describe("first-byte sniffing", () => {
  it("recognises JPEG, PNG and WebP and nothing else", () => {
    expect([sniffImage(JPEG), sniffImage(PNG), sniffImage(WEBP)]).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(sniffImage(TEXT)).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });

  it("recognises the recording formats the browsers produce", () => {
    expect([sniffAudio(WEBM), sniffAudio(OGG), sniffAudio(M4A)]).toEqual(["webm", "ogg", "m4a"]);
    expect(sniffAudio(TEXT)).toBeNull();
  });

  it("a declared type must match the real format", () => {
    expect(audioMatchesDeclared("audio/webm", WEBM)).toBe(true);
    expect(audioMatchesDeclared("audio/m4a", M4A)).toBe(true);
    expect(audioMatchesDeclared("audio/webm", OGG)).toBe(false);
    expect(audioMatchesDeclared("audio/webm", TEXT)).toBe(false);
  });
});

describe("camera upload", () => {
  const send = (f: File) => {
    const form = new FormData();
    form.append("frame", f);
    return cameraPOST(post("/api/camera/match", form));
  };

  it("rejects a text file renamed .jpg with an image label (415)", async () => {
    withFixture({ places: [place()] });
    const res = await send(file(TEXT, "photo.jpg", "image/jpeg"));
    expect(res.status).toBe(415);
    expect((await res.json()).error).toMatch(/JPEG, PNG or WebP/);
  });

  it("accepts a real JPEG and a real PNG even when the label is wrong", async () => {
    withFixture({ places: [place()] });
    expect((await send(file(JPEG, "a.jpg", "image/jpeg"))).status).toBe(200);
    expect((await send(file(PNG, "a.jpg", "image/jpeg"))).status).toBe(200);
  });
});

describe("voice onboarding upload", () => {
  const send = (audio: File, image?: File) => {
    const form = new FormData();
    form.append("audio", audio);
    if (image) form.append("image", image);
    return draftPOST(post("/api/onboard/draft", form));
  };

  it("rejects a text file labelled audio/webm (415)", async () => {
    withFixture({});
    expect((await send(file(TEXT, "a.webm", "audio/webm"))).status).toBe(415);
  });

  it("rejects an Ogg recording that claims to be webm (mismatched header, 415)", async () => {
    withFixture({});
    expect((await send(file(OGG, "a.webm", "audio/webm"))).status).toBe(415);
  });

  it("rejects a text file sent as the photo (415)", async () => {
    withFixture({});
    expect((await send(file(WEBM, "a.webm", "audio/webm"), file(TEXT, "p.jpg", "image/jpeg"))).status).toBe(415);
  });

  it("accepts a real webm recording and a real photo", async () => {
    withFixture({});
    expect((await send(file(WEBM, "a.webm", "audio/webm;codecs=opus"), file(JPEG, "p.jpg", "image/jpeg"))).status).toBe(200);
  });

  it("accepts Safari's audio/mp4 recording", async () => {
    withFixture({});
    expect((await send(file(M4A, "a.m4a", "audio/mp4"))).status).toBe(200);
  });
});

describe("listing submit and memories uploads", () => {
  it("submit rejects a text file sent as the photo (415)", async () => {
    withFixture({});
    const form = new FormData();
    form.append(
      "data",
      JSON.stringify({ name: "N", craft: "C", description: "D", languages: ["Hindi"], contact: "123456", locationText: "Udaipur", consentAgreed: true, photoHasNoFaces: true, publish: false }),
    );
    form.append("photo", file(TEXT, "p.jpg", "image/jpeg"));
    expect((await submitPOST(post("/api/onboard/submit", form))).status).toBe(415);
  });

  it("memories rejects a text file among the frames (415)", async () => {
    withFixture({ places: [place()] });
    const form = new FormData();
    form.append("frames", file(JPEG, "1.jpg", "image/jpeg"));
    form.append("frames", file(TEXT, "2.jpg", "image/jpeg"));
    expect((await momentsPOST(post("/api/memories/moments", form))).status).toBe(415);
  });
});

describe("/api/media/[name] path safety", () => {
  const get = (name: string) => mediaGET(new Request("http://t/api/media/x"), { params: Promise.resolve({ name }) } as never);

  it.each([
    ["parent folder", "../package.json"],
    ["encoded slash decoded by the router", "..%2fpackage.json"],
    ["double-encoded", "%2e%2e%2fpackage.json"],
    ["absolute path", "/etc/passwd"],
    ["windows separator", "..\\package.json"],
    ["nested path", "uploads/a.jpg"],
    ["real-looking name with a traversal tail", "00000000-0000-0000-0000-000000000000.jpg/../../x"],
    ["empty name", ""],
    ["wrong extension", "00000000-0000-0000-0000-000000000000.svg"],
    ["a name that does not exist", "00000000-0000-0000-0000-000000000000.jpg"],
  ])("%s gives 404", async (_label, name) => {
    withFixture({});
    expect((await get(name)).status).toBe(404);
  });
});
