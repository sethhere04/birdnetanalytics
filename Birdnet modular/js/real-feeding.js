// Real Feeding System - Based on YOUR detected species
console.log('real-feeding.js loading...');

// Comprehensive bird diet database with seasonal preferences
const BIRD_DIET_DATABASE = {
    // Cardinals and Grosbeaks
    'Northern Cardinal': {
        primaryDiet: ['seeds', 'insects'],
        foodPreferences: ['sunflower seeds', 'safflower seeds', 'cracked corn', 'peanuts'],
        feederTypes: ['platform', 'hopper', 'tube'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'insects'], priority: 'high-protein' },
            summer: { foods: ['seeds', 'fruit', 'insects'], priority: 'variety' },
            fall: { foods: ['sunflower seeds', 'corn'], priority: 'energy-building' },
            winter: { foods: ['sunflower seeds', 'peanuts'], priority: 'high-fat' }
        },
        dietBreakdown: { seeds: 60, insects: 30, fruit: 10 }
    },
    'Rose-breasted Grosbeak': {
        primaryDiet: ['seeds', 'insects', 'fruit'],
        foodPreferences: ['sunflower seeds', 'safflower', 'fruit', 'mealworms'],
        feederTypes: ['platform', 'hopper'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects', 'fruit', 'seeds'], priority: 'variety' },
            fall: { foods: ['sunflower seeds', 'fruit'], priority: 'energy-building' }
        },
        dietBreakdown: { seeds: 50, insects: 30, fruit: 20 }
    },
    
    // Woodpeckers
    'Red-bellied Woodpecker': {
        primaryDiet: ['insects', 'seeds', 'fruit'],
        foodPreferences: ['suet', 'peanuts', 'sunflower seeds', 'fruit'],
        feederTypes: ['suet cage', 'platform', 'peanut feeder'],
        seasonalNeeds: {
            spring: { foods: ['suet', 'mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects', 'fruit'], priority: 'fresh-foods' },
            fall: { foods: ['suet', 'peanuts', 'fruit'], priority: 'fat-storage' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 50, seeds: 25, fruit: 15, suet: 10 }
    },
    'Downy Woodpecker': {
        primaryDiet: ['insects', 'seeds'],
        foodPreferences: ['suet', 'peanut butter', 'sunflower seeds'],
        feederTypes: ['suet cage', 'peanut feeder'],
        seasonalNeeds: {
            spring: { foods: ['suet', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['suet', 'peanuts'], priority: 'fat-storage' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 65, seeds: 20, suet: 15 }
    },
    'Hairy Woodpecker': {
        primaryDiet: ['insects', 'seeds'],
        foodPreferences: ['suet', 'peanuts', 'sunflower seeds'],
        feederTypes: ['suet cage', 'peanut feeder'],
        seasonalNeeds: {
            spring: { foods: ['suet', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['suet', 'peanuts'], priority: 'fat-storage' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 70, seeds: 15, suet: 15 }
    },
    'Pileated Woodpecker': {
        primaryDiet: ['insects'],
        foodPreferences: ['suet', 'peanuts', 'mealworms'],
        feederTypes: ['suet cage', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['suet', 'mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['suet'], priority: 'fat-storage' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 75, suet: 15, seeds: 10 }
    },
    
    // Jays and Crows
    'Blue Jay': {
        primaryDiet: ['seeds', 'insects', 'nuts'],
        foodPreferences: ['peanuts', 'sunflower seeds', 'acorns', 'corn'],
        feederTypes: ['platform', 'hopper', 'peanut feeder'],
        seasonalNeeds: {
            spring: { foods: ['peanuts', 'sunflower seeds'], priority: 'high-protein' },
            summer: { foods: ['insects', 'peanuts'], priority: 'variety' },
            fall: { foods: ['acorns', 'peanuts', 'corn'], priority: 'cache-building' },
            winter: { foods: ['peanuts', 'sunflower seeds'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 45, insects: 25, nuts: 20, other: 10 }
    },
    
    // Chickadees and Titmice
    'Carolina Chickadee': {
        primaryDiet: ['insects', 'seeds'],
        foodPreferences: ['sunflower seeds', 'peanuts', 'suet', 'mealworms'],
        feederTypes: ['tube', 'suet cage', 'hopper'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects', 'sunflower seeds'], priority: 'natural-diet' },
            fall: { foods: ['sunflower seeds', 'peanuts'], priority: 'cache-building' },
            winter: { foods: ['sunflower seeds', 'suet'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 55, seeds: 35, suet: 10 }
    },
    'Tufted Titmouse': {
        primaryDiet: ['insects', 'seeds'],
        foodPreferences: ['sunflower seeds', 'peanuts', 'suet'],
        feederTypes: ['tube', 'hopper', 'suet cage'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects', 'sunflower seeds'], priority: 'natural-diet' },
            fall: { foods: ['sunflower seeds', 'peanuts'], priority: 'cache-building' },
            winter: { foods: ['sunflower seeds', 'suet'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 50, seeds: 40, suet: 10 }
    },
    
    // Nuthatches
    'White-breasted Nuthatch': {
        primaryDiet: ['insects', 'seeds', 'nuts'],
        foodPreferences: ['sunflower seeds', 'peanuts', 'suet'],
        feederTypes: ['suet cage', 'tube', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['sunflower seeds', 'peanuts'], priority: 'cache-building' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 45, seeds: 35, nuts: 15, suet: 5 }
    },
    'Red-breasted Nuthatch': {
        primaryDiet: ['insects', 'seeds'],
        foodPreferences: ['sunflower seeds', 'peanuts', 'suet'],
        feederTypes: ['suet cage', 'tube'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['sunflower seeds', 'peanuts'], priority: 'cache-building' },
            winter: { foods: ['suet', 'peanuts'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 50, seeds: 35, suet: 15 }
    },
    
    // Wrens
    'Carolina Wren': {
        primaryDiet: ['insects'],
        foodPreferences: ['suet', 'mealworms', 'peanut butter'],
        feederTypes: ['suet cage', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['mealworms', 'suet'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['suet', 'mealworms'], priority: 'fat-storage' },
            winter: { foods: ['suet', 'peanut butter'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 85, suet: 15 }
    },
    'House Wren': {
        primaryDiet: ['insects'],
        foodPreferences: ['mealworms'],
        feederTypes: ['platform'],
        seasonalNeeds: {
            spring: { foods: ['mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['mealworms'], priority: 'migration-prep' }
        },
        dietBreakdown: { insects: 98, other: 2 }
    },
    
    // Thrushes and Robins
    'American Robin': {
        primaryDiet: ['insects', 'fruit'],
        foodPreferences: ['mealworms', 'fruit', 'berries'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['mealworms', 'earthworms'], priority: 'high-protein' },
            summer: { foods: ['fruit', 'insects'], priority: 'fresh-foods' },
            fall: { foods: ['berries', 'fruit'], priority: 'energy-building' },
            winter: { foods: ['fruit', 'berries'], priority: 'fruit-focus' }
        },
        dietBreakdown: { insects: 40, fruit: 60 }
    },
    'Eastern Bluebird': {
        primaryDiet: ['insects', 'fruit'],
        foodPreferences: ['mealworms', 'suet', 'berries'],
        feederTypes: ['platform', 'mealworm feeder'],
        seasonalNeeds: {
            spring: { foods: ['mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects', 'fruit'], priority: 'natural-diet' },
            fall: { foods: ['mealworms', 'berries'], priority: 'energy-building' },
            winter: { foods: ['suet', 'berries'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 65, fruit: 35 }
    },
    'Wood Thrush': {
        primaryDiet: ['insects', 'fruit'],
        foodPreferences: ['mealworms', 'fruit'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects', 'fruit'], priority: 'natural-diet' },
            fall: { foods: ['fruit', 'mealworms'], priority: 'migration-prep' }
        },
        dietBreakdown: { insects: 70, fruit: 30 }
    },
    
    // Finches
    'American Goldfinch': {
        primaryDiet: ['seeds'],
        foodPreferences: ['nyjer', 'sunflower chips', 'millet'],
        feederTypes: ['tube', 'nyjer feeder'],
        seasonalNeeds: {
            spring: { foods: ['nyjer', 'fresh seeds'], priority: 'nesting-prep' },
            summer: { foods: ['nyjer', 'natural seeds'], priority: 'breeding' },
            fall: { foods: ['sunflower chips', 'nyjer'], priority: 'energy-building' },
            winter: { foods: ['nyjer', 'sunflower chips'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 100 }
    },
    'House Finch': {
        primaryDiet: ['seeds', 'fruit'],
        foodPreferences: ['sunflower seeds', 'nyjer', 'fruit'],
        feederTypes: ['tube', 'hopper'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'nyjer'], priority: 'nesting-prep' },
            summer: { foods: ['seeds', 'fruit'], priority: 'variety' },
            fall: { foods: ['sunflower seeds'], priority: 'energy-building' },
            winter: { foods: ['sunflower seeds', 'nyjer'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 85, fruit: 15 }
    },
    'Purple Finch': {
        primaryDiet: ['seeds', 'fruit'],
        foodPreferences: ['sunflower seeds', 'fruit', 'buds'],
        feederTypes: ['tube', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['sunflower seeds', 'buds'], priority: 'nesting-prep' },
            summer: { foods: ['seeds', 'fruit'], priority: 'variety' },
            fall: { foods: ['sunflower seeds'], priority: 'energy-building' },
            winter: { foods: ['sunflower seeds'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 80, fruit: 15, buds: 5 }
    },
    
    // Sparrows
    'White-throated Sparrow': {
        primaryDiet: ['seeds', 'insects'],
        foodPreferences: ['millet', 'cracked corn', 'sunflower chips'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'insects'], priority: 'migration-fuel' },
            fall: { foods: ['millet', 'cracked corn'], priority: 'migration-prep' },
            winter: { foods: ['millet', 'sunflower chips'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 75, insects: 25 }
    },
    'Song Sparrow': {
        primaryDiet: ['seeds', 'insects'],
        foodPreferences: ['millet', 'cracked corn', 'sunflower chips'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects', 'seeds'], priority: 'variety' },
            fall: { foods: ['millet', 'corn'], priority: 'energy-building' },
            winter: { foods: ['millet', 'sunflower chips'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 65, insects: 35 }
    },
    'Chipping Sparrow': {
        primaryDiet: ['seeds', 'insects'],
        foodPreferences: ['millet', 'cracked corn', 'nyjer'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects', 'seeds'], priority: 'variety' },
            fall: { foods: ['millet'], priority: 'migration-prep' }
        },
        dietBreakdown: { seeds: 60, insects: 40 }
    },
    'Dark-eyed Junco': {
        primaryDiet: ['seeds'],
        foodPreferences: ['millet', 'sunflower chips', 'cracked corn'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            fall: { foods: ['millet', 'corn'], priority: 'migration-fuel' },
            winter: { foods: ['millet', 'sunflower chips'], priority: 'high-energy' },
            spring: { foods: ['millet'], priority: 'migration-prep' }
        },
        dietBreakdown: { seeds: 100 }
    },
    
    // Warblers
    'Yellow-rumped Warbler': {
        primaryDiet: ['insects', 'fruit'],
        foodPreferences: ['suet', 'mealworms', 'fruit'],
        feederTypes: ['suet cage', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['suet', 'mealworms'], priority: 'migration-fuel' },
            fall: { foods: ['suet', 'fruit'], priority: 'migration-prep' },
            winter: { foods: ['suet', 'fruit'], priority: 'high-energy' }
        },
        dietBreakdown: { insects: 70, fruit: 20, suet: 10 }
    },
    'Common Yellowthroat': {
        primaryDiet: ['insects'],
        foodPreferences: ['mealworms'],
        feederTypes: ['platform'],
        seasonalNeeds: {
            spring: { foods: ['mealworms'], priority: 'high-protein' },
            summer: { foods: ['insects'], priority: 'natural-diet' },
            fall: { foods: ['mealworms'], priority: 'migration-prep' }
        },
        dietBreakdown: { insects: 100 }
    },
    
    // Other species
    'Baltimore Oriole': {
        primaryDiet: ['insects', 'fruit', 'nectar'],
        foodPreferences: ['grape jelly', 'oranges', 'mealworms', 'nectar'],
        feederTypes: ['platform', 'oriole feeder', 'nectar feeder'],
        seasonalNeeds: {
            spring: { foods: ['grape jelly', 'oranges', 'mealworms'], priority: 'migration-fuel' },
            summer: { foods: ['insects', 'fruit', 'nectar'], priority: 'variety' },
            fall: { foods: ['fruit', 'jelly'], priority: 'migration-prep' }
        },
        dietBreakdown: { insects: 50, fruit: 30, nectar: 20 }
    },
    'Ruby-throated Hummingbird': {
        primaryDiet: ['nectar', 'insects'],
        foodPreferences: ['sugar water', 'tiny insects'],
        feederTypes: ['nectar feeder'],
        seasonalNeeds: {
            spring: { foods: ['nectar'], priority: 'migration-fuel' },
            summer: { foods: ['nectar', 'insects'], priority: 'breeding' },
            fall: { foods: ['nectar'], priority: 'migration-prep' }
        },
        dietBreakdown: { nectar: 80, insects: 20 }
    },
    'Mourning Dove': {
        primaryDiet: ['seeds'],
        foodPreferences: ['millet', 'cracked corn', 'sunflower seeds'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'sunflower seeds'], priority: 'nesting-prep' },
            summer: { foods: ['seeds'], priority: 'variety' },
            fall: { foods: ['corn', 'millet'], priority: 'energy-building' },
            winter: { foods: ['millet', 'sunflower seeds'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 100 }
    },
    'Cedar Waxwing': {
        primaryDiet: ['fruit', 'insects'],
        foodPreferences: ['berries', 'fruit', 'insects'],
        feederTypes: ['platform', 'fruit feeder'],
        seasonalNeeds: {
            spring: { foods: ['fruit', 'insects'], priority: 'variety' },
            summer: { foods: ['insects', 'fruit'], priority: 'natural-diet' },
            fall: { foods: ['berries'], priority: 'energy-building' },
            winter: { foods: ['berries', 'fruit'], priority: 'fruit-focus' }
        },
        dietBreakdown: { fruit: 70, insects: 30 }
    },
    'Gray Catbird': {
        primaryDiet: ['insects', 'fruit'],
        foodPreferences: ['mealworms', 'fruit', 'grape jelly'],
        feederTypes: ['platform'],
        seasonalNeeds: {
            spring: { foods: ['mealworms', 'fruit'], priority: 'high-protein' },
            summer: { foods: ['insects', 'fruit'], priority: 'variety' },
            fall: { foods: ['fruit', 'mealworms'], priority: 'migration-prep' }
        },
        dietBreakdown: { insects: 60, fruit: 40 }
    },
    'Indigo Bunting': {
        primaryDiet: ['seeds', 'insects'],
        foodPreferences: ['nyjer', 'millet', 'sunflower chips'],
        feederTypes: ['tube', 'platform'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'insects'], priority: 'migration-fuel' },
            summer: { foods: ['insects', 'seeds'], priority: 'variety' },
            fall: { foods: ['nyjer', 'millet'], priority: 'migration-prep' }
        },
        dietBreakdown: { seeds: 55, insects: 45 }
    },
    'Eastern Towhee': {
        primaryDiet: ['seeds', 'insects', 'fruit'],
        foodPreferences: ['millet', 'sunflower seeds', 'cracked corn'],
        feederTypes: ['platform', 'ground'],
        seasonalNeeds: {
            spring: { foods: ['millet', 'insects'], priority: 'high-protein' },
            summer: { foods: ['insects', 'seeds', 'fruit'], priority: 'variety' },
            fall: { foods: ['seeds', 'fruit'], priority: 'energy-building' },
            winter: { foods: ['millet', 'sunflower seeds'], priority: 'high-energy' }
        },
        dietBreakdown: { seeds: 50, insects: 35, fruit: 15 }
    }
};

// Calculate comprehensive feeding recommendations from YOUR species
async function generateRealFeedingRecommendations() {
    try {
        console.log('📊 Generating real feeding recommendations from your detected species...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const detectedSpecies = await response.json();
        
        if (detectedSpecies.length === 0) {
            return {
                priorityFoods: [],
                feederTypes: [],
                seasonalRecommendations: {},
                dietBreakdown: {},
                upcomingNeeds: [],
                message: 'No species detected yet - start detecting birds!'
            };
        }
        
        console.log('✅ Analyzing ' + detectedSpecies.length + ' detected species for feeding needs');
        
        // Aggregate data from all detected species
        const foodScores = {};
        const feederScores = {};
        const dietTotals = { seeds: 0, insects: 0, fruit: 0, nectar: 0, suet: 0, other: 0 };
        const seasonalNeeds = { spring: {}, summer: {}, fall: {}, winter: {} };
        let totalWeight = 0;
        
        detectedSpecies.forEach(function(species) {
            const dietInfo = BIRD_DIET_DATABASE[species.common_name];
            if (!dietInfo) {
                console.log('⚠️ No diet data for: ' + species.common_name);
                return;
            }
            
            // Weight by detection count (more common species = higher priority)
            const weight = Math.min(species.count || 1, 100); // Cap at 100 to prevent dominance
            totalWeight += weight;
            
            // Score foods
            dietInfo.foodPreferences.forEach(function(food) {
                foodScores[food] = (foodScores[food] || 0) + weight;
            });
            
            // Score feeder types
            dietInfo.feederTypes.forEach(function(feeder) {
                feederScores[feeder] = (feederScores[feeder] || 0) + weight;
            });
            
            // Aggregate diet breakdown
            Object.keys(dietInfo.dietBreakdown).forEach(function(category) {
                const percentage = dietInfo.dietBreakdown[category];
                if (dietTotals[category] !== undefined) {
                    dietTotals[category] += (percentage * weight) / 100;
                } else {
                    dietTotals.other += (percentage * weight) / 100;
                }
            });
            
            // Aggregate seasonal needs
            Object.keys(dietInfo.seasonalNeeds).forEach(function(season) {
                const needs = dietInfo.seasonalNeeds[season];
                if (!seasonalNeeds[season]) seasonalNeeds[season] = {};
                
                needs.foods.forEach(function(food) {
                    seasonalNeeds[season][food] = (seasonalNeeds[season][food] || 0) + weight;
                });
            });
        });
        
        // Normalize diet breakdown to percentages
        Object.keys(dietTotals).forEach(function(category) {
            dietTotals[category] = Math.round((dietTotals[category] / totalWeight) * 100);
        });
        
        // Sort and get top priority foods
        const priorityFoods = Object.keys(foodScores)
            .sort((a, b) => foodScores[b] - foodScores[a])
            .slice(0, 8)
            .map(function(food) {
                return {
                    food: food,
                    score: Math.round((foodScores[food] / totalWeight) * 100),
                    speciesCount: detectedSpecies.filter(s => {
                        const info = BIRD_DIET_DATABASE[s.common_name];
                        return info && info.foodPreferences.includes(food);
                    }).length
                };
            });
        
        // Sort and get top feeder types
        const feederTypes = Object.keys(feederScores)
            .sort((a, b) => feederScores[b] - feederScores[a])
            .map(function(feeder) {
                return {
                    type: feeder,
                    priority: Math.round((feederScores[feeder] / totalWeight) * 100)
                };
            });
        
        // Generate seasonal recommendations
        const currentMonth = new Date().getMonth();
        let currentSeason = 'winter';
        if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
        else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
        else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
        
        const seasonalRecs = {};
        Object.keys(seasonalNeeds).forEach(function(season) {
            const foods = seasonalNeeds[season];
            seasonalRecs[season] = Object.keys(foods)
                .sort((a, b) => foods[b] - foods[a])
                .slice(0, 5)
                .map(food => ({
                    food: food,
                    importance: Math.round((foods[food] / totalWeight) * 100)
                }));
        });
        
        // Generate upcoming migration needs
        const upcomingNeeds = generateUpcomingFeedingNeeds(detectedSpecies, currentMonth);
        
        console.log('✅ Feeding recommendations generated successfully');
        
        return {
            priorityFoods: priorityFoods,
            feederTypes: feederTypes,
            seasonalRecommendations: seasonalRecs,
            currentSeason: currentSeason,
            dietBreakdown: dietTotals,
            upcomingNeeds: upcomingNeeds,
            speciesAnalyzed: detectedSpecies.length,
            message: 'Recommendations based on ' + detectedSpecies.length + ' detected species'
        };
        
    } catch (error) {
        console.error('Error generating feeding recommendations:', error);
        return {
            priorityFoods: [],
            feederTypes: [],
            seasonalRecommendations: {},
            dietBreakdown: {},
            upcomingNeeds: [],
            message: 'Error loading feeding data'
        };
    }
}

// Generate feeding needs for upcoming migrants
function generateUpcomingFeedingNeeds(detectedSpecies, currentMonth) {
    const upcomingMonths = [(currentMonth + 1) % 12, (currentMonth + 2) % 12];
    const needs = [];
    
    // Check for migratory species that might arrive soon
    detectedSpecies.forEach(function(species) {
        if (!species.first_heard) return;
        
        const firstDate = new Date(species.first_heard);
        const arrivalMonth = firstDate.getMonth();
        
        // If this species typically arrives in upcoming months
        if (upcomingMonths.includes(arrivalMonth)) {
            const dietInfo = BIRD_DIET_DATABASE[species.common_name];
            if (dietInfo) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                needs.push({
                    species: species.common_name,
                    expectedMonth: monthNames[arrivalMonth],
                    foods: dietInfo.foodPreferences.slice(0, 3),
                    priority: dietInfo.seasonalNeeds.spring?.priority || 'high-protein'
                });
            }
        }
    });
    
    return needs;
}

// Update the feeding recommendations display
async function updateRealFeedingRecommendations() {
    console.log('🔄 Updating feeding recommendations...');
    
    const recommendations = await generateRealFeedingRecommendations();
    
    // Update main feeding recommendations section
    const feedingRec = document.getElementById('feeding-recommendations');
    if (feedingRec) {
        if (recommendations.speciesAnalyzed === 0) {
            feedingRec.innerHTML = '<div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b;">No species detected yet. Start your BirdNET to get personalized feeding recommendations!</div>';
        } else {
            let html = '<div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; border-left: 4px solid #10b981;">';
            html += '<h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">Your Bird Community</h3>';
            html += '<p style="margin: 0;">' + recommendations.message + '</p>';
            html += '<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">Current season: <strong>' + recommendations.currentSeason.charAt(0).toUpperCase() + recommendations.currentSeason.slice(1) + '</strong></p>';
            html += '</div>';
            feedingRec.innerHTML = html;
        }
    }
    
    // Update priority foods
    const priorityFoodsEl = document.getElementById('priority-foods');
    if (priorityFoodsEl && recommendations.priorityFoods.length > 0) {
        let html = '';
        recommendations.priorityFoods.forEach(function(item, index) {
            const priorityLevel = index < 2 ? 'Critical' : index < 4 ? 'High' : 'Medium';
            const priorityColor = index < 2 ? '#10b981' : index < 4 ? '#f59e0b' : '#6b7280';
            
            html += '<div style="background: white; padding: 0.75rem; margin: 0.5rem 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid ' + priorityColor + ';">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
            html += '<div><strong>' + item.food.charAt(0).toUpperCase() + item.food.slice(1) + '</strong>';
            html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">' + item.speciesCount + ' of your species need this</div></div>';
            html += '<span class="badge badge-success" style="background: ' + priorityColor + '; color: white;">' + priorityLevel + '</span>';
            html += '</div></div>';
        });
        priorityFoodsEl.innerHTML = html;
    }
    
    // Update seasonal feeding calendar
    const feedingCalendar = document.getElementById('feeding-calendar');
    if (feedingCalendar && Object.keys(recommendations.seasonalRecommendations).length > 0) {
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const seasonNames = { spring: '🌱 Spring', summer: '☀️ Summer', fall: '🍂 Fall', winter: '❄️ Winter' };
        const currentSeason = recommendations.currentSeason;
        
        let html = '';
        seasons.forEach(function(season) {
            const foods = recommendations.seasonalRecommendations[season] || [];
            const isCurrent = season === currentSeason;
            
            html += '<div style="background: ' + (isCurrent ? '#dbeafe' : 'white') + '; padding: 0.75rem; margin: 0.5rem 0; border-radius: 6px; border: 2px solid ' + (isCurrent ? '#3b82f6' : '#e5e7eb') + ';">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">';
            html += '<strong style="color: ' + (isCurrent ? '#1e40af' : '#374151') + ';">' + seasonNames[season] + '</strong>';
            if (isCurrent) html += '<span style="background: #3b82f6; color: white; padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.688rem; font-weight: 600;">CURRENT</span>';
            html += '</div>';
            
            if (foods.length > 0) {
                html += '<div style="font-size: 0.813rem; color: #6b7280;">';
                html += '<strong>Focus on:</strong> ';
                html += foods.slice(0, 3).map(f => f.food).join(', ');
                html += '</div>';
            } else {
                html += '<div style="font-size: 0.813rem; color: #9ca3af; font-style: italic;">Standard feeding</div>';
            }
            html += '</div>';
        });
        feedingCalendar.innerHTML = html;
    }
    
    // Update diet chart
    const ctx = document.getElementById('diet-chart');
    if (ctx && recommendations.dietBreakdown) {
        const chartCtx = ctx.getContext('2d');
        if (charts.diet) charts.diet.destroy();
        
        const labels = [];
        const data = [];
        const colors = {
            seeds: '#f59e0b',
            insects: '#10b981',
            fruit: '#ef4444',
            nectar: '#06b6d4',
            suet: '#8b5cf6',
            other: '#6b7280'
        };
        const backgroundColors = [];
        
        Object.keys(recommendations.dietBreakdown).forEach(function(category) {
            const value = recommendations.dietBreakdown[category];
            if (value > 0) {
                labels.push(category.charAt(0).toUpperCase() + category.slice(1));
                data.push(value);
                backgroundColors.push(colors[category] || '#6b7280');
            }
        });
        
        charts.diet = new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '% of community diet';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update diet analysis text
    const dietAnalysis = document.getElementById('diet-analysis');
    if (dietAnalysis && recommendations.dietBreakdown) {
        const breakdown = recommendations.dietBreakdown;
        const primaryCategory = Object.keys(breakdown).reduce((a, b) => breakdown[a] > breakdown[b] ? a : b);
        
        let html = '<div style="line-height: 1.8;">';
        html += '<p><strong>Community Diet Profile:</strong></p>';
        html += '<p>Your bird community is primarily <strong>' + primaryCategory + '-eating (' + breakdown[primaryCategory] + '%)</strong>. ';
        
        // Add specific recommendations based on diet breakdown
        if (breakdown.seeds > 50) {
            html += 'Focus on quality seed mixes with sunflower seeds, millet, and nyjer. ';
        }
        if (breakdown.insects > 30) {
            html += 'Offer live or dried mealworms, especially in spring and summer. ';
        }
        if (breakdown.fruit > 20) {
            html += 'Provide fresh fruits and berries, particularly in summer and fall. ';
        }
        if (breakdown.suet > 10) {
            html += 'Keep suet feeders stocked year-round for woodpeckers and nuthatches. ';
        }
        if (breakdown.nectar > 10) {
            html += 'Maintain nectar feeders from spring through fall. ';
        }
        
        html += '</p><p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Adjust your feeder types and food offerings to match your community\'s needs.</p>';
        html += '</div>';
        
        dietAnalysis.innerHTML = html;
    }
    
    // Update upcoming species forecast for feeding
    if (recommendations.upcomingNeeds.length > 0) {
        const forecastInfo = document.getElementById('forecast-info');
        if (forecastInfo) {
            forecastInfo.innerHTML = '<p>Prepare feeders for ' + recommendations.upcomingNeeds.length + ' expected species based on your historical detection patterns</p>';
        }
        
        const forecastTbody = document.querySelector('#forecast-table tbody');
        if (forecastTbody) {
            forecastTbody.innerHTML = '';
            
            recommendations.upcomingNeeds.forEach(function(need) {
                const row = forecastTbody.insertRow();
                row.innerHTML = 
                    '<td>' + need.species + '</td>' +
                    '<td>Expected in ' + need.expectedMonth + '</td>' +
                    '<td><span class="badge badge-success">High</span></td>' +
                    '<td>' + need.foods.join(', ') + '</td>';
            });
        }
    }
    
    // Add feeder type recommendations section
    if (recommendations.feederTypes.length > 0) {
        const feedingRec = document.getElementById('feeding-recommendations');
        if (feedingRec) {
            let html = feedingRec.innerHTML;
            html += '<div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">';
            html += '<h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">🎯 Recommended Feeder Types</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">';
            
            recommendations.feederTypes.slice(0, 5).forEach(function(feeder) {
                const priorityColor = feeder.priority > 60 ? '#10b981' : feeder.priority > 40 ? '#f59e0b' : '#6b7280';
                html += '<div style="background: white; padding: 0.5rem; border-radius: 4px; border-left: 3px solid ' + priorityColor + ';">';
                html += '<div style="font-weight: 600; font-size: 0.875rem;">' + feeder.type.charAt(0).toUpperCase() + feeder.type.slice(1) + '</div>';
                html += '<div style="font-size: 0.75rem; color: #6b7280;">' + feeder.priority + '% priority</div>';
                html += '</div>';
            });
            
            html += '</div></div>';
            feedingRec.innerHTML = html;
        }
    }
    
    console.log('✅ Feeding recommendations updated successfully');
}

// Initialize feeding system
function initializeRealFeedingSystem() {
    console.log('🌰 Initializing real feeding recommendation system...');
    updateRealFeedingRecommendations();
}

// Export functions
window.updateRealFeedingRecommendations = updateRealFeedingRecommendations;
window.initializeRealFeedingSystem = initializeRealFeedingSystem;
window.BIRD_DIET_DATABASE = BIRD_DIET_DATABASE;

console.log('✅ real-feeding.js loaded successfully');
console.log('📊 Diet database contains ' + Object.keys(BIRD_DIET_DATABASE).length + ' species');

// Integration instructions for Index.html:
// Add this line BEFORE app.js in your HTML:
// <script src="js/real-feeding.js"></script>

// Integration instructions for app.js:
// Add this to your window.onload function, after loadAllData():
/*
    // Initialize Real Feeding System
    if (typeof initializeRealFeedingSystem === 'function') {
        console.log('Loading real feeding recommendations...');
        initializeRealFeedingSystem();
    } else {
        console.warn('Real Feeding System not loaded - check real-feeding.js');
    }
*/

// Integration instructions for updates.js:
// Replace the entire feeding section in updateAdvancedAnalytics() with:
/*
    // Real Feeding Recommendations
    if (typeof updateRealFeedingRecommendations === 'function') {
        await updateRealFeedingRecommendations();
    }
*/