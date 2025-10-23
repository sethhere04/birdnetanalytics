// Migration Route Mapping
console.log('migration-map.js loading...');

// Global variables for map
var migrationMap = null;
var currentMapLayers = [];

// Migration data for different species
var MIGRATION_ROUTES = {
    hummingbird: {
        name: 'Ruby-throated Hummingbird',
        winterRange: [[15, -100], [15, -80], [25, -80], [25, -100]],
        summerRange: [[35, -95], [35, -65], [50, -65], [50, -95]],
        springRoute: [
            [20, -87],   // Yucatan Peninsula
            [25, -88],   // Gulf Coast
            [30, -90],   // Louisiana
            [35, -87],   // Alabama
            [39.9612, -82.9988], // Columbus, OH (Your station)
            [42, -83],   // Michigan
            [45, -75]    // Ontario
        ],
        springDates: ['Feb 1', 'Mar 1', 'Mar 20', 'Apr 1', 'Apr 15', 'May 1', 'May 15'],
        fallRoute: [
            [45, -75],   // Ontario
            [39.9612, -82.9988], // Columbus, OH
            [35, -87],   // Alabama
            [28, -92],   // Gulf Coast
            [20, -87]    // Yucatan
        ],
        fallDates: ['Aug 15', 'Sep 1', 'Sep 15', 'Oct 1', 'Oct 15'],
        color: '#10b981'
    },
    warbler: {
        name: 'Yellow-rumped Warbler',
        winterRange: [[25, -105], [25, -75], [35, -75], [35, -105]],
        summerRange: [[40, -125], [40, -65], [60, -65], [60, -125]],
        springRoute: [
            [30, -95],   // Texas
            [35, -92],   // Arkansas
            [39.9612, -82.9988], // Columbus, OH
            [44, -80],   // Ontario
            [50, -90]    // Manitoba
        ],
        springDates: ['Mar 1', 'Mar 20', 'Apr 1', 'Apr 20', 'May 10'],
        fallRoute: [
            [50, -90],   // Manitoba
            [39.9612, -82.9988], // Columbus, OH
            [35, -92],   // Arkansas
            [30, -95]    // Texas
        ],
        fallDates: ['Sep 1', 'Oct 1', 'Oct 20', 'Nov 1'],
        color: '#3b82f6'
    },
    oriole: {
        name: 'Baltimore Oriole',
        winterRange: [[5, -90], [5, -70], [20, -70], [20, -90]],
        summerRange: [[35, -100], [35, -70], [50, -70], [50, -100]],
        springRoute: [
            [15, -85],   // Central America
            [22, -97],   // Mexico
            [28, -97],   // South Texas
            [33, -95],   // Dallas area
            [39.9612, -82.9988], // Columbus, OH
            [43, -79],   // Toronto
            [47, -85]    // Northern Ontario
        ],
        springDates: ['Mar 1', 'Mar 20', 'Apr 1', 'Apr 5', 'Apr 10', 'Apr 25', 'May 10'],
        fallRoute: [
            [47, -85],   // Northern Ontario
            [39.9612, -82.9988], // Columbus, OH
            [33, -95],   // Dallas
            [28, -97],   // South Texas
            [15, -85]    // Central America
        ],
        fallDates: ['Aug 20', 'Sep 1', 'Sep 10', 'Sep 20', 'Oct 1'],
        color: '#f59e0b'
    },
    sparrow: {
        name: 'White-throated Sparrow',
        winterRange: [[25, -105], [25, -75], [40, -75], [40, -105]],
        summerRange: [[45, -100], [45, -60], [60, -60], [60, -100]],
        springRoute: [
            [32, -85],   // Georgia
            [36, -84],   // Tennessee
            [39.9612, -82.9988], // Columbus, OH
            [44, -79],   // Ontario
            [50, -82]    // Northern Ontario
        ],
        springDates: ['Feb 20', 'Mar 5', 'Mar 20', 'Apr 10', 'Apr 30'],
        fallRoute: [
            [50, -82],   // Northern Ontario
            [39.9612, -82.9988], // Columbus, OH
            [36, -84],   // Tennessee
            [32, -85]    // Georgia
        ],
        fallDates: ['Sep 20', 'Oct 15', 'Nov 1', 'Nov 15'],
        color: '#8b5cf6'
    },
    yellowthroat: {
        name: 'Common Yellowthroat',
        winterRange: [[10, -105], [10, -80], [30, -80], [30, -105]],
        summerRange: [[30, -125], [30, -65], [60, -65], [60, -125]],
        springRoute: [
            [25, -97],   // Mexico
            [30, -93],   // Gulf Coast
            [35, -88],   // Mississippi
            [39.9612, -82.9988], // Columbus, OH
            [44, -80],   // Ontario
            [48, -85]    // Northern Ontario
        ],
        springDates: ['Mar 15', 'Apr 5', 'Apr 20', 'May 1', 'May 15', 'May 25'],
        fallRoute: [
            [48, -85],
            [39.9612, -82.9988],
            [35, -88],
            [30, -93],
            [25, -97]
        ],
        fallDates: ['Aug 25', 'Sep 15', 'Oct 1', 'Oct 15', 'Oct 30'],
        color: '#eab308'
    },
    ovenbird: {
        name: 'Ovenbird',
        winterRange: [[8, -92], [8, -70], [23, -70], [23, -92]],
        summerRange: [[35, -100], [35, -65], [55, -65], [55, -100]],
        springRoute: [
            [18, -88],   // Central America
            [26, -90],   // Gulf Coast
            [32, -88],   // Alabama
            [36, -85],   // Kentucky
            [39.9612, -82.9988], // Columbus, OH
            [43, -79],   // Toronto
            [48, -82]    // Northern Ontario
        ],
        springDates: ['Mar 20', 'Apr 10', 'Apr 25', 'May 5', 'May 10', 'May 20', 'May 30'],
        fallRoute: [
            [48, -82],
            [39.9612, -82.9988],
            [36, -85],
            [32, -88],
            [26, -90],
            [18, -88]
        ],
        fallDates: ['Aug 15', 'Sep 5', 'Sep 20', 'Oct 5', 'Oct 15', 'Oct 30'],
        color: '#06b6d4'
    },
    blackandwhite: {
        name: 'Black-and-white Warbler',
        winterRange: [[10, -95], [10, -75], [25, -75], [25, -95]],
        summerRange: [[35, -100], [35, -70], [55, -70], [55, -100]],
        springRoute: [
            [20, -90],   // Mexico/Central America
            [28, -92],   // Gulf Coast
            [33, -88],   // Alabama
            [37, -85],   // Kentucky
            [39.9612, -82.9988], // Columbus, OH
            [43, -78],   // Ontario
            [47, -80]    // Northern Ontario
        ],
        springDates: ['Mar 25', 'Apr 15', 'Apr 28', 'May 5', 'May 10', 'May 20', 'May 30'],
        fallRoute: [
            [47, -80],
            [39.9612, -82.9988],
            [37, -85],
            [33, -88],
            [28, -92],
            [20, -90]
        ],
        fallDates: ['Aug 10', 'Sep 1', 'Sep 15', 'Oct 1', 'Oct 15', 'Oct 30'],
        color: '#334155'
    },
    woodthrush: {
        name: 'Wood Thrush',
        winterRange: [[8, -92], [8, -75], [22, -75], [22, -92]],
        summerRange: [[32, -100], [32, -70], [48, -70], [48, -100]],
        springRoute: [
            [18, -87],   // Central America
            [26, -90],   // Gulf Coast
            [32, -87],   // Alabama
            [36, -84],   // Tennessee
            [39.9612, -82.9988], // Columbus, OH
            [43, -79],   // Ontario
            [46, -80]    // Southern Ontario
        ],
        springDates: ['Apr 1', 'Apr 20', 'May 1', 'May 10', 'May 15', 'May 25', 'Jun 1'],
        fallRoute: [
            [46, -80],
            [39.9612, -82.9988],
            [36, -84],
            [32, -87],
            [26, -90],
            [18, -87]
        ],
        fallDates: ['Aug 20', 'Sep 10', 'Sep 25', 'Oct 5', 'Oct 15', 'Oct 30'],
        color: '#92400e'
    },
    robin: {
        name: 'American Robin',
        winterRange: [[25, -120], [25, -75], [42, -75], [42, -120]],
        summerRange: [[35, -130], [35, -65], [68, -65], [68, -130]],
        springRoute: [
            [33, -97],   // Texas
            [36, -88],   // Tennessee
            [39.9612, -82.9988], // Columbus, OH
            [44, -79],   // Ontario
            [50, -85],   // Northern Ontario
            [58, -95]    // Manitoba/Saskatchewan
        ],
        springDates: ['Feb 15', 'Mar 5', 'Mar 15', 'Apr 1', 'Apr 20', 'May 10'],
        fallRoute: [
            [58, -95],
            [50, -85],
            [39.9612, -82.9988],
            [36, -88],
            [33, -97]
        ],
        fallDates: ['Sep 15', 'Oct 5', 'Oct 25', 'Nov 10', 'Nov 20'],
        color: '#dc2626'
    },
    cedarwaxwing: {
        name: 'Cedar Waxwing',
        winterRange: [[25, -120], [25, -75], [45, -75], [45, -120]],
        summerRange: [[40, -125], [40, -65], [65, -65], [65, -125]],
        springRoute: [
            [35, -95],   // Southern US
            [38, -88],   // Missouri/Illinois
            [39.9612, -82.9988], // Columbus, OH
            [44, -80],   // Ontario
            [50, -90],   // Manitoba
            [55, -100]   // Saskatchewan
        ],
        springDates: ['Mar 1', 'Mar 25', 'Apr 10', 'May 1', 'May 20', 'Jun 1'],
        fallRoute: [
            [55, -100],
            [50, -90],
            [39.9612, -82.9988],
            [38, -88],
            [35, -95]
        ],
        fallDates: ['Sep 1', 'Oct 1', 'Oct 20', 'Nov 5', 'Nov 20'],
        color: '#fbbf24'
    },
    screechowl: {
        name: 'Eastern Screech-Owl',
        winterRange: [[28, -100], [28, -75], [48, -75], [48, -100]],
        summerRange: [[28, -100], [28, -75], [48, -75], [48, -100]],
        springRoute: [
            [39.9612, -82.9988]  // Year-round resident - minimal migration
        ],
        springDates: ['Year-round'],
        fallRoute: [
            [39.9612, -82.9988]
        ],
        fallDates: ['Year-round'],
        color: '#78716c',
        note: 'Partial migrant - most populations are year-round residents'
    },
    junco: {
        name: 'Dark-eyed Junco',
        winterRange: [[25, -125], [25, -70], [45, -70], [45, -125]],
        summerRange: [[45, -130], [45, -65], [70, -65], [70, -130]],
        springRoute: [
            [35, -95],   // Oklahoma/Kansas
            [39.9612, -82.9988], // Columbus, OH (winter visitor)
            [44, -80],   // Ontario
            [50, -85],   // Northern Ontario
            [58, -95]    // Northern Canada
        ],
        springDates: ['Feb 15', 'Mar 20', 'Apr 10', 'Apr 30', 'May 20'],
        fallRoute: [
            [58, -95],   // Northern Canada
            [50, -85],   // Northern Ontario
            [44, -80],   // Ontario
            [39.9612, -82.9988], // Columbus, OH (arrives in fall)
            [35, -95]    // Southern wintering grounds
        ],
        fallDates: ['Sep 15', 'Oct 1', 'Oct 15', 'Oct 25', 'Nov 10'],
        color: '#6b7280'
    },
    goldfinch: {
        name: 'American Goldfinch',
        winterRange: [[30, -125], [30, -75], [45, -75], [45, -125]],
        summerRange: [[35, -125], [35, -70], [58, -70], [58, -125]],
        springRoute: [
            [35, -97],   // Texas/Oklahoma
            [38, -90],   // Missouri
            [39.9612, -82.9988], // Columbus, OH
            [43, -79],   // Ontario
            [48, -85]    // Northern Ontario
        ],
        springDates: ['Mar 1', 'Mar 25', 'Apr 15', 'May 5', 'May 25'],
        fallRoute: [
            [48, -85],
            [43, -79],
            [39.9612, -82.9988],
            [38, -90],
            [35, -97]
        ],
        fallDates: ['Sep 1', 'Sep 25', 'Oct 15', 'Nov 1', 'Nov 20'],
        color: '#facc15'
    }
};

