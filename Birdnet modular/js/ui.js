// UI Module
console.log('Loading BirdNET.ui module...');

(function() {
    'use strict';
    
    // Get references to BirdNET namespaces
    const ui = BirdNET.ui;
    const utils = BirdNET.utils;
    const api = BirdNET.api;
    const updates = BirdNET.updates;
    
    // Modal functions
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
                    additionalInfo.innerHTML = '<div style="padding: 1rem; color: #6b7280; text-align: center;">Additional information not available</div>';
                }
                
            } catch (error) {
                console.error('Failed to load additional species info:', error);
                additionalInfo.innerHTML = '<div style="background: #fee2e2; padding: 1rem; border-radius: 8px; color: #dc2626;">Failed to load additional information</div>';
            }
        }
    };
    
    ui.closeModal = function() {
        const modal = utils.getElement('species-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    ui.applyFilters = function() {
        console.log('Applying filters...', ui.filters);
        
        let filtered = BirdNET.data.originalSpecies.slice();
        
        // Apply search term
        if (ui.filters.searchTerm) {
            const searchLower = ui.filters.searchTerm.toLowerCase();
            filtered = filtered.filter(s => 
                (s.common_name && s.common_name.toLowerCase().includes(searchLower)) ||
                (s.scientific_name && s.scientific_name.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply confidence threshold
        filtered = filtered.filter(s => 
            !s.avg_confidence || s.avg_confidence >= ui.filters.confidenceThreshold
        );
        
        // Apply date range
        if (ui.filters.dateRange !== 'all') {
            const now = new Date();
            let cutoffDate = new Date(0);
            
            if (ui.filters.dateRange === 'today') {
                cutoffDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (ui.filters.dateRange === 'week') {
                cutoffDate = new Date(now.setDate(now.getDate() - 7));
            } else if (ui.filters.dateRange === 'month') {
                cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            }
            
            filtered = filtered.filter(s => {
                if (!s.last_heard) return false;
                return new Date(s.last_heard) >= cutoffDate;
            });
        }
        
        // Apply sorting
        if (ui.filters.sortBy === 'count') {
            filtered.sort((a, b) => (b.count || 0) - (a.count || 0));
        } else if (ui.filters.sortBy === 'recent') {
            filtered.sort((a, b) => {
                const dateA = a.last_heard ? new Date(a.last_heard) : new Date(0);
                const dateB = b.last_heard ? new Date(b.last_heard) : new Date(0);
                return dateB - dateA;
            });
        } else if (ui.filters.sortBy === 'name') {
            filtered.sort((a, b) => {
                const nameA = (a.common_name || '').toLowerCase();
                const nameB = (b.common_name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        } else if (ui.filters.sortBy === 'confidence') {
            filtered.sort((a, b) => (b.avg_confidence || 0) - (a.avg_confidence || 0));
        }
        
        // Update the displayed data
        BirdNET.data.species = filtered;
        
        // Refresh the UI components that display species
        if (updates.speciesTable) updates.speciesTable();
        if (updates.speciesGallery) updates.speciesGallery();
        
        console.log('Filters applied. Showing', filtered.length, 'of', BirdNET.data.originalSpecies.length, 'species');
    };
    
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
        
        // Species search
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
    
    console.log('✅ BirdNET.ui module loaded');
    
})();
