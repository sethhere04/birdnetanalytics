/**
 * Migration AI - Predicts species migration patterns based on detection history
 */

const MigrationAI = {
    // Migration patterns database (general North American patterns)
    migrationPatterns: {
        // Spring migrants (March-May)
        spring: {
            early: { start: 60, peak: 75, end: 90 }, // March 1 - March 31
            mid: { start: 90, peak: 105, end: 120 }, // April 1 - April 30
            late: { start: 120, peak: 135, end: 150 } // May 1 - May 30
        },
        // Fall migrants (August-November)
        fall: {
            early: { start: 213, peak: 228, end: 243 }, // August 1 - August 31
            mid: { start: 243, peak: 258, end: 273 }, // September 1 - September 30
            late: { start: 273, peak: 288, end: 303 } // October 1 - October 31
        }
    },

    /**
     * Analyze detection history to predict migration patterns
     */
    async analyzeMigrationPatterns(detections) {
        const speciesData = this.groupBySpecies(detections);
        const predictions = [];

        for (const [species, detectionList] of Object.entries(speciesData)) {
            const pattern = this.detectPattern(detectionList);
            const prediction = this.generatePrediction(species, pattern);
            predictions.push(prediction);
        }

        // Sort by next expected date
        return predictions.sort((a, b) => {
            const aDate = this.getNextExpectedDate(a);
            const bDate = this.getNextExpectedDate(b);
            return aDate - bDate;
        });
    },

    /**
     * Group detections by species
     */
    groupBySpecies(detections) {
        const grouped = {};

        detections.forEach(detection => {
            try {
                const species = detection.comName || detection.scientificName || detection.commonName || detection.species || 'Unknown';

                // Parse date from various formats
                let date;
                if (detection.date) {
                    date = new Date(detection.date);
                } else if (detection.timestamp) {
                    date = new Date(detection.timestamp);
                } else if (detection.DateTime) {
                    date = new Date(detection.DateTime);
                } else {
                    // Skip detections without dates
                    return;
                }

                // Validate date
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date for detection:', detection);
                    return;
                }

                if (!grouped[species]) {
                    grouped[species] = [];
                }

                grouped[species].push({
                    date: date,
                    confidence: parseFloat(detection.confidence || detection.Confidence || 0)
                });
            } catch (error) {
                console.warn('Error processing detection:', detection, error);
            }
        });

        return grouped;
    },

    /**
     * Detect migration pattern for a species
     */
    detectPattern(detections) {
        if (detections.length === 0) return null;

        // Convert dates to day of year
        const dayOfYear = detections.map(d => this.getDayOfYear(d.date));

        // Analyze presence by month
        const monthlyPresence = this.getMonthlyPresence(detections);

        // Determine pattern type
        const patternType = this.classifyPattern(monthlyPresence);

        // Calculate key dates
        const stats = this.calculateStats(dayOfYear);

        return {
            type: patternType,
            firstSeen: Math.min(...dayOfYear),
            lastSeen: Math.max(...dayOfYear),
            peakDay: stats.median,
            detectionCount: detections.length,
            monthlyPresence: monthlyPresence,
            confidence: this.calculateConfidence(detections)
        };
    },

    /**
     * Get day of year (1-366)
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    },

    /**
     * Get monthly presence counts
     */
    getMonthlyPresence(detections) {
        const months = new Array(12).fill(0);
        detections.forEach(d => {
            const month = d.date.getMonth();
            months[month]++;
        });
        return months;
    },

    /**
     * Classify migration pattern
     */
    classifyPattern(monthlyPresence) {
        const total = monthlyPresence.reduce((sum, count) => sum + count, 0);
        const presentMonths = monthlyPresence.filter(count => count > 0).length;

        // Year-round resident (present 10+ months)
        if (presentMonths >= 10) {
            return 'resident';
        }

        // Summer resident (May-August presence)
        const summerMonths = monthlyPresence.slice(4, 8).reduce((a, b) => a + b, 0);
        if (summerMonths / total > 0.6) {
            return 'summer';
        }

        // Winter resident (November-February presence)
        const winterMonths = monthlyPresence.slice(10, 12).reduce((a, b) => a + b, 0) +
                            monthlyPresence.slice(0, 2).reduce((a, b) => a + b, 0);
        if (winterMonths / total > 0.6) {
            return 'winter';
        }

        // Spring/Fall transient (concentrated in migration periods)
        return 'transient';
    },

    /**
     * Calculate statistics
     */
    calculateStats(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );

        return { median, mean, stdDev };
    },

    /**
     * Calculate prediction confidence
     */
    calculateConfidence(detections) {
        const years = new Set(detections.map(d => d.date.getFullYear())).size;
        const count = detections.length;

        // More years and detections = higher confidence
        if (years >= 3 && count >= 20) return 'high';
        if (years >= 2 && count >= 10) return 'medium';
        return 'low';
    },

    /**
     * Generate prediction for next occurrence
     */
    generatePrediction(species, pattern) {
        if (!pattern) {
            return {
                species,
                status: 'unknown',
                message: 'Not enough detection history',
                confidence: 'none'
            };
        }

        const today = new Date();
        const currentDay = this.getDayOfYear(today);
        const currentYear = today.getFullYear();

        let prediction = {
            species,
            pattern: pattern.type,
            detectionCount: pattern.detectionCount,
            confidence: pattern.confidence
        };

        // Determine current status and next expected date
        if (pattern.type === 'resident') {
            prediction.status = 'present';
            prediction.message = 'Year-round resident';
            prediction.nextExpected = null;
        } else if (pattern.type === 'summer') {
            if (currentDay >= pattern.firstSeen && currentDay <= pattern.lastSeen) {
                prediction.status = 'present';
                prediction.message = `Present until ~${this.formatDate(pattern.lastSeen, currentYear)}`;
                prediction.nextExpected = pattern.lastSeen;
            } else if (currentDay < pattern.firstSeen) {
                prediction.status = 'expected';
                prediction.message = `Arrives ~${this.formatDate(pattern.firstSeen, currentYear)}`;
                prediction.nextExpected = pattern.firstSeen;
            } else {
                prediction.status = 'departed';
                prediction.message = `Returns ~${this.formatDate(pattern.firstSeen, currentYear + 1)}`;
                prediction.nextExpected = pattern.firstSeen + 365;
            }
        } else if (pattern.type === 'winter') {
            const winterStart = 305; // ~November 1
            const winterEnd = 75;    // ~March 15

            if (currentDay >= winterStart || currentDay <= winterEnd) {
                prediction.status = 'present';
                prediction.message = 'Currently present';
                prediction.nextExpected = winterEnd;
            } else if (currentDay < winterStart) {
                prediction.status = 'expected';
                prediction.message = `Arrives ~${this.formatDate(winterStart, currentYear)}`;
                prediction.nextExpected = winterStart;
            } else {
                prediction.status = 'departed';
                prediction.message = `Returns ~${this.formatDate(winterStart, currentYear)}`;
                prediction.nextExpected = winterStart;
            }
        } else { // transient
            // Check if in migration window
            const springWindow = currentDay >= pattern.firstSeen - 30 && currentDay <= pattern.firstSeen + 30;
            const fallWindow = currentDay >= pattern.lastSeen - 30 && currentDay <= pattern.lastSeen + 30;

            if (springWindow || fallWindow) {
                prediction.status = 'migrating';
                prediction.message = 'Migration period';
                prediction.nextExpected = currentDay;
            } else if (currentDay < pattern.firstSeen) {
                prediction.status = 'expected';
                prediction.message = `Spring migration ~${this.formatDate(pattern.firstSeen, currentYear)}`;
                prediction.nextExpected = pattern.firstSeen;
            } else if (currentDay > pattern.lastSeen) {
                prediction.status = 'departed';
                prediction.message = `Returns ~${this.formatDate(pattern.firstSeen, currentYear + 1)}`;
                prediction.nextExpected = pattern.firstSeen + 365;
            } else {
                prediction.status = 'expected';
                prediction.message = `Fall migration ~${this.formatDate(pattern.lastSeen, currentYear)}`;
                prediction.nextExpected = pattern.lastSeen;
            }
        }

        // Add historical dates
        prediction.historicalFirst = pattern.firstSeen;
        prediction.historicalLast = pattern.lastSeen;
        prediction.historicalPeak = pattern.peakDay;
        prediction.monthlyPattern = pattern.monthlyPresence;

        return prediction;
    },

    /**
     * Get next expected date for sorting
     */
    getNextExpectedDate(prediction) {
        if (!prediction.nextExpected) return Infinity;
        const today = this.getDayOfYear(new Date());
        let diff = prediction.nextExpected - today;
        if (diff < 0) diff += 365;
        return diff;
    },

    /**
     * Format day of year as readable date
     */
    formatDate(dayOfYear, year) {
        const date = new Date(year, 0, dayOfYear);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    /**
     * Get status badge color
     */
    getStatusColor(status) {
        const colors = {
            'present': '#10b981',      // Green
            'expected': '#3b82f6',     // Blue
            'migrating': '#f59e0b',    // Amber
            'departed': '#6b7280',     // Gray
            'unknown': '#9ca3af'       // Light gray
        };
        return colors[status] || colors.unknown;
    },

    /**
     * Get confidence badge color
     */
    getConfidenceColor(confidence) {
        const colors = {
            'high': '#10b981',      // Green
            'medium': '#f59e0b',    // Amber
            'low': '#ef4444'        // Red
        };
        return colors[confidence] || '#9ca3af';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MigrationAI;
}
