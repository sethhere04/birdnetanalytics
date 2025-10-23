// UI Update Functions Module
console.log('Loading BirdNET.updates module...');

(function() {
    'use strict';
    
    const updates = BirdNET.updates;
    const utils = BirdNET.utils;
    const audio = BirdNET.audio;
    const charts = BirdNET.charts;
    
    // Update system status display
    updates.systemStatus = function() {
        const statusElement = utils.getElement('system-status');
        if (statusElement) {
            const now = new Date();
            const detectionsCount = (BirdNET.data.detections || []).length.toLocaleString();
            statusElement.innerHTML = 'Last updated: ' + now.toLocaleString() + 
                                     ' | Loaded: ' + detectionsCount + ' detections';
        }
    };
    
    // Update dashboard metrics
    updates.metrics = function() {
        const species = BirdNET.data.species;
        
        // Total Species
        utils.setTextContent('total-species', utils.formatNumber(species.length));
        
        // Total Detections
        const totalDetections = species.reduce(function(sum, s) {
            return sum + (s.count || 0);
        }, 0);
        utils.setTextContent('total-detections', utils.formatNumber(totalDetections));
        
        // Average Confidence
        if (species.length > 0) {
            const avgConfidence = species.reduce(function(sum, s) {
                return sum + (s.avg_confidence || 0);
            }, 0) / species.length;
            utils.setTextContent('avg-confidence', Math.round(avgConfidence * 100) + '%');
        }
        
        // Active Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = species.filter(function(s) {
            if (!s.last_heard) return false;
            const lastHeard = new Date(s.last_heard);
            return lastHeard >= today;
        }).length;
        utils.setTextContent('active-today', utils.formatNumber(activeToday));
    };
    
    // Update species table
    updates.speciesTable = function() {
        const tbody = document.querySelector('#species-table tbody');
        if (!tbody) return;
        
        const species = BirdNET.data.species;
        
        if (species.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">No species detected yet</td></tr>';
            return;
        }
        
        let html = '';
        species.forEach(function(s) {
            const isMigratory = utils.isMigratory(s.common_name);
            const isRare = utils.isRare(s.common_name);
            const conservationStatus = utils.getConservationStatus(s.common_name);
            
            html += '<tr style="cursor: pointer;" onclick="BirdNET.ui.openSpeciesModal(\'' + 
                    utils.sanitizeHTML(s.common_name) + '\')">';
            html += '<td>';
            html += '<div class="species-container">';
            html += '<div class="species-info">';
            html += '<strong>' + utils.sanitizeHTML(s.common_name || 'Unknown') + '</strong>';
            if (isMigratory) {
                html += ' <span class="badge badge-info">Migratory</span>';
            }
            if (isRare) {
                html += ' <span class="badge badge-warning">Rare</span>';
            }
            if (conservationStatus) {
                html += ' <span class="badge badge-danger">' + conservationStatus + '</span>';
            }
            html += '<div class="scientific-name">' + utils.sanitizeHTML(s.scientific_name || '') + '</div>';
            html += '</div></div></td>';
            html += '<td>' + utils.formatNumber(s.count || 0) + '</td>';
            html += '<td>' + Math.round((s.avg_confidence || 0) * 100) + '%</td>';
            html += '<td>' + utils.formatDate(s.first_heard) + '</td>';
            html += '<td>' + utils.formatDate(s.last_heard) + '</td>';
            
            // Safe audio button creation
            html += '<td>';
            if (s.best_detection_id && audio && audio.createButton) {
                html += audio.createButton(s.best_detection_id, s.common_name);
            } else if (s.best_detection_id) {
                // Fallback button if audio.createButton doesn't exist
                html += '<button onclick="playAudio(\'' + s.best_detection_id + '\')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">▶</button>';
            } else {
                html += 'N/A';
            }
            html += '</td>';
            
            html += '</tr>';
        });
        
        tbody.innerHTML = html;
    };
    
    // Update species gallery - FIXED VERSION
    updates.speciesGallery = function() {
        // Use enhanced gallery if available
        if (BirdNET.speciesGallery && BirdNET.speciesGallery.updateGalleryWithThumbnails) {
            BirdNET.speciesGallery.updateGalleryWithThumbnails();
            return;
        }
        
        // Fallback to basic gallery
        const gallery = utils.getElement('species-gallery');
        if (!gallery) return; // FIXED: Added safety check
        
        const species = BirdNET.data.species;
        
        if (species.length === 0) {
            utils.showEmpty('species-gallery', 'No species to display. Start your BirdNET to detect birds!');
            return;
        }
        
        let html = '';
        species.forEach(function(s) {
            html += '<div class="species-card" onclick="BirdNET.ui.openSpeciesModal(\'' + 
                    utils.sanitizeHTML(s.common_name) + '\')">';
            html += '<div class="species-card-placeholder">🦜</div>';
            html += '<div style="padding: 0.5rem 0;">';
            html += '<strong style="font-size: 0.938rem;">' + utils.sanitizeHTML(s.common_name || 'Unknown') + '</strong>';
            html += '<div class="scientific-name">' + utils.sanitizeHTML(s.scientific_name || '') + '</div>';
            html += '<div style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">';
            html += '<div>Detections: ' + utils.formatNumber(s.count || 0) + '</div>';
            html += '<div>Confidence: ' + Math.round((s.avg_confidence || 0) * 100) + '%</div>';
            html += '</div></div></div>';
        });
        
        gallery.innerHTML = html;
    };
    
    // Update recent detections table
    updates.recentDetections = async function() {
        const tbody = document.querySelector('#recent-detections-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
        
        try {
            // Use already loaded detections, just show the most recent ones
            const allDetections = BirdNET.data.detections || [];
            
            if (allDetections.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">' +
                    '<div style="color: #6b7280;">📊 No detections loaded yet</div>' +
                    '<div style="font-size: 0.875rem; color: #9ca3af; margin-top: 0.5rem;">Check that your BirdNET is actively detecting birds</div>' +
                    '</td></tr>';
                
                const infoDiv = utils.getElement('recent-detections-info');
                if (infoDiv) {
                    infoDiv.innerHTML = '<span style="color: #6b7280;">No detections found</span>';
                }
                return;
            }
            
            // Sort by date (most recent first) and take top 100
            const recentDetections = allDetections
                .slice() // Create copy to avoid mutating original
                .sort(function(a, b) {
                    const dateA = utils.getDetectionTime(a);
                    const dateB = utils.getDetectionTime(b);
                    return dateB - dateA;
                })
                .slice(0, 100);
            
            let html = '';
            recentDetections.forEach(function(d) {
                const detectionTime = utils.getDetectionTime(d);
                const speciesName = utils.sanitizeHTML(d.common_name || 'Unknown');
                
                html += '<tr onclick="BirdNET.ui.openSpeciesModal(\'' + speciesName + '\')" style="cursor: pointer;">';
                html += '<td><strong>' + speciesName + '</strong></td>';
                html += '<td>' + utils.formatDate(detectionTime) + '</td>';
                html += '<td>' + utils.formatTime(detectionTime) + '</td>';
                html += '<td>' + Math.round((d.confidence || 0) * 100) + '%</td>';
                
                // Confidence badge (inline to avoid missing function)
                html += '<td>';
                const percent = Math.round((d.confidence || 0) * 100);
                if (percent >= 80) {
                    html += '<span class="badge badge-success">High</span>';
                } else if (percent >= 50) {
                    html += '<span class="badge badge-warning">Medium</span>';
                } else {
                    html += '<span class="badge badge-info">Low</span>';
                }
                html += '</td>';
                
                // Safe audio button creation for detections
                html += '<td>';
                if (d.id && audio && audio.createButton) {
                    html += audio.createButton(d.id, speciesName);
                } else if (d.id) {
                    // Fallback button
                    html += '<button onclick="event.stopPropagation(); playAudio(\'' + d.id + '\')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">▶</button>';
                } else {
                    html += 'N/A';
                }
                html += '</td>';
                
                html += '</tr>';
            });
            
            tbody.innerHTML = html;
            
            const infoDiv = utils.getElement('recent-detections-info');
            if (infoDiv) {
                infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing 100 most recent (total loaded: ' + 
                                   allDetections.length.toLocaleString() + ')</span>';
            }
            
        } catch (error) {
            console.error('Error loading recent detections:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">' +
                '<div style="color: #ef4444;">⚠️ Unable to load detections</div>' +
                '<div style="font-size: 0.875rem; color: #9ca3af; margin-top: 0.5rem;">Error: ' + error.message + '</div>' +
                '</td></tr>';
        }
    };
    
    // Update newest species section
    updates.newestSpecies = function() {
        const container = utils.getElement('newest-species');
        if (!container) return;
        
        const species = BirdNET.data.originalSpecies.slice()
            .filter(s => s.first_heard)
            .sort((a, b) => new Date(b.first_heard) - new Date(a.first_heard))
            .slice(0, 5);
        
        if (species.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #6b7280;">No new species detected</div>';
            return;
        }
        
        let html = '';
        species.forEach(function(s) {
            html += '<div style="background: white; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; ' +
                   'border-left: 4px solid #10b981; cursor: pointer;" ' +
                   'onclick="BirdNET.ui.openSpeciesModal(\'' + utils.sanitizeHTML(s.common_name) + '\')">';
            html += '<strong style="color: #166534;">' + utils.sanitizeHTML(s.common_name || 'Unknown') + '</strong>';
            html += '<small style="display: block; color: #6b7280; margin-top: 0.25rem;">First detected: ' + 
                   utils.formatDate(s.first_heard) + '</small>';
            html += '</div>';
        });
        
        container.innerHTML = html;
    };
    
    // Update all UI elements
    updates.all = async function() {
        console.log('🔄 Updating all UI elements...');
        
        updates.systemStatus();
        updates.metrics();
        updates.speciesTable();
        updates.speciesGallery();
        updates.newestSpecies();
        await updates.recentDetections();
        
        console.log('✅ UI update complete');
    };
    
    console.log('✅ BirdNET.updates module loaded');
    
})();
