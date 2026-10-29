// Content of the /roadmap pitch page. English only: a Hindi version needs a native speaker (see CONTENT_TODO.md).
// Every "today" sentence was checked against the code. A "built" item must name the route and the file that prove it.
// Never upgrade a status to make the page look better. No prices, no ratings, no counts of people.

export type RoadmapStatus = "built" | "concept" | "not_planned";

/** The only status wording allowed on the page. */
export const STATUS_LABEL: Record<RoadmapStatus, string> = {
  built: "Built (prototype)",
  concept: "Concept",
  not_planned: "Not planned yet",
};

export type RoadmapItem = {
  id: string;
  name: string;
  status: RoadmapStatus;
  /** One sentence: what the idea is. */
  what: string;
  /** What exists today, or "Nothing yet". */
  today: string;
  /** What must be true before it is built. */
  before: string[];
  /** Built items only: the route a judge can open, and the file in this repository that proves it. */
  evidence: { route: string; file: string }[];
};

export const ROADMAP: RoadmapItem[] = [
  {
    id: "badges-passport",
    name: "Badges and passport",
    status: "built",
    what: "A stamp for each place whose story you have opened.",
    today:
      "You earn a stamp by reading or listening to a place's story. Stamps are saved in your browser only, are not checked against your location, and there is no leaderboard.",
    before: ["Decide what a badge is allowed to prove, because today it only shows which stories were opened on one device", "Keep badges on the device, or add accounts first"],
    evidence: [{ route: "/passport", file: "app/passport/page.tsx" }],
  },
  {
    id: "social-profiles",
    name: "Social layer and profiles",
    status: "not_planned",
    what: "Profiles and sharing between visitors.",
    today: "Nothing yet.",
    before: ["Accounts", "Moderation", "Reporting and blocking", "A policy for minors"],
    evidence: [],
  },
  {
    id: "live-stories",
    name: "Live stories and real-time sync",
    status: "not_planned",
    what: "Moments and stories shared live between visitors.",
    today: "Nothing is shared or live. A visitor's memories reel is saved only on their own device.",
    before: ["Moderation before anything is published", "Storage rules for photos and faces", "A real server that supports live connections"],
    evidence: [],
  },
  {
    id: "memories",
    name: "Memories (digital passport)",
    status: "built",
    what: "A short highlight reel made from your own photos of a visit.",
    today:
      "You choose up to five of your own photos or clips. They are shrunk on your phone and sent to an AI model for captions, and are not stored on our server. A frame that may show a face asks you what to do with it, and blurring covers the whole frame. The reel is saved on your device, you can delete it, and it is a reel inside the app, not an exported video. Without an AI key the captions are placeholders labelled Demo response.",
    before: ["Rights for any music (the music slot is empty today)", "Decide on privacy levels if sharing is ever added"],
    evidence: [{ route: "/memories", file: "app/memories/page.tsx" }],
  },
  {
    id: "bookings-commerce",
    name: "Bookings and commerce",
    status: "not_planned",
    what: "Booking a workshop or buying from a maker inside the app.",
    today:
      "Enquiries only. A visitor sends a maker a question or an appointment request, and the maker replies outside the app. There are no bookings and no payments, and the app says so.",
    before: ["A licensed payment provider", "Verified businesses", "Refunds and disputes", "A compliance review (see docs/PHASE6_NOT_BUILT.md)"],
    evidence: [],
  },
  {
    id: "verified-artisans",
    name: "Verified artisans hub",
    status: "built",
    what: "A showcase of local makers who have agreed to be listed.",
    today:
      "A listing cannot go live without recorded consent and the owner's own confirmation. Makers confirm their workshops before they show, and a workshop carries a free-text cost note written by the maker. There are no products and no checkout. The makers in this demo are samples and are marked as sample.",
    before: ["Real signed consent from each artisan", "For craft-origin claims such as GI status, evidence for each claim"],
    evidence: [
      { route: "/artisans", file: "app/artisans/page.tsx" },
      { route: "/onboard", file: "app/onboard/page.tsx" },
      { route: "/owner (private link)", file: "app/owner/[token]/page.tsx" },
    ],
  },
  {
    id: "hidden-places",
    name: "Hidden places and maps",
    status: "built",
    what: "Local favourites suggested by visitors and checked by a person.",
    today:
      "Visitors can suggest a hidden place. Nothing shows until a named moderator approves it and notes who sourced it. The suggestion form does not collect coordinates, and a place marked sensitive never shows one. There is no map.",
    before: ["A maps provider and its terms", "Verified coordinates and sources for each pick"],
    evidence: [
      { route: "/picks", file: "app/picks/page.tsx" },
      { route: "/admin/moderation", file: "app/admin/moderation/page.tsx" },
    ],
  },
  {
    id: "companion-guides",
    name: "Companion guides",
    status: "not_planned",
    what: "A local person who accompanies a visitor.",
    today: "Nothing yet.",
    before: ["Identity checks", "Safety rules", "Insurance", "Legal review", "A way to report problems", "Live location sharing between strangers needs all of these"],
    evidence: [],
  },
  {
    id: "mobility-rentals",
    name: "Local mobility rentals",
    status: "not_planned",
    what: "Renting a local vehicle through the app.",
    today: "Nothing yet.",
    before: ["Licensed operators", "Insurance", "Deposits and rental terms", "Local rules for each vehicle type"],
    evidence: [],
  },
];

/** Counts are computed from the data above, never typed by hand. */
export function roadmapCounts(items: RoadmapItem[] = ROADMAP): Record<RoadmapStatus, number> {
  const counts: Record<RoadmapStatus, number> = { built: 0, concept: 0, not_planned: 0 };
  for (const i of items) counts[i.status]++;
  return counts;
}
