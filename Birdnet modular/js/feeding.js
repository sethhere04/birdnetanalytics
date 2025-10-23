// Feeding Recommendations Module
console.log('Loading BirdNET.feeding module...');

(function() {
    'use strict';
    
    const feeding = BirdNET.feeding;
    const utils = BirdNET.utils;
    
    // Bird diet database
    feeding.dietDatabase = {
        'Northern Cardinal': {
            primaryDiet: 'seeds',
            foodPreferences: ['Sunflower seeds', 'Safflower seeds', 'Cracked corn'],
            feederTypes: ['Platform', 'Hopper', 'Tube'],
            seasonalNeeds: {
                spring: { priority: 'high-protein', foods: ['Insects', 'Mealworms'] },
                summer: { priority: 'variety', foods: ['Fruits', 'Seeds'] },
                fall: { priority: 'high-fat', foods: ['Sunflower seeds', 'Peanuts'] },
                winter: { priority: 'high-energy', foods: ['Suet', 'Sunflower seeds'] }
            }
        },
        'Blue Jay': {
            primaryDiet: 'omnivore',
            foodPreferences: ['Peanuts', 'Sunflower seeds', 'Suet', 'Corn'],
            feederTypes: ['Platform', 'Hopper'],
            seasonalNeeds: {
                spring: { priority: 'high-protein', foods: ['Peanuts', 'Insects'] },
                summer: { priority: 'variety', foods: ['Fruits', 'Seeds', 'Insects'] },
                fall: { priority: 'high-fat', foods: ['Acorns', 'Peanuts'] },
                winter: { priority: 'high-energy', foods: ['Suet', 'Peanuts'] }
            }
        },
        'American Goldfinch': {
            primaryDiet: 'seeds',
            foodPreferences: ['Nyjer seed', 'Sunflower chips', 'Thistle'],
            feederTypes: ['Tube', 'Sock'],
            seasonalNeeds: {
                spring: { priority: 'variety', foods: ['Nyjer', 'Dandelion seeds'] },
                summer: { priority: 'seeds', foods: ['Nyjer', 'Sunflower chips'] },
                fall: { priority: 'high-fat', foods: ['Sunflower seeds'] },
                winter: { priority: 'high-energy', foods: ['Nyjer', 'Sunflower chips'] }
            }
        },
        'Ruby-throated Hummingbird': {
            primaryDiet: 'nectar',
            foodPreferences: ['Sugar water (1:4 ratio)', 'Small insects'],
            feederTypes: ['Nectar feeder'],
            seasonalNeeds: {
                spring: { priority: 'nectar', foods: ['Fresh sugar water', 'Tree sap'] },
                summer: { priority: 'nectar', foods: ['Sugar water', 'Flower nectar', 'Insects'] },
                fall: { priority: 'high-energy', foods: ['Sugar water before migration'] }
            }
        },
        'Downy Woodpecker': {
            primaryDiet: 'insects',
            foodPreferences: ['Suet', 'Peanut butter', 'Sunflower seeds', 'Mealworms'],
            feederTypes: ['Suet cage', 'Platform'],
            seasonalNeeds: {
                spring: { priority: 'high-protein', foods: ['Suet', 'Insects'] },
                summer: { priority: 'insects', foods: ['Live insects', 'Mealworms'] },
                fall: { priority: 'high-fat', foods: ['Suet', 'Peanut butter'] },
                winter: { priority: 'high-energy', foods: ['Suet', 'Sunflower seeds'] }
            }
        }
    };
    
    // Get current season
    feeding.getCurrentSeason = function() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    };
    
    // Generate feeding recommendations
    feeding.generateRecommendations = function() {
        const species = BirdNET.data.originalSpecies;
        const season = feeding.getCurrentSeason();
        
        if (!species || species.length === 0) {
            return {
                speciesAnalyzed: 0,
                currentSeason: season,
                priorityFoods: [],
                feederTypes: [],
                dietBreakdown: {},
                message: 'No species detected yet. Start your BirdNET to get personalized feeding recommendations!'
            };
        }
        
        const foodCounts = {};
        const feederCounts = {};
        const dietTypes = {
            seeds: 0,
            insects: 0,
            fruit: 0,
            nectar: 0,
            suet: 0,
            omnivore: 0
        };
        
        // Analyze detected species
        species.forEach(function(s) {
            const dietInfo = feeding.dietDatabase[s.common_name];
            if (!dietInfo) return;
            
            // Count diet types
            dietTypes[dietInfo.primaryDiet] = (dietTypes[dietInfo.primaryDiet] || 0) + 1;
            
            // Get seasonal foods
            const seasonalNeeds = dietInfo.seasonalNeeds[season];
            if (seasonalNeeds && seasonalNeeds.foods) {
                seasonalNeeds.foods.forEach(function(food) {
                    foodCounts[food] = (foodCounts[food] || 0) + 1;
                });
            }
            
            // Count feeder types
            dietInfo.feederTypes.forEach(function(feeder) {
                feederCounts[feeder] = (feederCounts[feeder] || 0) + 1;
            });
        });
        
        // Sort and get top recommendations
        const priorityFoods = Object.keys(foodCounts)
            .map(function(food) {
                return { food: food, count: foodCounts[food] };
            })
            .sort(function(a, b) { return b.count - a.count; })
            .slice(0, 8);
        
        const feederTypes = Object.keys(feederCounts)
            .map(function(feeder) {
                return { feeder: feeder, count: feederCounts[feeder] };
            })
            .sort(function(a, b) { return b.count - a.count; });
        
        // Calculate diet breakdown percentages
        const totalDietTypes = Object.values(dietTypes).reduce(function(sum, val) { return sum + val; }, 0);
        const dietBreakdown = {};
        Object.keys(dietTypes).forEach(function(type) {
            if (dietTypes[type] > 0) {
                dietBreakdown[type] = Math.round((dietTypes[type] / totalDietTypes) * 100);
            }
        });
        
        return {
            speciesAnalyzed: species.length,
            currentSeason: season,
            priorityFoods: priorityFoods,
            feederTypes: feederTypes,
            dietBreakdown: dietBreakdown,
            message: 'Based on your ' + species.length + ' detected species, here are personalized feeding recommendations for ' + season + '.'
        };
    };
    
    // Update feeding recommendations display
    feeding.updateDisplay = function() {
        console.log('🍽️ Updating feeding recommendations...');
        
        const recommendations = feeding.generateRecommendations();
        
        // Update main message
        const feedingRec = utils.getElement('feeding-recommendations');
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
        const priorityFoodsEl = utils.getElement('priority-foods');
        if (priorityFoodsEl && recommendations.priorityFoods.length > 0) {
            let html = '';
            recommendations.priorityFoods.forEach(function(item, index) {
                const priorityLevel = index < 2 ? 'Critical' : index < 4 ? 'High' : 'Medium';
                const priorityColor = index < 2 ? '#10b981' : index < 4 ? '#f59e0b' : '#6b7280';
                
                html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; border-left: 4px solid ' + priorityColor + ';">';
                html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
                html += '<div>';
                html += '<strong style="font-size: 0.938rem;">' + utils.sanitizeHTML(item.food) + '</strong>';
                html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">' + item.count + ' species prefer this</div>';
                html += '</div>';
                html += '<span style="font-size: 0.75rem; font-weight: 600; color: ' + priorityColor + ';">' + priorityLevel + '</span>';
                html += '</div></div>';
            });
            priorityFoodsEl.innerHTML = html;
        }
        
        // Update feeder types
        const feederTypesEl = utils.getElement('recommended-feeders');
        if (feederTypesEl && recommendations.feederTypes.length > 0) {
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">';
            recommendations.feederTypes.forEach(function(item) {
                html += '<div style="background: #f0f9ff; padding: 0.75rem; border-radius: 6px; text-align: center; border: 2px solid #3b82f6;">';
                html += '<strong style="font-size: 0.938rem; color: #1e40af;">' + utils.sanitizeHTML(item.feeder) + '</strong>';
                html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">' + item.count + ' species</div>';
                html += '</div>';
            });
            html += '</div>';
            feederTypesEl.innerHTML = html;
        }
        
        // Update diet chart if available
        if (recommendations.dietBreakdown && Object.keys(recommendations.dietBreakdown).length > 0) {
            feeding.updateDietChart(recommendations.dietBreakdown);
        }
        
        console.log('✅ Feeding recommendations updated');
    };
    
    // Update diet breakdown chart
    feeding.updateDietChart = function(dietBreakdown) {
        const canvas = document.getElementById('diet-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (BirdNET.charts.dietChart) {
            BirdNET.charts.dietChart.destroy();
        }
        
        const labels = Object.keys(dietBreakdown).map(function(key) {
            return key.charAt(0).toUpperCase() + key.slice(1) + '-eating';
        });
        
        const data = Object.values(dietBreakdown);
        
        const colors = {
            'seeds': '#fbbf24',
            'insects': '#10b981',
            'fruit': '#f87171',
            'nectar': '#ec4899',
            'suet': '#8b5cf6',
            'omnivore': '#3b82f6'
        };
        
        const backgroundColors = Object.keys(dietBreakdown).map(function(key) {
            return colors[key] || '#6b7280';
        });
        
        BirdNET.charts.dietChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
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
                                return context.label + ': ' + context.parsed + '% of community';
                            }
                        }
                    }
                }
            }
        });
    };
    
    console.log('✅ BirdNET.feeding module loaded');
    
})();
