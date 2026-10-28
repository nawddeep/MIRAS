/**
 * MIRAS · Gemini 3.8 Flash AI Service
 * Powered by Google Gemini 3.8 Flash multimodal reasoning & vision model.
 * Provides real-time monument recognition, surrounding panorama storytelling,
 * and voice-first artisan craft listing generation.
 */

const STORAGE_KEY = 'miras_gemini_api_key';
let inMemoryKey = null;

export const PRIMARY_GEMINI_MODEL = 'gemini-3.8-flash';
export const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

/**
 * Retrieve active Gemini API key from localStorage, memory, or Vite environment variable (.env)
 * @returns {string|null}
 */
export function getGeminiApiKey() {
  try {
    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch (e) {
    // Local storage access error / sandboxed iframe
  }

  if (inMemoryKey && inMemoryKey.trim()) {
    return inMemoryKey.trim();
  }

  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && !envKey.includes('your_gemini_api_key_here')) {
    return envKey.trim();
  }
  return null;
}

/**
 * Save Gemini API key to browser storage for local session testing
 * @param {string} key
 */
export function setGeminiApiKey(key) {
  const trimmed = key ? key.trim() : '';
  inMemoryKey = trimmed || null;
  try {
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Storage write restricted, stored key in active memory.', e);
  }
}

/**
 * Clear stored API key
 */
export function clearGeminiApiKey() {
  inMemoryKey = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

/**
 * Check if a valid key is configured
 * @returns {boolean}
 */
export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

/**
 * Execute Gemini generateContent request with gemini-3.8-flash (with graceful model fallback if needed)
 * @param {Array} contents
 * @param {Object} [generationConfig={}]
 * @returns {Promise<string>} Raw text output from candidate
 */
async function callGeminiApi(contents, generationConfig = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY: Gemini API Key is missing. Set it in .env (VITE_GEMINI_API_KEY) or in the Settings modal.');
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            ...generationConfig,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If 404 model not found on this particular API key endpoint, try fallback model
        if (response.status === 404 && model !== CANDIDATE_MODELS[CANDIDATE_MODELS.length - 1]) {
          console.warn(`[Gemini API] ${model} unavailable (404), trying fallback...`);
          lastError = new Error(`Model ${model} returned 404`);
          continue;
        }
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response received from Gemini.');
      }

      console.info(`[Gemini] Successfully responded using model: ${model}`);
      return rawText;
    } catch (err) {
      lastError = err;
      if (model === CANDIDATE_MODELS[CANDIDATE_MODELS.length - 1]) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

/**
 * Parse clean JSON from Gemini text response
 * @param {string} rawText
 * @returns {Object}
 */
function parseJsonSafe(rawText) {
  let cleanJsonText = rawText.trim();
  if (cleanJsonText.startsWith('```')) {
    cleanJsonText = cleanJsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  return JSON.parse(cleanJsonText);
}

/**
 * Analyze an image or panorama frame with Gemini 3.8 Flash
 * @param {string} base64Data Raw base64 string or data: URL
 * @param {string} [mimeType='image/jpeg']
 * @returns {Promise<Object>} Structured monument and surrounding stories object
 */
export async function analyzeMonumentWithGemini(base64Data, mimeType = 'image/jpeg') {
  let cleanBase64 = base64Data;
  if (cleanBase64.includes(';base64,')) {
    const parts = cleanBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '') || mimeType;
    cleanBase64 = parts[1];
  }

  const prompt = `You are an expert Indian architectural historian and monument identification AI for MIRAS, a living cultural heritage platform.
Analyze this photo (which may be a live camera snap or a wide panoramic photo of a monument/historic compound).

Identify the monument, its verified architectural history, and surrounding monuments/courtyards/bastions/water structures in the surrounding area.

Respond ONLY with a strict, valid JSON object without markdown fences, matching this schema:
{
  "isRecognized": true,
  "name": "Full Official Monument Name",
  "region": "City, State, Country",
  "dynasty": "Ruling Dynasty and Era (e.g. Kachhwaha Rajput (1799 CE))",
  "confidence": 94,
  "overview": "A rich 2-paragraph historical and architectural narrative of this specific monument, explaining who built it, why, its stone masonry style, and historical significance.",
  "stories": [
    {
      "title": "Primary Historical Legend or Event",
      "context": "Era / Architectural Context",
      "text": "Detailed authentic historical story about this monument."
    },
    {
      "title": "Architectural or Engineering Marvel",
      "context": "Design & Climate Engineering",
      "text": "Details on how the structure was designed, materials used, acoustic or airflow features."
    }
  ],
  "surroundingStories": [
    {
      "monument": "Name of Adjacent/Surrounding Landmark 1",
      "title": "Historical Title / Context",
      "content": "Rich, authentic historical narrative of this neighboring compound, courtyard, bastion, pavilion, observatory, stepwell, or lake connected to the panorama.",
      "source": "Archival inscription, ASI monograph, or historical chronicle"
    },
    {
      "monument": "Name of Adjacent/Surrounding Landmark 2",
      "title": "Historical Title / Context",
      "content": "Detailed historical story about this surrounding structure, its builder, and relation to the main site.",
      "source": "Archival inscription or court gazetteer"
    },
    {
      "monument": "Name of Adjacent/Surrounding Landmark 3",
      "title": "Historical Title / Context",
      "content": "Detailed historical narrative of another nearby architectural element in the panoramic horizon.",
      "source": "Archaeological survey reference"
    }
  ]
}

CRITICAL RULES:
1. If the photo does NOT depict any historical monument, heritage structure, ancient ruin, or cultural site (for example, if it is a modern office, living room, car, selfie, food plate, or pet), respond with:
{
  "isRecognized": false,
  "name": "Unrecognized Site",
  "region": "Unknown",
  "dynasty": "None",
  "confidence": 35,
  "overview": "",
  "stories": [],
  "surroundingStories": []
}
2. Ensure at least 3 distinct "surroundingStories" detailing the neighboring structures around this panorama.
3. No emojis in the output.`;

  const contents = [
    {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
      ],
    },
  ];

  const raw = await callGeminiApi(contents, {
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  });

  return parseJsonSafe(raw);
}

