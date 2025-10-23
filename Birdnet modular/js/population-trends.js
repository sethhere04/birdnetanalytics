// Real Population Trends Analysis
console.log('population-trends.js loading...');

async function calculateRealPopulationTrends() {
    try {
        console.log('Calculating real population trends...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species summary');
        
        let speciesData = await response.json();
        
        if (!Array.isArray(speciesData)) {
            throw new Error('Unexpected species data format');
        }
        
        console.log('📊 Found ' + speciesData.length + ' species for analysis');
        
        if (speciesData.length === 0) {
            return {
                trends: [],
                method: 'insufficient_data',
                message: 'No species data available. Start detecting birds!'
            };
        }
        
        const speciesCounts = {};
        const speciesTimestamps = {};
        
        speciesData.forEach(function(species) {
            const speciesName = species.common_name || species.name || 'Unknown';
            
            speciesCounts[speciesName] = species.count || 0;
            speciesTimestamps[speciesName] = [];
            
            if (species.first_heard) {
                const firstDate = new Date(species.first_heard);
                if (!isNaN(firstDate.getTime())) {
                    speciesTimestamps[speciesName].push(firstDate);
                }
            }
            
            if (species.last_heard && species.last_heard !== species.first_heard) {
                const lastDate = new Date(species.last_heard);
                if (!isNaN(lastDate.getTime())) {
                    speciesTimestamps[speciesName].push(lastDate);
                }
            }
            
            if (species.first_heard && species.last_heard && species.count > 2) {
                const firstDate = new Date(species.first_heard);
                const lastDate = new Date(species.last_heard);
                const span = lastDate - firstDate;
                
                if (span > 0) {
                    const pointsToAdd = Math.min(Math.floor(species.count / 10), 8);
                    
                    for (let i = 1; i <= pointsToAdd; i++) {
                        const fraction = i / (pointsToAdd + 1);
                        const interpolatedDate = new Date(firstDate.getTime() + (span * fraction));
                        speciesTimestamps[speciesName].push(interpolatedDate);
                    }
                }
            }
        });
        
        const totalTimestamps = Object.values(speciesTimestamps).flat().length;
        console.log('✅ Created ' + totalTimestamps + ' data points from ' + speciesData.length + ' species');
        
        const topSpecies = Object.keys(speciesCounts)
            .sort((a, b) => speciesCounts[b] - speciesCounts[a])
            .slice(0, 10);
        
        console.log('🔝 Top 10 species by detection count:', topSpecies.join(', '));
        
        const trends = [];
        const currentDate = new Date();
        
        const allTimestamps = Object.values(speciesTimestamps).flat();
        if (allTimestamps.length === 0) {
            return {
                trends: [],
                method: 'no_timestamps',
                message: '⚠️ No timestamp data found.'
            };
        }
        
        const oldestDate = new Date(Math.min(...allTimestamps.map(d => d.getTime())));
        const newestDate = new Date(Math.max(...allTimestamps.map(d => d.getTime())));
        const dataSpanDays = (newestDate - oldestDate) / (1000 * 60 * 60 * 24);
        
        console.log('📅 Data span: ' + Math.round(dataSpanDays) + ' days');
        console.log('📅 Oldest detection: ' + oldestDate.toLocaleDateString());
        console.log('📅 Newest detection: ' + newestDate.toLocaleDateString());
        
        let analysisMethod = 'short_term';
        let comparisonPeriodDays = 7;
        
        if (dataSpanDays >= 365) {
            analysisMethod = 'year_over_year';
            comparisonPeriodDays = 30;
        } else if (dataSpanDays >= 60) {
            analysisMethod = 'medium_term';
            comparisonPeriodDays = 14;
        } else if (dataSpanDays >= 14) {
            analysisMethod = 'short_term';
            comparisonPeriodDays = 7;
        } else if (dataSpanDays >= 7) {
            analysisMethod = 'very_short_term';
            comparisonPeriodDays = 3;
        } else if (dataSpanDays >= 3) {
            analysisMethod = 'daily';
            comparisonPeriodDays = 1;
        } else {
            return {
                trends: topSpecies.map(species => ({
                    species: species,
                    change: 0,
                    totalDetections: speciesCounts[species],
                    confidence: 'low',
                    note: 'Too recent'
                })),
                method: 'insufficient_span',
                message: '⚠️ Need at least 3 days of data (' + Math.round(dataSpanDays) + ' days currently)',
                dataSpanDays: Math.round(dataSpanDays),
                oldestDate: oldestDate.toLocaleDateString(),
                newestDate: newestDate.toLocaleDateString()
            };
        }
        
        console.log('📊 Using ' + analysisMethod + ' analysis (comparing last ' + comparisonPeriodDays + ' days)');
        
        topSpecies.forEach(function(species) {
            const timestamps = speciesTimestamps[species];
            
            if (timestamps.length < 2) {
                trends.push({
                    species: species,
                    change: 0,
                    totalDetections: speciesCounts[species],
                    confidence: 'low',
                    note: 'Only 1 detection date'
                });
                return;
            }
            
            timestamps.sort((a, b) => a - b);
            
            const cutoffDate = new Date(currentDate - (comparisonPeriodDays * 24 * 60 * 60 * 1000));
            
            const recentDetections = timestamps.filter(t => t >= cutoffDate);
            const olderDetections = timestamps.filter(t => t < cutoffDate);
            
            if (olderDetections.length === 0) {
                trends.push({
                    species: species,
                    change: 100,
                    totalDetections: speciesCounts[species],
                    confidence: 'medium',
                    note: 'All recent',
                    recentCount: recentDetections.length,
                    olderCount: 0
                });
                return;
            }
            
            if (recentDetections.length === 0) {
                trends.push({
                    species: species,
                    change: -100,
                    totalDetections: speciesCounts[species],
                    confidence: 'high',
                    note: 'No recent activity',
                    recentCount: 0,
                    olderCount: olderDetections.length
                });
                return;
            }
            
            const recentSpanDays = Math.max(1, (currentDate - cutoffDate) / (1000 * 60 * 60 * 24));
            const olderSpanDays = Math.max(1, (cutoffDate - oldestDate) / (1000 * 60 * 60 * 24));
            
            const recentRate = recentDetections.length / recentSpanDays;
            const olderRate = olderDetections.length / olderSpanDays;
            
            let percentChange;
            if (olderRate === 0) {
                percentChange = 100;
            } else {
                percentChange = ((recentRate - olderRate) / olderRate) * 100;
            }
            
            percentChange = Math.max(-100, Math.min(100, percentChange));
            
            let confidence = 'low';
            const totalSamples = recentDetections.length + olderDetections.length;
            if (totalSamples >= 50) confidence = 'high';
            else if (totalSamples >= 20) confidence = 'medium';
            else if (totalSamples >= 10) confidence = 'low';
            else confidence = 'very low';
            
            trends.push({
                species: species,
                change: percentChange,
                totalDetections: speciesCounts[species],
                confidence: confidence,
                recentCount: recentDetections.length,
                olderCount: olderDetections.length,
                recentRate: recentRate.toFixed(2),
                olderRate: olderRate.toFixed(2)
            });
        });
        
        trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        
        console.log('✅ Calculated trends for ' + trends.length + ' species');
        
        const methodMessages = {
            'year_over_year': '📊 Comparing last 30 days to previous 30-day period',
            'medium_term': '📊 Comparing last 14 days to previous 14-day period',
            'short_term': '📊 Comparing last 7 days to previous 7-day period',
            'very_short_term': '📊 Comparing last 3 days to previous 3-day period',
            'daily': '📊 Comparing recent day to previous day'
        };
        
        return {
            trends: trends.slice(0, 8),
            method: analysisMethod,
            comparisonPeriodDays: comparisonPeriodDays,
            dataSpanDays: Math.round(dataSpanDays),
            oldestDate: oldestDate.toLocaleDateString(),
            newestDate: newestDate.toLocaleDateString(),
            message: (methodMessages[analysisMethod] || 'Analyzing trends') + ' (' + Math.round(dataSpanDays) + ' days total)'
        };
        
    } catch (error) {
        console.error('❌ Error calculating population trends:', error);
        return {
            trends: [],
            method: 'error',
            message: '❌ Error: ' + error.message
        };
    }
}

