// Personal Migration Calendar - Historical Data Analysis
console.log('personal-migration.js loading...');

// Calculate personal migration statistics from historical detection data
function analyzePersonalMigrationData(detections) {
    const speciesMigrationData = {};
    
    console.log('Analyzing ' + detections.length + ' detections for migration patterns...');
    
    // Group detections by species and year
    detections.forEach(function(detection) {
        // Try multiple possible field names for species
        const commonName = detection.common_name || 
                          detection.commonName || 
                          detection.species || 
                          detection.label || 
                          detection.bird_name ||
                          detection.name;
        
        if (!commonName) {
            console.warn('Detection missing species name:', detection);
            return;
        }
        
        // Try multiple possible field names for date
        let detectionDate;
        if (detection.beginTime) {
            detectionDate = new Date(detection.beginTime);
        } else if (detection.date) {
            detectionDate = new Date(detection.date);
        } else if (detection.timestamp) {
            detectionDate = new Date(detection.timestamp);
        } else if (detection.created_at) {
            detectionDate = new Date(detection.created_at);
        } else {
            console.warn('Detection missing date:', detection);
            return;
        }
        
        // Validate the date
        if (isNaN(detectionDate.getTime())) {
            console.warn('Invalid date for detection:', detection);
            return;
        }
        
        const year = detectionDate.getFullYear();
        const dayOfYear = Math.floor((detectionDate - new Date(year, 0, 0)) / 86400000);
        
        // Debug log for first few detections
        if (Object.keys(speciesMigrationData).length < 5) {
            console.log('Processing detection:', commonName, 'Date:', detectionDate.toLocaleDateString(), 'Day of year:', dayOfYear, 'Year:', year);
        }
        
        if (!speciesMigrationData[commonName]) {
            speciesMigrationData[commonName] = {
                name: commonName,
                scientificName: detection.scientific_name || detection.scientificName || 'Unknown',
                yearlyData: {},
                allDetections: []
            };
        }
        
        if (!speciesMigrationData[commonName].yearlyData[year]) {
            speciesMigrationData[commonName].yearlyData[year] = {
                firstSeen: dayOfYear,
                lastSeen: dayOfYear,
                detections: []
            };
        }
        
        const yearData = speciesMigrationData[commonName].yearlyData[year];
        yearData.firstSeen = Math.min(yearData.firstSeen, dayOfYear);
        yearData.lastSeen = Math.max(yearData.lastSeen, dayOfYear);
        yearData.detections.push(dayOfYear);
        speciesMigrationData[commonName].allDetections.push({ year: year, dayOfYear: dayOfYear });
    });
    
    console.log('Found ' + Object.keys(speciesMigrationData).length + ' unique species');
    
    // Calculate statistics for each species
    const migrationStats = [];
    
    Object.keys(speciesMigrationData).forEach(function(speciesName) {
        const data = speciesMigrationData[speciesName];
        const years = Object.keys(data.yearlyData).sort();
        
        if (years.length < 1) return; // Need at least 1 year of data (even partial)
        
        // Safety check - make sure we have valid data
        if (!speciesName || speciesName === 'undefined' || speciesName === 'null') {
            console.warn('Skipping invalid species name:', speciesName);
            return;
        }
        
        // Determine if spring-summer or winter resident
        const allFirstSeen = years.map(function(y) { return data.yearlyData[y].firstSeen; });
        const allLastSeen = years.map(function(y) { return data.yearlyData[y].lastSeen; });
        
        const avgFirstSeen = allFirstSeen.reduce(function(a, b) { return a + b; }, 0) / allFirstSeen.length;
        const avgLastSeen = allLastSeen.reduce(function(a, b) { return a + b; }, 0) / allLastSeen.length;
        
        // Determine migration type based on presence pattern
        let migrationType = 'spring-fall';
        
        // If present in winter months (Nov-Feb) = winter resident
        // Days 305-59
        if (avgFirstSeen > 275 || avgLastSeen < 100) {
            migrationType = 'winter';
        }
        
        console.log('Processing ' + speciesName + ': ' + years.length + ' years, type: ' + migrationType);
        
        const stats = {
            name: speciesName,
            scientificName: data.scientificName,
            type: migrationType,
            yearsData: years.length,
            totalDetections: data.allDetections.length,
            isPartialYear: years.length === 1 && new Date().getMonth() < 11 // Current year incomplete
        };
        
        if (migrationType === 'spring-fall') {
            stats.springArrival = {
                earliest: Math.min.apply(Math, allFirstSeen),
                average: Math.round(avgFirstSeen),
                latest: Math.max.apply(Math, allFirstSeen),
                year2024: data.yearlyData['2024'] ? data.yearlyData['2024'].firstSeen : null,
                year2023: data.yearlyData['2023'] ? data.yearlyData['2023'].firstSeen : null,
                year2022: data.yearlyData['2022'] ? data.yearlyData['2022'].firstSeen : null,
                singleYear: years.length === 1
            };
            
            stats.fallDeparture = {
                earliest: Math.min.apply(Math, allLastSeen),
                average: Math.round(avgLastSeen),
                latest: Math.max.apply(Math, allLastSeen),
                year2024: data.yearlyData['2024'] ? data.yearlyData['2024'].lastSeen : null,
                year2023: data.yearlyData['2023'] ? data.yearlyData['2023'].lastSeen : null,
                year2022: data.yearlyData['2022'] ? data.yearlyData['2022'].lastSeen : null,
                singleYear: years.length === 1
            };
        } else {
            stats.fallArrival = {
                earliest: Math.min.apply(Math, allFirstSeen),
                average: Math.round(avgFirstSeen),
                latest: Math.max.apply(Math, allFirstSeen),
                year2024: data.yearlyData['2024'] ? data.yearlyData['2024'].firstSeen : null,
                year2023: data.yearlyData['2023'] ? data.yearlyData['2023'].firstSeen : null,
                year2022: data.yearlyData['2022'] ? data.yearlyData['2022'].firstSeen : null,
                singleYear: years.length === 1
            };
            
            stats.springDeparture = {
                earliest: Math.min.apply(Math, allLastSeen),
                average: Math.round(avgLastSeen),
                latest: Math.max.apply(Math, allLastSeen),
                year2024: data.yearlyData['2024'] ? data.yearlyData['2024'].lastSeen : null,
                year2023: data.yearlyData['2023'] ? data.yearlyData['2023'].lastSeen : null,
                year2022: data.yearlyData['2022'] ? data.yearlyData['2022'].lastSeen : null,
                singleYear: years.length === 1
            };
        }
        
        migrationStats.push(stats);
    });
    
    return migrationStats;
}

