// Migration Metrics Calculator
console.log('migration-metrics.js loading...');

// Calculate migration progress percentage
function calculateMigrationProgress(speciesData) {
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    
    // Determine if we're in spring or fall migration
    const isSpring = dayOfYear >= 60 && dayOfYear <= 150; // Mar-May
    const isFall = dayOfYear >= 240 && dayOfYear <= 335; // Sep-Nov
    
    if (!isSpring && !isFall) {
        return {
            percentage: 0,
            arrived: 0,
            expected: 0,
            status: 'Not in active migration season'
        };
    }
    
    // Get expected migrants for this season
    const expectedMigrants = [];
    
    Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA).forEach(function(speciesName) {
        const migrationData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
        
        if (isSpring && migrationData.spring_arrival) {
            const arrivalDay = migrationData.spring_arrival.mean;
            if (dayOfYear >= arrivalDay - 30) {
                expectedMigrants.push({
                    name: speciesName,
                    expectedDay: arrivalDay,
                    type: 'spring'
                });
            }
        } else if (isFall && migrationData.fall_arrival) {
            const arrivalDay = migrationData.fall_arrival.mean;
            if (dayOfYear >= arrivalDay - 30) {
                expectedMigrants.push({
                    name: speciesName,
                    expectedDay: arrivalDay,
                    type: 'fall'
                });
            }
        }
    });
    
    // Count how many have actually arrived
    let arrivedCount = 0;
    speciesData.forEach(function(species) {
        if (expectedMigrants.some(function(m) { return m.name === species.common_name; })) {
            if (species.last_heard) {
                const lastHeardDate = new Date(species.last_heard);
                const daysSince = (currentDate - lastHeardDate) / (1000 * 60 * 60 * 24);
                if (daysSince <= 30) {
                    arrivedCount++;
                }
            }
        }
    });
    
    const percentage = expectedMigrants.length > 0 
        ? Math.round((arrivedCount / expectedMigrants.length) * 100) 
        : 0;
    
    return {
        percentage: percentage,
        arrived: arrivedCount,
        expected: expectedMigrants.length,
        status: isSpring ? 'Spring Migration' : 'Fall Migration'
    };
}

// Calculate days until next expected arrival
function calculateDaysUntilNextArrival(speciesData) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const dayOfYear = Math.floor((currentDate - new Date(currentYear, 0, 0)) / 86400000);
    
    let nextArrival = null;
    let minDays = Infinity;
    
    Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA).forEach(function(speciesName) {
        const migrationData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
        
        // Check if species has already arrived
        const hasArrived = speciesData.some(function(s) {
            if (s.common_name === speciesName && s.last_heard) {
                const daysSince = (currentDate - new Date(s.last_heard)) / (1000 * 60 * 60 * 24);
                return daysSince <= 14;
            }
            return false;
        });
        
        if (hasArrived) return;
        
        // Check spring arrival
        if (migrationData.spring_arrival) {
            const expectedDay = migrationData.spring_arrival.mean;
            let daysUntil = expectedDay - dayOfYear;
            
            if (daysUntil < 0) {
                daysUntil += 365;
            }
            
            if (daysUntil > 0 && daysUntil < minDays && daysUntil < 90) {
                minDays = daysUntil;
                nextArrival = {
                    species: speciesName,
                    days: daysUntil,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    type: 'spring'
                };
            }
        }
        
        // Check fall arrival
        if (migrationData.fall_arrival) {
            const expectedDay = migrationData.fall_arrival.mean;
            let daysUntil = expectedDay - dayOfYear;
            
            if (daysUntil < 0) {
                daysUntil += 365;
            }
            
            if (daysUntil > 0 && daysUntil < minDays && daysUntil < 90) {
                minDays = daysUntil;
                nextArrival = {
                    species: speciesName,
                    days: daysUntil,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    type: 'fall'
                };
            }
        }
    });
    
    return nextArrival;
}

