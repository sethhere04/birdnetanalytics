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

    // Apply date range filter if specified
    let filteredDetections = detections;
    if (filters && filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let cutoffDate;

        switch (filters.dateRange) {
            case 'today':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = null;
        }

        if (cutoffDate) {
            filteredDetections = detections.filter(d => {
                const detectionDate = parseDetectionDate(d);
                return detectionDate >= cutoffDate;
            });
            console.log(`🔍 Date filter applied: ${detections.length} → ${filteredDetections.length} detections (${filters.dateRange})`);
        }
    }

    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);

    return {
        totalSpecies: species.length,
        totalDetections: totalDetections,
        filteredDetections: filteredDetections.length,

        // Time-based analytics (use filtered detections)
        daily: analyzeDailyActivity(filteredDetections),
        hourly: analyzeHourlyPattern(filteredDetections),
        weekly: analyzeWeeklyPattern(filteredDetections),
        monthly: analyzeMonthlyPattern(filteredDetections),

        // Species analytics (from species summary - accurate)
        topSpecies: getTopSpeciesFromSummary(species),
        allSpecies: getAllSpeciesFromSummary(species),
        diversity: calculateDiversityFromSummary(species),
        rarest: getRarestFromSummary(species),

        // Recent activity (use filtered detections)
        today: getTodayStats(filteredDetections),
        recent: getRecentDetections(filteredDetections, 50),

        // Insights
        insights: generateInsightsFromSummary(species, filteredDetections)
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
 * Calculate Shannon Diversity Index
 * H = -Σ(pi * ln(pi)) where pi is the proportion of species i
 * Higher values indicate greater diversity
 */
export function calculateShannonIndex(species) {
    if (species.length === 0) return 0;

    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);
    if (totalDetections === 0) return 0;

    let shannonIndex = 0;
    species.forEach(s => {
        const count = s.detections || s.count || 0;
        if (count > 0) {
            const proportion = count / totalDetections;
            shannonIndex -= proportion * Math.log(proportion);
        }
    });

    return shannonIndex;
}

/**
 * Calculate Simpson's Diversity Index
 * D = 1 - Σ(pi²) where pi is the proportion of species i
 * Values range from 0 to 1, where 1 indicates maximum diversity
 */
export function calculateSimpsonIndex(species) {
    if (species.length === 0) return 0;

    const totalDetections = species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0);
    if (totalDetections === 0) return 0;

    let simpsonIndex = 0;
    species.forEach(s => {
        const count = s.detections || s.count || 0;
        if (count > 0) {
            const proportion = count / totalDetections;
            simpsonIndex += proportion * proportion;
        }
    });

    return 1 - simpsonIndex;
}

/**
 * Calculate species evenness (Pielou's J)
 * J = H / ln(S) where H is Shannon index and S is number of species
 * Values range from 0 to 1, where 1 indicates perfect evenness
 */
export function calculateEvenness(species) {
    if (species.length <= 1) return 1;

    const shannonIndex = calculateShannonIndex(species);
    const maxDiversity = Math.log(species.length);

    return maxDiversity > 0 ? shannonIndex / maxDiversity : 0;
}

/**
 * Get comprehensive diversity metrics
 */
export function getDiversityMetrics(species) {
    const shannonIndex = calculateShannonIndex(species);
    const simpsonIndex = calculateSimpsonIndex(species);
    const evenness = calculateEvenness(species);

    // Interpret Shannon Index
    let shannonInterpretation = 'No diversity';
    if (shannonIndex > 3.5) shannonInterpretation = 'Very high diversity';
    else if (shannonIndex > 3) shannonInterpretation = 'High diversity';
    else if (shannonIndex > 2) shannonInterpretation = 'Moderate diversity';
    else if (shannonIndex > 1) shannonInterpretation = 'Low diversity';

    // Interpret Evenness
    let evennessInterpretation = 'Very uneven';
    if (evenness > 0.8) evennessInterpretation = 'Very even';
    else if (evenness > 0.6) evennessInterpretation = 'Moderately even';
    else if (evenness > 0.4) evennessInterpretation = 'Somewhat uneven';

    return {
        shannon: {
            value: shannonIndex.toFixed(2),
            interpretation: shannonInterpretation,
            description: 'Shannon Index measures species diversity considering both richness and evenness'
        },
        simpson: {
            value: simpsonIndex.toFixed(2),
            interpretation: simpsonIndex > 0.8 ? 'High' : simpsonIndex > 0.5 ? 'Moderate' : 'Low',
            description: 'Simpson Index measures the probability that two randomly selected individuals belong to different species'
        },
        evenness: {
            value: evenness.toFixed(2),
            interpretation: evennessInterpretation,
            description: 'Evenness measures how similar species abundances are'
        },
        richness: {
            value: species.length,
            description: 'Total number of unique species detected'
        }
    };
}

