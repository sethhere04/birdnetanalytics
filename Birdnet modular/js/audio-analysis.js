/**
 * Audio Analysis Module - Individual Bird Identification
 * Uses temporal and metadata patterns to estimate individual birds
 */

import { API_CONFIG } from './api.js';

/**
 * Extract metadata-based features from detection
 * @param {Object} detection - Detection object
 * @returns {Object} - Feature vector
 */
function extractMetadataFeatures(detection) {
    const beginTime = new Date(detection.beginTime);
    const endTime = new Date(detection.endTime);
    const duration = (endTime - beginTime) / 1000; // seconds

    return {
        // Temporal features
        hourOfDay: beginTime.getHours(),
        timeOfDay: getTimeOfDay(beginTime.getHours()),
        dayOfWeek: beginTime.getDay(),
        duration: duration,

        // Detection metadata
        confidence: detection.confidence || 0,

        // Create a simple fingerprint
        timestamp: beginTime.getTime(),
        beginTime: detection.beginTime,
        endTime: detection.endTime
    };
}

/**
 * Get time of day category
 */
function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
}

/**
 * Cluster detections by temporal and metadata patterns to estimate individual birds
 * @param {Array} detections - Array of detections for a species
 * @returns {Array} - Array of clusters (groups of detections from same individual)
 */
function clusterDetectionsByTemporal(detections) {
    console.log(`🎵 Analyzing ${detections.length} detections using temporal patterns...`);

    // Extract features for all detections
    const analyzedDetections = detections.map(detection => ({
        detection,
        features: extractMetadataFeatures(detection)
    }));

    // Sort by timestamp
    analyzedDetections.sort((a, b) => a.features.timestamp - b.features.timestamp);

    const clusters = [];
    const assigned = new Set();

    // Time-based clustering with adaptive thresholds
    for (let i = 0; i < analyzedDetections.length; i++) {
        if (assigned.has(i)) continue;

        const cluster = [analyzedDetections[i]];
        assigned.add(i);

        // Look for detections that are likely the same bird
        for (let j = i + 1; j < analyzedDetections.length; j++) {
            if (assigned.has(j)) continue;

            const timeDiff = (analyzedDetections[j].features.timestamp - analyzedDetections[i].features.timestamp) / 1000; // seconds

            // Same bird if:
            // - Within 30 seconds (rapid succession)
            // - OR within 5 minutes AND same time of day
            if (timeDiff < 30 ||
                (timeDiff < 300 && analyzedDetections[i].features.timeOfDay === analyzedDetections[j].features.timeOfDay)) {
                cluster.push(analyzedDetections[j]);
                assigned.add(j);
            } else if (timeDiff > 600) {
                // Stop looking if gap is too large
                break;
            }
        }

        clusters.push(cluster);
    }

    console.log(`🎯 Found ${clusters.length} distinct detection sessions (estimated individuals)`);

    return clusters;
}

/**
 * Estimate individual birds for each species using temporal patterns
 * @param {Array} detections - All detections
 * @returns {Promise<Object>} - Map of species name to estimated individual count
 */
export async function estimateIndividualBirds(detections) {
    console.log(`🔬 Starting individual bird estimation for ${detections.length} detections...`);

    const speciesGroups = {};

    // Group by species
    detections.forEach(d => {
        const species = d.commonName || d.common_name || d.scientificName;
        if (!speciesGroups[species]) {
            speciesGroups[species] = [];
        }
        speciesGroups[species].push(d);
    });

    const estimates = {};
    const clusterDetails = {};

    // Analyze each species
    for (const [species, speciesDetections] of Object.entries(speciesGroups)) {
        if (speciesDetections.length < 2) {
            estimates[species] = 1; // Only one detection = one bird
            clusterDetails[species] = {
                clusters: 1,
                detections: speciesDetections.length,
                avgSessionSize: 1,
                method: 'single-detection'
            };
            continue;
        }

        // Use all detections (sorted by time)
        const sortedDetections = speciesDetections
            .sort((a, b) => new Date(a.beginTime) - new Date(b.beginTime));

        const clusters = clusterDetectionsByTemporal(sortedDetections);
        const avgSessionSize = clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length;

        estimates[species] = clusters.length;
        clusterDetails[species] = {
            clusters: clusters.length,
            detections: sortedDetections.length,
            avgSessionSize: Math.round(avgSessionSize * 10) / 10,
            method: 'temporal'
        };
    }

    console.log(`✅ Estimation complete:`, estimates);
    console.log(`📊 Cluster details:`, clusterDetails);

    return estimates;
}
