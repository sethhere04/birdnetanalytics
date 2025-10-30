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
 * Fetch recent detections from API with pagination support
 * Fetches multiple pages to get up to 500 detections for accurate daily counts
 */
export async function fetchDetections() {
    try {
        const endpoints = [
            { base: '/detections', limit: 100 },
            { base: '/notes', limit: 100 }
        ];

        for (const endpoint of endpoints) {
            try {
                const allDetections = [];
                let offset = 0;
                const maxDetections = 500; // Maximum total detections to fetch
                let hasMorePages = true;

                console.log(`📡 Fetching paginated detections from: ${endpoint.base}`);

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

                        console.log(`📄 Page ${data.current_page || 1}/${totalPages}: ${pageDetections.length} detections (${totalAvailable} total available)`);

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
                    console.log(`✅ Fetched ${allDetections.length} total detections from ${endpoint.base}`);
                    return allDetections;
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