// Identify early and late arrivals
function calculateEarlyLateArrivals(speciesData) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const dayOfYear = Math.floor((currentDate - new Date(currentYear, 0, 0)) / 86400000);
    
    const earlyArrivals = [];
    const lateArrivals = [];
    
    Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA).forEach(function(speciesName) {
        const migrationData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
        const detectedSpecies = speciesData.find(function(s) { return s.common_name === speciesName; });
        
        if (!detectedSpecies || !detectedSpecies.first_heard) return;
        
        const firstHeardDate = new Date(detectedSpecies.first_heard);
        const firstHeardYear = firstHeardDate.getFullYear();
        
        if (firstHeardYear !== currentYear) return;
        
        const arrivalDay = Math.floor((firstHeardDate - new Date(firstHeardYear, 0, 0)) / 86400000);
        
        // Check spring migration
        if (migrationData.spring_arrival) {
            const expectedDay = migrationData.spring_arrival.mean;
            const earliestDay = migrationData.spring_arrival.earliest || (expectedDay - 15);
            const latestDay = migrationData.spring_arrival.latest || (expectedDay + 15);
            
            const daysDifference = arrivalDay - expectedDay;
            
            if (arrivalDay < earliestDay) {
                earlyArrivals.push({
                    name: speciesName,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    actualDate: firstHeardDate.toLocaleDateString(),
                    daysEarly: Math.abs(daysDifference),
                    type: 'spring'
                });
            } else if (dayOfYear > latestDay && arrivalDay > latestDay) {
                lateArrivals.push({
                    name: speciesName,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    actualDate: firstHeardDate.toLocaleDateString(),
                    daysLate: daysDifference,
                    type: 'spring'
                });
            }
        }
        
        // Check fall migration
        if (migrationData.fall_arrival) {
            const expectedDay = migrationData.fall_arrival.mean;
            const earliestDay = migrationData.fall_arrival.earliest || (expectedDay - 15);
            const latestDay = migrationData.fall_arrival.latest || (expectedDay + 15);
            
            const daysDifference = arrivalDay - expectedDay;
            
            if (arrivalDay < earliestDay) {
                earlyArrivals.push({
                    name: speciesName,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    actualDate: firstHeardDate.toLocaleDateString(),
                    daysEarly: Math.abs(daysDifference),
                    type: 'fall'
                });
            } else if (dayOfYear > latestDay && arrivalDay > latestDay) {
                lateArrivals.push({
                    name: speciesName,
                    expectedDate: dayOfYearToDate(expectedDay, currentYear),
                    actualDate: firstHeardDate.toLocaleDateString(),
                    daysLate: daysDifference,
                    type: 'fall'
                });
            }
        }
    });
    
    // Check for missing expected arrivals
    Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA).forEach(function(speciesName) {
        const migrationData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
        const detectedSpecies = speciesData.find(function(s) { return s.common_name === speciesName; });
        
        if (migrationData.spring_arrival) {
            const expectedDay = migrationData.spring_arrival.mean;
            const latestDay = migrationData.spring_arrival.latest || (expectedDay + 15);
            
            if (dayOfYear > latestDay && dayOfYear < 180) {
                if (!detectedSpecies || !detectedSpecies.first_heard || 
                    new Date(detectedSpecies.first_heard).getFullYear() < currentYear) {
                    const daysOverdue = dayOfYear - latestDay;
                    lateArrivals.push({
                        name: speciesName,
                        expectedDate: dayOfYearToDate(expectedDay, currentYear),
                        actualDate: 'Not yet detected',
                        daysLate: daysOverdue,
                        type: 'spring',
                        missing: true
                    });
                }
            }
        }
        
        if (migrationData.fall_arrival) {
            const expectedDay = migrationData.fall_arrival.mean;
            const latestDay = migrationData.fall_arrival.latest || (expectedDay + 15);
            
            if (dayOfYear > latestDay && dayOfYear > 240) {
                if (!detectedSpecies || !detectedSpecies.last_heard) {
                    const daysOverdue = dayOfYear - latestDay;
                    lateArrivals.push({
                        name: speciesName,
                        expectedDate: dayOfYearToDate(expectedDay, currentYear),
                        actualDate: 'Not yet detected',
                        daysLate: daysOverdue,
                        type: 'fall',
                        missing: true
                    });
                }
            }
        }
    });
    
    return {
        early: earlyArrivals.sort(function(a, b) { return b.daysEarly - a.daysEarly; }),
        late: lateArrivals.sort(function(a, b) { return b.daysLate - a.daysLate; })
    };
}

// Calculate migration wave strength
function calculateMigrationWaveStrength(speciesData) {
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    
    const recentDetections = speciesData.filter(function(species) {
        if (!species.last_heard) return false;
        const daysSince = (currentDate - new Date(species.last_heard)) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
    });
    
    const recentMigrants = recentDetections.filter(function(species) {
        return AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[species.common_name];
    }).length;
    
    const totalDetections = recentDetections.reduce(function(sum, s) {
        return sum + (s.count || 0);
    }, 0);
    
    let strength = 'Low';
    let intensity = 0;
    let description = 'Minimal migration activity';
    
    if (recentMigrants >= 10 || totalDetections >= 100) {
        strength = 'High';
        intensity = 90;
        description = 'Peak migration wave - many species active';
    } else if (recentMigrants >= 5 || totalDetections >= 50) {
        strength = 'Moderate';
        intensity = 60;
        description = 'Active migration period';
    } else if (recentMigrants >= 2 || totalDetections >= 20) {
        strength = 'Building';
        intensity = 30;
        description = 'Migration activity increasing';
    }
    
    return {
        strength: strength,
        intensity: intensity,
        recentMigrants: recentMigrants,
        totalDetections: totalDetections,
        description: description,
        inPeakWindow: (dayOfYear >= 90 && dayOfYear <= 140) || (dayOfYear >= 260 && dayOfYear <= 310)
    };
}

