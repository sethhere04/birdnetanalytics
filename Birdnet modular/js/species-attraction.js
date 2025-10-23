// Species Attraction System - Suggest foods/feeders to attract species you DON'T have yet
console.log('species-attraction.js loading...');

// Comprehensive species database with habitat requirements and attractiveness factors
const SPECIES_ATTRACTION_DATABASE = {
    // Species you might not have yet, organized by likelihood
    
    // HIGH PROBABILITY - Common species that should be in your area
    'Tufted Titmouse': {
        likelihood: 'high',
        reason: 'Common year-round resident in Ohio',
        foods: ['sunflower seeds', 'peanuts', 'suet'],
        feederTypes: ['tube feeder', 'hopper feeder', 'suet cage'],
        habitat: ['mature trees', 'woodland edges'],
        season: 'year-round',
        difficulty: 'easy',
        tips: 'Very responsive to feeders. Loves black oil sunflower seeds. Will use nest boxes.',
        similarTo: ['Carolina Chickadee', 'White-breasted Nuthatch']
    },
    
    'Black-capped Chickadee': {
        likelihood: 'high',
        reason: 'Common in northern Ohio',
        foods: ['sunflower seeds', 'peanuts', 'suet', 'mealworms'],
        feederTypes: ['tube feeder', 'suet cage', 'hopper'],
        habitat: ['mixed woodlands', 'suburban yards'],
        season: 'year-round',
        difficulty: 'easy',
        tips: 'Acrobatic and fearless. Cache food for winter. Love suet in cold weather.',
        similarTo: ['Carolina Chickadee', 'Tufted Titmouse']
    },
    
    'White-throated Sparrow': {
        likelihood: 'high',
        reason: 'Common winter visitor (Oct-Apr)',
        foods: ['millet', 'cracked corn', 'sunflower chips'],
        feederTypes: ['platform feeder', 'ground feeding'],
        habitat: ['brushy areas', 'woodland edges'],
        season: 'winter',
        difficulty: 'easy',
        tips: 'Ground feeders. Scatter millet under bushes. Prefer areas with cover nearby.',
        similarTo: ['Dark-eyed Junco', 'Song Sparrow']
    },
    
    'Baltimore Oriole': {
        likelihood: 'high',
        reason: 'Spring/summer migrant (May-Aug)',
        foods: ['grape jelly', 'oranges', 'nectar', 'mealworms'],
        feederTypes: ['oriole feeder', 'platform feeder', 'nectar feeder'],
        habitat: ['tall shade trees', 'open woodlands'],
        season: 'spring-summer',
        difficulty: 'moderate',
        tips: 'Arrive late April/early May. Put out grape jelly and orange halves. Bright orange plumage.',
        similarTo: ['Rose-breasted Grosbeak', 'Gray Catbird']
    },
    
    'Ruby-throated Hummingbird': {
        likelihood: 'high',
        reason: 'Summer resident (May-Sep)',
        foods: ['sugar water (1:4 ratio)', 'small insects'],
        feederTypes: ['nectar feeder'],
        habitat: ['flower gardens', 'woodland edges'],
        season: 'spring-summer',
        difficulty: 'easy',
        tips: 'Males arrive first in late April. Clean feeders every 3-4 days. Plant red tubular flowers.',
        similarTo: ['Baltimore Oriole']
    },
    
    'Dark-eyed Junco': {
        likelihood: 'high',
        reason: 'Winter visitor (Oct-Apr)',
        foods: ['millet', 'sunflower chips', 'cracked corn'],
        feederTypes: ['platform feeder', 'ground feeding'],
        habitat: ['brushy edges', 'woodland borders'],
        season: 'winter',
        difficulty: 'easy',
        tips: 'Called "snowbirds". Ground feeders. Often in flocks. Prefer feeding areas with nearby cover.',
        similarTo: ['White-throated Sparrow', 'Chipping Sparrow']
    },
    
    // MEDIUM PROBABILITY - Less common but definitely possible
    'Yellow-rumped Warbler': {
        likelihood: 'medium',
        reason: 'Migration periods and winter',
        foods: ['suet', 'mealworms', 'berries'],
        feederTypes: ['suet cage', 'platform feeder'],
        habitat: ['woodland edges', 'berry bushes'],
        season: 'migration',
        difficulty: 'moderate',
        tips: 'Most likely during migration (Apr-May, Sep-Oct). One of few warblers that eats suet.',
        similarTo: ['Cedar Waxwing']
    },
    
    'Common Yellowthroat': {
        likelihood: 'medium',
        reason: 'Summer resident near water',
        foods: ['insects', 'mealworms'],
        feederTypes: ['mealworm feeder', 'platform'],
        habitat: ['wetland edges', 'dense shrubs'],
        season: 'spring-summer',
        difficulty: 'difficult',
        tips: 'Secretive. Prefers natural insects but may visit mealworm feeders. Needs dense low vegetation.',
        similarTo: ['House Wren', 'Carolina Wren']
    },
    
    'Ovenbird': {
        likelihood: 'medium',
        reason: 'Summer forest resident',
        foods: ['insects', 'mealworms'],
        feederTypes: ['ground feeding', 'mealworm feeder'],
        habitat: ['mature forest floor', 'leaf litter'],
        season: 'spring-summer',
        difficulty: 'difficult',
        tips: 'Ground dweller. Rarely visits feeders. Best attracted by mature forest habitat with leaf litter.',
        similarTo: ['Wood Thrush', 'Louisiana Waterthrush']
    },
    
    'Scarlet Tanager': {
        likelihood: 'medium',
        reason: 'Summer forest canopy resident',
        foods: ['fruit', 'mealworms', 'berries'],
        feederTypes: ['platform feeder', 'fruit feeder'],
        habitat: ['mature forest canopy'],
        season: 'spring-summer',
        difficulty: 'difficult',
        tips: 'Stunning red male. Prefers high canopy. May visit feeders for fruit or mealworms during migration.',
        similarTo: ['Rose-breasted Grosbeak', 'Baltimore Oriole']
    },
    
    'Red-headed Woodpecker': {
        likelihood: 'medium',
        reason: 'Year-round resident in suitable habitat',
        foods: ['suet', 'peanuts', 'sunflower seeds', 'mealworms'],
        feederTypes: ['suet cage', 'peanut feeder', 'platform'],
        habitat: ['open woodlands', 'dead snags'],
        season: 'year-round',
        difficulty: 'moderate',
        tips: 'Needs dead trees (snags). Cache food in bark crevices. Striking red, white, and black plumage.',
        similarTo: ['Red-bellied Woodpecker', 'Downy Woodpecker']
    },
    
    'Eastern Towhee': {
        likelihood: 'medium',
        reason: 'Year-round or summer resident',
        foods: ['millet', 'sunflower seeds', 'cracked corn'],
        feederTypes: ['platform feeder', 'ground feeding'],
        habitat: ['dense shrubs', 'woodland understory'],
        season: 'year-round',
        difficulty: 'moderate',
        tips: 'Ground forager. "Kick-scratches" in leaf litter. Prefers areas with dense low cover.',
        similarTo: ['Brown Thrasher', 'Song Sparrow']
    },
    
    'Brown Creeper': {
        likelihood: 'medium',
        reason: 'Winter visitor and year-round resident',
        foods: ['suet', 'peanut butter', 'mealworms'],
        feederTypes: ['suet cage', 'suet smeared on tree bark'],
        habitat: ['mature trees with rough bark'],
        season: 'winter',
        difficulty: 'moderate',
        tips: 'Tiny, well-camouflaged. Spirals up tree trunks. Loves suet smeared directly on bark.',
        similarTo: ['White-breasted Nuthatch', 'Downy Woodpecker']
    },
    
    'Fox Sparrow': {
        likelihood: 'medium',
        reason: 'Winter visitor and migrant',
        foods: ['millet', 'sunflower chips', 'cracked corn'],
        feederTypes: ['platform feeder', 'ground feeding'],
        habitat: ['dense brush', 'woodland edges'],
        season: 'winter',
        difficulty: 'moderate',
        tips: 'Large rusty sparrow. Kick-scratches like towhee. Winter visitor, often in small groups.',
        similarTo: ['White-throated Sparrow', 'Eastern Towhee']
    },
    
    // LOWER PROBABILITY - Uncommon but possible with right setup
    'Indigo Bunting': {
        likelihood: 'low',
        reason: 'Summer resident in open areas',
        foods: ['nyjer', 'millet', 'sunflower chips'],
        feederTypes: ['tube feeder', 'platform feeder'],
        habitat: ['field edges', 'brushy areas'],
        season: 'spring-summer',
        difficulty: 'difficult',
        tips: 'Brilliant blue male. Prefers natural seeds but may visit feeders. Needs open/edge habitat.',
        similarTo: ['American Goldfinch', 'Rose-breasted Grosbeak']
    },
    
    'Wood Thrush': {
        likelihood: 'low',
        reason: 'Summer forest interior resident',
        foods: ['mealworms', 'fruit', 'berries'],
        feederTypes: ['platform feeder', 'ground feeding'],
        habitat: ['mature forest interior', 'damp woods'],
        season: 'spring-summer',
        difficulty: 'very difficult',
        tips: 'Beautiful flute-like song. Rarely visits feeders. Best attracted by preserving forest habitat.',
        similarTo: ['American Robin', 'Gray-cheeked Thrush']
    },
    
    'Pine Siskin': {
        likelihood: 'low',
        reason: 'Irregular winter visitor (irruptive)',
        foods: ['nyjer', 'sunflower chips', 'thistle'],
        feederTypes: ['tube feeder', 'nyjer feeder'],
        habitat: ['conifers', 'mixed woodlands'],
        season: 'winter',
        difficulty: 'moderate',
        tips: 'Irruptive species - some years abundant, other years absent. Small streaky finch.',
        similarTo: ['American Goldfinch', 'Purple Finch']
    },
    
    'Evening Grosbeak': {
        likelihood: 'low',
        reason: 'Irregular winter visitor',
        foods: ['sunflower seeds', 'fruit'],
        feederTypes: ['platform feeder', 'hopper feeder'],
        habitat: ['coniferous forests'],
        season: 'winter',
        difficulty: 'very difficult',
        tips: 'Rare visitor. Irruptive species. Massive bill. Travels in flocks when present.',
        similarTo: ['Rose-breasted Grosbeak', 'Purple Finch']
    }
};

