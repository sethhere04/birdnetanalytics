// Real Analytics Module - FIXED VERSION
console.log('real-analytics.js loading...');

// Calculate real migration patterns from YOUR data
async function calculateRealMigrationPatterns() {
    try {
        console.log('Calculating real migration patterns...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const species = await response.json();
        
        const migratorySpecies = species.filter(function(s) {
            return s.first_heard && s.last_heard;
        }).map(function(s) {
            const first = new Date(s.first_heard);
            const last = new Date(s.last_heard);
            const daysBetween = Math.floor((last - first) / (1000 * 60 * 60 * 24));
            
            let pattern = 'Year-round';
            if (daysBetween < 120) {
                pattern = 'Short-term visitor';
            } else if (daysBetween < 200) {
                pattern = 'Summer resident';
            }
            
            return {
                species: s.common_name,
                firstSeen: first.toLocaleDateString(),
                lastSeen: last.toLocaleDateString(),
                daysPresent: daysBetween,
                pattern: pattern,
                detections: s.count || 0
            };
        });
        
        console.log('Found ' + migratorySpecies.length + ' migratory species with temporal data');
        
        return migratorySpecies;
        
    } catch (error) {
        console.error('Error calculating migration patterns:', error);
        return [];
    }
}

// Calculate real rarity scores
async function calculateRealRarityScores() {
    try {
        console.log('Calculating real rarity scores...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const species = await response.json();
        
        if (species.length === 0) return [];
        
        // Calculate statistics
        const counts = species.map(s => s.count || 0);
        const avgDetections = counts.reduce((a, b) => a + b, 0) / counts.length;
        const stdDev = Math.sqrt(counts.reduce((sq, n) => sq + Math.pow(n - avgDetections, 2), 0) / counts.length);
        
        console.log('Average detections per species: ' + avgDetections.toFixed(2));
        console.log('Standard deviation: ' + stdDev.toFixed(2));
        
        // Calculate rarity scores
        const rarityScores = species.map(function(s) {
            const detectionCount = s.count || 0;
            const zScore = (avgDetections - detectionCount) / (stdDev || 1);
            const rarityScore = Math.max(0, Math.min(100, Math.round(50 + (zScore * 15))));
            
            let category = 'Common';
            if (rarityScore >= 70) category = 'Very Rare';
            else if (rarityScore >= 50) category = 'Rare';
            else if (rarityScore >= 30) category = 'Uncommon';
            
            return {
                species: s.common_name,
                score: rarityScore,
                category: category,
                detectionCount: detectionCount,
                firstSeen: s.first_heard ? new Date(s.first_heard).toLocaleDateString() : 'Unknown',
                lastSeen: s.last_heard ? new Date(s.last_heard).toLocaleDateString() : 'Unknown'
            };
        });
        
        // Sort by rarity (rarest first)
        rarityScores.sort((a, b) => b.score - a.score);
        
        return rarityScores;
        
    } catch (error) {
        console.error('Error calculating rarity scores:', error);
        return [];
    }
}

// Calculate real conservation status
async function calculateRealConservationStatus() {
    try {
        console.log('Calculating real conservation status...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const species = await response.json();
        
        if (species.length === 0) {
            return {
                concernSpecies: [],
                message: 'No species data available for conservation analysis',
                analysisDate: new Date().toLocaleDateString(),
                dataSpan: '0 days',
                method: 'basic'
            };
        }
        
        // Simple conservation analysis based on detection frequency
        const concernSpecies = [];
        const now = new Date();
        
        species.forEach(function(s) {
            if (!s.last_heard || !s.count) return;
            
            const lastSeen = new Date(s.last_heard);
            const daysSinceLastSeen = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24));
            
            // Flag species not seen in over 60 days
            if (daysSinceLastSeen > 60 && s.count < 10) {
                concernSpecies.push({
                    species: s.common_name,
                    concern: 'Not recently detected',
                    changePercent: -100,
                    details: 'Last seen ' + daysSinceLastSeen + ' days ago',
                    confidence: 'medium',
                    detections: s.count
                });
            }
        });
        
        let message = concernSpecies.length > 0 
            ? concernSpecies.length + ' species showing reduced activity'
            : 'All detected species showing normal activity patterns';
        
        return {
            concernSpecies: concernSpecies,
            message: message,
            analysisDate: new Date().toLocaleDateString(),
            dataSpan: 'Available detection history',
            method: 'basic detection frequency analysis'
        };
        
    } catch (error) {
        console.error('Error calculating conservation status:', error);
        return {
            concernSpecies: [],
            message: 'Error analyzing conservation status: ' + error.message,
            analysisDate: new Date().toLocaleDateString(),
            dataSpan: '0 days',
            method: 'error'
        };
    }
}

// Update Migration Patterns display
async function updateRealMigrationPatterns() {
    const migrationPatterns = await calculateRealMigrationPatterns();
    
    const migrationSummary = document.getElementById('migration-summary');
    const migrationInfo = document.getElementById('migration-info');
    const migrationTbody = document.querySelector('#migration-table tbody');
    
    // Check if elements exist
    if (!migrationTbody) {
        console.warn('⚠️ Migration table not found');
        return;
    }
    
    if (migrationPatterns.length === 0) {
        migrationTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">No migration data available yet</td></tr>';
        if (migrationInfo) {
            migrationInfo.innerHTML = '<p>No temporal data available for migration analysis</p>';
        }
        return;
    }
    
    if (migrationSummary) {
        migrationSummary.textContent = 'Detected ' + migrationPatterns.length + ' species with migration patterns';
    }
    
    if (migrationInfo) {
        migrationInfo.innerHTML = '<p>Analysis based on first and last detection dates from your system</p>';
    }
    
    migrationTbody.innerHTML = '';
    migrationPatterns.forEach(function(pattern) {
        const row = migrationTbody.insertRow();
        row.innerHTML = 
            '<td>' + pattern.species + '</td>' +
            '<td>' + pattern.firstSeen + '</td>' +
            '<td>' + pattern.lastSeen + '</td>' +
            '<td>' + pattern.daysPresent + ' days</td>';
    });
    
    console.log('✅ Real migration patterns updated');
}

// Update Rarity Analysis display
async function updateRealRarityAnalysis() {
    const rarityScores = await calculateRealRarityScores();
    
    const rarityInfo = document.getElementById('rarity-info');
    const rarityTbody = document.querySelector('#rarity-table tbody');
    
    if (!rarityTbody) {
        console.warn('⚠️ Rarity table not found');
        return;
    }
    
    if (rarityScores.length === 0) {
        rarityTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">No rarity data available</td></tr>';
        return;
    }
    
    if (rarityInfo) {
        rarityInfo.innerHTML = '<p>Rarity scores based on detection frequency analysis. Showing top ' + 
            Math.min(10, rarityScores.length) + ' rarest species</p>';
    }
    
    rarityTbody.innerHTML = '';
    rarityScores.slice(0, 10).forEach(function(rare) {
        const row = rarityTbody.insertRow();
        const categoryClass = rare.category === 'Very Rare' ? 'danger' : 
                             rare.category === 'Rare' ? 'warning' : 'info';
        
        row.innerHTML = 
            '<td>' + rare.species + '</td>' +
            '<td><div style="background: linear-gradient(to right, #ef4444 0%, #eab308 50%, #10b981 100%); height: 8px; border-radius: 4px; position: relative;"><div style="position: absolute; left: ' + rare.score + '%; width: 8px; height: 8px; background: white; border: 2px solid #374151; border-radius: 50%; transform: translateX(-50%);"></div></div></td>' +
            '<td><span class="badge badge-' + categoryClass + '">' + rare.category + '</span></td>' +
            '<td>' + rare.detectionCount + '</td>';
    });
    
    console.log('✅ Real rarity analysis updated');
}

// Update Conservation Status display
async function updateRealConservationStatus() {
    const conservationData = await calculateRealConservationStatus();
    
    const conservationInfo = document.getElementById('conservation-info');
    const conservationAlerts = document.getElementById('conservation-alerts');
    
    if (!conservationAlerts) {
        console.warn('⚠️ Conservation alerts not found');
        return;
    }
    
    if (conservationInfo) {
        conservationInfo.innerHTML = '<p>' + conservationData.message + '</p>' +
            '<p style="font-size: 0.875rem; color: #6b7280;">Analysis date: ' + conservationData.analysisDate + '</p>';
    }
    
    if (conservationData.concernSpecies.length === 0) {
        conservationAlerts.innerHTML = '<div style="text-align: center; padding: 2rem; color: #10b981;">✅ No conservation concerns detected</div>';
        return;
    }
    
    let alertsHtml = '';
    conservationData.concernSpecies.forEach(function(species) {
        const severityColor = species.changePercent < -50 ? '#ef4444' : '#f59e0b';
        
        alertsHtml += 
            '<div class="alert-item alert-conservation" style="border-left-color: ' + severityColor + ';">' +
                '<div><strong>' + species.species + '</strong></div>' +
                '<div>Status: ' + species.concern + '</div>' +
                '<div>Change: ' + species.changePercent + '%</div>' +
                '<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">' + 
                species.details + '</div>' +
                '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">Confidence: ' + 
                species.confidence.toUpperCase() + ' | Total detections: ' + species.detections + '</div>' +
                '</div>';
    });
    
    conservationAlerts.innerHTML = alertsHtml;
    
    console.log('✅ Real conservation status updated');
}

// FIX #1: Add the missing updatePopulationTrendsChart function
async function updatePopulationTrendsChart() {
    console.log('📊 Updating population trends chart...');
    
    // Check if the population-trends.js module has loaded this function
    if (typeof window.updatePopulationTrendsChart !== 'undefined' && 
        window.updatePopulationTrendsChart !== updatePopulationTrendsChart) {
        // Call the actual implementation from population-trends.js
        return window.updatePopulationTrendsChart();
    }
    
    // Fallback implementation if population-trends.js hasn't loaded yet
    const container = document.getElementById('population-trends-info');
    const canvas = document.getElementById('population-chart');
    
    if (!container || !canvas) {
        console.warn('Population trends elements not found');
        return;
    }
    
    container.innerHTML = '<p>📊 Loading population trends data...</p>';
    
    try {
        // Import the function from population-trends.js if available
        if (typeof calculateRealPopulationTrends === 'function') {
            const result = await calculateRealPopulationTrends();
            
            container.innerHTML = '<p>' + result.message + '</p>';
            
            if (result.oldestDate && result.newestDate) {
                container.innerHTML += '<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">📅 Data range: ' + 
                    result.oldestDate + ' to ' + result.newestDate + '</p>';
            }
            
            console.log('✅ Population trends chart updated');
        } else {
            container.innerHTML = '<p style="color: #f59e0b;">⚠️ Population trends module not loaded yet</p>';
        }
    } catch (error) {
        console.error('Error updating population trends:', error);
        container.innerHTML = '<p style="color: #ef4444;">❌ Error loading population trends</p>';
    }
}

// Main function to update all real analytics
async function updateAllRealAnalytics() {
    console.log('🔄 Updating all analytics with REAL data...');
    
    try {
        // Population Trends - NOW ALWAYS AVAILABLE
        console.log('Updating population trends...');
        await updatePopulationTrendsChart();
        
        // Migration Patterns - now REAL
        console.log('Updating migration patterns...');
        await updateRealMigrationPatterns();
        
        // Rarity Analysis - now REAL
        console.log('Updating rarity analysis...');
        await updateRealRarityAnalysis();
        
        // Conservation Status - now REAL
        console.log('Updating conservation status...');
        await updateRealConservationStatus();
        
        console.log('✅ All analytics updated with REAL data');
    } catch (error) {
        console.error('❌ Error updating real analytics:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Export functions
window.updateAllRealAnalytics = updateAllRealAnalytics;
window.updateRealMigrationPatterns = updateRealMigrationPatterns;
window.updateRealRarityAnalysis = updateRealRarityAnalysis;
window.updateRealConservationStatus = updateRealConservationStatus;
window.updatePopulationTrendsChart = updatePopulationTrendsChart;

console.log('✅ real-analytics.js loaded successfully');