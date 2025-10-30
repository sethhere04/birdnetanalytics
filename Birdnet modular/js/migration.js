/**
 * Migration Module - Bird migration pattern analysis
 */

/**
 * Analyze migration patterns from species summary
 */
export function analyzeMigrationPatterns(species) {
    if (species.length === 0) return [];

    const migrations = [];
    const today = new Date();

    for (const s of species) {
        const speciesName = s.commonName || s.common_name || s.scientificName || 'Unknown';
        const firstSeen = s.firstSeen ? new Date(s.firstSeen) : null;
        const lastSeen = s.lastSeen ? new Date(s.lastSeen) : null;
        const count = s.detections || s.count || 0;

        if (!firstSeen || !lastSeen) continue;

        const pattern = classifyMigrationPatternSimple(firstSeen, lastSeen);
        const prediction = predictMigrationSimple(pattern, firstSeen, lastSeen, today);

        migrations.push({
            species: speciesName,
            pattern: pattern.type,
            firstSeen,
            lastSeen,
            detectionCount: count,
            monthlyPresence: [],
            prediction,
            confidence: count >= 50 ? 'high' : count >= 20 ? 'medium' : 'low'
        });
    }

    return migrations.sort((a, b) => {
        const aDate = a.prediction.nextDate || new Date(9999, 0, 1);
        const bDate = b.prediction.nextDate || new Date(9999, 0, 1);
        return aDate - bDate;
    });
}

/**
 * Classify migration pattern (simplified version for species summary)
 */
function classifyMigrationPatternSimple(firstSeen, lastSeen) {
    const daysSinceFirst = (new Date() - firstSeen) / (1000 * 60 * 60 * 24);
    const daysSinceLast = (new Date() - lastSeen) / (1000 * 60 * 60 * 24);

    // If seen recently and for a long time, likely resident
    if (daysSinceFirst > 300 && daysSinceLast < 30) {
        return { type: 'resident', description: 'Year-round resident' };
    }

    const firstMonth = firstSeen.getMonth();
    const lastMonth = lastSeen.getMonth();

    // Summer (April-September)
    if (firstMonth >= 3 && firstMonth <= 5 && lastMonth >= 7 && lastMonth <= 9) {
        return { type: 'summer', description: 'Summer breeding visitor' };
    }

    // Winter (October-March)
    if ((firstMonth >= 9 || firstMonth <= 2) && (lastMonth >= 9 || lastMonth <= 2)) {
        return { type: 'winter', description: 'Winter visitor' };
    }

    return { type: 'transient', description: 'Migratory (passing through)' };
}

/**
 * Predict migration timing (simplified)
 */
function predictMigrationSimple(pattern, firstSeen, lastSeen, today) {
    const daysSinceLast = (today - lastSeen) / (1000 * 60 * 60 * 24);

    if (pattern.type === 'resident') {
        return {
            status: 'present',
            message: 'Expected year-round',
            nextDate: null,
            countdown: null
        };
    }

    if (daysSinceLast < 7) {
        return {
            status: 'present',
            message: `Recently seen on ${lastSeen.toLocaleDateString()}`,
            nextDate: lastSeen,
            countdown: null
        };
    }

    if (daysSinceLast > 30) {
        const nextExpected = calculateNextExpectedDate(pattern, firstSeen, lastSeen, today);
        return {
            status: 'departed',
            message: `Last seen ${lastSeen.toLocaleDateString()}. May return in migration season.`,
            nextDate: nextExpected,
            countdown: calculateCountdown(nextExpected, today)
        };
    }

    return {
        status: 'migrating',
        message: 'May appear during migration',
        nextDate: today,
        countdown: null
    };
}

/**
 * Calculate next expected arrival date based on pattern
 */
function calculateNextExpectedDate(pattern, firstSeen, lastSeen, today) {
    const currentYear = today.getFullYear();
    const firstMonth = firstSeen.getMonth();
    const firstDay = firstSeen.getDate();

    let nextExpected = new Date(currentYear, firstMonth, firstDay);

    // If the expected date has passed this year, predict for next year
    if (nextExpected < today) {
        nextExpected = new Date(currentYear + 1, firstMonth, firstDay);
    }

    // Adjust based on pattern type
    if (pattern.type === 'summer') {
        // Summer birds typically arrive in spring (April-May)
        nextExpected = new Date(nextExpected.getFullYear(), Math.max(3, firstMonth), firstDay);
    } else if (pattern.type === 'winter') {
        // Winter birds typically arrive in fall (October-November)
        nextExpected = new Date(nextExpected.getFullYear(), Math.max(9, firstMonth), firstDay);
    }

    return nextExpected;
}

/**
 * Calculate countdown to a future date
 */
function calculateCountdown(futureDate, today) {
    if (!futureDate) return null;

    const diff = futureDate - today;
    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (days === 0) {
        return { value: 0, unit: 'days', text: 'Today!' };
    } else if (days === 1) {
        return { value: 1, unit: 'day', text: '1 day' };
    } else if (days < 7) {
        return { value: days, unit: 'days', text: `${days} days` };
    } else if (days < 30) {
        const remainingDays = days % 7;
        return {
            value: weeks,
            unit: 'weeks',
            text: remainingDays > 0 ? `${weeks} weeks, ${remainingDays} days` : `${weeks} weeks`
        };
    } else if (days < 365) {
        const remainingWeeks = Math.floor((days % 30) / 7);
        return {
            value: months,
            unit: 'months',
            text: remainingWeeks > 0 ? `${months} months, ${remainingWeeks} weeks` : `${months} months`
        };
    } else {
        const years = Math.floor(days / 365);
        const remainingMonths = Math.floor((days % 365) / 30);
        return {
            value: years,
            unit: 'years',
            text: remainingMonths > 0 ? `${years} years, ${remainingMonths} months` : `${years} years`
        };
    }
}