/**
 * Calculate comparison stats (today vs yesterday, this week vs last week, etc.)
 */
export function calculateComparisonStats(detections, species) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Today vs Yesterday
    const todayDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= todayStart;
    });
    const yesterdayDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= yesterdayStart && date < todayStart;
    });

    const todaySpecies = new Set(todayDetections.map(d => d.commonName || d.common_name || d.scientificName));
    const yesterdaySpecies = new Set(yesterdayDetections.map(d => d.commonName || d.common_name || d.scientificName));

    // This week vs last week (approximation from recent detections)
    const thisWeekDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= weekStart;
    });
    const lastWeekDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= lastWeekStart && date < weekStart;
    });

    return {
        today: {
            detections: todayDetections.length,
            species: todaySpecies.size
        },
        yesterday: {
            detections: yesterdayDetections.length,
            species: yesterdaySpecies.size
        },
        thisWeek: {
            detections: thisWeekDetections.length,
            species: new Set(thisWeekDetections.map(d => d.commonName || d.common_name || d.scientificName)).size
        },
        lastWeek: {
            detections: lastWeekDetections.length,
            species: new Set(lastWeekDetections.map(d => d.commonName || d.common_name || d.scientificName)).size
        },
        allTime: {
            detections: species.reduce((sum, s) => sum + (s.detections || s.count || 0), 0),
            species: species.length
        }
    };
}

/**
 * Get species list for a specific time period
 */
export function getSpeciesForPeriod(period, detections, speciesData) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    let filteredDetections;
    let periodLabel;

    switch (period) {
        case 'today':
            filteredDetections = detections.filter(d => {
                const date = parseDetectionDate(d);
                return date >= todayStart;
            });
            periodLabel = 'Today';
            break;
        case 'yesterday':
            filteredDetections = detections.filter(d => {
                const date = parseDetectionDate(d);
                return date >= yesterdayStart && date < todayStart;
            });
            periodLabel = 'Yesterday';
            break;
        case 'thisWeek':
            filteredDetections = detections.filter(d => {
                const date = parseDetectionDate(d);
                return date >= weekStart;
            });
            periodLabel = 'This Week';
            break;
        case 'allTime':
            filteredDetections = detections;
            periodLabel = 'All Time';
            break;
        default:
            filteredDetections = detections;
            periodLabel = 'All Time';
    }

    // Get unique species with their detection counts for the period
    const speciesMap = new Map();
    filteredDetections.forEach(d => {
        const name = d.commonName || d.common_name || d.scientificName;
        if (!speciesMap.has(name)) {
            speciesMap.set(name, {
                name: name,
                count: 0,
                avgConfidence: 0,
                confidenceSum: 0
            });
        }
        const species = speciesMap.get(name);
        species.count++;
        species.confidenceSum += (d.confidence || 0);
        species.avgConfidence = species.confidenceSum / species.count;
    });

    // Convert to array and sort by count
    const speciesList = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count);

    return {
        label: periodLabel,
        species: speciesList,
        totalDetections: filteredDetections.length
    };
}

/**
 * Calculate diversity trends over time
 * Returns diversity metrics (Shannon, Simpson, Richness) for each time period
 */
