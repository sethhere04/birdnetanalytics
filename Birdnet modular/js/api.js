/**
 * API Module - Handles all API calls to BirdNET-Go
 */

export const API_CONFIG = {
    baseUrl: 'http://192.168.68.129:8080/api/v2',
    refreshInterval: 60000, // 1 minute
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
 * Fetch recent detections from API
 * Increased limit to 500 to capture full day of activity for "Active Today" count
 */
export async function fetchDetections() {
    try {
        const endpoints = [
            '/detections?limit=500',
            '/notes?limit=500&offset=0'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
                if (response.ok) {
                    const data = await response.json();
                    const detections = Array.isArray(data) ? data : (data.data || []);
                    console.log(`✅ Found ${detections.length} recent detections from ${endpoint}`);
                    return detections;
                }
            } catch (e) {
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