// Fetch all historical detections for migration analysis
async function fetchHistoricalDetectionsForMigration() {
    try {
        console.log('Fetching species summary with historical dates from: ' + CONFIG.API_BASE + '/analytics/species/summary');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        
        if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            throw new Error('HTTP ' + response.status);
        }
        
        const speciesSummary = await response.json();
        const historicalDetections = [];
        
        if (Array.isArray(speciesSummary)) {
            console.log('Processing ' + speciesSummary.length + ' species from summary...');
            
            speciesSummary.forEach(function(species) {
                if (species.first_heard) {
                    historicalDetections.push({
                        common_name: species.common_name,
                        scientific_name: species.scientific_name,
                        beginTime: species.first_heard,
                        date: species.first_heard,
                        confidence: species.avg_confidence,
                        type: 'first_detection',
                        count: 1
                    });
                }
                
                if (species.last_heard && species.last_heard !== species.first_heard) {
                    historicalDetections.push({
                        common_name: species.common_name,
                        scientific_name: species.scientific_name,
                        beginTime: species.last_heard,
                        date: species.last_heard,
                        confidence: species.avg_confidence,
                        type: 'last_detection',
                        count: 1
                    });
                }
                
                if (species.first_heard && species.last_heard) {
                    const firstDate = new Date(species.first_heard);
                    const lastDate = new Date(species.last_heard);
                    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                    
                    if (daysDiff > 30) {
                        const midDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 2);
                        historicalDetections.push({
                            common_name: species.common_name,
                            scientific_name: species.scientific_name,
                            beginTime: midDate.toISOString(),
                            date: midDate.toISOString(),
                            confidence: species.avg_confidence,
                            type: 'mid_detection',
                            count: 1
                        });
                    }
                    
                    if (daysDiff > 90) {
                        const quarterDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 4);
                        const threeQuarterDate = new Date(firstDate.getTime() + ((lastDate - firstDate) * 3) / 4);
                        
                        historicalDetections.push({
                            common_name: species.common_name,
                            scientific_name: species.scientific_name,
                            beginTime: quarterDate.toISOString(),
                            date: quarterDate.toISOString(),
                            confidence: species.avg_confidence,
                            type: 'quarter_detection',
                            count: 1
                        });
                        
                        historicalDetections.push({
                            common_name: species.common_name,
                            scientific_name: species.scientific_name,
                            beginTime: threeQuarterDate.toISOString(),
                            date: threeQuarterDate.toISOString(),
                            confidence: species.avg_confidence,
                            type: 'quarter_detection',
                            count: 1
                        });
                    }
                }
            });
        }
        
        console.log('Created ' + historicalDetections.length + ' historical data points from species summary');
        
        if (historicalDetections.length > 0) {
            const dates = historicalDetections.map(function(d) { return new Date(d.beginTime).getTime(); });
            const minDate = new Date(Math.min.apply(Math, dates));
            const maxDate = new Date(Math.max.apply(Math, dates));
            console.log('Historical data range: ' + minDate.toLocaleDateString() + ' to ' + maxDate.toLocaleDateString());
        }
        
        return historicalDetections;
        
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

