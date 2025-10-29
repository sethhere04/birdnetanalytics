/**
 * Feeding Module - Bird feeding recommendations
 */

import { birdFoodDatabase } from './database.js';

/**
 * Get current season
 */
export function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
}

/**
 * Get seasonal feeding recommendations
 */
export function getSeasonalRecommendations() {
    const season = getCurrentSeason();
    const recommendations = {
        spring: {
            title: 'Spring Feeding (March - May)',
            icon: '🌸',
            badge: 'season-spring',
            description: 'Spring is nesting and migration time. Birds need protein-rich foods to support breeding and prepare for migration.',
            foods: [
                { name: 'Mealworms', reason: 'High protein for nesting birds and chicks' },
                { name: 'Suet', reason: 'Energy for migrating birds' },
                { name: 'Sunflower Seeds', reason: 'Fat and protein for breeding season' },
                { name: 'Nyjer Seed', reason: 'Essential for finches raising young' },
                { name: 'Fruit', reason: 'Natural food for early migrants like robins' }
            ],
            tips: [
                'Offer live mealworms to attract bluebirds and wrens',
                'Keep feeders clean to prevent disease during crowded migration',
                'Add a water source - birds need it for drinking and bathing',
                'Reduce feeding in late spring when natural food becomes abundant'
            ]
        },
        summer: {
            title: 'Summer Feeding (June - August)',
            icon: '☀️',
            badge: 'season-summer',
            description: 'Many birds switch to natural insects in summer, but feeders still help parents feeding chicks.',
            foods: [
                { name: 'Nyjer Seed', reason: 'Goldfinches still love it year-round' },
                { name: 'Sunflower Chips', reason: 'No shells = less mess in summer heat' },
                { name: 'Fruit', reason: 'Attracts orioles, tanagers, and catbirds' },
                { name: 'Sugar Water', reason: 'For hummingbirds (change every 2-3 days)' },
                { name: 'Mealworms', reason: 'Protein boost for parent birds' }
            ],
            tips: [
                'Change water and nectar frequently in hot weather',
                'Clean feeders weekly to prevent mold and bacteria',
                'Use smaller quantities of seed to keep it fresh',
                'Provide shade for feeders if possible',
                'Keep suet in the refrigerator or use no-melt formulas'
            ]
        },
        fall: {
            title: 'Fall Feeding (September - November)',
            icon: '🍂',
            badge: 'season-fall',
            description: 'Fall migration brings new visitors. Birds need high-fat foods to fuel their journeys south.',
            foods: [
                { name: 'Sunflower Seeds', reason: 'High fat content for migration energy' },
                { name: 'Peanuts', reason: 'Excellent fat and protein source' },
                { name: 'Suet', reason: 'Essential high-energy food for migrants' },
                { name: 'Nyjer Seed', reason: 'Migrating finches fuel up' },
                { name: 'Millet', reason: 'Attracts sparrows and juncos returning for winter' }
            ],
            tips: [
                'Stock up on food for winter - birds are scouting feeding sites',
                'Add suet feeders back after summer break',
                'Watch for uncommon migrants passing through',
                'Keep feeders full to help birds build fat reserves',
                'Clean feeders before winter residents arrive'
            ]
        },
        winter: {
            title: 'Winter Feeding (December - February)',
            icon: '❄️',
            badge: 'season-winter',
            description: 'Winter is the most critical feeding time. Birds rely heavily on feeders when natural food is scarce.',
            foods: [
                { name: 'Black Oil Sunflower Seeds', reason: 'Maximum calories with thin shells' },
                { name: 'Suet', reason: 'Critical fat source for cold weather' },
                { name: 'Peanuts', reason: 'High-energy food woodpeckers love' },
                { name: 'Safflower Seeds', reason: 'Cardinals love them, squirrels don\'t' },
                { name: 'Cracked Corn', reason: 'Ground feeders like juncos and doves' }
            ],
            tips: [
                'Keep feeders full - birds depend on reliable food sources',
                'Offer suet in multiple locations for woodpeckers',
                'Shovel areas under feeders after snowfall',
                'Provide fresh water with a heated birdbath',
                'Feed in the morning and evening when birds need energy most'
            ]
        }
    };

    return recommendations[season];
}

/**
 * Get species-specific feeding recommendations
 */
export function getSpeciesFeedingData(topSpecies) {
    const speciesWithFeeding = topSpecies.filter(s => birdFoodDatabase[s.name]).slice(0, 12);

    if (speciesWithFeeding.length === 0) {
        return { speciesWithFeeding: [], allFoods: {}, allFeeders: {} };
    }

    const allFoods = {};
    const allFeeders = {};

    speciesWithFeeding.forEach(species => {
        const feedingData = birdFoodDatabase[species.name];
        feedingData.foods.forEach(food => {
            if (!allFoods[food]) allFoods[food] = [];
            allFoods[food].push(species.name);
        });
        feedingData.feeder.forEach(feeder => {
            if (!allFeeders[feeder]) allFeeders[feeder] = [];
            allFeeders[feeder].push(species.name);
        });
    });

    return { speciesWithFeeding, allFoods, allFeeders };
}

/**
 * Get feeding data for a specific species
 */
export function getFeedingDataForSpecies(speciesName) {
    return birdFoodDatabase[speciesName] || null;
}
