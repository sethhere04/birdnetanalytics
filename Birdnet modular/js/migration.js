// Migration Module - Advanced migration tracking and predictions
console.log('Loading BirdNET.migration module...');

(function() {
    'use strict';
    
    const migration = BirdNET.migration;
    const utils = BirdNET.utils;
    const config = BirdNET.config;
    
    // Enhanced migration data with more species
    migration.speciesData = {
        'Ruby-throated Hummingbird': {
            type: 'neotropical',
            springArrival: 100, fallDeparture: 260,
            peakSpring: 120, peakFall: 240,
            winterRange: 'Central America, Mexico',
            breedingRange: 'Eastern North America',
            flyway: 'Broad-front across Gulf'
        },
        'Baltimore Oriole': {
            type: 'neotropical',
            springArrival: 110, fallDeparture: 250,
            peakSpring: 125, peakFall: 235,
            winterRange: 'Central/South America',
            breedingRange: 'Eastern/Central North America'
        },
        'Rose-breasted Grosbeak': {
            type: 'neotropical',
            springArrival: 105, fallDeparture: 255,
            peakSpring: 120, peakFall: 240,
            winterRange: 'Mexico to Peru',
            breedingRange: 'Northeastern North America'
        },
        'Indigo Bunting': {
            type: 'neotropical',
            springArrival: 115, fallDeparture: 265,
            peakSpring: 130, peakFall: 250,
            winterRange: 'Caribbean, Central America',
            breedingRange: 'Eastern United States'
        },
        'Scarlet Tanager': {
            type: 'neotropical',
            springArrival: 110, fallDeparture: 260,
            peakSpring: 125, peakFall: 245,
            winterRange: 'South America',
            breedingRange: 'Eastern forests'
        },
        'Wood Thrush': {
            type: 'neotropical',
            springArrival: 115, fallDeparture: 265,
            peakSpring: 130, peakFall: 250,
            winterRange: 'Central America',
            breedingRange: 'Eastern deciduous forests'
        },
        'American Redstart': {
            type: 'neotropical',
            springArrival: 105, fallDeparture: 260,
            peakSpring: 120, peakFall: 245,
            winterRange: 'Caribbean, Central/South America',
            breedingRange: 'Northern forests'
        },
        'Black-throated Green Warbler': {
            type: 'neotropical',
            springArrival: 100, fallDeparture: 270,
            peakSpring: 115, peakFall: 255,
            winterRange: 'Mexico to Panama',
            breedingRange: 'Northern coniferous forests'
        },
        'Yellow Warbler': {
            type: 'neotropical',
            springArrival: 110, fallDeparture: 245,
            peakSpring: 125, peakFall: 230,
            winterRange: 'Central/South America',
            breedingRange: 'Widespread North America'
        },
        'Common Yellowthroat': {
            type: 'neotropical',
            springArrival: 105, fallDeparture: 270,
            peakSpring: 120, peakFall: 255,
            winterRange: 'Southern US to Central America',
            breedingRange: 'Widespread wetlands'
        },
        'Eastern Phoebe': {
            type: 'short-distance',
            springArrival: 75, fallDeparture: 290,
            peakSpring: 90, peakFall: 275,
            winterRange: 'Southern US, Mexico',
            breedingRange: 'Eastern North America'
        },
        'Tree Swallow': {
            type: 'short-distance',
            springArrival: 85, fallDeparture: 280,
            peakSpring: 100, peakFall: 265,
            winterRange: 'Southern US, Central America',
            breedingRange: 'Northern North America'
        },
        'Barn Swallow': {
            type: 'neotropical',
            springArrival: 95, fallDeparture: 275,
            peakSpring: 110, peakFall: 260,
            winterRange: 'South America',
            breedingRange: 'Widespread North America'
        },
        'Chimney Swift': {
            type: 'neotropical',
            springArrival: 105, fallDeparture: 275,
            peakSpring: 120, peakFall: 260,
            winterRange: 'Peru, Chile, Brazil',
            breedingRange: 'Eastern North America'
        },
        'Ruby-crowned Kinglet': {
            type: 'short-distance',
            springArrival: 90, fallDeparture: 300,
            peakSpring: 105, peakFall: 285,
            winterRange: 'Southern US, Mexico',
            breedingRange: 'Northern forests'
        },
        'White-throated Sparrow': {
            type: 'short-distance',
            springArrival: 85, fallDeparture: 310,
            peakSpring: 100, peakFall: 295,
            winterRange: 'Eastern/Southern US',
            breedingRange: 'Canadian forests'
        },
        'Dark-eyed Junco': {
            type: 'short-distance',
            springArrival: 80, fallDeparture: 315,
            peakSpring: 95, peakFall: 300,
            winterRange: 'Throughout US',
            breedingRange: 'Northern/Mountain forests'
        }
    };
    
    // Get day of year
    migration.getDayOfYear = function(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };
    
    // Convert day of year to date
    migration.dayToDate = function(dayOfYear) {
        const date = new Date(new Date().getFullYear(), 0);
        date.setDate(dayOfYear);
        return date;
    };
    
    // Analyze migration status with detailed information
    migration.analyzeStatus = function() {
        const species = BirdNET.data.originalSpecies;
        const today = new Date();
        const currentDay = migration.getDayOfYear(today);
        
        const arriving = [];
        const present = [];
        const departing = [];
        const expected = [];
        const lateArrivals = [];
        const earlyDepartures = [];
        
        // Check each migratory species
        Object.keys(migration.speciesData).forEach(function(speciesName) {
            const migrationData = migration.speciesData[speciesName];
            const detected = species.find(s => s.common_name === speciesName);
            
            const arrivalWindow = {
                start: migrationData.springArrival - 14,
                end: migrationData.springArrival + 14
            };
            
            const departureWindow = {
                start: migrationData.fallDeparture - 14,
                end: migrationData.fallDeparture + 14
            };
            
            // Spring arrival period
            if (currentDay >= arrivalWindow.start && currentDay <= arrivalWindow.end) {
                if (detected) {
                    const daysEarly = migrationData.springArrival - currentDay;
                    arriving.push({
                        name: speciesName,
                        firstSeen: detected.first_heard,
                        status: daysEarly > 0 ? 'early' : 'on-time',
                        daysEarly: daysEarly,
                        detections: detected.count,
                        type: migrationData.type,
                        winterRange: migrationData.winterRange
                    });
                } else {
                    expected.push({
                        name: speciesName,
                        expectedDate: migration.dayToDate(migrationData.springArrival),
                        peakDate: migration.dayToDate(migrationData.peakSpring),
                        daysUntil: migrationData.springArrival - currentDay,
                        type: migrationData.type,
                        winterRange: migrationData.winterRange
                    });
                }
            }
            // Summer residence period
            else if (currentDay > arrivalWindow.end && currentDay < departureWindow.start) {
                if (detected) {
                    present.push({
                        name: speciesName,
                        detections: detected.count,
                        lastSeen: detected.last_heard,
                        expectedDeparture: migration.dayToDate(migrationData.fallDeparture),
                        daysUntilDeparture: migrationData.fallDeparture - currentDay,
                        breedingRange: migrationData.breedingRange
                    });
                } else if (currentDay > migrationData.peakSpring + 30) {
                    // Expected but not detected - late or missing
                    lateArrivals.push({
                        name: speciesName,
                        expectedArrival: migration.dayToDate(migrationData.springArrival),
                        daysLate: currentDay - migrationData.springArrival,
                        type: migrationData.type
                    });
                }
            }
            // Fall departure period
            else if (currentDay >= departureWindow.start && currentDay <= departureWindow.end) {
                if (detected) {
                    departing.push({
                        name: speciesName,
                        lastSeen: detected.last_heard,
                        detections: detected.count,
                        expectedDeparture: migration.dayToDate(migrationData.fallDeparture),
                        peakDeparture: migration.dayToDate(migrationData.peakFall),
                        winterRange: migrationData.winterRange
                    });
                }
            }
            // Past departure - check if still present
            else if (currentDay > departureWindow.end) {
                if (detected) {
                    const lastSeenDate = new Date(detected.last_heard);
                    const lastSeenDay = migration.getDayOfYear(lastSeenDate);
                    
                    if (lastSeenDay > migrationData.fallDeparture) {
                        earlyDepartures.push({
                            name: speciesName,
                            lastSeen: detected.last_heard,
                            daysLate: lastSeenDay - migrationData.fallDeparture,
                            shouldHaveDeparted: migration.dayToDate(migrationData.fallDeparture)
                        });
                    }
                }
            }
        });
        
        return {
            arriving: arriving,
            present: present,
            departing: departing,
            expected: expected,
            lateArrivals: lateArrivals,
            earlyDepartures: earlyDepartures,
            currentDay: currentDay,
            currentDate: today,
            season: migration.getCurrentSeason(currentDay)
        };
    };
    
    // Get current migration season
    migration.getCurrentSeason = function(dayOfYear) {
        if (dayOfYear >= 60 && dayOfYear <= 150) return 'Spring Migration';
        if (dayOfYear >= 151 && dayOfYear <= 240) return 'Breeding Season';
        if (dayOfYear >= 241 && dayOfYear <= 330) return 'Fall Migration';
        return 'Winter';
    };
    
    // Update migration display with enhanced info
    migration.updateDisplay = function() {
        console.log('🦅 Updating migration analysis...');
        
        const status = migration.analyzeStatus();
        
        // Update season indicator
        const seasonIndicator = utils.getElement('migration-season');
        if (seasonIndicator) {
            seasonIndicator.innerHTML = '<strong>Current Season:</strong> ' + status.season;
        }
        
        // Update arriving species
        migration.updateArrivingSpecies(status.arriving);
        
        // Update present species
        migration.updatePresentSpecies(status.present);
        
        // Update departing species
        migration.updateDepartingSpecies(status.departing);
        
        // Update expected species
        migration.updateExpectedSpecies(status.expected);
        
        // Update anomalies if any
        migration.updateAnomalies(status.lateArrivals, status.earlyDepartures);
        
        console.log('✅ Migration analysis updated');
    };
    
    migration.updateArrivingSpecies = function(arriving) {
        const el = utils.getElement('arriving-species-list');
        if (!el) return;
        
        if (arriving.length === 0) {
            el.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species currently arriving</div>';
            return;
        }
        
        let html = '';
        arriving.forEach(function(s) {
            html += '<div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #10b981;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: start;">';
            html += '<div>';
            html += '<strong style="color: #166534; font-size: 1rem;">' + utils.sanitizeHTML(s.name) + '</strong>';
            html += '<div style="font-size: 0.813rem; color: #6b7280; margin-top: 0.25rem;">';
            html += '<div>🗓️ First detected: ' + utils.formatDate(s.firstSeen) + '</div>';
            html += '<div>📊 Detections: ' + s.detections + '</div>';
            html += '<div>🌍 From: ' + s.winterRange + '</div>';
            if (s.daysEarly > 0) {
                html += '<div style="color: #059669; font-weight: 600;">⚡ ' + Math.abs(s.daysEarly) + ' days early!</div>';
            } else if (s.daysEarly < -7) {
                html += '<div style="color: #d97706;">⏰ ' + Math.abs(s.daysEarly) + ' days late</div>';
            }
            html += '</div></div>';
            html += '<span class="badge badge-success" style="font-size: 0.75rem;">' + s.type + '</span>';
            html += '</div></div>';
        });
        el.innerHTML = html;
    };
    
    migration.updatePresentSpecies = function(present) {
        const el = utils.getElement('present-species-list');
        if (!el) return;
        
        if (present.length === 0) {
            el.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No migratory species currently present</div>';
            return;
        }
        
        let html = '';
        present.forEach(function(s) {
            html += '<div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #3b82f6;">';
            html += '<strong style="color: #1e40af; font-size: 1rem;">' + utils.sanitizeHTML(s.name) + '</strong>';
            html += '<div style="font-size: 0.813rem; color: #6b7280; margin-top: 0.25rem;">';
            html += '<div>📊 Detections: ' + s.detections + '</div>';
            html += '<div>👁️ Last seen: ' + utils.formatDate(s.lastSeen) + '</div>';
            html += '<div>📅 Expected departure: ' + utils.formatDate(s.expectedDeparture) + ' (' + s.daysUntilDeparture + ' days)</div>';
            if (s.breedingRange) {
                html += '<div>🏡 Breeding: ' + s.breedingRange + '</div>';
            }
            html += '</div></div>';
        });
        el.innerHTML = html;
    };
    
    migration.updateDepartingSpecies = function(departing) {
        const el = utils.getElement('departing-species-list');
        if (!el) return;
        
        if (departing.length === 0) {
            el.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species currently departing</div>';
            return;
        }
        
        let html = '';
        departing.forEach(function(s) {
            html += '<div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #f59e0b;">';
            html += '<strong style="color: #92400e; font-size: 1rem;">' + utils.sanitizeHTML(s.name) + '</strong>';
            html += '<div style="font-size: 0.813rem; color: #6b7280; margin-top: 0.25rem;">';
            html += '<div>📊 Detections: ' + s.detections + '</div>';
            html += '<div>👁️ Last seen: ' + utils.formatDate(s.lastSeen) + '</div>';
            html += '<div>📅 Expected departure: ' + utils.formatDate(s.expectedDeparture) + '</div>';
            html += '<div>🌍 Heading to: ' + s.winterRange + '</div>';
            html += '</div></div>';
        });
        el.innerHTML = html;
    };
    
    migration.updateExpectedSpecies = function(expected) {
        const el = utils.getElement('expected-species-list');
        if (!el) return;
        
        if (expected.length === 0) {
            el.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species expected soon</div>';
            return;
        }
        
        let html = '';
        expected.forEach(function(s) {
            html += '<div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #8b5cf6;">';
            html += '<strong style="color: #6b21a8; font-size: 1rem;">' + utils.sanitizeHTML(s.name) + '</strong>';
            html += '<div style="font-size: 0.813rem; color: #6b7280; margin-top: 0.25rem;">';
            html += '<div>📅 Expected: ' + utils.formatDate(s.expectedDate);
            if (s.daysUntil > 0) {
                html += ' (in ' + s.daysUntil + ' days)';
            } else {
                html += ' (overdue by ' + Math.abs(s.daysUntil) + ' days)';
            }
            html += '</div>';
            html += '<div>⭐ Peak: ' + utils.formatDate(s.peakDate) + '</div>';
            html += '<div>🌍 From: ' + s.winterRange + '</div>';
            html += '</div>';
            html += '<span class="badge badge-info" style="font-size: 0.75rem; margin-top: 0.5rem;">' + s.type + '</span>';
            html += '</div>';
        });
        el.innerHTML = html;
    };
    
    migration.updateAnomalies = function(lateArrivals, earlyDepartures) {
        const el = utils.getElement('migration-anomalies');
        if (!el) return;
        
        if (lateArrivals.length === 0 && earlyDepartures.length === 0) {
            el.style.display = 'none';
            return;
        }
        
        el.style.display = 'block';
        let html = '<div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 1rem;">';
        html += '<h3 style="font-size: 1rem; color: #92400e; margin-bottom: 0.75rem;">⚠️ Migration Anomalies</h3>';
        
        if (lateArrivals.length > 0) {
            html += '<div style="margin-bottom: 0.75rem;"><strong>Late/Missing Arrivals:</strong></div>';
            lateArrivals.forEach(function(s) {
                html += '<div style="font-size: 0.875rem; color: #6b7280; margin-left: 1rem;">• ' + 
                       s.name + ' (expected ' + utils.formatDate(s.expectedArrival) + ', ' + 
                       s.daysLate + ' days late)</div>';
            });
        }
        
        if (earlyDepartures.length > 0) {
            html += '<div style="margin-top: 0.75rem; margin-bottom: 0.75rem;"><strong>Delayed Departures:</strong></div>';
            earlyDepartures.forEach(function(s) {
                html += '<div style="font-size: 0.875rem; color: #6b7280; margin-left: 1rem;">• ' + 
                       s.name + ' (should have left ' + utils.formatDate(s.shouldHaveDeparted) + ', still present)</div>';
            });
        }
        
        html += '</div>';
        el.innerHTML = html;
    };
    
    console.log('✅ BirdNET.migration module loaded');
    
})();

