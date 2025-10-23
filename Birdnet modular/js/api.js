// API Module - Simplified for existing backend compatibility
console.log('Loading BirdNET.api module...');

(function() {
    'use strict';
    
    const api = BirdNET.api;
    const config = BirdNET.config;
    const cache = BirdNET.cache;
    
    // Main fetch function - compatible with existing backend
    api.fetchData = async function() {
        try {
            console.log('Fetching species summary from:', config.API_BASE + '/analytics/species/summary');
            const response = await fetch(config.API_BASE + '/analytics/species/summary');
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            
            let data = await response.json();
            
            // Normalize data structure
            if (!Array.isArray(data)) {
                console.warn('Unexpected data format, wrapping in array');
                data = [data];
            }
            
            // Store in namespace
            BirdNET.data.originalSpecies = data;
            BirdNET.data.species = data.slice();
            
            console.log('✅ Fetched ' + data.length + ' species');
            return data;
            
        } catch (error) {
            console.error('Failed to fetch species data:', error);
            throw error;
        }
    };
    
    // Fetch all detections
    api.fetchDetections = async function(limit = 100) {
        try {
            // Try multiple possible endpoints for v2 API
            const possibleEndpoints = [
                config.API_BASE + '/detections?limit=' + limit,
                config.API_BASE + '/notes?limit=' + limit + '&offset=0',
                config.API_BASE.replace('/v2', '') + '/notes?limit=' + limit + '&offset=0'
            ];
            
            let data = null;
            let lastError = null;
            
            for (const endpoint of possibleEndpoints) {
                try {
                    console.log('Trying detections endpoint:', endpoint);
                    const response = await fetch(endpoint);
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log('✅ Found working endpoint:', endpoint);
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }
            
            if (!data) {
                console.warn('⚠️ No detections endpoint available. Continuing without detection data.');
                BirdNET.data.detections = [];
                return [];
            }
            
            // Normalize array structure
            const detections = Array.isArray(data) ? data : (data.data || data.detections || []);
            
            BirdNET.data.detections = detections;
            
            console.log('✅ Fetched ' + detections.length + ' detections');
            return detections;
            
        } catch (error) {
            console.error('Failed to fetch detections:', error);
            BirdNET.data.detections = [];
            return [];
        }
    };
    
    // Fetch daily detection counts
    api.fetchDailyDetectionCounts = async function() {
        try {
            console.log('Fetching daily counts...');
            const response = await fetch(config.API_BASE + '/analytics/detections/daily');
            
            if (!response.ok) {
                throw new Error('Failed to fetch daily counts');
            }
            
            const data = await response.json();
            BirdNET.data.dailyCounts = data;
            
            console.log('✅ Fetched daily counts');
            return data;
            
        } catch (error) {
            console.error('Failed to fetch daily counts:', error);
            return {};
        }
    };
    
    // Get audio clip URL
    api.getAudioClipUrl = function(noteId) {
        return config.API_BASE + '/audio/' + noteId;
    };
    
    // Fetch species information from Wikipedia
    api.fetchWikipediaInfo = async function(speciesName) {
        const cacheKey = 'wiki_' + speciesName.toLowerCase();
        
        if (cache.speciesInfo[cacheKey]) {
            return cache.speciesInfo[cacheKey];
        }
        
        try {
            const searchUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + 
                            encodeURIComponent(speciesName);
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error('Wikipedia fetch failed');
            }
            
            const data = await response.json();
            
            const info = {
                description: data.extract || 'No description available',
                thumbnail: data.thumbnail ? data.thumbnail.source : null,
                image: data.originalimage ? data.originalimage.source : null,
                url: data.content_urls ? data.content_urls.desktop.page : null
            };
            
            cache.speciesInfo[cacheKey] = info;
            return info;
            
        } catch (error) {
            console.warn('Wikipedia fetch failed for ' + speciesName);
            return null;
        }
    };
    
    // Fetch photos from iNaturalist
    api.fetchiNaturalistPhotos = async function(speciesName) {
        try {
            const searchUrl = 'https://api.inaturalist.org/v1/taxa?q=' + 
                            encodeURIComponent(speciesName) + 
                            '&rank=species&per_page=1';
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error('iNaturalist fetch failed');
            }
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const taxon = data.results[0];
                return {
                    photos: taxon.taxon_photos ? 
                           taxon.taxon_photos.map(p => p.photo.medium_url).slice(0, 5) : 
                           [],
                    conservationStatus: taxon.conservation_status ? 
                                      taxon.conservation_status.status : 
                                      null,
                    wikipediaUrl: taxon.wikipedia_url || null
                };
            }
            
            return null;
            
        } catch (error) {
            console.warn('iNaturalist fetch failed for ' + speciesName);
            return null;
        }
    };
    
    // Get comprehensive species information
    api.getSpeciesInfo = async function(speciesName, scientificName) {
        const cacheKey = speciesName.toLowerCase();
        
        if (cache.speciesInfo[cacheKey]) {
            return cache.speciesInfo[cacheKey];
        }
        
        console.log('Fetching comprehensive info for:', speciesName);
        
        const [wikiInfo, iNatPhotos] = await Promise.all([
            api.fetchWikipediaInfo(speciesName),
            api.fetchiNaturalistPhotos(speciesName)
        ]);
        
        const speciesInfo = {
            commonName: speciesName,
            scientificName: scientificName || 'Unknown',
            description: null,
            photos: [],
            conservationStatus: null,
            wikipediaUrl: null
        };
        
        if (wikiInfo) {
            speciesInfo.description = wikiInfo.description;
            speciesInfo.wikipediaUrl = wikiInfo.url;
            if (wikiInfo.image) {
                speciesInfo.photos.push(wikiInfo.image);
            }
        }
        
        if (iNatPhotos) {
            if (iNatPhotos.photos && iNatPhotos.photos.length > 0) {
                speciesInfo.photos = speciesInfo.photos.concat(iNatPhotos.photos);
            }
            speciesInfo.conservationStatus = iNatPhotos.conservationStatus;
            if (iNatPhotos.wikipediaUrl && !speciesInfo.wikipediaUrl) {
                speciesInfo.wikipediaUrl = iNatPhotos.wikipediaUrl;
            }
        }
        
        // Remove duplicates
        speciesInfo.photos = [...new Set(speciesInfo.photos)];
        
        cache.speciesInfo[cacheKey] = speciesInfo;
        return speciesInfo;
    };
    
    console.log('✅ BirdNET.api module loaded');
    
})();