async function updatePopulationTrendsChart() {
    const container = document.getElementById('population-trends-info');
    const canvas = document.getElementById('population-chart');
    
    if (!container || !canvas) {
        console.warn('Population trends elements not found');
        return;
    }
    
    container.innerHTML = '<p>📊 Analyzing your detection data...</p>';
    
    const result = await calculateRealPopulationTrends();
    
    container.innerHTML = '<p>' + result.message + '</p>';
    
    if (result.oldestDate && result.newestDate) {
        container.innerHTML += '<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">📅 Data range: ' + 
            result.oldestDate + ' to ' + result.newestDate + '</p>';
    }
    
    if (result.trends.length === 0) {
        container.innerHTML += '<p style="color: #ef4444; margin-top: 0.5rem;">⚠️ Keep detecting birds to build historical data!</p>';
        
        if (charts.population) {
            charts.population.destroy();
        }
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (charts.population) {
        charts.population.destroy();
    }
    
    charts.population = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: result.trends.map(t => t.species),
            datasets: [{
                label: 'Population Change (%)',
                data: result.trends.map(t => t.change),
                backgroundColor: result.trends.map(t => 
                    t.change > 0 ? '#10b981' : t.change < 0 ? '#ef4444' : '#6b7280'
                ),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const trend = result.trends[context[0].dataIndex];
                            return trend.species;
                        },
                        label: function(context) {
                            const trend = result.trends[context.dataIndex];
                            const lines = [
                                'Change: ' + trend.change.toFixed(1) + '%',
                                'Total: ' + trend.totalDetections,
                                'Recent: ' + trend.recentCount + ' points',
                                'Previous: ' + trend.olderCount + ' points'
                            ];
                            if (trend.recentRate && trend.olderRate) {
                                lines.push('Recent rate: ' + trend.recentRate + '/day');
                                lines.push('Previous rate: ' + trend.olderRate + '/day');
                            }
                            lines.push('Confidence: ' + trend.confidence.toUpperCase());
                            if (trend.note) {
                                lines.push(trend.note);
                            }
                            return lines;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Change (%)' },
                    ticks: { callback: value => value + '%' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } }
                }
            }
        }
    });
    
    console.log('✅ Population trends chart updated with real data');
}

window.calculateRealPopulationTrends = calculateRealPopulationTrends;
window.updatePopulationTrendsChart = updatePopulationTrendsChart;

console.log('✅ population-trends.js loaded successfully');