// Update the personal migration calendar display
async function updatePersonalMigrationCalendar() {
    console.log('Updating personal migration calendar...');
    
    const container = document.getElementById('personal-migration-calendar');
    if (!container) {
        console.warn('Personal migration calendar container not found');
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner"></div><p>Analyzing your historical detection data...</p></div>';
    
    try {
        const detections = await fetchHistoricalDetectionsForMigration();
        
        if (detections.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No historical data available yet. Keep detecting birds to build your personal migration calendar!</div>';
            return;
        }
        
        const migrationData = analyzePersonalMigrationData(detections);
        
        console.log('Generated migration data for ' + migrationData.length + ' species');
        
        if (migrationData.length === 0) {
            container.innerHTML = '<div style="background: #f0f9ff; padding: 2rem; border-radius: 8px; border-left: 4px solid #3b82f6;"><h3 style="color: #1e40af; margin-bottom: 0.5rem;">🌱 Building Your Personal Calendar</h3><p style="color: #1e40af;">Keep your BirdNET running!</p></div>';
            return;
        }
        
        displayPersonalMigrationCalendar(migrationData, container);
        
        console.log('Personal migration calendar updated with ' + migrationData.length + ' species');
    } catch (error) {
        console.error('Error updating personal migration calendar:', error);
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Error loading migration calendar.</div>';
    }
}

// Display function
function displayPersonalMigrationCalendar(migrationData, container) {
    const currentDate = new Date();
    const currentDayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    
    let html = '<div><div style="margin-bottom: 1.5rem;"><h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">📅 Your Personal Migration Calendar</h2><p style="color: #6b7280; font-size: 0.875rem;">📊 Based on your detection data</p></div>';
    
    html += '<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #0ea5e9;"><h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">What\'s Happening Now?</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.5rem;">';
    
    let activeCount = 0;
    migrationData.forEach(function(species) {
        const status = getSpeciesCurrentStatus(species, currentDayOfYear);
        if (status.status !== 'absent') {
            activeCount++;
            html += '<div style="background: white; padding: 0.5rem 0.75rem; border-radius: 4px; border-left: 3px solid ' + getStatusColor(status.status) + '; font-size: 0.813rem;"><div style="font-weight: 600; margin-bottom: 0.125rem;">' + species.name + '</div><div style="color: #6b7280; font-size: 0.75rem;">' + status.event + '</div></div>';
        }
    });
    
    if (activeCount === 0) {
        html += '<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; font-size: 0.875rem;">No active migrations right now</div>';
    }
    
    html += '</div></div>';
    
    html += '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    html += '<div style="background: #fef3c7; padding: 0.875rem; border-radius: 6px; border-left: 3px solid #f59e0b;"><div style="font-size: 0.813rem; font-weight: 600; color: #92400e; margin-bottom: 0.375rem;">Why Personal Data?</div><p style="font-size: 0.75rem; color: #92400e; margin: 0; line-height: 1.4;">Field guides show regional averages, but birds arrive at different times based on microclimate, elevation, and location. This shows when birds actually arrive at YOUR location.</p></div>';
    
    const hasMultiYearData = migrationData.some(function(s) { return s.yearsData >= 2; });
    const hasPartialData = migrationData.some(function(s) { return s.isPartialYear; });
    
    html += '<div style="background: #e0f2fe; padding: 0.875rem; border-radius: 6px; border-left: 3px solid #0284c7;"><div style="font-size: 0.813rem; font-weight: 600; color: #075985; margin-bottom: 0.375rem;">📈 Improving Accuracy</div>';
    
    if (hasPartialData && !hasMultiYearData) {
        html += '<div style="color: #075985; font-size: 0.75rem; line-height: 1.4;"><strong>You\'re in first season!</strong><br>• Current: First detection dates<br>• After 1 year: Arrival/departure patterns<br>• After 2+ years: Highly accurate predictions</div>';
    } else if (!hasMultiYearData) {
        html += '<div style="color: #075985; font-size: 0.75rem; line-height: 1.4;"><strong>One year complete!</strong><br>• Next year: Date ranges & comparisons<br>• Better predictions for arrivals<br>• Year-over-year trend analysis</div>';
    } else {
        html += '<p style="color: #075985; font-size: 0.75rem; margin: 0; line-height: 1.4;">You have multi-year data! Your calendar is highly accurate. Continue running BirdNET to refine patterns.</p>';
    }
    html += '</div></div></div>';
    
    container.innerHTML = html;
}

function getSpeciesCurrentStatus(species, currentDayOfYear) {
    let status = 'absent';
    let event = 'Not present';
    let daysUntil = null;
    
    if (species.type === 'spring-fall') {
        if (currentDayOfYear >= species.springArrival.earliest && currentDayOfYear <= species.springArrival.latest) {
            status = 'arriving';
            event = 'Spring Arrival Window';
        } else if (currentDayOfYear > species.springArrival.latest && currentDayOfYear < species.fallDeparture.earliest) {
            status = 'present';
            event = 'Present';
        } else if (currentDayOfYear >= species.fallDeparture.earliest && currentDayOfYear <= species.fallDeparture.latest) {
            status = 'departing';
            event = 'Fall Departure Window';
        } else if (currentDayOfYear < species.springArrival.earliest) {
            status = 'expected';
            daysUntil = species.springArrival.average - currentDayOfYear;
            event = 'Expected in ' + daysUntil + ' days';
        }
    } else {
        if (currentDayOfYear >= species.fallArrival.earliest && currentDayOfYear <= species.fallArrival.latest) {
            status = 'arriving';
            event = 'Fall Arrival Window';
        } else if ((currentDayOfYear > species.fallArrival.latest) || (currentDayOfYear < species.springDeparture.earliest)) {
            status = 'present';
            event = 'Present (Winter Resident)';
        } else if (currentDayOfYear >= species.springDeparture.earliest && currentDayOfYear <= species.springDeparture.latest) {
            status = 'departing';
            event = 'Spring Departure Window';
        }
    }
    
    return { status: status, event: event, daysUntil: daysUntil };
}

function getStatusColor(status) {
    const colors = {
        'arriving': '#22c55e',
        'departing': '#f97316',
        'present': '#3b82f6',
        'absent': '#9ca3af',
        'expected': '#a855f7'
    };
    return colors[status] || colors.absent;
}

function dayOfYearToDateString(dayOfYear) {
    const date = new Date(new Date().getFullYear(), 0);
    date.setDate(dayOfYear);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

console.log('personal-migration.js loaded successfully');