export function calculateDiversityTrends(detections, periodType = 'daily', periods = 30) {
    if (!detections || detections.length === 0) return [];

    const now = new Date();
    const trends = [];

    for (let i = periods - 1; i >= 0; i--) {
        let periodStart, periodEnd, label;

        if (periodType === 'daily') {
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - i);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 1);
            label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (periodType === 'weekly') {
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - (i * 7));
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 7);
            label = `Week of ${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else if (periodType === 'monthly') {
            periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Filter detections for this period
        const periodDetections = detections.filter(d => {
            const date = parseDetectionDate(d);
            return date >= periodStart && date < periodEnd;
        });

        // Count species occurrences in this period
        const speciesCounts = {};
        periodDetections.forEach(d => {
            const speciesName = d.commonName || d.common_name || d.scientificName || 'Unknown';
            speciesCounts[speciesName] = (speciesCounts[speciesName] || 0) + 1;
        });

        // Convert to array format for diversity calculations
        const speciesArray = Object.entries(speciesCounts).map(([name, count]) => ({
            name,
            count,
            detections: count
        }));

        // Calculate diversity metrics
        const shannon = calculateShannonIndex(speciesArray);
        const simpson = calculateSimpsonIndex(speciesArray);
        const richness = speciesArray.length;

        trends.push({
            date: periodStart,
            label,
            shannon: parseFloat(shannon.toFixed(2)),
            simpson: parseFloat(simpson.toFixed(2)),
            richness,
            detections: periodDetections.length
        });
    }

    return trends;
}

/**
 * Predict peak activity times for the next 7 days
 * Based on historical hourly and daily patterns
 */
export function predictPeakActivity(detections, days = 7) {
    if (!detections || detections.length === 0) return [];

    const now = new Date();
    const predictions = [];

    // Analyze historical patterns by day of week and hour
    const dayHourPatterns = {};

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = date.getHours();

        const key = `${dayOfWeek}-${hour}`;
        dayHourPatterns[key] = (dayHourPatterns[key] || 0) + 1;
    });

    // Predict for next 7 days
    for (let i = 0; i < days; i++) {
        const futureDate = new Date(now);
        futureDate.setDate(now.getDate() + i);
        futureDate.setHours(0, 0, 0, 0);

        const dayOfWeek = futureDate.getDay();

        // Find peak hour for this day of week
        let peakHour = 0;
        let peakCount = 0;
        let totalActivity = 0;

        for (let hour = 0; hour < 24; hour++) {
            const key = `${dayOfWeek}-${hour}`;
            const count = dayHourPatterns[key] || 0;
            totalActivity += count;

            if (count > peakCount) {
                peakCount = count;
                peakHour = hour;
            }
        }

        // Calculate confidence based on data available
        const avgActivity = totalActivity / 24;
        const confidence = totalActivity > 20 ? 'high' : totalActivity > 10 ? 'medium' : 'low';

        // Format peak time range
        const peakStart = peakHour;
        const peakEnd = (peakHour + 1) % 24;
        const timeRange = `${peakStart.toString().padStart(2, '0')}:00 - ${peakEnd.toString().padStart(2, '0')}:00`;

        predictions.push({
            date: futureDate,
            dayName: futureDate.toLocaleDateString('en-US', { weekday: 'long' }),
            dateStr: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            peakHour,
            timeRange,
            expectedActivity: Math.round(avgActivity),
            peakActivity: peakCount,
            confidence,
            isToday: i === 0
        });
    }

    return predictions;
}

/**
 * Calculate species co-occurrence patterns
 * Returns pairs of species frequently detected together
 */
export function calculateCoOccurrence(detections, minSupport = 3) {
    if (!detections || detections.length === 0) return [];

    // Group detections by time windows (1-hour windows)
    const timeWindows = {};

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const windowKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;

        if (!timeWindows[windowKey]) {
            timeWindows[windowKey] = new Set();
        }

        const speciesName = d.commonName || d.common_name || d.scientificName || 'Unknown';
        timeWindows[windowKey].add(speciesName);
    });

    // Count co-occurrences
    const coOccurrences = {};

    Object.values(timeWindows).forEach(speciesSet => {
        const speciesArray = Array.from(speciesSet);

        // Generate all pairs
        for (let i = 0; i < speciesArray.length; i++) {
            for (let j = i + 1; j < speciesArray.length; j++) {
                const pair = [speciesArray[i], speciesArray[j]].sort().join(' & ');
                coOccurrences[pair] = (coOccurrences[pair] || 0) + 1;
            }
        }
    });

    // Convert to array and filter by minimum support
    const coOccurrenceArray = Object.entries(coOccurrences)
        .map(([pair, count]) => {
            const [species1, species2] = pair.split(' & ');
            return { species1, species2, count };
        })
        .filter(item => item.count >= minSupport)
        .sort((a, b) => b.count - a.count);

    return coOccurrenceArray;
}

/**
 * Predict time to next detection for each species
 * Based on historical detection intervals
 */
export function predictNextDetection(species, detections) {
    if (!species || species.length === 0) return [];

    const now = new Date();
    const predictions = [];

    species.forEach(s => {
        const speciesName = s.commonName || s.common_name || s.scientificName || 'Unknown';

        // Get all detections for this species
        const speciesDetections = detections
            .filter(d => (d.commonName || d.common_name || d.scientificName) === speciesName)
            .map(d => parseDetectionDate(d))
            .sort((a, b) => a - b);

        if (speciesDetections.length < 2) {
            // Not enough data
            predictions.push({
                species: speciesName,
                lastSeen: s.lastSeen ? new Date(s.lastSeen) : null,
                avgInterval: null,
                nextExpected: null,
                confidence: 'insufficient data',
                message: 'Need more detection history'
            });
            return;
        }

        // Calculate intervals between detections
        const intervals = [];
        for (let i = 1; i < speciesDetections.length; i++) {
            const interval = (speciesDetections[i] - speciesDetections[i - 1]) / (1000 * 60 * 60); // hours
            intervals.push(interval);
        }

        // Calculate average interval
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const stdDev = Math.sqrt(
            intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
        );

        // Predict next detection
        const lastDetection = speciesDetections[speciesDetections.length - 1];
        const nextExpected = new Date(lastDetection.getTime() + (avgInterval * 60 * 60 * 1000));

        const timeSinceLastMs = now - lastDetection;
        const hoursUntilNext = (nextExpected - now) / (1000 * 60 * 60);

        // Determine confidence based on consistency
        const cv = stdDev / avgInterval; // Coefficient of variation
        let confidence = 'low';
        if (cv < 0.5 && speciesDetections.length >= 10) confidence = 'high';
        else if (cv < 1.0 && speciesDetections.length >= 5) confidence = 'medium';

        // Generate message
        let message;
        if (hoursUntilNext < 0) {
            message = 'Overdue (check soon!)';
        } else if (hoursUntilNext < 1) {
            message = 'Expected within the hour';
        } else if (hoursUntilNext < 24) {
            message = `Expected in ${Math.round(hoursUntilNext)} hours`;
        } else {
            message = `Expected in ${Math.round(hoursUntilNext / 24)} days`;
        }

        predictions.push({
            species: speciesName,
            lastSeen: lastDetection,
            avgInterval: avgInterval,
            nextExpected,
            hoursUntilNext: Math.round(hoursUntilNext),
            confidence,
            message,
            detectionCount: speciesDetections.length
        });
    });

    // Sort by next expected time
    return predictions
        .filter(p => p.nextExpected !== null)
        .sort((a, b) => a.nextExpected - b.nextExpected);
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

/**
 * Compare multiple species (2-4 species)
 * Returns comparison data including activity overlap, peak times, etc.
 */
export function compareSpecies(speciesNames, detections, speciesData) {
    if (!speciesNames || speciesNames.length < 2) {
        return null;
    }

    const comparisons = [];

    speciesNames.forEach(speciesName => {
        // Get detections for this species
        const speciesDetections = detections.filter(d => {
            const name = d.commonName || d.common_name || d.species || d.scientificName;
            return name === speciesName;
        });

        if (speciesDetections.length === 0) {
            comparisons.push({
                name: speciesName,
                count: 0,
                hourlyPattern: new Array(24).fill(0),
                peakHours: [],
                avgConfidence: 0,
                firstSeen: null,
                lastSeen: null
            });
            return;
        }

        // Analyze hourly pattern
        const hourlyPattern = new Array(24).fill(0);
        speciesDetections.forEach(d => {
            const date = parseDetectionDate(d);
            const hour = date.getHours();
            hourlyPattern[hour]++;
        });

        // Find peak hours (top 3)
        const hourData = hourlyPattern.map((count, hour) => ({ hour, count }));
        const peakHours = hourData
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .filter(h => h.count > 0)
            .map(h => ({
                hour: h.hour,
                count: h.count,
                label: formatHour(h.hour)
            }));

        // Get timestamps
        const timestamps = speciesDetections.map(d => parseDetectionDate(d).getTime());
        const firstSeen = new Date(Math.min(...timestamps));
        const lastSeen = new Date(Math.max(...timestamps));

        // Calculate average confidence
        const confidences = speciesDetections.map(d => d.confidence || d.avgConfidence || 0);
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

        comparisons.push({
            name: speciesName,
            count: speciesDetections.length,
            hourlyPattern: hourlyPattern,
            peakHours: peakHours,
            avgConfidence: avgConfidence,
            firstSeen: firstSeen,
            lastSeen: lastSeen
        });
    });

    // Calculate overlap metrics
    const overlaps = calculateActivityOverlap(comparisons);

    return {
        species: comparisons,
        overlaps: overlaps,
        summary: generateComparisonSummary(comparisons, overlaps)
    };
}

/**
 * Calculate activity overlap between species
 */
function calculateActivityOverlap(comparisons) {
    const overlaps = [];

    for (let i = 0; i < comparisons.length; i++) {
        for (let j = i + 1; j < comparisons.length; j++) {
            const species1 = comparisons[i];
            const species2 = comparisons[j];

            // Calculate hourly overlap
            let overlapHours = 0;
            let totalActivityHours = 0;

            for (let hour = 0; hour < 24; hour++) {
                const count1 = species1.hourlyPattern[hour];
                const count2 = species2.hourlyPattern[hour];

                if (count1 > 0 && count2 > 0) {
                    overlapHours++;
                }
                if (count1 > 0 || count2 > 0) {
                    totalActivityHours++;
                }
            }

            const overlapPercentage = totalActivityHours > 0
                ? (overlapHours / totalActivityHours) * 100
                : 0;

            overlaps.push({
                species1: species1.name,
                species2: species2.name,
                overlapPercentage: overlapPercentage.toFixed(1),
                overlapHours: overlapHours,
                totalHours: totalActivityHours
            });
        }
    }

    return overlaps;
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(comparisons, overlaps) {
    const summary = [];

    // Most active species
    const mostActive = [...comparisons].sort((a, b) => b.count - a.count)[0];
    if (mostActive) {
        summary.push(`${mostActive.name} is most active with ${mostActive.count} detections`);
    }

    // Highest overlap
    if (overlaps.length > 0) {
        const highestOverlap = [...overlaps].sort((a, b) => parseFloat(b.overlapPercentage) - parseFloat(a.overlapPercentage))[0];
        summary.push(`${highestOverlap.species1} and ${highestOverlap.species2} overlap ${highestOverlap.overlapPercentage}% of the time`);
    }

    // Time separation
    if (overlaps.length > 0) {
        const lowestOverlap = [...overlaps].sort((a, b) => parseFloat(a.overlapPercentage) - parseFloat(b.overlapPercentage))[0];
        if (parseFloat(lowestOverlap.overlapPercentage) < 30) {
            summary.push(`${lowestOverlap.species1} and ${lowestOverlap.species2} prefer different times (${lowestOverlap.overlapPercentage}% overlap)`);
        }
    }

    return summary;
}

/**
 * Format hour for display
 */
function formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
}

/**
 * Enhanced predictions with weather integration
 */
export function predictActivityWithWeather(detections, weatherData) {
    const basePredictions = predictPeakActivity(detections, 7);

    if (!weatherData || !weatherData.forecast) {
        return basePredictions;
    }

    // Enhance predictions with weather
    const enhancedPredictions = basePredictions.map((prediction, index) => {
        const forecast = weatherData.forecast[index];
        if (!forecast) return prediction;

        // Adjust confidence based on weather
        let weatherAdjustment = 0;
        let weatherFactors = [];

        // Temperature impact
        if (forecast.temp >= 60 && forecast.temp <= 75) {
            weatherAdjustment += 15;
            weatherFactors.push('Ideal temperature');
        } else if (forecast.temp < 32 || forecast.temp > 90) {
            weatherAdjustment -= 20;
            weatherFactors.push(forecast.temp < 32 ? 'Very cold' : 'Very hot');
        }

        // Rain impact
        if (forecast.rain > 0.1) {
            weatherAdjustment -= 25;
            weatherFactors.push('Rain expected');
        }

        // Wind impact
        if (forecast.windSpeed > 15) {
            weatherAdjustment -= 15;
            weatherFactors.push('High winds');
        }

        // Adjust confidence (keep between 0-100)
        const adjustedConfidence = Math.max(0, Math.min(100, prediction.confidence + weatherAdjustment));

        return {
            ...prediction,
            weather: {
                temp: forecast.temp,
                description: forecast.description,
                icon: forecast.icon
            },
            confidence: adjustedConfidence,
            weatherFactors: weatherFactors,
            weatherAdjustment: weatherAdjustment
        };
    });

    return enhancedPredictions;
}

/**
 * Calculate year-over-year comparison
 * Compares current period to same period last year
 */
export function calculateYearOverYear(detections, speciesData) {
    const now = new Date();
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // This year (YTD)
    const thisYearDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= thisYearStart;
    });
    const thisYearSpecies = new Set(thisYearDetections.map(d =>
        d.commonName || d.common_name || d.scientificName
    ));

    // Last year (same period)
    const lastYearDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= lastYearStart && date <= lastYearEnd;
    });
    const lastYearSpecies = new Set(lastYearDetections.map(d =>
        d.commonName || d.common_name || d.scientificName
    ));

    // Calculate monthly breakdown
    const monthlyComparison = [];
    for (let month = 0; month <= now.getMonth(); month++) {
        const thisYear = detections.filter(d => {
            const date = parseDetectionDate(d);
            return date.getFullYear() === now.getFullYear() && date.getMonth() === month;
        });
        const lastYear = detections.filter(d => {
            const date = parseDetectionDate(d);
            return date.getFullYear() === now.getFullYear() - 1 && date.getMonth() === month;
        });

        monthlyComparison.push({
            month: new Date(now.getFullYear(), month, 1).toLocaleDateString('en-US', { month: 'short' }),
            thisYear: new Set(thisYear.map(d => d.commonName || d.common_name || d.scientificName)).size,
            lastYear: new Set(lastYear.map(d => d.commonName || d.common_name || d.scientificName)).size,
            thisYearDetections: thisYear.length,
            lastYearDetections: lastYear.length
        });
    }

    // New species this year
    const newSpeciesThisYear = [...thisYearSpecies].filter(s => !lastYearSpecies.has(s));

    // Missing species from last year
    const missingSpecies = [...lastYearSpecies].filter(s => !thisYearSpecies.has(s));

    const speciesChange = thisYearSpecies.size - lastYearSpecies.size;
    const detectionChange = thisYearDetections.length - lastYearDetections.length;

    return {
        thisYear: {
            species: thisYearSpecies.size,
            detections: thisYearDetections.length
        },
        lastYear: {
            species: lastYearSpecies.size,
            detections: lastYearDetections.length
        },
        changes: {
            species: speciesChange,
            speciesPercent: lastYearSpecies.size > 0 ? ((speciesChange / lastYearSpecies.size) * 100).toFixed(1) : 0,
            detections: detectionChange,
            detectionsPercent: lastYearDetections.length > 0 ? ((detectionChange / lastYearDetections.length) * 100).toFixed(1) : 0
        },
        monthlyComparison: monthlyComparison,
        newSpecies: newSpeciesThisYear,
        missingSpecies: missingSpecies
    };
}

/**
 * Calculate species streaks
 * Tracks consecutive days each species has appeared
 */
export function calculateSpeciesStreaks(detections, speciesData) {
    const streaks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    speciesData.forEach(species => {
        const speciesName = species.commonName || species.common_name || species.scientificName;

        // Get all detection dates for this species
        const detectionDates = detections
            .filter(d => (d.commonName || d.common_name || d.scientificName) === speciesName)
            .map(d => {
                const date = parseDetectionDate(d);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            })
            .filter((value, index, self) => self.indexOf(value) === index) // unique dates
            .sort((a, b) => b - a); // newest first

        if (detectionDates.length === 0) return;

        // Calculate current streak (consecutive days from today backwards)
        let currentStreak = 0;
        let checkDate = today.getTime();

        for (let i = 0; i < detectionDates.length; i++) {
            if (detectionDates[i] === checkDate) {
                currentStreak++;
                checkDate -= 24 * 60 * 60 * 1000; // go back one day
            } else if (detectionDates[i] < checkDate) {
                break;
            }
        }

        // Calculate best streak ever
        let bestStreak = 0;
        let tempStreak = 1;
        for (let i = 0; i < detectionDates.length - 1; i++) {
            const daysDiff = (detectionDates[i] - detectionDates[i + 1]) / (24 * 60 * 60 * 1000);
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak);

        if (currentStreak > 0 || bestStreak > 1) {
            streaks.push({
                species: speciesName,
                currentStreak: currentStreak,
                bestStreak: bestStreak,
                isActive: currentStreak > 0,
                lastSeen: new Date(detectionDates[0])
            });
        }
    });

    return streaks.sort((a, b) => {
        if (a.currentStreak !== b.currentStreak) {
            return b.currentStreak - a.currentStreak;
        }
        return b.bestStreak - a.bestStreak;
    });
}

/**
 * Calculate rarity scores for species
 * Based on detection frequency and historical patterns
 */
export function calculateRarityScores(speciesData, detections) {
    if (!speciesData || speciesData.length === 0) return [];

    const totalDetections = detections.length;
    const avgDetectionsPerSpecies = totalDetections / speciesData.length;

    return speciesData.map(species => {
        const speciesName = species.commonName || species.common_name || species.scientificName;
        const count = species.detections || species.count || 0;

        // Rarity based on frequency (less common = more rare)
        const frequencyScore = Math.max(0, 100 - ((count / avgDetectionsPerSpecies) * 50));

        // Rarity based on how long since first seen
        const firstSeen = species.firstSeen || new Date(species.first_seen);
        const daysSinceFirst = (Date.now() - firstSeen.getTime()) / (24 * 60 * 60 * 1000);
        const recencyScore = daysSinceFirst > 0 ? Math.min(50, (30 / daysSinceFirst) * 50) : 0;

        const rarityScore = Math.round(frequencyScore + recencyScore);

        let rarityLevel;
        if (rarityScore >= 80) rarityLevel = 'Extremely Rare';
        else if (rarityScore >= 60) rarityLevel = 'Very Rare';
        else if (rarityScore >= 40) rarityLevel = 'Rare';
        else if (rarityScore >= 20) rarityLevel = 'Uncommon';
        else rarityLevel = 'Common';

        return {
            species: speciesName,
            rarityScore: rarityScore,
            rarityLevel: rarityLevel,
            detections: count,
            firstSeen: firstSeen
        };
    }).sort((a, b) => b.rarityScore - a.rarityScore);
}

/**
 * Detect activity anomalies
 * Find unusual patterns in bird activity
 */
export function detectActivityAnomalies(detections, speciesData) {
    const anomalies = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgoStart = new Date(todayStart);
    weekAgoStart.setDate(weekAgoStart.getDate() - 7);

    // Today's detections
    const todayDetections = detections.filter(d => parseDetectionDate(d) >= todayStart);
    const todaySpecies = new Map();
    todayDetections.forEach(d => {
        const name = d.commonName || d.common_name || d.scientificName;
        todaySpecies.set(name, (todaySpecies.get(name) || 0) + 1);
    });

    // Historical average (last 30 days, excluding today)
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const historicalDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date >= thirtyDaysAgo && date < todayStart;
    });

    // Calculate daily averages for each species
    const speciesAverages = new Map();
    speciesData.forEach(species => {
        const speciesName = species.commonName || species.common_name || species.scientificName;
        const speciesDetections = historicalDetections.filter(d =>
            (d.commonName || d.common_name || d.scientificName) === speciesName
        );
        const dailyAvg = speciesDetections.length / 30;
        speciesAverages.set(speciesName, dailyAvg);
    });

    // Find anomalies - species much more or less active than usual
    todaySpecies.forEach((count, speciesName) => {
        const avg = speciesAverages.get(speciesName) || 0;
        if (avg === 0) return; // Skip if no historical data

        const percentDiff = ((count - avg) / avg) * 100;

        if (percentDiff >= 200) {
            anomalies.push({
                type: 'spike',
                species: speciesName,
                message: `${speciesName} appeared ${count} times today (${percentDiff.toFixed(0)}% more than usual)`,
                count: count,
                average: avg.toFixed(1),
                percentDiff: percentDiff.toFixed(0),
                icon: '📈'
            });
        } else if (percentDiff <= -50 && count > 0) {
            anomalies.push({
                type: 'drop',
                species: speciesName,
                message: `${speciesName} appeared only ${count} times today (${Math.abs(percentDiff).toFixed(0)}% less than usual)`,
                count: count,
                average: avg.toFixed(1),
                percentDiff: percentDiff.toFixed(0),
                icon: '📉'
            });
        }
    });

    // Find missing species (usually active but not seen today)
    speciesAverages.forEach((avg, speciesName) => {
        if (avg >= 1 && !todaySpecies.has(speciesName)) {
            anomalies.push({
                type: 'missing',
                species: speciesName,
                message: `${speciesName} not seen today (usually appears ${avg.toFixed(1)} times/day)`,
                count: 0,
                average: avg.toFixed(1),
                icon: '❓'
            });
        }
    });

    // New species today
    todaySpecies.forEach((count, speciesName) => {
        const avg = speciesAverages.get(speciesName) || 0;
        if (avg === 0) {
            anomalies.push({
                type: 'new',
                species: speciesName,
                message: `${speciesName} detected for the first time in 30 days!`,
                count: count,
                icon: '🆕'
            });
        }
    });

    return anomalies;
}

/**
 * Get missing species alerts
 * Species that haven't been seen in a while but usually appear regularly
 */
export function getMissingSpeciesAlerts(speciesData, detections) {
    const alerts = [];
    const now = new Date();

    speciesData.forEach(species => {
        const speciesName = species.commonName || species.common_name || species.scientificName;
        const lastSeen = species.lastSeen ? new Date(species.lastSeen) : new Date(species.last_seen);
        const daysSinceLastSeen = (now - lastSeen) / (24 * 60 * 60 * 1000);

        // Get all detections for this species
        const speciesDetections = detections
            .filter(d => (d.commonName || d.common_name || d.scientificName) === speciesName)
            .map(d => parseDetectionDate(d))
            .sort((a, b) => b - a);

        if (speciesDetections.length < 3) return; // Need at least 3 detections

        // Calculate average days between detections
        let totalDaysBetween = 0;
        for (let i = 0; i < speciesDetections.length - 1; i++) {
            const daysBetween = (speciesDetections[i] - speciesDetections[i + 1]) / (24 * 60 * 60 * 1000);
            totalDaysBetween += daysBetween;
        }
        const avgDaysBetween = totalDaysBetween / (speciesDetections.length - 1);

        // Alert if current absence is more than 2x the average interval
        if (daysSinceLastSeen > avgDaysBetween * 2 && avgDaysBetween < 7) {
            const daysOverdue = daysSinceLastSeen - avgDaysBetween;
            alerts.push({
                species: speciesName,
                daysSinceLastSeen: Math.round(daysSinceLastSeen),
                avgDaysBetween: avgDaysBetween.toFixed(1),
                daysOverdue: Math.round(daysOverdue),
                urgency: daysOverdue > avgDaysBetween * 2 ? 'high' : 'medium',
                message: `${speciesName} usually appears every ${avgDaysBetween.toFixed(1)} days, but it's been ${Math.round(daysSinceLastSeen)} days`
            });
        }
    });

    return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Predict best times to watch for birds
 * Based on historical peak activity
 */
