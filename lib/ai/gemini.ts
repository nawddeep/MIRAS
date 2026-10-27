import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ListingDraft, PlaceMatch } from "@/lib/schemas";
import type { AiProvider, DraftInput, MatchInput } from "./types";

// Gemini's schema field does not accept the "$schema" meta key that Zod adds.
const jsonSchema = (schema: z.ZodType) => {
  const out = z.toJSONSchema(schema) as Record<string, unknown>;
  delete out.$schema;
  return out;
};

const DRAFT_PROMPT = `You help a local artisan in Udaipur create a marketplace listing from their own voice recording.
Rules:
- Use ONLY what the speaker says in the recording and what is visible in the photo. Do not add history, legends, awards, prices, or claims they did not make.
- description_en: 2-4 plain English sentences. description_hi: the same meaning in simple Hindi (Devanagari).
- title: a short listing title. category: the craft in 1-3 words. materials: only materials they mention or that are clearly visible.
- uncertain_fields: list every field name you were not sure about (unclear audio, guessed spelling, inferred from photo only). If the recording is empty or unclear, put every field there and leave text fields empty.
- photo_shows_face: true if a person's face is clearly visible in the photo.
Return only JSON matching the schema.`;

const MATCH_PROMPT = (names: string) => `You identify which heritage site in Udaipur a visitor's camera photo shows.
Candidates (id: name): ${names}
Rules:
- Return placeId as one of the candidate ids, or null if the photo does not clearly show one of them.
- confidence is 0..1. Be conservative: dark, blurry, partial or ambiguous photos get low confidence.
- personIsMainSubject is true if a person is the main subject of the photo.
- Do not describe the place or write any text other than the JSON.`;

/** Gemini via the official Google Gen AI SDK. The model name always comes from GEMINI_MODEL; it is never guessed. */
export class GeminiAiProvider implements AiProvider {
  readonly name = "gemini" as const;
  private client: GoogleGenAI;

  constructor(
    apiKey: string,
    private model: string,
    timeoutMs = 30_000,
  ) {
    this.client = new GoogleGenAI({ apiKey, httpOptions: { timeout: timeoutMs } });
  }

  async draftListing(input: DraftInput) {
    const parts = [
      { inlineData: { mimeType: input.audioMime, data: input.audio.toString("base64") } },
      ...(input.image && input.imageMime ? [{ inlineData: { mimeType: input.imageMime, data: input.image.toString("base64") } }] : []),
      { text: DRAFT_PROMPT },
    ];
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", responseJsonSchema: jsonSchema(ListingDraft), temperature: 0.2 },
    });
    return res.text ?? "";
  }

  async matchPlace(input: MatchInput) {
    const names = input.candidates.map((c) => `${c.id}: ${c.name}`).join("; ");
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType: input.imageMime, data: input.image.toString("base64") } }, { text: MATCH_PROMPT(names) }],
        },
      ],
      config: { responseMimeType: "application/json", responseJsonSchema: jsonSchema(PlaceMatch), temperature: 0 },
    });
    return res.text ?? "";
  }
}
