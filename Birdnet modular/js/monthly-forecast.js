// Monthly Migration Forecast Generator
console.log('monthly-forecast.js loading...');

// Generate monthly forecast based on detected species
function generateMonthlyForecast() {
    console.log('Generating monthly migration forecast...');
    
    var container = document.getElementById('monthly-forecast-grid');
    if (!container) {
        console.error('Monthly forecast container not found');
        return;
    }
    
    // Check if we have dynamic migration data
    if (!window.DYNAMIC_MIGRATION_ROUTES || Object.keys(window.DYNAMIC_MIGRATION_ROUTES).length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">Loading migration data...</div>';
        
        // Try again after a short delay
        setTimeout(function() {
            if (window.DYNAMIC_MIGRATION_ROUTES && Object.keys(window.DYNAMIC_MIGRATION_ROUTES).length > 0) {
                generateMonthlyForecast();
            }
        }, 1000);
        return;
    }
    
    // Get all migratory species
    var allSpecies = Object.values(window.DYNAMIC_MIGRATION_ROUTES);
    
    // Filter out resident species
    var migratorySpecies = allSpecies.filter(function(species) {
        return species.type !== 'resident';
    });
    
    if (migratorySpecies.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">No migratory species detected yet. Keep birding!</div>';
        return;
    }
    
    console.log('Processing ' + migratorySpecies.length + ' migratory species for monthly forecast');
    
    // Create monthly buckets
    var months = [
        { name: 'January', num: 1, species: [] },
        { name: 'February', num: 2, species: [] },
        { name: 'March', num: 3, species: [] },
        { name: 'April', num: 4, species: [] },
        { name: 'May', num: 5, species: [] },
        { name: 'June', num: 6, species: [] },
        { name: 'July', num: 7, species: [] },
        { name: 'August', num: 8, species: [] },
        { name: 'September', num: 9, species: [] },
        { name: 'October', num: 10, species: [] },
        { name: 'November', num: 11, species: [] },
        { name: 'December', num: 12, species: [] }
    ];
    
    // Assign species to months based on their detection data and migration type
    migratorySpecies.forEach(function(species) {
        if (!species.springRoute || !species.springDates) return;
        
        var detectionInfo = {
            name: species.name,
            type: species.type,
            detections: species.detectionCount || 0,
            color: species.color,
            firstDetected: species.firstDetected,
            lastDetected: species.lastDetected
        };
        
        // Determine when to expect this species based on type
        if (species.type === 'neotropical' || species.type === 'temperate') {
            // Spring arrival months (typically March-May)
            var springDate = species.springDates && species.springDates.length > 0 ? 
                             species.springDates[species.springDates.length - 1] : null;
            if (springDate) {
                var springMonth = getMonthFromDateString(springDate);
                if (springMonth >= 1 && springMonth <= 12) {
                    detectionInfo.event = 'Spring Arrival';
                    detectionInfo.eventType = 'arrival';
                    months[springMonth - 1].species.push(detectionInfo);
                }
            }
            
            // Fall departure months (typically August-October)
            var fallDate = species.fallDates && species.fallDates.length > 0 ? 
                          species.fallDates[species.fallDates.length - 1] : null;
            if (fallDate) {
                var fallMonth = getMonthFromDateString(fallDate);
                if (fallMonth >= 1 && fallMonth <= 12) {
                    detectionInfo.event = 'Fall Departure';
                    detectionInfo.eventType = 'departure';
                    months[fallMonth - 1].species.push(Object.assign({}, detectionInfo));
                }
            }
        } else if (species.type === 'reverse') {
            // Winter visitors (like junco) - opposite pattern
            var arrivalDate = species.fallDates && species.fallDates.length > 0 ? 
                             species.fallDates[species.fallDates.length - 1] : null;
            if (arrivalDate) {
                var arrivalMonth = getMonthFromDateString(arrivalDate);
                if (arrivalMonth >= 1 && arrivalMonth <= 12) {
                    detectionInfo.event = 'Winter Arrival';
                    detectionInfo.eventType = 'arrival';
                    months[arrivalMonth - 1].species.push(detectionInfo);
                }
            }
            
            var departureDate = species.springDates && species.springDates.length > 0 ? 
                               species.springDates[species.springDates.length - 1] : null;
            if (departureDate) {
                var departureMonth = getMonthFromDateString(departureDate);
                if (departureMonth >= 1 && departureMonth <= 12) {
                    detectionInfo.event = 'Spring Departure';
                    detectionInfo.eventType = 'departure';
                    months[departureMonth - 1].species.push(Object.assign({}, detectionInfo));
                }
            }
        } else if (species.type === 'partial' || species.type === 'nomadic') {
            // Partial migrants - variable presence
            if (species.firstDetected) {
                var firstMonth = new Date(species.firstDetected).getMonth() + 1;
                detectionInfo.event = 'Possible Arrival';
                detectionInfo.eventType = 'arrival';
                months[firstMonth - 1].species.push(detectionInfo);
            }
        }
    });
    
    // Generate HTML for each month
    container.innerHTML = '';
    
    var currentMonth = new Date().getMonth() + 1;
    
    months.forEach(function(month) {
        var card = document.createElement('div');
        var isCurrentMonth = month.num === currentMonth;
        
        card.style.cssText = 'background: white; border: 2px solid ' + 
                            (isCurrentMonth ? '#3b82f6' : '#e5e7eb') + 
                            '; border-radius: 8px; padding: 1rem; position: relative;';
        
        if (isCurrentMonth) {
            var badge = document.createElement('div');
            badge.style.cssText = 'position: absolute; top: -10px; right: 10px; background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
            badge.textContent = 'Current';
            card.appendChild(badge);
        }
        
        var header = document.createElement('div');
        header.style.cssText = 'font-weight: 700; font-size: 1.125rem; margin-bottom: 0.75rem; color: ' + 
                              (isCurrentMonth ? '#1e40af' : '#374151');
        header.textContent = month.name;
        card.appendChild(header);
        
        if (month.species.length === 0) {
            var noActivity = document.createElement('div');
            noActivity.style.cssText = 'color: #9ca3af; font-size: 0.875rem; font-style: italic; padding: 1rem 0;';
            noActivity.textContent = 'No major migration activity expected';
            card.appendChild(noActivity);
        } else {
            var count = document.createElement('div');
            count.style.cssText = 'font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem;';
            count.textContent = month.species.length + ' species event' + (month.species.length !== 1 ? 's' : '');
            card.appendChild(count);
            
            var speciesList = document.createElement('div');
            speciesList.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;';
            
            month.species.slice(0, 10).forEach(function(sp) {
                var item = document.createElement('div');
                item.style.cssText = 'background: #f9fafb; padding: 0.5rem; border-radius: 4px; border-left: 3px solid ' + sp.color + '; font-size: 0.813rem;';
                
                var eventColor = sp.eventType === 'arrival' ? '#10b981' : '#f59e0b';
                var eventIcon = sp.eventType === 'arrival' ? '↑' : '↓';
                
                item.innerHTML = 
                    '<div style="font-weight: 600; margin-bottom: 0.125rem;">' + sp.name + '</div>' +
                    '<div style="font-size: 0.75rem; color: ' + eventColor + '; font-weight: 500;">' + 
                    eventIcon + ' ' + sp.event + '</div>' +
                    '<div style="font-size: 0.688rem; color: #6b7280; margin-top: 0.125rem;">' + 
                    sp.detections + ' historical detection' + (sp.detections !== 1 ? 's' : '') + '</div>';
                
                speciesList.appendChild(item);
            });
            
            if (month.species.length > 10) {
                var more = document.createElement('div');
                more.style.cssText = 'text-align: center; color: #6b7280; font-size: 0.75rem; padding: 0.5rem; font-style: italic;';
                more.textContent = '+ ' + (month.species.length - 10) + ' more species';
                speciesList.appendChild(more);
            }
            
            card.appendChild(speciesList);
        }
        
        container.appendChild(card);
    });
    
    console.log('Monthly forecast generated successfully');
}

// Helper function to extract month from date string like "Apr 15"
function getMonthFromDateString(dateStr) {
    var monthNames = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    var parts = dateStr.split(' ');
    if (parts.length >= 1) {
        var monthAbbr = parts[0];
        return monthNames[monthAbbr] || 0;
    }
    return 0;
}

console.log('monthly-forecast.js loaded successfully');
console.log('generateMonthlyForecast function defined:', typeof generateMonthlyForecast);