export function predictBestWatchTimes(detections) {
    // Get hourly activity for each day of week
    const dayHourActivity = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    detections.forEach(d => {
        const date = parseDetectionDate(d);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;
        dayHourActivity[key] = (dayHourActivity[key] || 0) + 1;
    });

    // Find best times for each day
    const recommendations = daysOfWeek.map((dayName, dayIndex) => {
        const hoursData = [];
        for (let hour = 0; hour < 24; hour++) {
            const key = `${dayIndex}-${hour}`;
            hoursData.push({
                hour: hour,
                activity: dayHourActivity[key] || 0
            });
        }

        // Sort by activity
        hoursData.sort((a, b) => b.activity - a.activity);
        const topHours = hoursData.slice(0, 3);

        return {
            day: dayName,
            bestTimes: topHours.map(h => ({
                time: `${h.hour}:00 - ${h.hour + 1}:00`,
                hour: h.hour,
                activity: h.activity,
                label: h.hour < 12 ? 'Morning' : h.hour < 17 ? 'Afternoon' : 'Evening'
            })),
            peakActivity: topHours[0].activity
        };
    });

    // Get today's recommendation
    const today = new Date().getDay();
    const todayRecommendation = recommendations[today];

    return {
        today: todayRecommendation,
        weekly: recommendations
    };
}
