// Species Information API Integration
console.log('species-info-api.js loading...');

// Cache to avoid redundant API calls
const speciesInfoCache = {};

// Fetch species information from Wikipedia
async function fetchWikipediaInfo(speciesName) {
    try {
        // Search for the species page
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(speciesName)}`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Wikipedia data not found');
        }
        
        const data = await response.json();
        
        return {
            description: data.extract || 'No description available',
            thumbnail: data.thumbnail ? data.thumbnail.source : null,
            image: data.originalimage ? data.originalimage.source : null,
            url: data.content_urls ? data.content_urls.desktop.page : null
        };
    } catch (error) {
        console.warn('Wikipedia fetch failed for ' + speciesName + ':', error);
        return null;
    }
}

// Fetch species photos from iNaturalist
async function fetchiNaturalistPhotos(speciesName) {
    try {
        const searchUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(speciesName)}&rank=species&per_page=1`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('iNaturalist data not found');
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const taxon = data.results[0];
            return {
                photos: taxon.taxon_photos ? taxon.taxon_photos.map(p => p.photo.medium_url).slice(0, 5) : [],
                conservationStatus: taxon.conservation_status ? taxon.conservation_status.status : null,
                wikipediaUrl: taxon.wikipedia_url || null
            };
        }
        
        return null;
    } catch (error) {
        console.warn('iNaturalist fetch failed for ' + speciesName + ':', error);
        return null;
    }
}

// Fetch eBird regional info (requires API key)
async function fetcheBirdInfo(speciesName, speciesCode) {
    // eBird API key would go here - users need to get their own
    const EBIRD_API_KEY = 'c4iai7mt6vj4'; // User needs to add this
    
    if (EBIRD_API_KEY === 'c4iai7mt6vj4') {
        console.log('eBird API key not configured - skipping eBird data');
        return null;
    }
    
    try {
        // Get species code if not provided
        if (!speciesCode) {
            // You'd need to map common names to eBird species codes
            // For now, we'll skip if no code provided
            return null;
        }
        
        const headers = {
            'X-eBirdApiToken': EBIRD_API_KEY
        };
        
        // Fetch recent observations in region
        const regionCode = 'US-OH'; // Ohio - customize based on your location
        const url = `https://api.ebird.org/v2/data/obs/${regionCode}/recent/${speciesCode}`;
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            throw new Error('eBird data not found');
        }
        
        const data = await response.json();
        
        return {
            recentObservations: data.length,
            localAbundance: data.length > 10 ? 'Common' : data.length > 3 ? 'Uncommon' : 'Rare'
        };
    } catch (error) {
        console.warn('eBird fetch failed:', error);
        return null;
    }
}

// Get comprehensive species information
async function getSpeciesInfo(speciesName, scientificName) {
    // Check cache first
    const cacheKey = speciesName.toLowerCase();
    if (speciesInfoCache[cacheKey]) {
        return speciesInfoCache[cacheKey];
    }
    
    console.log('Fetching species info for:', speciesName);
    
    // Fetch from multiple sources in parallel
    const [wikiInfo, iNatPhotos] = await Promise.all([
        fetchWikipediaInfo(speciesName),
        fetchiNaturalistPhotos(speciesName)
    ]);
    
    // Combine all information
    const speciesInfo = {
        commonName: speciesName,
        scientificName: scientificName || 'Unknown',
        description: null,
        photos: [],
        conservationStatus: null,
        wikipediaUrl: null,
        localAbundance: null
    };
    
    // Add Wikipedia data
    if (wikiInfo) {
        speciesInfo.description = wikiInfo.description;
        speciesInfo.wikipediaUrl = wikiInfo.url;
        if (wikiInfo.image) {
            speciesInfo.photos.push(wikiInfo.image);
        }
    }
    
    // Add iNaturalist data
    if (iNatPhotos) {
        if (iNatPhotos.photos && iNatPhotos.photos.length > 0) {
            speciesInfo.photos = speciesInfo.photos.concat(iNatPhotos.photos);
        }
        speciesInfo.conservationStatus = iNatPhotos.conservationStatus;
        if (iNatPhotos.wikipediaUrl && !speciesInfo.wikipediaUrl) {
            speciesInfo.wikipediaUrl = iNatPhotos.wikipediaUrl;
        }
    }
    
    // Remove duplicate photos
    speciesInfo.photos = [...new Set(speciesInfo.photos)];
    
    // Cache the result
    speciesInfoCache[cacheKey] = speciesInfo;
    
    return speciesInfo;
}