console.log('Loading BirdNET.migration module...');

(function() {
    'use strict';
    
    const migration = BirdNET.migration;
    const utils = BirdNET.utils;
    const config = BirdNET.config;
    
    // Migration data for common species
    migration.speciesData = {
        'Ruby-throated Hummingbird': {
            type: 'neotropical',
            springArrival: 100,  // Day of year
            fallDeparture: 260,
            peakSpring: 120,
            peakFall: 240
        },
        'Baltimore Oriole': {
            type: 'neotropical',
            springArrival: 110,
            fallDeparture: 250,
            peakSpring: 125,
            peakFall: 235
        },
        'Rose-breasted Grosbeak': {
            type: 'neotropical',
            springArrival: 105,
            fallDeparture: 255,
            peakSpring: 120,
            peakFall: 240
        },
        'Indigo Bunting': {
            type: 'neotropical',
            springArrival: 115,
            fallDeparture: 265,
            peakSpring: 130,
            peakFall: 250
        },
        'Scarlet Tanager': {
            type: 'neotropical',
            springArrival: 110,
            fallDeparture: 260,
            peakSpring: 125,
            peakFall: 245
        },
        'Wood Thrush': {
            type: 'neotropical',
            springArrival: 115,
            fallDeparture: 265,
            peakSpring: 130,
            peakFall: 250
        },
        'American Redstart': {
            type: 'neotropical',
            springArrival: 105,
            fallDeparture: 260,
            peakSpring: 120,
            peakFall: 245
        },
        'Black-throated Green Warbler': {
            type: 'neotropical',
            springArrival: 100,
            fallDeparture: 270,
            peakSpring: 115,
            peakFall: 255
        },
        'Yellow Warbler': {
            type: 'neotropical',
            springArrival: 110,
            fallDeparture: 245,
            peakSpring: 125,
            peakFall: 230
        },
        'Common Yellowthroat': {
            type: 'neotropical',
            springArrival: 105,
            fallDeparture: 270,
            peakSpring: 120,
            peakFall: 255
        },
        'Eastern Phoebe': {
            type: 'temperate',
            springArrival: 75,
            fallDeparture: 290,
            peakSpring: 90,
            peakFall: 275
        },
        'Tree Swallow': {
            type: 'temperate',
            springArrival: 85,
            fallDeparture: 280,
            peakSpring: 100,
            peakFall: 265
        },
        'Barn Swallow': {
            type: 'temperate',
            springArrival: 95,
            fallDeparture: 275,
            peakSpring: 110,
            peakFall: 260
        },
        'Chimney Swift': {
            type: 'neotropical',
            springArrival: 105,
            fallDeparture: 275,
            peakSpring: 120,
            peakFall: 260
        },
        'Ruby-crowned Kinglet': {
            type: 'short-distance',
            springArrival: 90,
            fallDeparture: 300,
            peakSpring: 105,
            peakFall: 285
        },
        'White-throated Sparrow': {
            type: 'short-distance',
            springArrival: 85,
            fallDeparture: 310,
            peakSpring: 100,
            peakFall: 295
        },
        'Dark-eyed Junco': {
            type: 'short-distance',
            springArrival: 80,
            fallDeparture: 315,
            peakSpring: 95,
            peakFall: 300
        }
    };
    
    // Get day of year
    migration.getDayOfYear = function(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };
    
    // Analyze migration status
    migration.analyzeStatus = function() {
        const species = BirdNET.data.originalSpecies;
        const today = new Date();
        const currentDay = migration.getDayOfYear(today);
        
        const arriving = [];
        const present = [];
        const departing = [];
        const expected = [];
        
        // Check each migratory species
        config.MIGRATORY_SPECIES.forEach(function(speciesName) {
            const migrationData = migration.speciesData[speciesName];
            if (!migrationData) return;
            
            const detected = species.find(s => s.common_name === speciesName);
            
            // Determine status based on current day
            if (currentDay >= migrationData.springArrival - 14 && 
                currentDay <= migrationData.springArrival + 14) {
                // Spring arrival window
                if (detected) {
                    arriving.push({
                        name: speciesName,
                        firstSeen: detected.first_heard,
                        status: 'early',
                        daysEarly: migrationData.springArrival - currentDay
                    });
                } else {
                    expected.push({
                        name: speciesName,
                        expectedDate: migration.dayToDate(migrationData.springArrival),
                        daysUntil: migrationData.springArrival - currentDay
                    });
                }
            } else if (currentDay > migrationData.springArrival + 14 && 
                      currentDay < migrationData.fallDeparture - 14) {
                // Present period
                if (detected) {
                    present.push({
                        name: speciesName,
                        detections: detected.count,
                        lastSeen: detected.last_heard
                    });
                }
            } else if (currentDay >= migrationData.fallDeparture - 14 && 
                      currentDay <= migrationData.fallDeparture + 14) {
                // Fall departure window
                if (detected) {
                    departing.push({
                        name: speciesName,
                        lastSeen: detected.last_heard,
                        expectedDeparture: migration.dayToDate(migrationData.fallDeparture)
                    });
                }
            }
        });
        
        return {
            arriving: arriving,
            present: present,
            departing: departing,
            expected: expected,
            currentDay: currentDay,
            currentDate: today
        };
    };
    
    // Convert day of year to date
    migration.dayToDate = function(dayOfYear) {
        const date = new Date(new Date().getFullYear(), 0);
        date.setDate(dayOfYear);
        return date;
    };
    
    // Update migration display
    migration.updateDisplay = function() {
        console.log('🦅 Updating migration analysis...');
        
        const status = migration.analyzeStatus();
        
        // Update arriving species
        const arrivingEl = utils.getElement('arriving-species-list');
        if (arrivingEl) {
            if (status.arriving.length === 0) {
                arrivingEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species currently arriving</div>';
            } else {
                let html = '';
                status.arriving.forEach(function(s) {
                    html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; border-left: 4px solid #10b981;">';
                    html += '<strong style="color: #166534;">' + utils.sanitizeHTML(s.name) + '</strong>';
                    html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">';
                    html += 'First detected: ' + utils.formatDate(s.firstSeen);
                    if (s.daysEarly > 0) {
                        html += ' • ' + Math.abs(s.daysEarly) + ' days early!';
                    }
                    html += '</div></div>';
                });
                arrivingEl.innerHTML = html;
            }
        }
        
        // Update present species
        const presentEl = utils.getElement('present-species-list');
        if (presentEl) {
            if (status.present.length === 0) {
                presentEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No migratory species currently present</div>';
            } else {
                let html = '';
                status.present.forEach(function(s) {
                    html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; border-left: 4px solid #3b82f6;">';
                    html += '<strong style="color: #1e40af;">' + utils.sanitizeHTML(s.name) + '</strong>';
                    html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">';
                    html += s.detections + ' detections • Last seen: ' + utils.formatDate(s.lastSeen);
                    html += '</div></div>';
                });
                presentEl.innerHTML = html;
            }
        }
        
        // Update departing species
        const departingEl = utils.getElement('departing-species-list');
        if (departingEl) {
            if (status.departing.length === 0) {
                departingEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species currently departing</div>';
            } else {
                let html = '';
                status.departing.forEach(function(s) {
                    html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; border-left: 4px solid #f59e0b;">';
                    html += '<strong style="color: #92400e;">' + utils.sanitizeHTML(s.name) + '</strong>';
                    html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">';
                    html += 'Expected departure: ' + utils.formatDate(s.expectedDeparture);
                    html += '</div></div>';
                });
                departingEl.innerHTML = html;
            }
        }
        
        // Update expected species
        const expectedEl = utils.getElement('expected-species-list');
        if (expectedEl) {
            if (status.expected.length === 0) {
                expectedEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No species expected soon</div>';
            } else {
                let html = '';
                status.expected.forEach(function(s) {
                    html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; border-left: 4px solid #8b5cf6;">';
                    html += '<strong style="color: #6b21a8;">' + utils.sanitizeHTML(s.name) + '</strong>';
                    html += '<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">';
                    html += 'Expected: ' + utils.formatDate(s.expectedDate);
                    if (s.daysUntil > 0) {
                        html += ' • In ' + s.daysUntil + ' days';
                    } else {
                        html += ' • Overdue by ' + Math.abs(s.daysUntil) + ' days';
                    }
                    html += '</div></div>';
                });
                expectedEl.innerHTML = html;
            }
        }
        
        console.log('✅ Migration analysis updated');
    };
    
    console.log('✅ BirdNET.migration module loaded');
    
})();
