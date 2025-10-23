// FIX #2: Around line 210 in openSpeciesModal function
// FIX #3: Around line 279 in initializeEventListeners function

// FIND THIS SECTION (around line 200-235):
ui.openSpeciesModal = async function(commonName) {
    const modal = utils.getElement('species-modal');
    if (!modal) return;
    
    // Find species in data
    const species = BirdNET.data.originalSpecies.find(s => s.common_name === commonName);
    if (!species) {
        console.warn('Species not found:', commonName);
        return;
    }
    
    // Set basic info
    utils.setTextContent('modal-title', species.common_name || 'Unknown');
    utils.setTextContent('modal-subtitle', species.scientific_name || '');
    utils.setTextContent('modal-detections', utils.formatNumber(species.count || 0));
    utils.setTextContent('modal-confidence', 
        species.avg_confidence ? Math.round(species.avg_confidence * 100) + '%' : 'N/A');
    utils.setTextContent('modal-first-heard', 
        species.first_heard ? utils.formatDate(species.first_heard) : 'N/A');
    utils.setTextContent('modal-last-heard', 
        species.last_heard ? utils.formatDate(species.last_heard) : 'N/A');
    
    // Show modal
    modal.style.display = 'block';
    
    // Load additional info asynchronously
    const additionalInfo = utils.getElement('modal-additional-info');
    if (additionalInfo) {
        additionalInfo.innerHTML = '<div style="text-align: center; padding: 1rem;"><div class="spinner"></div></div>';
        
        try {
            // FIX #2: Check if api.fetchSpeciesInfo exists before calling
            const info = (api && api.fetchSpeciesInfo) ? 
                await api.fetchSpeciesInfo(species.common_name) : null;
            
            if (info) {
                let html = '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">';
                
                if (info.description) {
                    html += '<p style="margin-bottom: 1rem; line-height: 1.6;">' + utils.sanitizeHTML(info.description) + '</p>';
                }
                
                if (info.habitat) {
                    html += '<div style="margin-bottom: 0.5rem;"><strong>Habitat:</strong> ' + utils.sanitizeHTML(info.habitat) + '</div>';
                }
                
                if (info.diet) {
                    html += '<div style="margin-bottom: 0.5rem;"><strong>Diet:</strong> ' + utils.sanitizeHTML(info.diet) + '</div>';
                }
                
                if (info.conservation_status) {
                    html += '<div style="margin-bottom: 0.5rem;"><strong>Conservation Status:</strong> ' + utils.sanitizeHTML(info.conservation_status) + '</div>';
                }
                
                html += '</div>';
                additionalInfo.innerHTML = html;
            } else {
                // FIX #2: Show fallback message if function doesn't exist
                additionalInfo.innerHTML = '<div style="padding: 1rem; color: #6b7280; text-align: center;">Additional information not available</div>';
            }
            
        } catch (error) {
            console.error('Failed to load additional species info:', error);
            additionalInfo.innerHTML = '<div style="background: #fee2e2; padding: 1rem; border-radius: 8px; color: #dc2626;">Failed to load additional information</div>';
        }
    }
};

// FIND THIS SECTION (around line 240-285):
ui.initializeEventListeners = function() {
    console.log('Initializing UI event listeners...');
    
    // Date filter
    const dateFilter = utils.getElement('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function(e) {
            ui.filters.dateRange = e.target.value;
            ui.applyFilters();
        });
    }
    
    // Confidence threshold
    const confidenceSlider = utils.getElement('confidence-slider');
    const confidenceValue = utils.getElement('confidence-value');
    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            ui.filters.confidenceThreshold = value;
            if (confidenceValue) {
                confidenceValue.textContent = Math.round(value * 100) + '%';
            }
        });
        
        confidenceSlider.addEventListener('change', function() {
            ui.applyFilters();
        });
    }
    
    // FIX #3: Check if species-search element exists before adding listener
    const searchInput = utils.getElement('species-search');
    if (searchInput) {
        const debouncedSearch = utils.debounce(function() {
            ui.filters.searchTerm = searchInput.value;
            ui.applyFilters();
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
        console.log('✅ Species search listener added');
    } else {
        console.log('ℹ️ Species search not available on current tab');
    }
    
    // Sort
    const sortSelect = utils.getElement('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            ui.filters.sortBy = e.target.value;
            ui.applyFilters();
        });
    }
    
    // Refresh button
    const refreshBtn = utils.getElement('refresh-detections');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            updates.recentDetections();
        });
    }
    
    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', ui.closeModal);
    }
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        const modal = utils.getElement('species-modal');
        if (event.target === modal) {
            ui.closeModal();
        }
    });
    
    console.log('✅ Event listeners initialized');
};