// Enhanced species modal with rich information
async function openEnhancedModal(species) {
    const modal = document.getElementById('species-modal');
    
    // Show loading state
    document.getElementById('modal-title').textContent = species.common_name || species.scientific_name;
    document.getElementById('modal-subtitle').textContent = species.scientific_name || '';
    
    // Set basic stats
    document.getElementById('modal-detections').textContent = formatNumber(species.count || 0);
    document.getElementById('modal-confidence').textContent = species.avg_confidence ? Math.round(species.avg_confidence * 100) + '%' : 'N/A';
    document.getElementById('modal-first-heard').textContent = species.first_heard ? new Date(species.first_heard).toLocaleDateString() : 'N/A';
    document.getElementById('modal-last-heard').textContent = species.last_heard ? new Date(species.last_heard).toLocaleDateString() : 'N/A';
    
    // Show modal immediately with loading indicator
    modal.style.display = 'block';
    
    // Add loading indicator to additional info section
    let additionalInfo = document.getElementById('modal-additional-info');
    if (!additionalInfo) {
        additionalInfo = document.createElement('div');
        additionalInfo.id = 'modal-additional-info';
        document.querySelector('.modal-content').appendChild(additionalInfo);
    }
    
    additionalInfo.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner"></div><p>Loading species information...</p></div>';
    
    // Fetch enhanced species info
    try {
        const speciesInfo = await getSpeciesInfo(
            species.common_name || species.scientific_name,
            species.scientific_name
        );
        
        // Build enhanced info HTML
        let infoHTML = '';
        
        // Photo Gallery
        if (speciesInfo.photos.length > 0) {
            infoHTML += '<div style="margin-top: 1.5rem;">';
            infoHTML += '<h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #2d3748;">📸 Photo Gallery</h3>';
            infoHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">';
            
            speciesInfo.photos.slice(0, 6).forEach(function(photoUrl, index) {
                infoHTML += '<img src="' + photoUrl + '" alt="' + speciesInfo.commonName + '" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer; transition: transform 0.2s;" onclick="window.open(\'' + photoUrl + '\', \'_blank\')" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">';
            });
            
            infoHTML += '</div></div>';
        }
        
        // Description
        if (speciesInfo.description) {
            infoHTML += '<div style="margin-top: 1.5rem;">';
            infoHTML += '<h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #2d3748;">📖 About This Species</h3>';
            infoHTML += '<p style="line-height: 1.6; color: #4a5568;">' + speciesInfo.description + '</p>';
            infoHTML += '</div>';
        }
        
        // Additional Info Cards
        infoHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">';
        
        // Conservation Status
        if (speciesInfo.conservationStatus) {
            const statusColors = {
                'LC': '#10b981', // Least Concern - Green
                'NT': '#f59e0b', // Near Threatened - Orange
                'VU': '#f97316', // Vulnerable - Dark Orange
                'EN': '#ef4444', // Endangered - Red
                'CR': '#dc2626'  // Critically Endangered - Dark Red
            };
            const statusColor = statusColors[speciesInfo.conservationStatus] || '#6b7280';
            
            infoHTML += '<div style="background: #f7fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid ' + statusColor + ';">';
            infoHTML += '<div style="font-weight: 600; color: #2d3748; margin-bottom: 0.25rem;">Conservation Status</div>';
            infoHTML += '<div style="color: ' + statusColor + '; font-weight: 600;">' + speciesInfo.conservationStatus + '</div>';
            infoHTML += '</div>';
        }
        
        // Your Detection Summary
        infoHTML += '<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6;">';
        infoHTML += '<div style="font-weight: 600; color: #1e40af; margin-bottom: 0.25rem;">Your Detections</div>';
        infoHTML += '<div style="color: #1e40af;">' + (species.count || 0) + ' total detections</div>';
        if (species.first_heard) {
            const daysSince = Math.floor((new Date() - new Date(species.first_heard)) / (1000 * 60 * 60 * 24));
            infoHTML += '<div style="font-size: 0.875rem; color: #1e40af; margin-top: 0.25rem;">First detected ' + daysSince + ' days ago</div>';
        }
        infoHTML += '</div>';
        
        // Migration Status (if available from your config)
        if (CONFIG.MIGRATORY_SPECIES.includes(species.common_name)) {
            infoHTML += '<div style="background: #dcfce7; padding: 1rem; border-radius: 8px; border-left: 4px solid #10b981;">';
            infoHTML += '<div style="font-weight: 600; color: #166534; margin-bottom: 0.25rem;">Migration</div>';
            infoHTML += '<div style="color: #166534;">Migratory Species</div>';
            infoHTML += '</div>';
        }
        
        // Rarity Score (if available from your config)
        const rarityScore = CONFIG.RARITY_SCORES[species.common_name];
        if (rarityScore) {
            const rarityColor = rarityScore > 40 ? '#ef4444' : rarityScore > 25 ? '#f59e0b' : '#10b981';
            const rarityLabel = rarityScore > 40 ? 'Rare' : rarityScore > 25 ? 'Uncommon' : 'Common';
            
            infoHTML += '<div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid ' + rarityColor + ';">';
            infoHTML += '<div style="font-weight: 600; color: #92400e; margin-bottom: 0.25rem;">Local Rarity</div>';
            infoHTML += '<div style="color: #92400e;">' + rarityLabel + ' (' + rarityScore + '/100)</div>';
            infoHTML += '</div>';
        }
        
        infoHTML += '</div>';
        
        // Links
        if (speciesInfo.wikipediaUrl) {
            infoHTML += '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">';
            infoHTML += '<a href="' + speciesInfo.wikipediaUrl + '" target="_blank" style="display: inline-block; background: #667eea; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background=\'#5568d3\'" onmouseout="this.style.background=\'#667eea\'">📚 Read More on Wikipedia</a>';
            infoHTML += '</div>';
        }
        
        additionalInfo.innerHTML = infoHTML;
        
    } catch (error) {
        console.error('Error loading species info:', error);
        additionalInfo.innerHTML = '<div style="padding: 1rem; background: #fef3c7; border-radius: 8px; color: #92400e;"><strong>⚠️ Could not load additional species information</strong><br>Showing basic detection data only.</div>';
    }
}

console.log('species-info-api.js loaded successfully');