/**
 * Draft an artisan craft listing from voice transcript using Gemini 3.8 Flash
 * @param {string} transcript Spoken artisan speech in Hindi or English
 * @returns {Promise<Object>} Structured listing with bilingual descriptions & materials
 */
export async function draftArtisanListingWithGemini(transcript) {
  const prompt = `You are Gemini 3.8 Flash powering MIRAS, a living heritage marketplace for hereditary Indian artisans.
An artisan has spoken the following voice description of their craft:
"${transcript}"

Extract the craft details and return ONLY a strict JSON object with this schema:
{
  "craftType": "Name of Traditional Craft Form (e.g. Quartz Blue Pottery, Zardozi)",
  "suggestedPrice": 1800,
  "materials": ["Material 1", "Material 2", "Material 3"],
  "englishTitle": "Compelling Title for Global Travelers & Connoisseurs",
  "hindiTitle": "पारंपरिक प्रामाणिक हिन्दी शीर्षक",
  "englishDesc": "Engaging 2-sentence description of the craft technique, hereditary background, and provenance.",
  "hindiDesc": "कारीगर के अपने शब्दों पर आधारित सरल, प्रामाणिक 2-पंक्तियों का हिन्दी विवरण।"
}

RULES:
1. Estimate a fair artisan direct-trade price in Indian Rupees (INR, integer only).
2. Extract all authentic raw materials mentioned or historically required for this craft.
3. No emojis in the output.`;

  const contents = [
    {
      parts: [{ text: prompt }],
    },
  ];

  const raw = await callGeminiApi(contents, {
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
  });

  return parseJsonSafe(raw);
}
