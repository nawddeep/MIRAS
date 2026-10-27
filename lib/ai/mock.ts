import type { AiProvider } from "./types";

/** Default provider when Gemini is not configured. Everything it returns is shown as "Demo response". */
export class MockAiProvider implements AiProvider {
  readonly name = "mock" as const;

  async draftListing() {
    return {
      title: "Demo response: listing title from your recording",
      description_en: "Demo response: the English description of your work will appear here once AI is configured.",
      description_hi: "डेमो जवाब: AI चालू होने पर आपके काम का हिंदी विवरण यहाँ आएगा।",
      category: "Demo craft",
      materials: ["demo material"],
      uncertain_fields: ["category", "materials"],
    };
  }

  /** The mock cannot see. It never claims a match; the UI offers a manual place picker instead. */
  async matchPlace() {
    return { placeId: null, confidence: 0, personIsMainSubject: false };
  }
}