function dayOfYearToDate(dayOfYear, year) {
    const date = new Date(year, 0);
    date.setDate(dayOfYear);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function updateAllMigrationMetrics() {
    try {
        console.log('Updating migration metrics...');
        
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        const speciesData = await response.json();
        
        const progress = calculateMigrationProgress(speciesData);
        const nextArrival = calculateDaysUntilNextArrival(speciesData);
        const earlyLate = calculateEarlyLateArrivals(speciesData);
        const waveStrength = calculateMigrationWaveStrength(speciesData);
        
        updateMigrationMetricsDisplay(progress, nextArrival, earlyLate, waveStrength);
        
        console.log('Migration metrics updated successfully');
        
    } catch (error) {
        console.error('Error updating migration metrics:', error);
    }
}

function updateMigrationMetricsDisplay(progress, nextArrival, earlyLate, waveStrength) {
    const progressElement = document.getElementById('migration-progress-value');
    if (progressElement) {
        progressElement.textContent = progress.percentage + '%';
    }
    
    const progressBar = document.getElementById('migration-progress-bar');
    if (progressBar) {
        progressBar.style.width = progress.percentage + '%';
    }
    
    const progressDetail = document.getElementById('migration-progress-detail');
    if (progressDetail) {
        progressDetail.textContent = progress.arrived + ' of ' + progress.expected + ' expected migrants';
    }
    
    const nextArrivalDays = document.getElementById('next-arrival-days');
    if (nextArrivalDays) {
        nextArrivalDays.textContent = nextArrival ? nextArrival.days : '--';
    }
    
    const nextArrivalSpecies = document.getElementById('next-arrival-species');
    if (nextArrivalSpecies) {
        nextArrivalSpecies.textContent = nextArrival ? nextArrival.species : 'None expected soon';
    }
    
    const nextArrivalDate = document.getElementById('next-arrival-date');
    if (nextArrivalDate) {
        nextArrivalDate.textContent = nextArrival ? 'Expected: ' + nextArrival.expectedDate : '';
    }
    
    const earlyCount = document.getElementById('early-arrivals-count');
    if (earlyCount) {
        earlyCount.textContent = earlyLate.early.length;
    }
    
    const earlyList = document.getElementById('early-arrivals-list');
    if (earlyList) {
        if (earlyLate.early.length > 0) {
            earlyList.innerHTML = earlyLate.early.map(function(species) {
                return '<div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">' +
                    '<div style="font-weight: 600; color: #166534;">' + species.name + '</div>' +
                    '<div style="font-size: 0.875rem; color: #166534;">Expected: ' + species.expectedDate + '</div>' +
                    '<div style="font-size: 0.875rem; color: #166534;">Arrived: ' + species.actualDate + '</div>' +
                    '<div style="font-size: 0.875rem; font-weight: 600; color: #059669;">' + species.daysEarly + ' days early</div>' +
                    '</div>';
            }).join('');
        } else {
            earlyList.innerHTML = '<div style="color: #6b7280; font-style: italic;">No early arrivals this season</div>';
        }
    }
    
    const lateList = document.getElementById('late-arrivals-list');
    if (lateList) {
        if (earlyLate.late.length > 0) {
            lateList.innerHTML = earlyLate.late.map(function(species) {
                const bgColor = species.missing ? '#fee2e2' : '#fef3c7';
                const borderColor = species.missing ? '#ef4444' : '#f59e0b';
                const textColor = species.missing ? '#991b1b' : '#92400e';
                
                return '<div style="background: ' + bgColor + '; border-left: 4px solid ' + borderColor + '; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">' +
                    '<div style="font-weight: 600; color: ' + textColor + ';">' + species.name + '</div>' +
                    '<div style="font-size: 0.875rem; color: ' + textColor + ';">Expected: ' + species.expectedDate + '</div>' +
                    '<div style="font-size: 0.875rem; color: ' + textColor + ';">Status: ' + species.actualDate + '</div>' +
                    '<div style="font-size: 0.875rem; font-weight: 600; color: ' + borderColor + ';">' + 
                    (species.missing ? 'Overdue by ' : '') + species.daysLate + ' days' + (species.missing ? ' - not detected' : ' late') + '</div>' +
                    '</div>';
            }).join('');
        } else {
            lateList.innerHTML = '<div style="color: #6b7280; font-style: italic;">All migrants on schedule</div>';
        }
    }
    
    const waveStrengthValue = document.getElementById('wave-strength-value');
    if (waveStrengthValue) {
        waveStrengthValue.textContent = waveStrength.strength;
    }
    
    const waveStrengthIndicator = document.getElementById('wave-strength-indicator');
    if (waveStrengthIndicator) {
        const colors = {
            'High': '#10b981',
            'Moderate': '#f59e0b',
            'Building': '#3b82f6',
            'Low': '#6b7280'
        };
        waveStrengthIndicator.style.background = colors[waveStrength.strength] || '#6b7280';
    }
    
    const waveStrengthDetail = document.getElementById('wave-strength-detail');
    if (waveStrengthDetail) {
        waveStrengthDetail.textContent = waveStrength.description;
    }
    
    const waveStrengthStats = document.getElementById('wave-strength-stats');
    if (waveStrengthStats) {
        waveStrengthStats.textContent = waveStrength.recentMigrants + ' migrants in last 7 days';
    }
}

console.log('migration-metrics.js loaded successfully');