// Initialize migration map
function initializeMigrationMap() {
    console.log('Initializing migration map...');
    
    // Check if map is already initialized
    if (migrationMap) {
        console.log('Migration map already initialized');
        return;
    }
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded! Make sure leaflet.js is included.');
        document.getElementById('migration-map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f3f4f6; color: #6b7280;">Map library failed to load</div>';
        return;
    }
    
    // Check if container exists
    var mapContainer = document.getElementById('migration-map');
    if (!mapContainer) {
        console.error('Migration map container not found');
        return;
    }
    
    // Initialize the map centered on Columbus, OH
    try {
        migrationMap = L.map('migration-map').setView([39.9612, -82.9988], 5);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(migrationMap);
        
        // Add your BirdNET station marker
        var homeIcon = L.divIcon({
            className: 'home-station-marker',
            html: '<div style="background: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        var homeMarker = L.marker([39.9612, -82.9988], { icon: homeIcon }).addTo(migrationMap);
        homeMarker.bindPopup('<div style="font-weight: 600; margin-bottom: 4px;">Your BirdNET Station</div><div style="font-size: 0.875rem;">Columbus, OH</div><div style="font-size: 0.75rem; color: #6b7280;">Lat: 39.9612, Lon: -82.9988</div>');
        
        console.log('Migration map initialized successfully');
        
        // Show example route after a short delay
        setTimeout(function() {
            showMigrationRoute('hummingbird');
        }, 100);
        
    } catch (error) {
        console.error('Error initializing map:', error);
        
        // If error is "already initialized", try to use existing map
        if (error.message && error.message.includes('already initialized')) {
            console.log('Map container was already initialized, skipping...');
            return;
        }
        
        document.getElementById('migration-map').innerHTML = 
            '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f3f4f6; color: #ef4444;">Error initializing map</div>';
    }
}

// Clear all map layers except base map and home station
function clearMigrationMap() {
    if (!migrationMap) return;
    
    currentMapLayers.forEach(function(layer) {
        migrationMap.removeLayer(layer);
    });
    currentMapLayers = [];
    
    // Reset view to default
    migrationMap.setView([39.9612, -82.9988], 5);
    
    console.log('Migration map cleared');
}

// Show migration route for a specific species
function showMigrationRoute(speciesKey) {
    if (!migrationMap) {
        console.error('Migration map not initialized');
        return;
    }
    
    clearMigrationMap();
    
    var data = MIGRATION_ROUTES[speciesKey];
    if (!data) {
        console.error('Species data not found:', speciesKey);
        return;
    }
    
    console.log('Showing migration route for:', data.name);
    
    // Draw winter range
    var winterPoly = L.polygon(data.winterRange, {
        color: '#e67e22',
        fillColor: '#e67e22',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
    }).addTo(migrationMap);
    winterPoly.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Winter Range</div>');
    currentMapLayers.push(winterPoly);
    
    // Draw summer range
    var summerPoly = L.polygon(data.summerRange, {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
    }).addTo(migrationMap);
    summerPoly.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Summer Breeding Range</div>');
    currentMapLayers.push(summerPoly);
    
    // Draw spring migration route
    var springLine = L.polyline(data.springRoute, {
        color: '#27ae60',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(migrationMap);
    springLine.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Spring Migration Route (Northbound) ⬆</div>');
    currentMapLayers.push(springLine);
    
    // Draw fall migration route
    var fallLine = L.polyline(data.fallRoute, {
        color: '#f39c12',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(migrationMap);
    fallLine.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Fall Migration Route (Southbound) ⬇</div>');
    currentMapLayers.push(fallLine);
    
    // Add waypoint markers for spring route
    data.springRoute.forEach(function(point, idx) {
        // Skip endpoints and your station (already marked)
        if (idx === 0 || idx === data.springRoute.length - 1 || 
            (Math.abs(point[0] - 39.9612) < 0.01 && Math.abs(point[1] + 82.9988) < 0.01)) {
            return;
        }
        
        var marker = L.circleMarker(point, {
            radius: 6,
            fillColor: '#27ae60',
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(migrationMap);
        
        var date = data.springDates[idx] || 'N/A';
        marker.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem;">Spring arrival: ' + date + '</div>');
        currentMapLayers.push(marker);
    });
    
    // Fit map bounds to show the entire migration route
    var allPoints = data.springRoute.concat(data.winterRange).concat(data.summerRange);
    var bounds = L.latLngBounds(allPoints);
    migrationMap.fitBounds(bounds, { padding: [50, 50] });
    
    console.log('Migration route displayed for:', data.name);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Don't auto-initialize - let tab switching handle it
        console.log('DOM loaded - waiting for Migration tab to be opened');
    });
} else {
    // Don't auto-initialize - let tab switching handle it
    console.log('DOM already loaded - waiting for Migration tab to be opened');
}

console.log('migration-map.js loaded successfully');