// Detections Module - Recent Detections Management
console.log('detections.js loading...');

// Create BirdNET namespace if it doesn't exist
if (typeof BirdNET === 'undefined') {
    window.BirdNET = {};
}

// Detections module
BirdNET.detections = (function() {
    'use strict';
    
    /**
     * Update recent detections table
     */
    async function updateRecentDetections() {
        try {
            console.log('Updating recent detections...');
            
            const table = document.getElementById('recent-detections-table');
            if (!table) {
                console.warn('Recent detections table not found');
                return;
            }
            
            const tbody = table.querySelector('tbody');
            if (!tbody) return;
            
            // Get detections data
            const detections = BirdNET.data.recentDetections || [];
            
            if (detections.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">No recent detections</td></tr>';
                return;
            }
            
            // Clear table
            tbody.innerHTML = '';
            
            // Populate table (show last 50)
            const recentDetections = detections.slice(0, 50);
            
            recentDetections.forEach(function(detection) {
                const row = tbody.insertRow();
                
                // Species name
                const nameCell = row.insertCell();
                nameCell.innerHTML = '<a href="#" onclick="openSpeciesModal(\'' + 
                    detection.common_name + '\'); return false;" style="color: #2563eb; text-decoration: none;">' + 
                    detection.common_name + '</a>';
                
                // Date
                const dateCell = row.insertCell();
                const date = new Date(detection.begin_time || detection.timestamp);
                dateCell.textContent = date.toLocaleDateString();
                
                // Time
                const timeCell = row.insertCell();
                timeCell.textContent = date.toLocaleTimeString();
                
                // Confidence
                const confidenceCell = row.insertCell();
                const confidence = ((detection.confidence || 0) * 100).toFixed(1) + '%';
                confidenceCell.textContent = confidence;
                
                // Status
                const statusCell = row.insertCell();
                const statusBadge = detection.confidence > 0.8 ? 
                    '<span class="badge badge-success">High</span>' :
                    detection.confidence > 0.5 ?
                    '<span class="badge badge-warning">Medium</span>' :
                    '<span class="badge badge-info">Low</span>';
                statusCell.innerHTML = statusBadge;
                
                // Audio button
                const audioCell = row.insertCell();
                if (detection.clip_name) {
                    audioCell.innerHTML = '<button onclick="playAudio(\'' + detection.clip_name + 
                        '\')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">▶</button>';
                } else {
                    audioCell.textContent = '-';
                }
            });
            
            // Update info
            const info = document.getElementById('recent-detections-info');
            if (info) {
                info.textContent = 'Showing ' + recentDetections.length + ' of ' + 
                    detections.length + ' total detections';
            }
            
            console.log('✅ Recent detections updated');
            
        } catch (error) {
            console.error('Error updating recent detections:', error);
        }
    }
    
    /**
     * Filter detections by date range
     * @param {string} range - Date range ('today', 'week', 'month', 'all')
     */
    function filterByDateRange(range) {
        console.log('Filtering detections by:', range);
        // Implementation would filter the table based on date range
    }
    
    /**
     * Filter detections by confidence
     * @param {number} minConfidence - Minimum confidence threshold (0-1)
     */
    function filterByConfidence(minConfidence) {
        const table = document.getElementById('recent-detections-table');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(function(row) {
            const confidenceCell = row.cells[3]; // Confidence column
            if (!confidenceCell) return;
            
            const confidenceText = confidenceCell.textContent;
            const confidence = parseFloat(confidenceText) / 100;
            
            if (confidence >= minConfidence) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Public API
    return {
        updateRecentDetections: updateRecentDetections,
        filterByDateRange: filterByDateRange,
        filterByConfidence: filterByConfidence
    };
})();

console.log('✅ detections.js loaded successfully');