// filters.js - Data Filtering Module
// File: js/filters.js
console.log('filters.js loading...');

// Initialize filters
function initializeFilters() {
    console.log('Initializing data filters...');
}

// Apply data filters
function applyDataFilters() {
    // Start with all data
    speciesData = originalSpeciesData.slice();
    
    // Apply date filter
    var dateFilter = document.getElementById('date-filter');
    if (dateFilter && dateFilter.value !== 'all') {
        var now = new Date();
        var filterDate = new Date();
        
        switch(dateFilter.value) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                filterDate.setDate(filterDate.getDate() - 1);
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(filterDate.getDate() - 7);
                break;
            case 'month':
                filterDate.setDate(filterDate.getDate() - 30);
                break;
        }
        
        speciesData = speciesData.filter(function(species) {
            if (!species.last_heard) return true;
            var lastHeard = new Date(species.last_heard);
            return lastHeard >= filterDate;
        });
    }
    
    // Apply confidence filter
    var confidenceSlider = document.getElementById('confidence-filter');
    if (confidenceSlider) {
        var threshold = parseFloat(confidenceSlider.value) / 100;
        speciesData = speciesData.filter(function(species) {
            return (species.avg_confidence || 0) >= threshold;
        });
    }
    
    // Update displays
    if (typeof updateMetrics === 'function') {
        updateMetrics();
    }
    
    if (typeof updateSpeciesTable === 'function') {
        updateSpeciesTable();
    }
    
    if (typeof updateSpeciesGallery === 'function') {
        updateSpeciesGallery();
    }
    
    if (typeof updateFilterStatus === 'function') {
        updateFilterStatus();
    }
}

// Update filter status display
function updateFilterStatus() {
    var statusDiv = document.getElementById('filter-status');
    if (!statusDiv) return;
    
    var statusText = [];
    
    var dateFilter = document.getElementById('date-filter');
    if (dateFilter && dateFilter.value !== 'all') {
        var dateLabels = {
            'today': 'Today only',
            'yesterday': 'Yesterday only',
            'week': 'Last 7 days',
            'month': 'Last 30 days'
        };
        statusText.push('Date: ' + dateLabels[dateFilter.value]);
    }
    
    var confidenceSlider = document.getElementById('confidence-filter');
    if (confidenceSlider && parseInt(confidenceSlider.value) > 0) {
        statusText.push('Confidence: ≥' + confidenceSlider.value + '%');
    }
    
    if (statusText.length === 0) {
        statusDiv.innerHTML = 'No filters applied - showing all data';
        statusDiv.style.background = '#f9fafb';
        statusDiv.style.color = '#6b7280';
    } else {
        statusDiv.innerHTML = '<strong>Active filters:</strong> ' + statusText.join(' • ') + ' (' + speciesData.length + ' species match)';
        statusDiv.style.background = '#dbeafe';
        statusDiv.style.color = '#1e40af';
    }
}

// Clear all filters
function clearAllFilters() {
    var dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.value = 'all';
    
    var confidenceSlider = document.getElementById('confidence-filter');
    if (confidenceSlider) {
        confidenceSlider.value = 0;
        var confidenceValue = document.getElementById('confidence-value');
        if (confidenceValue) confidenceValue.textContent = '0%';
    }
    
    var timeFilter = document.getElementById('time-filter');
    if (timeFilter) timeFilter.value = 'all';
    
    var customDateRange = document.getElementById('custom-date-range');
    if (customDateRange) customDateRange.style.display = 'none';
    
    speciesData = originalSpeciesData.slice();
    
    if (typeof updateFilterStatus === 'function') {
        updateFilterStatus();
    }
    
    if (typeof updateMetrics === 'function') {
        updateMetrics();
    }
    
    if (typeof updateSpeciesTable === 'function') {
        updateSpeciesTable();
    }
    
    if (typeof updateSpeciesGallery === 'function') {
        updateSpeciesGallery();
    }
    
    if (typeof updateAdvancedAnalytics === 'function') {
        updateAdvancedAnalytics();
    }
}

console.log('✅ filters.js loaded successfully');
