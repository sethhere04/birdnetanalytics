// UI creation functions
function createThumbnail(species) {
    if (species.thumbnail_url || species.image_url || species.photo_url) {
        var img = document.createElement('img');
        img.src = species.thumbnail_url || species.image_url || species.photo_url;
        img.className = 'thumbnail';
        img.alt = species.common_name || 'Bird';
        img.onclick = function() { 
            if (typeof openEnhancedModal === 'function') {
                openEnhancedModal(species);
            } else {
                openModal(species);
            }
        };
        img.onerror = function() {
            var placeholder = document.createElement('div');
            placeholder.textContent = 'Bird';
            placeholder.style.cssText = 'width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: #f3f4f6; border-radius: 6px; margin-right: 0.75rem; cursor: pointer; border: 2px solid #e5e7eb; color: #6b7280;';
            placeholder.onclick = function() { 
                if (typeof openEnhancedModal === 'function') {
                    openEnhancedModal(species);
                } else {
                    openModal(species);
                }
            };
            img.parentNode.replaceChild(placeholder, img);
        };
        return img;
    } else {
        var placeholder = document.createElement('div');
        placeholder.textContent = 'Bird';
        placeholder.style.cssText = 'width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: #f3f4f6; border-radius: 6px; margin-right: 0.75rem; cursor: pointer; border: 2px solid #e5e7eb; color: #6b7280;';
        placeholder.onclick = function() { 
            if (typeof openEnhancedModal === 'function') {
                openEnhancedModal(species);
            } else {
                openModal(species);
            }
        };
        return placeholder;
    }
}

function createNewestSpeciesCard(species, index) {
    var card = document.createElement('div');
    card.className = 'species-card';
    card.onclick = function() { 
        if (typeof openEnhancedModal === 'function') {
            openEnhancedModal(species);
        } else {
            openModal(species);
        }
    };
    card.style.position = 'relative';
    
    var newBadge = document.createElement('div');
    newBadge.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; background: #059669; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.6rem; font-weight: 600; z-index: 1;';
    newBadge.textContent = '#' + (index + 1) + ' LIFE BIRD';
    card.appendChild(newBadge);
    
    if (species.thumbnail_url || species.image_url || species.photo_url) {
        var img = document.createElement('img');
        img.src = species.thumbnail_url || species.image_url || species.photo_url;
        img.className = 'species-card-image';
        img.alt = species.common_name || 'Bird';
        img.onerror = function() {
            this.style.display = 'none';
            var placeholder = document.createElement('div');
            placeholder.className = 'species-card-placeholder';
            placeholder.textContent = 'No Image Available';
            this.parentNode.insertBefore(placeholder, this.nextSibling);
        };
        card.appendChild(img);
    } else {
        var placeholder = document.createElement('div');
        placeholder.className = 'species-card-placeholder';
        placeholder.textContent = 'No Image Available';
        card.appendChild(placeholder);
    }
    
    var isMigratory = CONFIG.MIGRATORY_SPECIES.includes(species.common_name);
    var rarity = CONFIG.RARITY_SCORES[species.common_name] || 0;
    
    var badges = '';
    if (rarity > 40) {
        badges += '<span class="badge badge-danger" style="font-size: 0.6rem;">Rare</span>';
    } else if (rarity > 25) {
        badges += '<span class="badge badge-warning" style="font-size: 0.6rem;">Uncommon</span>';
    }
    
    if (isMigratory) {
        badges += '<span class="badge badge-success" style="font-size: 0.6rem;">Migratory</span>';
    } else {
        badges += '<span class="badge badge-info" style="font-size: 0.6rem;">Resident</span>';
    }
    
    var firstHeard = species.first_heard ? new Date(species.first_heard).toLocaleDateString() : 'N/A';
    var timeAgo = '';
    if (species.first_heard) {
        var timeDiff = new Date() - new Date(species.first_heard);
        var daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        var hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        
        if (daysAgo === 0 && hoursAgo === 0) {
            timeAgo = 'Just now';
        } else if (daysAgo === 0) {
            timeAgo = hoursAgo + 'h ago';
        } else if (daysAgo === 1) {
            timeAgo = 'Yesterday';
        } else {
            timeAgo = daysAgo + 'd ago';
        }
    }
    
    var totalDetections = species.count || 0;
    var lastSeen = species.last_heard ? new Date(species.last_heard).toLocaleDateString() : 'N/A';
    
    var contentDiv = document.createElement('div');
    contentDiv.innerHTML = 
        '<div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">' + (species.common_name || species.scientific_name) + '</div>' +
        (species.scientific_name && species.common_name ? '<div style="font-size: 0.75rem; color: #6b7280; font-style: italic; margin-bottom: 0.5rem;">' + species.scientific_name + '</div>' : '') +
        '<div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280;">' +
            '<span>' + formatNumber(totalDetections) + ' total</span>' +
            '<span>' + (species.avg_confidence ? Math.round(species.avg_confidence * 100) + '%' : 'N/A') + '</span>' +
        '</div>' +
        '<div style="font-size: 0.75rem; color: #059669; font-weight: 600;">First heard: ' + firstHeard + (timeAgo ? ' (' + timeAgo + ')' : '') + '</div>' +
        '<div style="font-size: 0.75rem; color: #6b7280;">Last seen: ' + lastSeen + '</div>' +
        '<div style="display: flex; gap: 0.25rem; margin-top: 0.5rem; flex-wrap: wrap;">' + badges + '</div>';
    
    card.appendChild(contentDiv);
    return card;
}

