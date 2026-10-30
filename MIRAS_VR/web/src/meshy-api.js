/**
 * MIRAS VR · Meshy Image-to-3D Integration Service
 * Generates custom 3D humanoid GLB characters from user portrait photos.
 * Strict Zero Emojis.
 */

const PROXY_ENDPOINT = '/api/meshy/openapi/v1/image-to-3d';
const DIRECT_ENDPOINT = 'https://api.meshy.ai/openapi/v1/image-to-3d';
const STORAGE_KEY = 'miras_meshy_api_key';

export function getSavedMeshyApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function saveMeshyApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[Meshy API] Could not persist API key to localStorage', e);
  }
}

/**
 * Creates an Image to 3D task on Meshy.
 * @param {Object} params
 * @param {string} params.apiKey Meshy Bearer token
 * @param {string} params.imageUrl Public URL or base64 data URI (image/jpeg, image/png, image/webp)
 * @param {string} [params.aiModel='latest'] 'latest' | 'meshy-7.1' | 'meshy-6'
 * @param {string} [params.modelType='standard'] 'standard' | 'smart-topology'
 * @returns {Promise<{taskId: string}>}
 */
export async function createImageTo3DTask({ apiKey, imageUrl, aiModel = 'latest', modelType = 'standard' }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Meshy API key is required. Please provide your API key.');
  }
  if (!imageUrl) {
    throw new Error('Image URL or base64 data URI is required.');
  }

  const payload = {
    image_url: imageUrl,
    ai_model: aiModel,
    model_type: modelType,
    should_texture: true,
    enable_pbr: true,
    pose_mode: 'a-pose',
    target_formats: ['glb'],
  };

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Content-Type': 'application/json',
  };

  // Try local dev server proxy first; fallback to direct Meshy endpoint
  let response = null;
  let lastErr = null;

  try {
    response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    lastErr = err;
  }

  // If proxy returned 404 or connection failed, fallback to direct endpoint
  if (!response || (!response.ok && response.status === 404)) {
    try {
      response = await fetch(DIRECT_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (directErr) {
      throw new Error(`Failed to contact Meshy API: ${directErr.message || lastErr?.message}`);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || (data.task_error && data.task_error.message) || `HTTP ${response.status}`;
    throw new Error(`Meshy Task Creation Failed: ${errorMsg}`);
  }

  const taskId = data.result;
  if (!taskId) {
    throw new Error('Meshy API response did not contain a task ID.');
  }

  return { taskId };
}

/**
 * Polls an existing Image to 3D task until completion.
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.taskId
 * @param {Function} [params.onProgress] Callback receiving (percent, statusText)
 * @param {number} [params.intervalMs=3000]
 * @param {number} [params.timeoutMs=600000] 10 minute timeout
 * @returns {Promise<{glbUrl: string, raw: Object}>}
 */
export async function pollImageTo3DTask({
  apiKey,
  taskId,
  onProgress = () => {},
  intervalMs = 3000,
  timeoutMs = 600000,
}) {
  const startTime = Date.now();
  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
  };

  while (Date.now() - startTime < timeoutMs) {
    let response = null;

    try {
      response = await fetch(`${PROXY_ENDPOINT}/${taskId}`, { headers });
    } catch (e) {
      // proxy error, will try direct
    }

    if (!response || (!response.ok && response.status === 404)) {
      response = await fetch(`${DIRECT_ENDPOINT}/${taskId}`, { headers });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.message || (errData.task_error && errData.task_error.message) || `HTTP ${response.status}`;
      throw new Error(`Meshy Poll Failed: ${msg}`);
    }

    const data = await response.json();
    const status = (data.status || '').toUpperCase();
    const progress = typeof data.progress === 'number' ? data.progress : 0;

    onProgress(progress, status);

    if (status === 'SUCCEEDED') {
      const glbUrl = data.model_urls && data.model_urls.glb;
      if (!glbUrl) {
        throw new Error('Task succeeded but no GLB model URL was provided by Meshy.');
      }
      return {
        glbUrl,
        raw: data,
      };
    }

    if (status === 'FAILED' || status === 'EXPIRED') {
      const reason = (data.task_error && data.task_error.message) || status;
      throw new Error(`Meshy 3D generation failed: ${reason}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Meshy 3D generation timed out after 10 minutes.');
}
