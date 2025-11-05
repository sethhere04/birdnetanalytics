/**
 * Custom Alerts Module - Manages user-configured species alerts
 */

// Alert configuration storage key
const ALERT_CONFIG_KEY = 'birdnet_alert_config';
const NOTIFIED_DETECTIONS_KEY = 'birdnet_notified_detections';

/**
 * Default alert configuration
 */
const DEFAULT_CONFIG = {
    enabled: true,
    soundEnabled: true,
    cooldownMinutes: 30, // Don't alert more than once per 30 minutes for same species
    alertTypes: {
        specificSpecies: true,  // Alert for specific watched species
        rareSpecies: true,      // Alert for rare species (1-3 detections)
        newSpecies: true        // Alert for first-time detections
    },
    watchedSpecies: [] // Array of species names to watch
};

/**
 * Get alert configuration
 */
export function getAlertConfig() {
    try {
        const saved = localStorage.getItem(ALERT_CONFIG_KEY);
        if (saved) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading alert config:', error);
    }
    return DEFAULT_CONFIG;
}

/**
 * Save alert configuration
 */
export function saveAlertConfig(config) {
    try {
        localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(config));
        console.log('✅ Alert configuration saved');
        return true;
    } catch (error) {
        console.error('Error saving alert config:', error);
        return false;
    }
}

/**
 * Add species to watch list
 */
export function addWatchedSpecies(speciesName) {
    const config = getAlertConfig();
    if (!config.watchedSpecies.includes(speciesName)) {
        config.watchedSpecies.push(speciesName);
        saveAlertConfig(config);
        return true;
    }
    return false;
}

/**
 * Remove species from watch list
 */
export function removeWatchedSpecies(speciesName) {
    const config = getAlertConfig();
    const index = config.watchedSpecies.indexOf(speciesName);
    if (index > -1) {
        config.watchedSpecies.splice(index, 1);
        saveAlertConfig(config);
        return true;
    }
    return false;
}

/**
 * Check if we should send an alert for a species
 */
function shouldAlert(speciesName, detectionTime, config) {
    if (!config.enabled) return false;

    // Check cooldown
    const notifiedKey = `${speciesName}_${detectionTime.toDateString()}`;
    const notified = JSON.parse(localStorage.getItem(NOTIFIED_DETECTIONS_KEY) || '{}');

    if (notified[notifiedKey]) {
        const lastNotification = new Date(notified[notifiedKey]);
        const minutesSince = (detectionTime - lastNotification) / (1000 * 60);

        if (minutesSince < config.cooldownMinutes) {
            return false; // Still in cooldown period
        }
    }

    return true;
}

/**
 * Mark species as notified
 */
function markAsNotified(speciesName, detectionTime) {
    try {
        const notifiedKey = `${speciesName}_${detectionTime.toDateString()}`;
        const notified = JSON.parse(localStorage.getItem(NOTIFIED_DETECTIONS_KEY) || '{}');
        notified[notifiedKey] = detectionTime.toISOString();

        // Clean up old entries (older than 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        Object.keys(notified).forEach(key => {
            if (new Date(notified[key]) < sevenDaysAgo) {
                delete notified[key];
            }
        });

        localStorage.setItem(NOTIFIED_DETECTIONS_KEY, JSON.stringify(notified));
    } catch (error) {
        console.error('Error marking as notified:', error);
    }
}

/**
 * Send notification
 */
function sendNotification(title, body, icon) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: icon || '/bird-icon.png',
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Play sound if enabled
        const config = getAlertConfig();
        if (config.soundEnabled) {
            playNotificationSound();
        }

        return notification;
    }
    return null;
}

/**
 * Play notification sound
 */
function playNotificationSound() {
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

/**
 * Check for alerts in new detections
 */
export function checkForAlerts(newDetections, analytics, speciesImages = {}) {
    const config = getAlertConfig();

    if (!config.enabled || !newDetections || newDetections.length === 0) {
        return;
    }

    console.log(`🔔 Checking ${newDetections.length} new detections for alerts...`);

    // Track which species we've already alerted for in this batch
    const alreadyAlerted = new Set();

    newDetections.forEach(detection => {
        const speciesName = detection.commonName || detection.common_name || detection.species || detection.scientificName;
        const detectionTime = new Date(detection.date + 'T' + detection.time);
        const confidence = (detection.confidence || 0) * 100;

        // Skip if already alerted for this species in this batch
        if (alreadyAlerted.has(speciesName)) {
            return;
        }

        // Check if we should alert
        if (!shouldAlert(speciesName, detectionTime, config)) {
            return;
        }

        let shouldSendAlert = false;
        let alertType = '';
        let alertMessage = '';

        // Check for specific species alerts
        if (config.alertTypes.specificSpecies && config.watchedSpecies.includes(speciesName)) {
            shouldSendAlert = true;
            alertType = '⭐ Watched Species Detected!';
            alertMessage = `${speciesName} was just detected with ${confidence.toFixed(1)}% confidence!`;
        }

        // Check for rare species alerts
        if (!shouldSendAlert && config.alertTypes.rareSpecies && analytics) {
            const species = analytics.rarest?.find(s => s.name === speciesName);
            if (species && species.count <= 3) {
                shouldSendAlert = true;
                alertType = '🦅 Rare Bird Detected!';
                alertMessage = `${speciesName} spotted! This is a rare visitor with only ${species.count} detection${species.count > 1 ? 's' : ''}.`;
            }
        }

        // Check for new species alerts
        if (!shouldSendAlert && config.alertTypes.newSpecies && analytics) {
            const species = analytics.allSpecies?.find(s => s.name === speciesName);
            if (species && species.count === 1) {
                shouldSendAlert = true;
                alertType = '🎉 New Species!';
                alertMessage = `${speciesName} detected for the first time!`;
            }
        }

        // Send alert if needed
        if (shouldSendAlert) {
            const icon = speciesImages[speciesName] || null;
            sendNotification(alertType, alertMessage, icon);
            markAsNotified(speciesName, detectionTime);
            alreadyAlerted.add(speciesName);

            console.log(`🔔 Alert sent: ${alertType} - ${speciesName}`);
        }
    });

    if (alreadyAlerted.size > 0) {
        console.log(`✅ Sent ${alreadyAlerted.size} alert(s)`);
    }
}

/**
 * Get watched species list
 */
export function getWatchedSpecies() {
    const config = getAlertConfig();
    return config.watchedSpecies || [];
}

/**
 * Check if species is watched
 */
export function isWatchedSpecies(speciesName) {
    return getWatchedSpecies().includes(speciesName);
}
