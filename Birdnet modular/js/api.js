/**
 * API Module - Handles all API calls to BirdNET-Go
 */

export const API_CONFIG = {
    baseUrl: 'http://192.168.68.129:8080/api/v2',
    audioBaseUrl: 'http://192.168.68.129:8080/api/v1/media/audio',
    refreshInterval: 60000, // 1 minute
    get initialLoadLimit() {
        // Load from localStorage, fallback to 5000
        const saved = localStorage.getItem('initialLoadLimit');
        return saved ? parseInt(saved, 10) : 5000;
    },
    set initialLoadLimit(value) {
        localStorage.setItem('initialLoadLimit', value.toString());
    }
};

/**
 * Fetch species summary from API
 */
export async function fetchSpecies() {
    try {
        const url = `${API_CONFIG.baseUrl}/analytics/species/summary`;
        console.log(`📡 Fetching species from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const species = Array.isArray(data) ? data : [];

        console.log(`✅ API returned ${species.length} species`);

        return species;
    } catch (error) {
        console.warn('Species endpoint failed:', error);
        return [];
    }
}

/**
 * Fetch recent detections from API with pagination support
 * @param {Date} sinceTime - Optional: Only fetch detections newer than this time (for incremental loading)
 * Fetches multiple pages to get up to 2000 detections for accurate daily counts
 */
export async function fetchDetections(sinceTime = null) {
    try {
        const endpoints = [
            { base: '/detections', limit: 100 },
            { base: '/notes', limit: 100 }
        ];

        for (const endpoint of endpoints) {
            try {
                const allDetections = [];
                let offset = 0;
                const maxDetections = sinceTime ? 200 : API_CONFIG.initialLoadLimit; // Incremental: 2 pages, Initial: use config
                let hasMorePages = true;

                if (sinceTime) {
                    console.log(`📡 Fetching NEW detections from: ${endpoint.base} (since ${sinceTime.toLocaleString()})`);
                } else {
                    console.log(`📡 Fetching paginated detections from: ${endpoint.base} (limit: ${API_CONFIG.initialLoadLimit})`);
                }

                while (hasMorePages && allDetections.length < maxDetections) {
                    const url = `${API_CONFIG.baseUrl}${endpoint.base}?limit=${endpoint.limit}&offset=${offset}`;
                    const response = await fetch(url);

                    if (!response.ok) break;

                    const data = await response.json();

                    // Handle different response formats
                    let pageDetections;
                    let totalAvailable;
                    let totalPages;

                    if (Array.isArray(data)) {
                        // Simple array format
                        pageDetections = data;
                        hasMorePages = data.length === endpoint.limit;
                    } else if (data.data) {
                        // Paginated format with metadata
                        pageDetections = data.data;
                        totalAvailable = data.total || 0;
                        totalPages = data.total_pages || 1;

                        // Show progress every 10 pages, or every page for first 10 pages
                        const currentPage = data.current_page || 1;
                        if (currentPage <= 10 || currentPage % 10 === 0) {
                            const progress = ((allDetections.length / totalAvailable) * 100).toFixed(1);
                            console.log(`📄 Page ${currentPage}/${totalPages}: ${allDetections.length}/${totalAvailable} detections (${progress}%)`);
                        }

                        hasMorePages = (data.current_page || 1) < totalPages;
                    } else {
                        // Unknown format
                        break;
                    }

                    if (pageDetections.length === 0) {
                        hasMorePages = false;
                        break;
                    }

                    allDetections.push(...pageDetections);
                    offset += endpoint.limit;

                    // Stop if we've reached the max or got all available
                    if (totalAvailable && allDetections.length >= totalAvailable) {
                        hasMorePages = false;
                    }
                }

                if (allDetections.length > 0) {
                    // Filter by sinceTime if doing incremental loading
                    if (sinceTime) {
                        const newDetections = allDetections.filter(d => {
                            const detectionTime = parseDetectionDate(d);
                            return detectionTime > sinceTime;
                        });

                        console.log(`✅ Fetched ${allDetections.length} detections, ${newDetections.length} are new (since ${sinceTime.toLocaleString()})`);
                        return newDetections;
                    } else {
                        console.log(`✅ Fetched ${allDetections.length} total detections from ${endpoint.base}`);
                        return allDetections;
                    }
                }
            } catch (e) {
                console.warn(`Failed to fetch from ${endpoint.base}:`, e);
                continue;
            }
        }

        console.warn('No detections endpoint available');
        return [];
    } catch (error) {
        console.error('Failed to fetch detections:', error);
        return [];
    }
}

/**
 * Parse detection date/time from API format
 * API format: { "date": "2025-10-27", "time": "10:53:12" }
 */
export function parseDetectionDate(detection) {
    // Handle separate date and time fields (BirdNET-Go v2 format)
    if (detection.date && detection.time) {
        return new Date(`${detection.date}T${detection.time}`);
    }

    // Fallback to other formats
    if (detection.begin_time) return new Date(detection.begin_time);
    if (detection.timestamp) return new Date(detection.timestamp);
    if (detection.date) return new Date(detection.date);
    if (detection.DateTime) return new Date(detection.DateTime);

    // Last resort - use current time
    return new Date();
}

/**
 * Get audio URL for a detection
 * @param {Object} detection - Detection object from API
 * @returns {string|null} - Audio URL or null if not available
 */
export function getAudioUrl(detection) {
    // BirdNET-Go audio naming: <scientific_name>_<confidence>_<timestamp>.<extension>

    // Get scientific name (replace spaces with underscores)
    const scientificName = (detection.scientificName || detection.scientific_name || '').replace(/\s+/g, '_');

    // Get confidence (as decimal, e.g., 0.95)
    const confidence = detection.confidence || 0;

    // Get timestamp from date and time
    // Format: YYYYMMDD_HHMMSS (e.g., 20251031_143052)
    if (!detection.date || !detection.time) {
        console.warn('❌ Missing date/time for audio clip:', detection);
        return null;
    }

    const datePart = detection.date.replace(/-/g, ''); // 2025-10-31 -> 20251031
    const timePart = detection.time.replace(/:/g, ''); // 14:30:52 -> 143052
    const timestamp = `${datePart}_${timePart}`;

    // Construct clip name: ScientificName_0.95_20251031_143052.wav
    // Try common audio extensions
    const extensions = ['wav', 'mp3', 'ogg'];

    // Build the clip name (try .wav first as it's most common for BirdNET)
    const clipName = `${scientificName}_${confidence}_${timestamp}.wav`;

    // Construct the audio URL
    const audioUrl = `${API_CONFIG.audioBaseUrl}?clip=${encodeURIComponent(clipName)}`;
    console.log('🎵 Constructed audio URL:', audioUrl, 'from detection:', {
        scientificName,
        confidence,
        timestamp,
        clipName
    });
    return audioUrl;
}

/**
 * Check if a detection has audio available
 * @param {Object} detection - Detection object from API
 * @returns {boolean} - True if audio is likely available
 */
export function hasAudio(detection) {
    // Audio is available if we have the required fields to construct the clip name
    const hasScientificName = !!(detection.scientificName || detection.scientific_name);
    const hasConfidence = detection.confidence !== undefined && detection.confidence !== null;
    const hasDateTime = !!(detection.date && detection.time);

    return hasScientificName && hasConfidence && hasDateTime;
}