function createSpeciesCard(species) {
    var card = document.createElement('div');
    card.className = 'species-card';
    card.onclick = function() { 
        if (typeof openEnhancedModal === 'function') {
            openEnhancedModal(species);
        } else {
            openModal(species);
        }
    };
    
    if (species.thumbnail_url || species.image_url || species.photo_url) {
        var img = document.createElement('img');
        img.src = species.thumbnail_url || species.image_url || species.photo_url;
        img.className = 'species-card-image';
        img.alt = species.common_name || 'Bird';
        img.onerror = function() {
            this.style.display = 'none';
            var placeholder = document.createElement('div');
            placeholder.className = 'species-card-placeholder';
            placeholder.textContent = 'No Image Available';
            this.parentNode.insertBefore(placeholder, this.nextSibling);
        };
        card.appendChild(img);
    } else {
        var placeholder = document.createElement('div');
        placeholder.className = 'species-card-placeholder';
        placeholder.textContent = 'No Image Available';
        card.appendChild(placeholder);
    }
    
    var isMigratory = CONFIG.MIGRATORY_SPECIES.includes(species.common_name);
    var rarity = CONFIG.RARITY_SCORES[species.common_name] || 0;
    
    var badges = '';
    if (rarity > 40) {
        badges += '<span class="badge badge-danger" style="font-size: 0.6rem;">Rare</span>';
    } else if (rarity > 25) {
        badges += '<span class="badge badge-warning" style="font-size: 0.6rem;">Uncommon</span>';
    }
    
    if (isMigratory) {
        badges += '<span class="badge badge-success" style="font-size: 0.6rem;">Migratory</span>';
    } else {
        badges += '<span class="badge badge-info" style="font-size: 0.6rem;">Resident</span>';
    }
    
    var lastSeen = species.last_heard ? new Date(species.last_heard).toLocaleDateString() : 'N/A';
    
    var contentDiv = document.createElement('div');
    contentDiv.innerHTML = 
        '<div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">' + (species.common_name || species.scientific_name) + '</div>' +
        (species.scientific_name && species.common_name ? '<div style="font-size: 0.75rem; color: #6b7280; font-style: italic; margin-bottom: 0.5rem;">' + species.scientific_name + '</div>' : '') +
        '<div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280;">' +
            '<span>' + formatNumber(species.count || 0) + ' detections</span>' +
            '<span>' + (species.avg_confidence ? Math.round(species.avg_confidence * 100) + '%' : 'N/A') + '</span>' +
        '</div>' +
        '<div style="font-size: 0.75rem; color: #6b7280;">Last seen: ' + lastSeen + '</div>' +
        '<div style="display: flex; gap: 0.25rem; margin-top: 0.5rem; flex-wrap: wrap;">' + badges + '</div>';
    
    card.appendChild(contentDiv);
    return card;
}

// Modal and interaction functions
function openModal(species) {
    // Check if enhanced modal is available
    if (typeof openEnhancedModal === 'function') {
        openEnhancedModal(species);
        return;
    }
    
    // Fallback to basic modal
    var modal = document.getElementById('species-modal');
    document.getElementById('modal-title').textContent = species.common_name || species.scientific_name;
    document.getElementById('modal-subtitle').textContent = species.scientific_name && species.common_name ? species.scientific_name : '';
    
    var modalImg = document.getElementById('modal-image');
    if (species.thumbnail_url || species.image_url || species.photo_url) {
        modalImg.src = species.thumbnail_url || species.image_url || species.photo_url;
        modalImg.style.display = 'block';
    } else {
        modalImg.style.display = 'none';
    }

    document.getElementById('modal-detections').textContent = formatNumber(species.count || 0);
    document.getElementById('modal-confidence').textContent = species.avg_confidence ? Math.round(species.avg_confidence * 100) + '%' : 'N/A';
    document.getElementById('modal-first-heard').textContent = species.first_heard ? new Date(species.first_heard).toLocaleDateString() : 'N/A';
    document.getElementById('modal-last-heard').textContent = species.last_heard ? new Date(species.last_heard).toLocaleDateString() : 'N/A';

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('species-modal').style.display = 'none';
}