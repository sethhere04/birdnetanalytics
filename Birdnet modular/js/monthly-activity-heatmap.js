// Monthly Species Activity Heatmap Generator
console.log('monthly-activity-heatmap.js loading...');

// Generate monthly activity data from detections
async function generateMonthlyActivityData() {
    try {
        console.log('Fetching species data for monthly activity analysis...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const allSpecies = await response.json();
        
        // For each species, we need to get all their detections to build monthly patterns
        const speciesMonthlyData = [];
        
        for (const species of allSpecies) {
            // Calculate monthly activity from first_heard and last_heard
            if (species.first_heard && species.last_heard) {
                const firstDate = new Date(species.first_heard);
                const lastDate = new Date(species.last_heard);
                
                // Create monthly activity array (12 months)
                const monthlyActivity = new Array(12).fill(0);
                
                // Get all months between first and last detection
                const firstMonth = firstDate.getMonth();
                const lastMonth = lastDate.getMonth();
                const firstYear = firstDate.getFullYear();
                const lastYear = lastDate.getFullYear();
                
                // If same year, mark all months between first and last
                if (firstYear === lastYear) {
                    for (let m = firstMonth; m <= lastMonth; m++) {
                        monthlyActivity[m] = 1;
                    }
                } else {
                    // Multi-year data - mark all months from first to end of year
                    // and from start of year to last month
                    for (let m = firstMonth; m < 12; m++) {
                        monthlyActivity[m] = 1;
                    }
                    for (let m = 0; m <= lastMonth; m++) {
                        monthlyActivity[m] = 1;
                    }
                }
                
                // Try to get more granular data if available
                // Estimate activity level based on detection count and time span
                const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                const avgDetectionsPerDay = species.count / Math.max(daySpan, 1);
                
                // Scale activity levels
                for (let m = 0; m < 12; m++) {
                    if (monthlyActivity[m] > 0) {
                        // Higher activity during peak months (adjust based on detection density)
                        if (m >= firstMonth && m <= lastMonth && firstYear === lastYear) {
                            monthlyActivity[m] = Math.min(1, avgDetectionsPerDay * 10);
                        }
                    }
                }
                
                speciesMonthlyData.push({
                    commonName: species.common_name,
                    scientificName: species.scientific_name,
                    totalDetections: species.count,
                    firstDetection: firstDate,
                    lastDetection: lastDate,
                    monthlyActivity: monthlyActivity,
                    firstMonth: firstMonth,
                    lastMonth: lastMonth,
                    isMigratory: isSpeciesMigratory(species),
                    arrivalMonth: firstMonth,
                    departureMonth: lastMonth
                });
            }
        }
        
        console.log('Generated monthly activity data for ' + speciesMonthlyData.length + ' species');
        return speciesMonthlyData;
        
    } catch (error) {
        console.error('Error generating monthly activity data:', error);
        return [];
    }
}

// Render the monthly activity heatmap
async function renderMonthlyActivityHeatmap() {
    const container = document.getElementById('monthly-activity-heatmap');
    if (!container) {
        console.warn('Monthly activity heatmap container not found');
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner"></div><p>Analyzing your detection data...</p></div>';
    
    const speciesData = await generateMonthlyActivityData();
    
    if (speciesData.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No detection data available for monthly analysis</div>';
        return;
    }
    
    // Store data globally for filtering/sorting
    window.monthlyActivityData = speciesData;
    
    // Initial render with default sort
    updateHeatmapDisplay(speciesData);
    
    // Set up event listeners
    setupActivityFilters();
}

// Update heatmap display with current filter/sort
function updateHeatmapDisplay(data) {
    const container = document.getElementById('monthly-activity-heatmap');
    
    // Month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Build HTML
    let html = '<div style="overflow-x: auto;">';
    
    // Header row
    html += '<div style="display: grid; grid-template-columns: 200px repeat(12, 60px); gap: 2px; padding: 1rem; background: #f9fafb; border-bottom: 2px solid #e5e7eb; position: sticky; top: 0; z-index: 10;">';
    html += '<div style="font-weight: 600; font-size: 0.813rem; color: #374151;">Species</div>';
    for (let m = 0; m < 12; m++) {
        html += '<div style="text-align: center; font-weight: 600; font-size: 0.75rem; color: #6b7280;">' + monthNames[m] + '</div>';
    }
    html += '</div>';
    
    // Species rows
    data.forEach(function(species) {
        html += '<div style="display: grid; grid-template-columns: 200px repeat(12, 60px); gap: 2px; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; align-items: center; transition: background 0.2s;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'white\'">';
        
        // Species name
        html += '<div style="font-size: 0.813rem; font-weight: 500; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + species.commonName + '">' + species.commonName + '</div>';
        
        // Monthly cells
        for (let m = 0; m < 12; m++) {
            const activity = species.monthlyActivity[m];
            const isFirstMonth = m === species.firstMonth;
            const isLastMonth = m === species.lastMonth;
            
            let cellStyle = 'height: 40px; border-radius: 4px; position: relative; display: flex; align-items: center; justify-content: center;';
            
            if (activity === 0) {
                // No activity
                cellStyle += ' background: #f3f4f6;';
            } else {
                // Activity level color
                const intensity = Math.min(1, activity);
                const green = Math.floor(16 + (154 - 16) * intensity); // #10 to #9a
                const hex = green.toString(16).padStart(2, '0');
                cellStyle += ' background: #' + hex + 'dd' + hex + ';';
            }
            
            html += '<div style="' + cellStyle + '">';
            
            // Add markers for first/last detection
            if (isFirstMonth && activity > 0) {
                html += '<div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 2px solid white; position: absolute; top: 2px; left: 2px;" title="First detected in ' + monthNames[m] + '"></div>';
            }
            if (isLastMonth && activity > 0 && !isFirstMonth) {
                html += '<div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; border: 2px solid white; position: absolute; bottom: 2px; right: 2px;" title="Last detected in ' + monthNames[m] + '"></div>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Update species count
    const countDisplay = document.getElementById('activity-species-count');
    if (countDisplay) {
        countDisplay.textContent = data.length;
    }
}

// Setup filter and sort event listeners
function setupActivityFilters() {
    const sortSelect = document.getElementById('activity-sort');
    const filterSelect = document.getElementById('activity-filter');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', applyActivityFiltersAndSort);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', applyActivityFiltersAndSort);
    }
}

// Apply current filters and sort
function applyActivityFiltersAndSort() {
    if (!window.monthlyActivityData) return;
    
    let filtered = window.monthlyActivityData.slice();
    
    // Apply filter
    const filterValue = document.getElementById('activity-filter').value;
    
    if (filterValue === 'spring') {
        // Spring arrivals (March, April, May)
        filtered = filtered.filter(function(s) {
            return s.arrivalMonth >= 2 && s.arrivalMonth <= 4;
        });
    } else if (filterValue === 'fall') {
        // Fall arrivals (September, October, November)
        filtered = filtered.filter(function(s) {
            return s.arrivalMonth >= 8 && s.arrivalMonth <= 10;
        });
    } else if (filterValue === 'summer') {
        // Summer residents (arrive in spring, leave in fall)
        filtered = filtered.filter(function(s) {
            return s.arrivalMonth >= 2 && s.arrivalMonth <= 5 && s.departureMonth >= 8 && s.departureMonth <= 10;
        });
    } else if (filterValue === 'winter') {
        // Winter residents (arrive in fall, leave in spring)
        filtered = filtered.filter(function(s) {
            return s.arrivalMonth >= 9 || s.arrivalMonth <= 2;
        });
    } else if (filterValue === 'yearround') {
        // Year-round (present all 12 months)
        filtered = filtered.filter(function(s) {
            const activeMonths = s.monthlyActivity.filter(function(a) { return a > 0; }).length;
            return activeMonths === 12 || (s.arrivalMonth === s.departureMonth);
        });
    }
    
    // Apply sort
    const sortValue = document.getElementById('activity-sort').value;
    
    if (sortValue === 'arrivals') {
        filtered.sort(function(a, b) {
            return a.arrivalMonth - b.arrivalMonth;
        });
    } else if (sortValue === 'departures') {
        filtered.sort(function(a, b) {
            return a.departureMonth - b.departureMonth;
        });
    } else if (sortValue === 'name') {
        filtered.sort(function(a, b) {
            return a.commonName.localeCompare(b.commonName);
        });
    } else if (sortValue === 'detections') {
        filtered.sort(function(a, b) {
            return b.totalDetections - a.totalDetections;
        });
    }
    
    updateHeatmapDisplay(filtered);
}

// Initialize when tab is opened
function initializeMonthlyActivityHeatmap() {
    console.log('Initializing monthly activity heatmap...');
    renderMonthlyActivityHeatmap();
}

// Export for use in main app
if (typeof window !== 'undefined') {
    window.initializeMonthlyActivityHeatmap = initializeMonthlyActivityHeatmap;
}

console.log('monthly-activity-heatmap.js loaded successfully');