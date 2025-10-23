// Modal Handlers - Species Modal Management
console.log('modal-handlers.js loading...');

/**
 * Open the species modal and load data
 * @param {string} speciesName - Common name of the species
 */
function openSpeciesModal(speciesName) {
    const modal = document.getElementById('species-modal');
    if (!modal) {
        console.warn('Species modal not found');
        return;
    }
    
    // Show modal
    modal.classList.add('active');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load species data
    loadSpeciesModalData(speciesName);
}

/**
 * Close the species modal
 */
function closeSpeciesModal() {
    const modal = document.getElementById('species-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Load species data into the modal
 * @param {string} speciesName - Common name of the species
 */
async function loadSpeciesModalData(speciesName) {
    try {
        console.log('Loading modal data for:', speciesName);
        
        // Get species data from global data
        const speciesData = BirdNET.data.speciesSummary?.find(s => s.common_name === speciesName);
        
        if (!speciesData) {
            console.warn('Species data not found:', speciesName);
            return;
        }
        
        // Update modal content - basic info
        const modalName = document.getElementById('species-modal-name');
        const modalScientific = document.getElementById('species-modal-scientific');
        const modalCount = document.getElementById('species-modal-count');
        const modalConfidence = document.getElementById('species-modal-confidence');
        const modalFirst = document.getElementById('species-modal-first');
        const modalLast = document.getElementById('species-modal-last');
        
        if (modalName) modalName.textContent = speciesData.common_name || speciesName;
        if (modalScientific) modalScientific.textContent = speciesData.scientific_name || 'Scientific name unavailable';
        if (modalCount) modalCount.textContent = (speciesData.count || 0).toLocaleString();
        if (modalConfidence) modalConfidence.textContent = speciesData.avg_confidence ? 
            (speciesData.avg_confidence * 100).toFixed(1) + '%' : 'N/A';
        if (modalFirst) modalFirst.textContent = speciesData.first_heard ? 
            new Date(speciesData.first_heard).toLocaleDateString() : 'Unknown';
        if (modalLast) modalLast.textContent = speciesData.last_heard ? 
            new Date(speciesData.last_heard).toLocaleDateString() : 'Unknown';
        
        // Load species image if available
        const imageContainer = document.getElementById('species-modal-image');
        if (imageContainer) {
            if (speciesData.thumbnail_url) {
                imageContainer.innerHTML = '<img src="' + speciesData.thumbnail_url + 
                    '" style="width: 100%; height: 100%; object-fit: cover;" alt="' + speciesName + '">';
            } else {
                imageContainer.innerHTML = '<div style="width: 100%; height: 100%; display: flex; ' +
                    'align-items: center; justify-content: center; color: #9ca3af; font-size: 2rem;">🦜</div>';
            }
        }
        
        // Additional info
        const modalInfo = document.getElementById('species-modal-info');
        if (modalInfo) {
            let infoHtml = '<p><strong>Status:</strong> ' + (speciesData.status || 'Active') + '</p>';
            
            if (speciesData.first_heard && speciesData.last_heard) {
                const days = Math.floor((new Date(speciesData.last_heard) - new Date(speciesData.first_heard)) / (1000 * 60 * 60 * 24));
                infoHtml += '<p><strong>Detection Range:</strong> ' + days + ' days</p>';
            } else {
                infoHtml += '<p><strong>Detection Range:</strong> N/A</p>';
            }
            
            modalInfo.innerHTML = infoHtml;
        }
        
        // Load recent detections
        loadRecentDetections(speciesName);
        
        // Load additional info (if modal-additional-info exists)
        loadAdditionalInfo(speciesName, speciesData);
        
    } catch (error) {
        console.error('Error loading species modal data:', error);
        const modalInfo = document.getElementById('species-modal-info');
        if (modalInfo) {
            modalInfo.innerHTML = '<p style="color: #ef4444;">Error loading species information</p>';
        }
    }
}

/**
 * Load recent detections for a species
 * @param {string} speciesName - Common name of the species
 */
function loadRecentDetections(speciesName) {
    const recentContainer = document.getElementById('species-modal-recent');
    if (!recentContainer) return;
    
    if (BirdNET.data.recentDetections) {
        const recentForSpecies = BirdNET.data.recentDetections
            .filter(d => d.common_name === speciesName)
            .slice(0, 10);
        
        if (recentForSpecies.length > 0) {
            let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
            
            recentForSpecies.forEach(detection => {
                const date = new Date(detection.begin_time || detection.timestamp);
                html += '<div style="padding: 0.75rem; background: #f9fafb; border-radius: 6px; ' +
                    'display: flex; justify-content: space-between; align-items: center;">';
                html += '<div>';
                html += '<div style="font-weight: 500;">' + date.toLocaleDateString() + ' ' + 
                    date.toLocaleTimeString() + '</div>';
                html += '<div style="font-size: 0.875rem; color: #6b7280;">Confidence: ' + 
                    ((detection.confidence || 0) * 100).toFixed(1) + '%</div>';
                html += '</div>';
                
                if (detection.clip_name) {
                    html += '<button onclick="playAudio(\'' + detection.clip_name + '\')" ' +
                        'style="padding: 0.25rem 0.75rem; background: #3b82f6; color: white; ' +
                        'border: none; border-radius: 4px; cursor: pointer;">▶ Play</button>';
                }
                
                html += '</div>';
            });
            
            html += '</div>';
            recentContainer.innerHTML = html;
        } else {
            recentContainer.innerHTML = '<p style="color: #6b7280;">No recent detections found</p>';
        }
    } else {
        recentContainer.innerHTML = '<p style="color: #6b7280;">Loading recent detections...</p>';
    }
}

/**
 * Load additional information for a species (if element exists)
 * @param {string} speciesName - Common name of the species
 * @param {object} speciesData - Species data object
 */
async function loadAdditionalInfo(speciesName, speciesData) {
    const additionalInfo = document.getElementById('modal-additional-info');
    if (!additionalInfo) return;
    
    // Show loading state
    additionalInfo.innerHTML = '<div style="text-align: center; padding: 1rem;">' +
        '<div class="spinner"></div><p style="margin-top: 0.5rem; color: #6b7280;">Loading additional information...</p></div>';
    
    try {
        // If species-info-api.js is loaded, use it
        if (typeof getSpeciesInfo === 'function') {
            const speciesInfo = await getSpeciesInfo(
                speciesData.common_name || speciesData.scientific_name,
                speciesData.scientific_name
            );
            
            let infoHTML = '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">';
            
            if (speciesInfo.description) {
                infoHTML += '<p style="margin-bottom: 1rem; line-height: 1.6;">' + speciesInfo.description + '</p>';
            }
            
            if (speciesInfo.habitat) {
                infoHTML += '<div style="margin-bottom: 0.5rem;"><strong>Habitat:</strong> ' + speciesInfo.habitat + '</div>';
            }
            
            if (speciesInfo.diet) {
                infoHTML += '<div style="margin-bottom: 0.5rem;"><strong>Diet:</strong> ' + speciesInfo.diet + '</div>';
            }
            
            if (speciesInfo.conservation_status) {
                infoHTML += '<div style="margin-bottom: 0.5rem;"><strong>Conservation Status:</strong> ' + 
                    speciesInfo.conservation_status + '</div>';
            }
            
            // Photo gallery
            if (speciesInfo.photos && speciesInfo.photos.length > 0) {
                infoHTML += '<div style="margin-top: 1rem;"><strong>Photos:</strong></div>';
                infoHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">';
                speciesInfo.photos.slice(0, 6).forEach(photoUrl => {
                    infoHTML += '<img src="' + photoUrl + '" alt="' + speciesName + '" ' +
                        'style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; cursor: pointer;" ' +
                        'onclick="window.open(\'' + photoUrl + '\', \'_blank\')">';
                });
                infoHTML += '</div>';
            }
            
            infoHTML += '</div>';
            additionalInfo.innerHTML = infoHTML;
        } else {
            // Fallback: basic info only
            additionalInfo.innerHTML = '<div style="padding: 1rem; color: #6b7280; text-align: center;">' +
                'Additional information not available</div>';
        }
    } catch (error) {
        console.error('Error loading additional species info:', error);
        additionalInfo.innerHTML = '<div style="padding: 1rem; color: #ef4444; text-align: center;">' +
            'Error loading additional information</div>';
    }
}

/**
 * Initialize modal event listeners
 */
function initializeModalHandlers() {
    console.log('Initializing modal handlers...');
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('species-modal');
        if (modal && e.target === modal) {
            closeSpeciesModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSpeciesModal();
        }
    });
    
    console.log('✅ Modal handlers initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalHandlers);
} else {
    initializeModalHandlers();
}

// Export functions to global scope
window.openSpeciesModal = openSpeciesModal;
window.closeSpeciesModal = closeSpeciesModal;
window.loadSpeciesModalData = loadSpeciesModalData;

console.log('✅ modal-handlers.js loaded successfully');