// Enhanced Species Gallery with Thumbnails
console.log('Loading BirdNET enhanced species gallery...');

(function() {
    'use strict';
    
    const gallery = BirdNET.speciesGallery = {};
    const utils = BirdNET.utils;
    const api = BirdNET.api;
    
    // Enrich species with best recording for audio playback
    gallery.enrichWithBestRecordings = async function() {
        try {
            console.log('Enriching species with best recordings...');
            
            // Fetch all detections if not already loaded
            const detections = BirdNET.data.detections || [];
            
            if (detections.length === 0) {
                console.warn('No detections available for enrichment');
                return false;
            }
            
            // Group detections by species and find best (highest confidence) for each
            const speciesBestDetections = {};
            
            detections.forEach(function(detection) {
                const speciesName = utils.getSpeciesName(detection);
                if (!speciesName || !detection.id) return;
                
                const confidence = utils.getConfidence(detection) / 100; // Convert to 0-1
                
                if (!speciesBestDetections[speciesName] || confidence > speciesBestDetections[speciesName].confidence) {
                    speciesBestDetections[speciesName] = {
                        id: detection.id,
                        confidence: confidence
                    };
                }
            });
            
            console.log('Found best recordings for', Object.keys(speciesBestDetections).length, 'species');
            
            // Enrich species data with best detection info
            if (BirdNET.data.species) {
                BirdNET.data.species.forEach(function(species) {
                    const best = speciesBestDetections[species.common_name];
                    if (best) {
                        species.best_detection_id = best.id;
                        species.best_confidence = best.confidence;
                    }
                });
            }
            
            if (BirdNET.data.originalSpecies) {
                BirdNET.data.originalSpecies.forEach(function(species) {
                    const best = speciesBestDetections[species.common_name];
                    if (best) {
                        species.best_detection_id = best.id;
                        species.best_confidence = best.confidence;
                    }
                });
            }
            
            console.log('✅ Species data enriched with best recordings');
            return true;
            
        } catch (error) {
            console.error('Error enriching species with best recordings:', error);
            return false;
        }
    };
    
    // Create species card with thumbnail and audio
    gallery.createSpeciesCard = function(species) {
        const isMigratory = utils.isMigratory(species.common_name);
        const isRare = utils.isRare(species.common_name);
        const conservationStatus = utils.getConservationStatus(species.common_name);
        
        let html = '<div class="species-card" onclick="BirdNET.ui.openSpeciesModal(\'' + 
                   utils.sanitizeHTML(species.common_name) + '\')">';
        
        // Thumbnail - will be loaded asynchronously
        html += '<div class="species-card-image-container" id="species-thumb-' + species.common_name.replace(/\s/g, '-') + '">';
        html += '<div class="species-card-placeholder">🦜</div>';
        html += '</div>';
        
        // Species info
        html += '<div style="padding: 0.75rem;">';
        html += '<strong style="font-size: 1rem;">' + utils.sanitizeHTML(species.common_name || 'Unknown') + '</strong>';
        
        // Badges
        if (isMigratory) {
            html += ' <span class="badge badge-info" style="font-size: 0.688rem;">Migratory</span>';
        }
        if (isRare) {
            html += ' <span class="badge badge-warning" style="font-size: 0.688rem;">Rare</span>';
        }
        if (conservationStatus) {
            html += ' <span class="badge badge-danger" style="font-size: 0.688rem;">' + conservationStatus + '</span>';
        }
        
        html += '<div class="scientific-name" style="margin-top: 0.25rem;">' + 
               utils.sanitizeHTML(species.scientific_name || '') + '</div>';
        
        // Stats
        html += '<div style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">';
        html += '<div style="margin-bottom: 0.25rem;">Detections: <strong>' + utils.formatNumber(species.count || 0) + '</strong></div>';
        html += '<div style="margin-bottom: 0.25rem;">Confidence: <strong>' + Math.round((species.avg_confidence || 0) * 100) + '%</strong></div>';
        html += '<div>Last seen: <strong>' + utils.formatDate(species.last_heard) + '</strong></div>';
        html += '</div>';
        
        // Audio button
        if (species.best_detection_id) {
            html += '<div style="margin-top: 0.75rem;">';
            html += BirdNET.audio.createButton(species.best_detection_id, species.common_name);
            html += '</div>';
        }
        
        html += '</div></div>';
        
        return html;
    };
    
    // Load thumbnail for a species
    gallery.loadThumbnail = async function(speciesName) {
        try {
            const containerId = 'species-thumb-' + speciesName.replace(/\s/g, '-');
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Try to get image from Wikipedia/iNaturalist
            const info = await api.getSpeciesInfo(speciesName, '');
            
            if (info && info.photos && info.photos.length > 0) {
                const imageUrl = info.photos[0];
                container.innerHTML = '<img src="' + imageUrl + '" class="species-card-image" alt="' + 
                                    utils.sanitizeHTML(speciesName) + '" onerror="this.parentElement.innerHTML=\'<div class=\\\'species-card-placeholder\\\'>🦜</div>\'">';
            }
        } catch (error) {
            // Silently fail - placeholder will remain
        }
    };
    
    // Update species gallery with thumbnails
    gallery.updateGalleryWithThumbnails = async function() {
        const galleryElement = utils.getElement('species-gallery');
        if (!galleryElement) return;
        
        const species = BirdNET.data.species;
        
        if (species.length === 0) {
            utils.showEmpty('species-gallery', 'No species to display. Start your BirdNET to detect birds!');
            return;
        }
        
        // First, render cards with placeholders
        let html = '';
        species.forEach(function(s) {
            html += gallery.createSpeciesCard(s);
        });
        galleryElement.innerHTML = html;
        
        // Then, load thumbnails asynchronously (load first 20 for performance)
        const speciesToLoad = species.slice(0, 20);
        console.log('Loading thumbnails for', speciesToLoad.length, 'species...');
        
        // Load thumbnails in batches to avoid overwhelming the APIs
        for (let i = 0; i < speciesToLoad.length; i++) {
            setTimeout(function() {
                gallery.loadThumbnail(speciesToLoad[i].common_name);
            }, i * 200); // Stagger requests by 200ms
        }
    };
    
    console.log('✅ BirdNET enhanced species gallery loaded');
    
})();
