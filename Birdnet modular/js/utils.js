// Utility Functions Module
console.log('Loading BirdNET.utils module...');

(function() {
    'use strict';
    
    const utils = BirdNET.utils;
    
    // Format large numbers with K/M suffixes
    utils.formatNumber = function(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };
    
    // Sanitize HTML to prevent XSS
    utils.sanitizeHTML = function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // Safe HTML insertion
    utils.setTextContent = function(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    };
    
    utils.setHTML = function(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    };
    
    // Date formatting utilities
    utils.formatDate = function(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    utils.formatDateTime = function(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleString();
    };
    
    utils.formatTime = function(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleTimeString();
    };
    
    // Get date range filter
    utils.getDateRange = function(filterValue) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(filterValue) {
            case 'today':
                return { start: today, end: null };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: today };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return { start: weekAgo, end: null };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return { start: monthAgo, end: null };
            default:
                return { start: null, end: null };
        }
    };
    
    // Filter species by date range
    utils.filterByDateRange = function(species, filterValue) {
        if (filterValue === 'all') return species;
        
        const range = utils.getDateRange(filterValue);
        if (!range.start) return species;
        
        return species.filter(function(s) {
            if (!s.last_heard) return false;
            const lastHeard = new Date(s.last_heard);
            if (range.end) {
                return lastHeard >= range.start && lastHeard < range.end;
            }
            return lastHeard >= range.start;
        });
    };
    
    // Filter species by confidence threshold
    utils.filterByConfidence = function(species, threshold) {
        return species.filter(function(s) {
            return (s.avg_confidence || 0) >= threshold;
        });
    };
    
    // Filter species by search term
    utils.filterBySearch = function(species, searchTerm) {
        if (!searchTerm) return species;
        
        const term = searchTerm.toLowerCase();
        return species.filter(function(s) {
            const commonName = (s.common_name || '').toLowerCase();
            const scientificName = (s.scientific_name || '').toLowerCase();
            return commonName.includes(term) || scientificName.includes(term);
        });
    };
    
    // Sort species by various criteria
    utils.sortSpecies = function(species, sortBy) {
        const sorted = species.slice();
        
        switch(sortBy) {
            case 'count':
                return sorted.sort((a, b) => (b.count || 0) - (a.count || 0));
            case 'confidence':
                return sorted.sort((a, b) => (b.avg_confidence || 0) - (a.avg_confidence || 0));
            case 'name':
                return sorted.sort((a, b) => 
                    (a.common_name || '').localeCompare(b.common_name || '')
                );
            case 'recent':
                return sorted.sort((a, b) => {
                    const dateA = a.last_heard ? new Date(a.last_heard) : new Date(0);
                    const dateB = b.last_heard ? new Date(b.last_heard) : new Date(0);
                    return dateB - dateA;
                });
            case 'first':
                return sorted.sort((a, b) => {
                    const dateA = a.first_heard ? new Date(a.first_heard) : new Date(0);
                    const dateB = b.first_heard ? new Date(b.first_heard) : new Date(0);
                    return dateA - dateB;
                });
            default:
                return sorted;
        }
    };
    
    // Apply all filters and sorting
    utils.applyFilters = function() {
        const filters = BirdNET.ui.filters;
        let filtered = BirdNET.data.originalSpecies.slice();
        
        // Apply filters in sequence
        filtered = utils.filterByDateRange(filtered, filters.dateRange);
        filtered = utils.filterByConfidence(filtered, filters.confidenceThreshold);
        filtered = utils.filterBySearch(filtered, filters.searchTerm);
        filtered = utils.sortSpecies(filtered, filters.sortBy);
        
        // Update the filtered data
        BirdNET.data.species = filtered;
        
        return filtered;
    };
    
    // Debounce function for performance
    utils.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = function() {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // Get element safely - FIXED VERSION
    utils.getElement = function(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element not found: ${id} (may not be loaded yet or not on current tab)`);
            return null;
        }
        return element;
    };
    
    // Check if species is migratory
    utils.isMigratory = function(commonName) {
        return BirdNET.config.MIGRATORY_SPECIES.includes(commonName);
    };
    
    // Get rarity score
    utils.getRarityScore = function(commonName) {
        return BirdNET.config.RARITY_SCORES[commonName] || 0;
    };
    
    // Get conservation status
    utils.getConservationStatus = function(commonName) {
        return BirdNET.config.CONSERVATION_STATUS[commonName] || null;
    };
    
    // Check if species is rare (rarity > 30)
    utils.isRare = function(commonName) {
        return utils.getRarityScore(commonName) > 30;
    };
    
    // Normalize species name from detection
    utils.getSpeciesName = function(detection) {
        return detection.common_name || 
               detection.species || 
               detection.commonName || 
               detection.label || 
               detection.bird_name ||
               detection.name ||
               detection.species_name ||
               'Unknown Species';
    };
    
    // Get confidence from detection
    utils.getConfidence = function(detection) {
        if (detection.confidence !== undefined) {
            return Math.round(detection.confidence * 100);
        } else if (detection.score !== undefined) {
            return Math.round(detection.score * 100);
        } else if (detection.probability !== undefined) {
            return Math.round(detection.probability * 100);
        }
        return 0;
    };
    
    // Get timestamp from detection
    utils.getDetectionTime = function(detection) {
        if (detection.beginTime) {
            return new Date(detection.beginTime);
        } else if (detection.date && detection.time) {
            return new Date(detection.date + 'T' + detection.time);
        } else if (detection.timestamp) {
            return new Date(detection.timestamp);
        } else if (detection.created_at) {
            return new Date(detection.created_at);
        }
        return new Date();
    };
    
    // Show loading indicator
    utils.showLoading = function(elementId, message = 'Loading...') {
        const element = utils.getElement(elementId);
        if (element) {
            element.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">' +
                              '<div class="spinner"></div>' +
                              '<div style="margin-top: 0.5rem;">' + utils.sanitizeHTML(message) + '</div>' +
                              '</div>';
        }
    };
    
    // Show error message
    utils.showError = function(elementId, message) {
        const element = utils.getElement(elementId);
        if (element) {
            element.innerHTML = '<div style="background: #fee2e2; padding: 1rem; border-radius: 8px; border-left: 4px solid #ef4444; color: #dc2626;">' +
                              utils.sanitizeHTML(message) +
                              '</div>';
        }
    };
    
    // Show empty state
    utils.showEmpty = function(elementId, message) {
        const element = utils.getElement(elementId);
        if (element) {
            element.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">' +
                              '<div style="font-size: 3rem; margin-bottom: 1rem;">🦜</div>' +
                              '<div>' + utils.sanitizeHTML(message) + '</div>' +
                              '</div>';
        }
    };
    
    console.log('✅ BirdNET.utils module loaded');
    
})();
