/**
 * Analytics Module - Data analysis and processing
 */

import { parseDetectionDate } from './api.js';

/**
 * Analyze all data and generate insights
 * Uses species summary for most analytics, detections for recent activity
 */
export function analyzeData(species, detections, filters) {
    if (species.length === 0 && detections.length === 0) {
        return getEmptyAnalytics();
    }

    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);

    return {
        totalSpecies: species.length,
        totalDetections: totalDetections,
        filteredDetections: totalDetections,

        // Time-based analytics (from recent 100 detections - sample)
        daily: analyzeDailyActivity(detections),
        hourly: analyzeHourlyPattern(detections),
        weekly: analyzeWeeklyPattern(detections),
        monthly: analyzeMonthlyPattern(detections),

        // Species analytics (from species summary - accurate)
        topSpecies: getTopSpeciesFromSummary(species),
        allSpecies: getAllSpeciesFromSummary(species),
        diversity: calculateDiversityFromSummary(species),
        rarest: getRarestFromSummary(species),

        // Recent activity
        today: getTodayStats(detections),
        recent: getRecentDetections(detections, 50),

        // Insights
        insights: generateInsightsFromSummary(species, detections)
    };
}

/**
 * Analyze daily activity (last 30 days)
 */
export function analyzeDailyActivity(detections) {
    const days = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        days[key] = { count: 0, species: new Set() };
    }

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const key = date.toISOString().split('T')[0];
        if (days[key]) {
            days[key].count++;
            days[key].species.add(d.commonName || d.common_name || d.scientificName);
        }
    });

    return Object.entries(days).map(([date, data]) => ({
        date,
        count: data.count,
        speciesCount: data.species.size
    }));
}

/**
 * Analyze hourly pattern
 */
export function analyzeHourlyPattern(detections) {
    const hours = Array(24).fill(0);

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const hour = date.getHours();
        hours[hour]++;
    });

    return hours.map((count, hour) => ({ hour, count }));
}

/**
 * Analyze weekly pattern (day of week)
 */
export function analyzeWeeklyPattern(detections) {
    const days = Array(7).fill(0);

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const day = date.getDay();
        days[day]++;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((count, index) => ({ day: dayNames[index], count }));
}

/**
 * Analyze monthly pattern
 */
export function analyzeMonthlyPattern(detections) {
    const months = Array(12).fill(0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        months[date.getMonth()]++;
    });

    return months.map((count, index) => ({ month: monthNames[index], count }));
}

/**
 * Get top species from species summary endpoint
 */
export function getTopSpeciesFromSummary(species) {
    return species
        .map(s => ({
            name: s.commonName || s.common_name || s.scientificName || 'Unknown',
            count: s.detections || s.count || 0,
            avgConfidence: s.confidence || s.avgConfidence || 0,
            firstSeen: s.firstSeen ? new Date(s.firstSeen) : new Date(),
            lastSeen: s.lastSeen ? new Date(s.lastSeen) : new Date(),
            totalConfidence: (s.detections || s.count || 0) * (s.confidence || 0)
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get all species stats from summary
 */
export function getAllSpeciesFromSummary(species) {
    return getTopSpeciesFromSummary(species);
}

/**
 * Calculate diversity from species summary
 */
export function calculateDiversityFromSummary(species) {
    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);

    return species
        .sort((a, b) => (b.detections || b.count || 0) - (a.detections || a.count || 0))
        .slice(0, 10)
        .map(s => ({
            name: s.commonName || s.common_name || s.scientificName || 'Unknown',
            count: s.detections || s.count || 0,
            percentage: totalDetections > 0 ? (((s.detections || s.count || 0) / totalDetections) * 100).toFixed(1) : '0.0'
        }));
}

/**
 * Get rarest species from summary
 */
export function getRarestFromSummary(species) {
    return species
        .filter(s => (s.detections || s.count || 0) <= 3)
        .map(s => ({
            name: s.commonName || s.common_name || s.scientificName || 'Unknown',
            count: s.detections || s.count || 0,
            avgConfidence: s.confidence || s.avgConfidence || 0,
            firstSeen: s.firstSeen ? new Date(s.firstSeen) : new Date(),
            lastSeen: s.lastSeen ? new Date(s.lastSeen) : new Date()
        }))
        .sort((a, b) => a.count - b.count)
        .slice(0, 10);
}

/**
 * Get today's stats
 */
export function getTodayStats(detections) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= today;
    });

    const species = new Set(todayDetections.map(d => d.commonName || d.common_name || d.scientificName));

    return {
        count: todayDetections.length,
        species: species.size
    };
}

