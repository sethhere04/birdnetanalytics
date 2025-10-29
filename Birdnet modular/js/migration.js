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
            nextDate: null
        };
    }

    if (daysSinceLast < 7) {
        return {
            status: 'present',
            message: `Recently seen on ${lastSeen.toLocaleDateString()}`,
            nextDate: lastSeen
        };
    }

    if (daysSinceLast > 30) {
        return {
            status: 'departed',
            message: `Last seen ${lastSeen.toLocaleDateString()}. May return in migration season.`,
            nextDate: new Date(today.getFullYear() + 1, firstSeen.getMonth(), firstSeen.getDate())
        };
    }

    return {
        status: 'migrating',
        message: 'May appear during migration',
        nextDate: today
    };
}
