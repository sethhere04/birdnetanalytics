// Species Module - Species Data Management
console.log('species.js loading...');

// Create BirdNET namespace if it doesn't exist
if (typeof BirdNET === 'undefined') {
    window.BirdNET = {};
}

// Species module
BirdNET.species = (function() {
    'use strict';
    
    /**
     * Update species table with current data
     */
    async function updateSpeciesTable() {
        try {
            console.log('Updating species table...');
            
            const table = document.getElementById('species-table');
            if (!table) {
                console.warn('Species table not found');
                return;
            }
            
            const tbody = table.querySelector('tbody');
            if (!tbody) return;
            
            // Get species data
            const species = BirdNET.data.speciesSummary || [];
            
            if (species.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">No species detected yet</td></tr>';
                return;
            }
            
            // Clear table
            tbody.innerHTML = '';
            
            // Populate table
            species.forEach(function(s) {
                const row = tbody.insertRow();
                
                // Species name (clickable)
                const nameCell = row.insertCell();
                nameCell.innerHTML = '<a href="#" onclick="openSpeciesModal(\'' + 
                    s.common_name + '\'); return false;" style="color: #2563eb; text-decoration: none;">' + 
                    s.common_name + '</a>';
                
                // Detections
                const detectionsCell = row.insertCell();
                detectionsCell.textContent = (s.count || 0).toLocaleString();
                
                // Confidence
                const confidenceCell = row.insertCell();
                const confidence = s.avg_confidence ? (s.avg_confidence * 100).toFixed(1) + '%' : 'N/A';
                confidenceCell.textContent = confidence;
                
                // First heard
                const firstCell = row.insertCell();
                firstCell.textContent = s.first_heard ? 
                    new Date(s.first_heard).toLocaleDateString() : 'Unknown';
                
                // Last heard
                const lastCell = row.insertCell();
                lastCell.textContent = s.last_heard ? 
                    new Date(s.last_heard).toLocaleDateString() : 'Unknown';
                
                // Audio button
                const audioCell = row.insertCell();
                if (s.clip_name) {
                    audioCell.innerHTML = '<button onclick="playAudio(\'' + s.clip_name + 
                        '\')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">▶</button>';
                } else {
                    audioCell.textContent = '-';
                }
            });
            
            console.log('✅ Species table updated with', species.length, 'species');
            
        } catch (error) {
            console.error('Error updating species table:', error);
        }
    }
    
    /**
     * Filter species table based on search
     * @param {string} searchTerm - Search term
     */
    function filterSpecies(searchTerm) {
        const table = document.getElementById('species-table');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        const term = searchTerm.toLowerCase();
        
        rows.forEach(function(row) {
            const text = row.textContent.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    /**
     * Sort species table
     * @param {string} column - Column to sort by
     * @param {string} direction - 'asc' or 'desc'
     */
    function sortSpeciesTable(column, direction) {
        // Implementation for sorting
        console.log('Sorting by', column, direction);
    }
    
    // Public API
    return {
        updateSpeciesTable: updateSpeciesTable,
        filterSpecies: filterSpecies,
        sortSpeciesTable: sortSpeciesTable
    };
})();

console.log('✅ species.js loaded successfully');