/**
 * Get today's active species with details
 */
export function getTodayActiveSpecies(detections, speciesData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= today;
    });

    const speciesCounts = {};
    todayDetections.forEach(d => {
        const species = d.commonName || d.common_name || d.scientificName || 'Unknown';
        if (!speciesCounts[species]) {
            speciesCounts[species] = 0;
        }
        speciesCounts[species]++;
    });

    const todaySpeciesList = Object.entries(speciesCounts).map(([speciesName, count]) => {
        const speciesInfo = speciesData.find(s =>
            (s.commonName || s.common_name || s.scientificName) === speciesName
        );

        return {
            name: speciesName,
            count: count,
            thumbnail: speciesInfo?.thumbnail_url || null
        };
    });

    return todaySpeciesList.sort((a, b) => b.count - a.count);
}

/**
 * Get recent detections
 */
export function getRecentDetections(detections, limit = 50) {
    return detections
        .map(d => ({
            ...d,
            timestamp: parseDetectionDate(d)
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

/**
 * Generate insights from species summary and recent detections
 */
export function generateInsightsFromSummary(species, detections) {
    const insights = [];
    const hourly = analyzeHourlyPattern(detections);
    const topSpecies = getTopSpeciesFromSummary(species);
    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);

    if (hourly.length > 0) {
        const peakHour = hourly.reduce((max, h) => h.count > max.count ? h : max, hourly[0]);
        if (peakHour.count > 0) {
            insights.push({
                type: 'peak-time',
                icon: '🕐',
                title: 'Peak Activity Hour (Recent Sample)',
                text: `Based on recent detections, most bird activity occurs around ${peakHour.hour}:00 with ${peakHour.count} detections.`
            });
        }
    }

    if (topSpecies.length > 0) {
        const top = topSpecies[0];
        const percentage = totalDetections > 0 ? ((top.count / totalDetections) * 100).toFixed(1) : '0';
        insights.push({
            type: 'common-species',
            icon: '👑',
            title: 'Most Common Visitor',
            text: `${top.name} is your backyard champion with ${top.count.toLocaleString()} total detections (${percentage}% of all sightings).`
        });
    }

    const uniqueSpecies = species.length;
    insights.push({
        type: 'diversity',
        icon: '🌈',
        title: 'Species Diversity',
        text: `You've detected ${uniqueSpecies} different species in your backyard with ${totalDetections.toLocaleString()} total detections. ${uniqueSpecies >= 15 ? 'Excellent diversity!' : uniqueSpecies >= 8 ? 'Good variety!' : 'More species may appear as seasons change.'}`
    });

    if (topSpecies.length >= 3) {
        const top3 = topSpecies.slice(0, 3).map(s => s.name).join(', ');
        insights.push({
            type: 'top-species',
            icon: '🏆',
            title: 'Your Top 3 Species',
            text: `${top3} are your most frequent visitors.`
        });
    }

    const rare = species.filter(s => (s.detections || s.count || 0) <= 3);
    if (rare.length > 0) {
        insights.push({
            type: 'rare-visitors',
            icon: '💎',
            title: 'Rare Visitors',
            text: `You've had ${rare.length} species with 3 or fewer sightings. These are your rarest backyard visitors!`
        });
    }

    if (totalDetections >= 10000) {
        insights.push({
            type: 'milestone',
            icon: '🎉',
            title: 'Detection Milestone!',
            text: `Congratulations! You've recorded over ${(totalDetections / 1000).toFixed(0)}K bird detections. That's incredible!`
        });
    } else if (totalDetections >= 1000) {
        insights.push({
            type: 'milestone',
            icon: '🎉',
            title: 'Detection Milestone!',
            text: `You've recorded over ${(totalDetections / 1000).toFixed(1)}K bird detections. Keep watching!`
        });
    }

    return insights;
}

/**
 * Get empty analytics structure
 */
function getEmptyAnalytics() {
    return {
        totalSpecies: 0,
        totalDetections: 0,
        filteredDetections: 0,
        daily: [],
        hourly: [],
        weekly: [],
        monthly: [],
        topSpecies: [],
        allSpecies: [],
        diversity: [],
        rarest: [],
        today: { count: 0, species: 0 },
        recent: [],
        insights: []
    };
}
