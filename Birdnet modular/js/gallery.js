// Gallery Module - Species Gallery Management
console.log('gallery.js loading...');

// Create BirdNET namespace if it doesn't exist
if (typeof BirdNET === 'undefined') {
    window.BirdNET = {};
}

// Gallery module
BirdNET.gallery = (function() {
    'use strict';
    
    /**
     * Update species gallery
     */
    async function updateGallery() {
        try {
            console.log('Updating species gallery...');
            
            const gallery = document.getElementById('species-gallery');
            if (!gallery) {
                console.warn('Species gallery not found');
                return;
            }
            
            // Get species data
            const species = BirdNET.data.speciesSummary || [];
            
            if (species.length === 0) {
                gallery.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">' +
                    '<div class="empty-state-icon">🦜</div>' +
                    '<div class="empty-state-title">No Species Yet</div>' +
                    '<div class="empty-state-description">Start detecting birds to see them here!</div>' +
                    '</div>';
                return;
            }
            
            // Clear gallery
            gallery.innerHTML = '';
            
            // Create gallery cards (show top 20 by detection count)
            const topSpecies = species
                .sort((a, b) => (b.count || 0) - (a.count || 0))
                .slice(0, 20);
            
            topSpecies.forEach(function(s) {
                const card = document.createElement('div');
                card.className = 'species-card';
                card.style.cssText = 'background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;';
                card.onclick = function() {
                    openSpeciesModal(s.common_name);
                };
                
                // Add hover effect
                card.onmouseenter = function() {
                    this.style.transform = 'translateY(-4px)';
                    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                };
                card.onmouseleave = function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                };
                
                // Image container
                const imageContainer = document.createElement('div');
                imageContainer.className = 'species-card-image-container';
                
                if (s.thumbnail_url) {
                    const img = document.createElement('img');
                    img.src = s.thumbnail_url;
                    img.alt = s.common_name;
                    img.className = 'species-card-image';
                    imageContainer.appendChild(img);
                } else {
                    imageContainer.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #d1d5db;">🦜</div>';
                }
                
                card.appendChild(imageContainer);
                
                // Info container
                const infoContainer = document.createElement('div');
                infoContainer.style.cssText = 'padding: 1rem;';
                
                const name = document.createElement('h3');
                name.textContent = s.common_name;
                name.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: #1f2937;';
                infoContainer.appendChild(name);
                
                const detections = document.createElement('div');
                detections.textContent = (s.count || 0).toLocaleString() + ' detections';
                detections.style.cssText = 'font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;';
                infoContainer.appendChild(detections);
                
                const confidence = document.createElement('div');
                confidence.textContent = 'Avg: ' + (s.avg_confidence ? (s.avg_confidence * 100).toFixed(1) + '%' : 'N/A');
                confidence.style.cssText = 'font-size: 0.875rem; color: #6b7280;';
                infoContainer.appendChild(confidence);
                
                card.appendChild(infoContainer);
                gallery.appendChild(card);
            });
            
            console.log('✅ Gallery updated with', topSpecies.length, 'species');
            
        } catch (error) {
            console.error('Error updating gallery:', error);
        }
    }
    
    /**
     * Filter gallery by search term
     * @param {string} searchTerm - Search term
     */
    function filterGallery(searchTerm) {
        const gallery = document.getElementById('species-gallery');
        if (!gallery) return;
        
        const cards = gallery.querySelectorAll('.species-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(function(card) {
            const text = card.textContent.toLowerCase();
            if (text.includes(term)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Public API
    return {
        updateGallery: updateGallery,
        filterGallery: filterGallery
    };
})();

console.log('✅ gallery.js loaded successfully');