// Analyze what species you DON'T have and suggest attractants
async function generateSpeciesAttractionRecommendations() {
    try {
        console.log('🎯 Analyzing species you DON\'T have yet...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const detectedSpecies = await response.json();
        
        // Get list of species names you already have
        const detectedNames = detectedSpecies.map(s => s.common_name);
        
        console.log('✅ You currently have ' + detectedNames.length + ' species detected');
        
        // Find species you DON'T have yet
        const undetectedSpecies = [];
        
        Object.keys(SPECIES_ATTRACTION_DATABASE).forEach(function(speciesName) {
            if (!detectedNames.includes(speciesName)) {
                const speciesInfo = SPECIES_ATTRACTION_DATABASE[speciesName];
                undetectedSpecies.push({
                    name: speciesName,
                    ...speciesInfo
                });
            }
        });
        
        console.log('🆕 Found ' + undetectedSpecies.length + ' species you haven\'t detected yet');
        
        // Filter by current season
        const currentMonth = new Date().getMonth();
        let currentSeason = 'winter';
        if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
        else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
        else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
        
        // Filter to species likely present in current season
        const seasonalSpecies = undetectedSpecies.filter(function(species) {
            if (species.season === 'year-round') return true;
            if (species.season === 'spring-summer' && (currentSeason === 'spring' || currentSeason === 'summer')) return true;
            if (species.season === 'winter' && (currentSeason === 'fall' || currentSeason === 'winter')) return true;
            if (species.season === 'migration' && (currentSeason === 'spring' || currentSeason === 'fall')) return true;
            return false;
        });
        
        console.log('📅 ' + seasonalSpecies.length + ' species likely present in current season (' + currentSeason + ')');
        
        // Sort by likelihood and difficulty
        const likelihoodOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        seasonalSpecies.sort(function(a, b) {
            const likelihoodDiff = likelihoodOrder[b.likelihood] - likelihoodOrder[a.likelihood];
            if (likelihoodDiff !== 0) return likelihoodDiff;
            
            // If same likelihood, easier species first
            const difficultyOrder = { 'easy': 4, 'moderate': 3, 'difficult': 2, 'very difficult': 1 };
            return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        });
        
        // Aggregate what you need to attract these species
        const foodScores = {};
        const feederScores = {};
        const habitatNeeds = {};
        
        seasonalSpecies.forEach(function(species) {
            const weight = likelihoodOrder[species.likelihood] || 1;
            
            species.foods.forEach(function(food) {
                foodScores[food] = (foodScores[food] || 0) + weight;
            });
            
            species.feederTypes.forEach(function(feeder) {
                feederScores[feeder] = (feederScores[feeder] || 0) + weight;
            });
            
            species.habitat.forEach(function(habitat) {
                habitatNeeds[habitat] = (habitatNeeds[habitat] || 0) + weight;
            });
        });
        
        // Get top recommendations
        const topFoods = Object.keys(foodScores)
            .sort((a, b) => foodScores[b] - foodScores[a])
            .slice(0, 5)
            .map(food => ({
                food: food,
                speciesAttracted: seasonalSpecies.filter(s => s.foods.includes(food)).length,
                priority: foodScores[food]
            }));
        
        const topFeeders = Object.keys(feederScores)
            .sort((a, b) => feederScores[b] - feederScores[a])
            .slice(0, 5)
            .map(feeder => ({
                feeder: feeder,
                speciesAttracted: seasonalSpecies.filter(s => s.feederTypes.includes(feeder)).length,
                priority: feederScores[feeder]
            }));
        
        const topHabitat = Object.keys(habitatNeeds)
            .sort((a, b) => habitatNeeds[b] - habitatNeeds[a])
            .slice(0, 5)
            .map(habitat => ({
                habitat: habitat,
                speciesAttracted: seasonalSpecies.filter(s => s.habitat.includes(habitat)).length,
                priority: habitatNeeds[habitat]
            }));
        
        // Top 5 most likely species to attract right now
        const topTargets = seasonalSpecies.slice(0, 5);
        
        return {
            undetectedCount: undetectedSpecies.length,
            seasonalCount: seasonalSpecies.length,
            currentSeason: currentSeason,
            topTargets: topTargets,
            topFoods: topFoods,
            topFeeders: topFeeders,
            topHabitat: topHabitat,
            allSeasonalSpecies: seasonalSpecies
        };
        
    } catch (error) {
        console.error('Error generating attraction recommendations:', error);
        return {
            undetectedCount: 0,
            seasonalCount: 0,
            currentSeason: 'unknown',
            topTargets: [],
            topFoods: [],
            topFeeders: [],
            topHabitat: [],
            allSeasonalSpecies: []
        };
    }
}

// Display the species attraction recommendations
async function updateSpeciesAttractionDisplay() {
    console.log('🔄 Updating species attraction recommendations...');
    
    const recommendations = await generateSpeciesAttractionRecommendations();
    
    // Create or update the attraction section
    let attractionSection = document.getElementById('species-attraction-section');
    if (!attractionSection) {
        // Insert after feeding recommendations
        const feedingSection = document.querySelector('#tab-feeding .section');
        if (feedingSection && feedingSection.parentNode) {
            attractionSection = document.createElement('div');
            attractionSection.id = 'species-attraction-section';
            attractionSection.className = 'section';
            feedingSection.parentNode.insertBefore(attractionSection, feedingSection.nextSibling);
        } else {
            console.warn('Could not find feeding section to insert attraction recommendations');
            return;
        }
    }
    
    if (recommendations.seasonalCount === 0) {
        attractionSection.innerHTML = '<h2>🎯 Attract New Species</h2><div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6;"><p>Great job! You\'ve detected most common species for your area and season.</p></div>';
        return;
    }
    
    let html = '<h2>🎯 Attract New Species</h2>';
    html += '<p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Species you haven\'t detected yet that are likely in your area this season (' + recommendations.currentSeason + ')</p>';
    
    // Top Target Species
    html += '<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 1.5rem;">';
    html += '<h3 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #1e40af;">🏆 Top Targets This Season</h3>';
    html += '<div style="display: grid; gap: 0.75rem;">';
    
    recommendations.topTargets.forEach(function(species) {
        const likelihoodColor = species.likelihood === 'high' ? '#10b981' : species.likelihood === 'medium' ? '#f59e0b' : '#6b7280';
        const likelihoodBg = species.likelihood === 'high' ? '#dcfce7' : species.likelihood === 'medium' ? '#fef3c7' : '#f3f4f6';
        
        html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; border-left: 4px solid ' + likelihoodColor + ';">';
        html += '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">';
        html += '<strong style="font-size: 0.938rem;">' + species.name + '</strong>';
        html += '<span style="background: ' + likelihoodBg + '; color: ' + likelihoodColor + '; padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">' + species.likelihood.toUpperCase() + '</span>';
        html += '</div>';
        html += '<div style="font-size: 0.813rem; color: #6b7280; margin-bottom: 0.5rem;">' + species.reason + '</div>';
        html += '<div style="font-size: 0.813rem;"><strong>Offer:</strong> ' + species.foods.slice(0, 3).join(', ') + '</div>';
        html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; font-style: italic;">' + species.tips + '</div>';
        html += '</div>';
    });
    
    html += '</div></div>';
    
    // What to Add section
    html += '<div class="grid grid-2" style="gap: 1rem;">';
    
    // Foods to Add
    html += '<div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">';
    html += '<h3 style="margin: 0 0 0.75rem 0; font-size: 1rem;">🌰 Foods to Add</h3>';
    html += '<p style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.75rem;">These foods will attract the most new species</p>';
    
    recommendations.topFoods.forEach(function(item) {
        html += '<div style="padding: 0.5rem; margin-bottom: 0.5rem; background: #f9fafb; border-radius: 4px; border-left: 3px solid #3b82f6;">';
        html += '<div style="font-weight: 600; font-size: 0.875rem;">' + item.food.charAt(0).toUpperCase() + item.food.slice(1) + '</div>';
        html += '<div style="font-size: 0.75rem; color: #6b7280;">Will attract ' + item.speciesAttracted + ' new species</div>';
        html += '</div>';
    });
    
    html += '</div>';
    
    // Feeders to Add
    html += '<div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">';
    html += '<h3 style="margin: 0 0 0.75rem 0; font-size: 1rem;">🎯 Feeders to Add</h3>';
    html += '<p style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.75rem;">These feeder types will help attract new species</p>';
    
    recommendations.topFeeders.forEach(function(item) {
        html += '<div style="padding: 0.5rem; margin-bottom: 0.5rem; background: #f9fafb; border-radius: 4px; border-left: 3px solid #10b981;">';
        html += '<div style="font-weight: 600; font-size: 0.875rem;">' + item.feeder.charAt(0).toUpperCase() + item.feeder.slice(1) + '</div>';
        html += '<div style="font-size: 0.75rem; color: #6b7280;">Will attract ' + item.speciesAttracted + ' new species</div>';
        html += '</div>';
    });
    
    html += '</div>';
    
    html += '</div>';
    
    // Habitat Improvements
    if (recommendations.topHabitat.length > 0) {
        html += '<div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 1rem;">';
        html += '<h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #166534;">🌳 Habitat Improvements</h3>';
        html += '<p style="font-size: 0.813rem; color: #166534; margin-bottom: 0.75rem;">Beyond feeders, these habitat features will attract more species:</p>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">';
        
        recommendations.topHabitat.forEach(function(item) {
            html += '<div style="background: white; padding: 0.5rem 0.75rem; border-radius: 4px; border-left: 3px solid #10b981;">';
            html += '<div style="font-weight: 600; font-size: 0.813rem; color: #166534;">' + item.habitat.charAt(0).toUpperCase() + item.habitat.slice(1) + '</div>';
            html += '<div style="font-size: 0.75rem; color: #6b7280;">' + item.speciesAttracted + ' species</div>';
            html += '</div>';
        });
        
        html += '</div></div>';
    }
    
    // All species list (expandable)
    html += '<div style="margin-top: 1rem;"><button id="toggle-all-targets" style="background: #6b7280; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Show All ' + recommendations.seasonalCount + ' Potential Species</button>';
    html += '<div id="all-targets-list" style="display: none; margin-top: 1rem; max-height: 400px; overflow-y: auto; background: #f9fafb; padding: 1rem; border-radius: 8px;">';
    
    recommendations.allSeasonalSpecies.forEach(function(species) {
        const likelihoodColor = species.likelihood === 'high' ? '#10b981' : species.likelihood === 'medium' ? '#f59e0b' : '#6b7280';
        
        html += '<div style="background: white; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; border-left: 4px solid ' + likelihoodColor + ';">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">';
        html += '<strong>' + species.name + '</strong>';
        html += '<span style="font-size: 0.75rem; color: ' + likelihoodColor + '; font-weight: 600;">' + species.likelihood.toUpperCase() + '</span>';
        html += '</div>';
        html += '<div style="font-size: 0.75rem; color: #6b7280;">' + species.reason + '</div>';
        html += '<div style="font-size: 0.75rem; margin-top: 0.25rem;"><strong>Needs:</strong> ' + species.foods.join(', ') + '</div>';
        html += '</div>';
    });
    
    html += '</div></div>';
    
    attractionSection.innerHTML = html;
    
    // Add toggle functionality
    const toggleBtn = document.getElementById('toggle-all-targets');
    const targetsList = document.getElementById('all-targets-list');
    if (toggleBtn && targetsList) {
        toggleBtn.addEventListener('click', function() {
            if (targetsList.style.display === 'none') {
                targetsList.style.display = 'block';
                toggleBtn.textContent = 'Hide All Species';
            } else {
                targetsList.style.display = 'none';
                toggleBtn.textContent = 'Show All ' + recommendations.seasonalCount + ' Potential Species';
            }
        });
    }
    
    console.log('✅ Species attraction recommendations updated');
}

// Initialize the attraction system
function initializeSpeciesAttractionSystem() {
    console.log('🎯 Initializing species attraction system...');
    updateSpeciesAttractionDisplay();
}

// Export functions
window.updateSpeciesAttractionDisplay = updateSpeciesAttractionDisplay;
window.initializeSpeciesAttractionSystem = initializeSpeciesAttractionSystem;
window.SPECIES_ATTRACTION_DATABASE = SPECIES_ATTRACTION_DATABASE;

console.log('✅ species-attraction.js loaded successfully');
console.log('🎯 Species attraction database contains ' + Object.keys(SPECIES_ATTRACTION_DATABASE).length + ' potential species');