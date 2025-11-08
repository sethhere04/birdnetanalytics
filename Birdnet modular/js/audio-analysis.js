/**
 * Audio Analysis Module - Individual Bird Identification
 * Uses acoustic fingerprinting to identify individual birds
 */

import { API_CONFIG } from './api.js';

// Configuration: Set to true to use CORS proxy for audio fingerprinting
// Set to false to use temporal analysis only
export const USE_AUDIO_FINGERPRINTING = true;

// CORS Proxy URL (change if proxy runs on different port)
const AUDIO_PROXY_URL = 'http://localhost:3000/audio';

/**
 * Fetch and decode audio file for a detection
 * Uses CORS proxy to bypass cross-origin restrictions
 * @param {number} detectionId - Detection ID from API
 * @returns {Promise<AudioBuffer>} - Decoded audio buffer
 */
export async function fetchAudioBuffer(detectionId) {
    const audioUrl = `${AUDIO_PROXY_URL}/${detectionId}`;

    try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
            console.warn(`Audio not available for detection ${detectionId}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        return audioBuffer;
    } catch (error) {
        console.error(`Error fetching audio for detection ${detectionId}:`, error);
        return null;
    }
}

/**
 * Extract metadata-based features from detection
 * Fallback when audio is not available
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
 * Extract acoustic features from audio buffer
 * @param {AudioBuffer} audioBuffer - Decoded audio
 * @returns {Object} - Acoustic features (pitch, frequency, duration, etc.)
 */
export function extractAcousticFeatures(audioBuffer) {
    if (!audioBuffer) return null;

    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Calculate basic features
    const features = {
        duration,
        sampleRate,

        // Energy/Amplitude features
        meanAmplitude: calculateMeanAmplitude(channelData),
        maxAmplitude: calculateMaxAmplitude(channelData),
        energyVariance: calculateEnergyVariance(channelData),

        // Frequency features
        dominantFrequency: calculateDominantFrequency(channelData, sampleRate),
        frequencyRange: calculateFrequencyRange(channelData, sampleRate),
        spectralCentroid: calculateSpectralCentroid(channelData, sampleRate),

        // Temporal features
        zeroCrossingRate: calculateZeroCrossingRate(channelData),

        // Spectrogram summary (for matching)
        spectrogramSignature: generateSpectrogramSignature(channelData, sampleRate)
    };

    return features;
}

/**
 * Calculate mean amplitude
 */
function calculateMeanAmplitude(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += Math.abs(channelData[i]);
    }
    return sum / channelData.length;
}

/**
 * Calculate max amplitude
 */
function calculateMaxAmplitude(channelData) {
    let max = 0;
    for (let i = 0; i < channelData.length; i++) {
        const abs = Math.abs(channelData[i]);
        if (abs > max) max = abs;
    }
    return max;
}

/**
 * Calculate energy variance
 */
function calculateEnergyVariance(channelData) {
    const mean = calculateMeanAmplitude(channelData);
    let variance = 0;
    for (let i = 0; i < channelData.length; i++) {
        const diff = Math.abs(channelData[i]) - mean;
        variance += diff * diff;
    }
    return variance / channelData.length;
}

/**
 * Calculate dominant frequency using simple FFT approach
 */
function calculateDominantFrequency(channelData, sampleRate) {
    // Simplified frequency detection using autocorrelation
    const bufferSize = Math.min(4096, channelData.length);
    const correlations = new Array(bufferSize).fill(0);

    for (let lag = 0; lag < bufferSize; lag++) {
        for (let i = 0; i < bufferSize; i++) {
            correlations[lag] += channelData[i] * channelData[i + lag];
        }
    }

    // Find first peak after zero
    let maxCorrelation = -Infinity;
    let dominantLag = 0;
    for (let i = 1; i < bufferSize / 2; i++) {
        if (correlations[i] > maxCorrelation && correlations[i] > correlations[i - 1] && correlations[i] > correlations[i + 1]) {
            maxCorrelation = correlations[i];
            dominantLag = i;
        }
    }

    return dominantLag > 0 ? sampleRate / dominantLag : 0;
}

/**
 * Calculate frequency range (basic spectral analysis)
 */
function calculateFrequencyRange(channelData, sampleRate) {
    // Simplified - would normally use FFT
    const frequencies = [];
    const windowSize = 2048;

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
        const window = channelData.slice(i, i + windowSize);
        const freq = calculateDominantFrequency(window, sampleRate);
        if (freq > 0) frequencies.push(freq);
    }

    if (frequencies.length === 0) return 0;

    const min = Math.min(...frequencies);
    const max = Math.max(...frequencies);
    return max - min;
}

/**
 * Calculate spectral centroid (brightness of sound)
 */
function calculateSpectralCentroid(channelData, sampleRate) {
    // Simplified centroid calculation
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < channelData.length; i++) {
        const magnitude = Math.abs(channelData[i]);
        const frequency = (i * sampleRate) / channelData.length;
        weightedSum += frequency * magnitude;
        sum += magnitude;
    }

    return sum > 0 ? weightedSum / sum : 0;
}

/**
 * Calculate zero crossing rate (measure of noisiness)
 */
function calculateZeroCrossingRate(channelData) {
    let crossings = 0;
    for (let i = 1; i < channelData.length; i++) {
        if ((channelData[i - 1] >= 0 && channelData[i] < 0) ||
            (channelData[i - 1] < 0 && channelData[i] >= 0)) {
            crossings++;
        }
    }
    return crossings / channelData.length;
}

/**
 * Generate a simplified spectrogram signature (fingerprint)
 */
function generateSpectrogramSignature(channelData, sampleRate) {
    const numBands = 10; // Divide spectrum into 10 frequency bands
    const windowSize = 1024;
    const hopSize = 512;
    const signature = [];

    // Process windows
    for (let pos = 0; pos < channelData.length - windowSize; pos += hopSize) {
        const window = channelData.slice(pos, pos + windowSize);
        const bandEnergies = new Array(numBands).fill(0);

        // Calculate energy in each frequency band
        for (let i = 0; i < window.length; i++) {
            const band = Math.floor((i / window.length) * numBands);
            bandEnergies[band] += window[i] * window[i];
        }

        // Normalize
        const maxEnergy = Math.max(...bandEnergies);
        if (maxEnergy > 0) {
            for (let i = 0; i < numBands; i++) {
                bandEnergies[i] /= maxEnergy;
            }
        }

        signature.push(bandEnergies);
    }

    return signature;
}

/**
 * Calculate similarity between two acoustic fingerprints
 * @param {Object} features1 - First feature set
 * @param {Object} features2 - Second feature set
 * @returns {number} - Similarity score (0-1, higher = more similar)
 */
export function calculateSimilarity(features1, features2) {
    if (!features1 || !features2) return 0;

    // Compare basic features
    const durationSimilarity = 1 - Math.min(Math.abs(features1.duration - features2.duration) / Math.max(features1.duration, features2.duration), 1);
    const freqSimilarity = 1 - Math.min(Math.abs(features1.dominantFrequency - features2.dominantFrequency) / Math.max(features1.dominantFrequency, features2.dominantFrequency), 1);
    const energySimilarity = 1 - Math.min(Math.abs(features1.meanAmplitude - features2.meanAmplitude) / Math.max(features1.meanAmplitude, features2.meanAmplitude), 1);
    const zcr = 1 - Math.min(Math.abs(features1.zeroCrossingRate - features2.zeroCrossingRate) / Math.max(features1.zeroCrossingRate, features2.zeroCrossingRate), 1);

    // Compare spectrogram signatures
    let spectrogramSimilarity = 0;
    if (features1.spectrogramSignature && features2.spectrogramSignature) {
        const minLength = Math.min(features1.spectrogramSignature.length, features2.spectrogramSignature.length);
        let totalSimilarity = 0;

        for (let i = 0; i < minLength; i++) {
            let frameSimilarity = 0;
            for (let j = 0; j < features1.spectrogramSignature[i].length; j++) {
                const diff = Math.abs(features1.spectrogramSignature[i][j] - features2.spectrogramSignature[i][j]);
                frameSimilarity += (1 - diff);
            }
            totalSimilarity += frameSimilarity / features1.spectrogramSignature[i].length;
        }

        spectrogramSimilarity = totalSimilarity / minLength;
    }

    // Weighted average (spectrogram is most important)
    const similarity = (
        spectrogramSimilarity * 0.5 +
        freqSimilarity * 0.2 +
        durationSimilarity * 0.15 +
        energySimilarity * 0.1 +
        zcr * 0.05
    );

    return similarity;
}

/**
 * Cluster detections by acoustic similarity to estimate individual birds
 * @param {Array} detections - Array of detections for a species
 * @param {number} similarityThreshold - Threshold for considering two detections from same bird (0-1)
 * @returns {Promise<Array>} - Array of clusters (groups of detections from same individual)
 */
async function clusterDetectionsByAudio(detections, similarityThreshold = 0.75) {
    console.log(`🎵 Starting audio analysis for ${detections.length} detections...`);

    // Fetch and analyze audio for each detection
    const analyzedDetections = [];
    for (let i = 0; i < Math.min(detections.length, 50); i++) { // Limit to 50 for performance
        const detection = detections[i];
        const audioBuffer = await fetchAudioBuffer(detection.id);

        if (audioBuffer) {
            const features = extractAcousticFeatures(audioBuffer);
            if (features) {
                analyzedDetections.push({
                    detection,
                    features
                });
                console.log(`✓ Analyzed detection ${detection.id}`);
            }
        }
    }

    console.log(`📊 Analyzed ${analyzedDetections.length} detections, clustering...`);

    // Cluster using similarity threshold
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < analyzedDetections.length; i++) {
        if (assigned.has(i)) continue;

        const cluster = [analyzedDetections[i]];
        assigned.add(i);

        // Find similar detections
        for (let j = i + 1; j < analyzedDetections.length; j++) {
            if (assigned.has(j)) continue;

            const similarity = calculateSimilarity(
                analyzedDetections[i].features,
                analyzedDetections[j].features
            );

            if (similarity >= similarityThreshold) {
                cluster.push(analyzedDetections[j]);
                assigned.add(j);
            }
        }

        clusters.push(cluster);
    }

    console.log(`🎯 Found ${clusters.length} distinct individuals using audio fingerprinting`);

    return clusters;
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
 * Estimate individual birds for each species using audio fingerprinting or temporal patterns
 * @param {Array} detections - All detections
 * @returns {Promise<Object>} - Map of species name to estimated individual count
 */
export async function estimateIndividualBirds(detections) {
    console.log(`🔬 Starting individual bird estimation for ${detections.length} detections...`);
    console.log(`📡 Audio fingerprinting: ${USE_AUDIO_FINGERPRINTING ? 'ENABLED' : 'DISABLED'}`);

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

        // Choose clustering method based on configuration
        let clusters;
        let method;

        if (USE_AUDIO_FINGERPRINTING) {
            try {
                clusters = await clusterDetectionsByAudio(sortedDetections);
                method = 'audio-fingerprinting';
            } catch (error) {
                console.warn(`Audio fingerprinting failed for ${species}, falling back to temporal analysis:`, error);
                clusters = clusterDetectionsByTemporal(sortedDetections);
                method = 'temporal-fallback';
            }
        } else {
            clusters = clusterDetectionsByTemporal(sortedDetections);
            method = 'temporal';
        }

        const avgSessionSize = clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length;

        estimates[species] = clusters.length;
        clusterDetails[species] = {
            clusters: clusters.length,
            detections: sortedDetections.length,
            avgSessionSize: Math.round(avgSessionSize * 10) / 10,
            method: method
        };
    }

    console.log(`✅ Estimation complete:`, estimates);
    console.log(`📊 Cluster details:`, clusterDetails);

    return estimates;
}
