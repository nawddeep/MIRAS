import { describe, expect, it } from "vitest";
import OwnerPage from "@/app/owner/[token]/page";
import nextConfig from "../../next.config";
import { getRepos } from "@/lib/repos";
import { createListing, type ListingSubmission } from "@/lib/services/onboarding";
import { artisan, withFixture } from "./helpers";

const enquiry = (id: string, artisanId: string, message: string, createdAt: string) => ({
  id,
  artisanId,
  message,
  contactBack: "visitor@example.invalid",
  kind: "question" as const,
  createdAt,
});

describe("security headers", () => {
  it("sends nosniff, referrer, frame and permissions headers on every path, and no CSP", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    const h = Object.fromEntries(rules[0].headers.map((x) => [x.key, x.value]));
    expect(h).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self)",
    });
    expect(Object.keys(h).join()).not.toMatch(/content-security-policy/i);
  });
});

describe("edit tokens", () => {
  const sub: ListingSubmission = {
    name: "N",
    craft: "C",
    description: "D",
    materials: [],
    languages: ["Hindi"],
    contact: "123456",
    locationText: "Udaipur",
    consentAgreed: false,
    photoHasNoFaces: false,
    publish: false,
  };

  it("new tokens carry at least 128 bits (24 random bytes, base64url) and are unique", () => {
    withFixture({});
    const storage = {
      saveImage: () => {
        throw new Error("no photo");
      },
      read: () => undefined,
    };
    const a = createListing(sub, undefined, storage).artisan.editToken;
    const b = createListing(sub, undefined, storage).artisan.editToken;
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(a).not.toBe(b);
  });

  it("an existing, shorter token still works; wrong, truncated, extended and empty tokens do not", () => {
    withFixture({ artisans: [artisan({ id: "a1", editToken: "old-token-0123456789" })] });
    const repo = getRepos().artisans;
    expect(repo.getByEditToken("old-token-0123456789")?.id).toBe("a1");
    for (const bad of ["old-token-012345678", "old-token-01234567890", "OLD-TOKEN-0123456789", ""]) {
      expect(repo.getByEditToken(bad)).toBeUndefined();
    }
  });
});

describe("owner page and enquiries", () => {
  const setup = () => {
    const { repos } = withFixture({
      artisans: [artisan({ id: "a1", editToken: "token-for-a1-0123456789" }), artisan({ id: "a2", name: "Other Maker", editToken: "token-for-a2-0123456789" })],
    });
    repos.enquiries.create(enquiry("e1", "a1", "Older question for the first maker", "2026-10-27T10:00:00.000Z"));
    repos.enquiries.create(enquiry("e2", "a1", "Newer question for the first maker", "2026-10-28T10:00:00.000Z"));
    repos.enquiries.create(enquiry("e3", "a2", "Private message for the second maker", "2026-10-28T11:00:00.000Z"));
  };
  const render = async (token: string) => JSON.stringify(await OwnerPage({ params: Promise.resolve({ token }) } as never));

  it("a valid token shows only its own enquiries, newest first", async () => {
    setup();
    const html = await render("token-for-a1-0123456789");
    expect(html).toContain("Newer question for the first maker");
    expect(html).toContain("Older question for the first maker");
    expect(html.indexOf("Newer question")).toBeLessThan(html.indexOf("Older question"));
    expect(html).not.toContain("Private message for the second maker");
    expect(html).toContain("visitor@example.invalid");
  });

  it("a wrong token shows nothing: the page is a 404", async () => {
    setup();
    await expect(render("token-for-a1-0123456780")).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
