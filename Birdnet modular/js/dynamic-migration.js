// Dynamic Migration Route Generation
console.log('dynamic-migration.js loading...');

// eBird API configuration
var EBIRD_CONFIG = {
    API_KEY: 'c4iai7mt6vj4', // Get free key at https://ebird.org/api/keygen
    BASE_URL: 'https://api.ebird.org/v2',
    USE_DEMO_MODE: true // Set to false when you have an API key
};

// Migration pattern database with seasonal timing and typical routes
var SPECIES_MIGRATION_DATABASE = {
    // Format: 'Common Name': { type, timing, flyway }
    'Ruby-throated Hummingbird': { 
        type: 'neotropical', 
        springArrival: 105, 
        fallDeparture: 245,
        flyway: 'atlantic',
        winterLat: 18,
        summerLat: 45
    },
    'Baltimore Oriole': { 
        type: 'neotropical', 
        springArrival: 100, 
        fallDeparture: 250,
        flyway: 'mississippi',
        winterLat: 12,
        summerLat: 46
    },
    'Yellow-rumped Warbler': { 
        type: 'temperate', 
        springArrival: 91, 
        fallDeparture: 305,
        flyway: 'mississippi',
        winterLat: 30,
        summerLat: 52
    },
    'White-throated Sparrow': { 
        type: 'temperate', 
        springArrival: 79, 
        fallDeparture: 320,
        flyway: 'atlantic',
        winterLat: 32,
        summerLat: 52
    },
    'Common Yellowthroat': { 
        type: 'neotropical', 
        springArrival: 115, 
        fallDeparture: 260,
        flyway: 'mississippi',
        winterLat: 20,
        summerLat: 50
    },
    'Ovenbird': { 
        type: 'neotropical', 
        springArrival: 120, 
        fallDeparture: 255,
        flyway: 'atlantic',
        winterLat: 15,
        summerLat: 48
    },
    'Black-and-white Warbler': { 
        type: 'neotropical', 
        springArrival: 110, 
        fallDeparture: 250,
        flyway: 'atlantic',
        winterLat: 18,
        summerLat: 47
    },
    'Wood Thrush': { 
        type: 'neotropical', 
        springArrival: 125, 
        fallDeparture: 260,
        flyway: 'mississippi',
        winterLat: 15,
        summerLat: 44
    },
    'American Robin': { 
        type: 'partial', 
        springArrival: 70, 
        fallDeparture: 300,
        flyway: 'continental',
        winterLat: 35,
        summerLat: 58
    },
    'Cedar Waxwing': { 
        type: 'nomadic', 
        springArrival: 85, 
        fallDeparture: 290,
        flyway: 'continental',
        winterLat: 38,
        summerLat: 55
    },
    'Eastern Screech-Owl': { 
        type: 'resident', 
        springArrival: null, 
        fallDeparture: null,
        flyway: null,
        winterLat: 39.96,
        summerLat: 39.96
    },
    'Dark-eyed Junco': { 
        type: 'reverse', 
        springArrival: 90, 
        fallDeparture: 288,
        flyway: 'continental',
        winterLat: 35,
        summerLat: 58
    },
    'American Goldfinch': { 
        type: 'partial', 
        springArrival: 80, 
        fallDeparture: 290,
        flyway: 'continental',
        winterLat: 35,
        summerLat: 50
    },
    'Indigo Bunting': {
        type: 'neotropical',
        springArrival: 125,
        fallDeparture: 265,
        flyway: 'mississippi',
        winterLat: 18,
        summerLat: 44
    },
    'Rose-breasted Grosbeak': {
        type: 'neotropical',
        springArrival: 115,
        fallDeparture: 260,
        flyway: 'mississippi',
        winterLat: 16,
        summerLat: 46
    },
    'Gray Catbird': {
        type: 'neotropical',
        springArrival: 120,
        fallDeparture: 275,
        flyway: 'atlantic',
        winterLat: 22,
        summerLat: 46
    },
    'Eastern Kingbird': {
        type: 'neotropical',
        springArrival: 130,
        fallDeparture: 255,
        flyway: 'mississippi',
        winterLat: 5,
        summerLat: 48
    },
    'Eastern Phoebe': {
        type: 'temperate',
        springArrival: 95,
        fallDeparture: 300,
        flyway: 'mississippi',
        winterLat: 30,
        summerLat: 48
    },
    'Eastern Wood-Pewee': {
        type: 'neotropical',
        springArrival: 135,
        fallDeparture: 260,
        flyway: 'atlantic',
        winterLat: 8,
        summerLat: 46
    },
    'Great Crested Flycatcher': {
        type: 'neotropical',
        springArrival: 125,
        fallDeparture: 260,
        flyway: 'mississippi',
        winterLat: 12,
        summerLat: 45
    },
    'Chimney Swift': {
        type: 'neotropical',
        springArrival: 118,
        fallDeparture: 275,
        flyway: 'mississippi',
        winterLat: 5,
        summerLat: 48
    },
    'Barn Swallow': {
        type: 'neotropical',
        springArrival: 115,
        fallDeparture: 270,
        flyway: 'continental',
        winterLat: 10,
        summerLat: 52
    },
    'Tree Swallow': {
        type: 'neotropical',
        springArrival: 100,
        fallDeparture: 280,
        flyway: 'continental',
        winterLat: 25,
        summerLat: 55
    },
    'Northern Rough-winged Swallow': {
        type: 'neotropical',
        springArrival: 110,
        fallDeparture: 270,
        flyway: 'mississippi',
        winterLat: 15,
        summerLat: 50
    },
    'Purple Martin': {
        type: 'neotropical',
        springArrival: 105,
        fallDeparture: 255,
        flyway: 'mississippi',
        winterLat: 5,
        summerLat: 48
    },
    'Yellow-billed Cuckoo': {
        type: 'neotropical',
        springArrival: 125,
        fallDeparture: 270,
        flyway: 'mississippi',
        winterLat: 8,
        summerLat: 45
    },
    'Black-billed Cuckoo': {
        type: 'neotropical',
        springArrival: 130,
        fallDeparture: 265,
        flyway: 'atlantic',
        winterLat: 10,
        summerLat: 48
    },
    'Common Nighthawk': {
        type: 'neotropical',
        springArrival: 135,
        fallDeparture: 260,
        flyway: 'continental',
        winterLat: 5,
        summerLat: 52
    },
    'Killdeer': {
        type: 'partial',
        springArrival: 85,
        fallDeparture: 305,
        flyway: 'continental',
        winterLat: 32,
        summerLat: 52
    },
    'Spotted Sandpiper': {
        type: 'neotropical',
        springArrival: 120,
        fallDeparture: 270,
        flyway: 'continental',
        winterLat: 20,
        summerLat: 55
    },
    'Bay-breasted Warbler': {
        type: 'neotropical',
        springArrival: 135,
        fallDeparture: 260,
        flyway: 'atlantic',
        winterLat: 10,
        summerLat: 50
    },
    'Worm-eating Warbler': {
        type: 'neotropical',
        springArrival: 125,
        fallDeparture: 265,
        flyway: 'atlantic',
        winterLat: 15,
        summerLat: 42
    },
    'Louisiana Waterthrush': {
        type: 'neotropical',
        springArrival: 100,
        fallDeparture: 245,
        flyway: 'mississippi',
        winterLat: 18,
        summerLat: 42
    },
    'Northern Waterthrush': {
        type: 'neotropical',
        springArrival: 120,
        fallDeparture: 265,
        flyway: 'atlantic',
        winterLat: 15,
        summerLat: 52
    },
    'Yellow-throated Warbler': {
        type: 'neotropical',
        springArrival: 105,
        fallDeparture: 270,
        flyway: 'atlantic',
        winterLat: 25,
        summerLat: 42
    },
    'Cape May Warbler': {
        type: 'neotropical',
        springArrival: 130,
        fallDeparture: 270,
        flyway: 'atlantic',
        winterLat: 20,
        summerLat: 50
    },
    'Yellow-throated Vireo': {
        type: 'neotropical',
        springArrival: 120,
        fallDeparture: 265,
        flyway: 'mississippi',
        winterLat: 15,
        summerLat: 46
    },
    'Eastern Bluebird': {
        type: 'partial',
        springArrival: 80,
        fallDeparture: 310,
        flyway: 'continental',
        winterLat: 32,
        summerLat: 50
    },
    'Gray-cheeked Thrush': {
        type: 'neotropical',
        springArrival: 135,
        fallDeparture: 260,
        flyway: 'atlantic',
        winterLat: 8,
        summerLat: 58
    },
    'Chipping Sparrow': {
        type: 'temperate',
        springArrival: 100,
        fallDeparture: 295,
        flyway: 'continental',
        winterLat: 30,
        summerLat: 52
    },
    'Purple Finch': {
        type: 'nomadic',
        springArrival: 90,
        fallDeparture: 300,
        flyway: 'continental',
        winterLat: 35,
        summerLat: 52
    },
    'Red-breasted Nuthatch': {
        type: 'nomadic',
        springArrival: 85,
        fallDeparture: 305,
        flyway: 'continental',
        winterLat: 35,
        summerLat: 55
    }
};

// Flyway routes (major migration corridors)
var FLYWAY_ROUTES = {
    atlantic: {
        centerLon: -78,
        springPath: [
            [25, -80], [30, -78], [35, -76], [39.96, -82.99], [44, -75], [50, -70]
        ],
        fallPath: [
            [50, -70], [44, -75], [39.96, -82.99], [35, -76], [30, -78], [25, -80]
        ]
    },
    mississippi: {
        centerLon: -90,
        springPath: [
            [28, -92], [33, -90], [37, -88], [39.96, -82.99], [44, -85], [50, -90]
        ],
        fallPath: [
            [50, -90], [44, -85], [39.96, -82.99], [37, -88], [33, -90], [28, -92]
        ]
    },
    continental: {
        centerLon: -95,
        springPath: [
            [32, -97], [36, -92], [39.96, -82.99], [44, -88], [50, -95]
        ],
        fallPath: [
            [50, -95], [44, -88], [39.96, -82.99], [36, -92], [32, -97]
        ]
    }
};

// Generate migration route for a species
function generateMigrationRoute(speciesName) {
    console.log('Generating migration route for:', speciesName);
    
    // Check if species is in our database
    var speciesData = SPECIES_MIGRATION_DATABASE[speciesName];
    
    if (!speciesData) {
        // Species not in database - try to infer from common patterns
        console.log('Species not in database, using default pattern');
        speciesData = inferMigrationPattern(speciesName);
    }
    
    // Handle resident species
    if (speciesData.type === 'resident') {
        return {
            name: speciesName,
            type: 'resident',
            winterRange: [[35, -100], [35, -70], [48, -70], [48, -100]],
            summerRange: [[35, -100], [35, -70], [48, -70], [48, -100]],
            springRoute: [[39.9612, -82.9988]],
            springDates: ['Year-round'],
            fallRoute: [[39.9612, -82.9988]],
            fallDates: ['Year-round'],
            color: generateColorFromName(speciesName)
        };
    }
    
    // Get flyway data
    var flyway = FLYWAY_ROUTES[speciesData.flyway] || FLYWAY_ROUTES.mississippi;
    
    // Generate winter range
    var winterRange = [
        [speciesData.winterLat - 5, flyway.centerLon - 15],
        [speciesData.winterLat - 5, flyway.centerLon + 15],
        [speciesData.winterLat + 5, flyway.centerLon + 15],
        [speciesData.winterLat + 5, flyway.centerLon - 15]
    ];
    
    // Generate summer range
    var summerRange = [
        [speciesData.summerLat - 5, flyway.centerLon - 20],
        [speciesData.summerLat - 5, flyway.centerLon + 20],
        [speciesData.summerLat + 8, flyway.centerLon + 20],
        [speciesData.summerLat + 8, flyway.centerLon - 20]
    ];
    
    // For reverse migrants (like junco), swap ranges
    if (speciesData.type === 'reverse') {
        var temp = winterRange;
        winterRange = summerRange;
        summerRange = temp;
    }
    
    // Generate spring and fall routes with dates
    var springRoute = [];
    var springDates = [];
    var fallRoute = [];
    var fallDates = [];
    
    // Calculate dates based on arrival timing
    var arrivalDate = new Date(2025, 0, 1);
    arrivalDate.setDate(speciesData.springArrival || 100);
    
    // Spring migration route
    if (speciesData.type === 'reverse') {
        // Junco leaves in spring
        var route = [...flyway.fallPath];
        var daysPerLeg = 10;
        
        route.forEach(function(point, idx) {
            springRoute.push(point);
            var legDate = new Date(arrivalDate);
            legDate.setDate(legDate.getDate() + (idx * daysPerLeg));
            springDates.push(legDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        });
    } else {
        // Normal spring migration north
        var route = [...flyway.springPath];
        var daysPerLeg = 8;
        
        route.forEach(function(point, idx) {
            springRoute.push(point);
            var legDate = new Date(arrivalDate);
            legDate.setDate(legDate.getDate() - ((route.length - idx - 1) * daysPerLeg));
            springDates.push(legDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        });
    }
    
    // Fall migration route
    var departureDate = new Date(2025, 0, 1);
    departureDate.setDate(speciesData.fallDeparture || 250);
    
    if (speciesData.type === 'reverse') {
        // Junco arrives in fall
        var route = [...flyway.springPath];
        var daysPerLeg = 12;
        
        route.forEach(function(point, idx) {
            fallRoute.push(point);
            var legDate = new Date(departureDate);
            legDate.setDate(legDate.getDate() - ((route.length - idx - 1) * daysPerLeg));
            fallDates.push(legDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        });
    } else {
        // Normal fall migration south
        var route = [...flyway.fallPath];
        var daysPerLeg = 12;
        
        route.forEach(function(point, idx) {
            fallRoute.push(point);
            var legDate = new Date(departureDate);
            legDate.setDate(legDate.getDate() + (idx * daysPerLeg));
            fallDates.push(legDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        });
    }
    
    return {
        name: speciesName,
        type: speciesData.type,
        winterRange: winterRange,
        summerRange: summerRange,
        springRoute: springRoute,
        springDates: springDates,
        fallRoute: fallRoute,
        fallDates: fallDates,
        color: generateColorFromName(speciesName)
    };
}

// Infer migration pattern for unknown species
function inferMigrationPattern(speciesName) {
    var name = speciesName.toLowerCase();
    
    // Infer from species name
    if (name.includes('warbler') || name.includes('oriole') || name.includes('hummingbird') || 
        name.includes('tanager') || name.includes('grosbeak')) {
        return {
            type: 'neotropical',
            springArrival: 110,
            fallDeparture: 250,
            flyway: 'mississippi',
            winterLat: 18,
            summerLat: 45
        };
    }
    
    if (name.includes('sparrow') || name.includes('finch') || name.includes('junco')) {
        return {
            type: 'temperate',
            springArrival: 85,
            fallDeparture: 290,
            flyway: 'continental',
            winterLat: 32,
            summerLat: 50
        };
    }
    
    if (name.includes('owl') || name.includes('woodpecker') || name.includes('cardinal') ||
        name.includes('titmouse') || name.includes('chickadee') || name.includes('nuthatch')) {
        return {
            type: 'resident',
            springArrival: null,
            fallDeparture: null,
            flyway: null,
            winterLat: 39.96,
            summerLat: 39.96
        };
    }
    
    // Default to temperate migrant
    return {
        type: 'temperate',
        springArrival: 100,
        fallDeparture: 270,
        flyway: 'mississippi',
        winterLat: 30,
        summerLat: 48
    };
}

// Generate a color from species name (deterministic)
function generateColorFromName(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate pleasant colors (avoid too dark or too light)
    var hue = Math.abs(hash % 360);
    var saturation = 60 + (Math.abs(hash % 20));
    var lightness = 45 + (Math.abs(hash % 15));
    
    return 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)';
}

// Load detected migratory species from your BirdNET data
async function loadDetectedMigratorySpecies() {
    try {
        console.log('Loading detected migratory species from BirdNET...');
        
        var response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species data');
        
        var allSpecies = await response.json();
        
        // Automatically detect migratory species based on behavior patterns
        var migratorySpecies = allSpecies.filter(function(species) {
            return isSpeciesMigratory(species);
        });
        
        console.log('Found ' + migratorySpecies.length + ' detected migratory species (auto-detected)');
        console.log('Species:', migratorySpecies.map(s => s.common_name).join(', '));
        
        return migratorySpecies;
        
    } catch (error) {
        console.error('Error loading detected species:', error);
        return [];
    }
}

// Automatically determine if a species is migratory based on multiple factors
function isSpeciesMigratory(species) {
    var name = species.common_name.toLowerCase();
    
    // 1. Check if explicitly in our migration database
    if (SPECIES_MIGRATION_DATABASE[species.common_name]) {
        var data = SPECIES_MIGRATION_DATABASE[species.common_name];
        return data.type !== 'resident';
    }
    
    // 2. Check against CONFIG.MIGRATORY_SPECIES if it exists
    if (typeof CONFIG !== 'undefined' && CONFIG.MIGRATORY_SPECIES) {
        if (CONFIG.MIGRATORY_SPECIES.includes(species.common_name)) {
            return true;
        }
    }
    
    // 3. Auto-detect based on temporal presence patterns
    if (species.first_heard && species.last_heard) {
        var firstDate = new Date(species.first_heard);
        var lastDate = new Date(species.last_heard);
        
        var firstDay = Math.floor((firstDate - new Date(firstDate.getFullYear(), 0, 0)) / 86400000);
        var lastDay = Math.floor((lastDate - new Date(lastDate.getFullYear(), 0, 0)) / 86400000);
        
        // If bird is absent for more than 3 months, likely migratory
        var daysPresent = lastDay - firstDay;
        var yearGap = 365 - daysPresent;
        
        if (yearGap > 90) {
            console.log('Auto-detected migrant (temporal):', species.common_name, 'Gap:', yearGap, 'days');
            return true;
        }
    }
    
    // 4. Known migratory bird families (most reliable method)
    var migratoryFamilies = [
        // Warblers - almost all migratory
        'warbler',
        // Flycatchers - almost all migratory
        'flycatcher', 'phoebe', 'kingbird', 'pewee',
        // Swallows - all migratory
        'swallow', 'martin',
        // Thrushes - most migratory
        'thrush', 'bluebird', 'veery', 'swainson',
        // Vireos - most migratory
        'vireo',
        // Tanagers - all migratory
        'tanager',
        // Orioles - all migratory
        'oriole',
        // Grosbeaks - most migratory
        'grosbeak',
        // Buntings - most migratory
        'bunting',
        // Hummingbirds - all migratory in eastern US
        'hummingbird',
        // Cuckoos - all migratory
        'cuckoo',
        // Nighthawks & Nightjars
        'nighthawk', 'whip-poor-will', 'nightjar',
        // Swifts - all migratory
        'swift',
        // Wrens (some)
        'house wren', 'winter wren', 'marsh wren', 'sedge wren',
        // Shorebirds - most migratory
        'sandpiper', 'plover', 'yellowlegs', 'dowitcher', 'dunlin',
        // Terns - all migratory
        'tern',
        // Gulls (many)
        'bonaparte', 'franklin',
        // Waterfowl (many)
        'teal', 'wigeon', 'pintail', 'shoveler', 'scaup', 'bufflehead', 'merganser',
        // Rails (some)
        'sora', 'virginia rail',
        // Cranes
        'sandhill crane', 'whooping crane',
        // Bobolink & Meadowlarks (some)
        'bobolink',
        // Waxwings
        'waxwing',
        // Catbird
        'catbird',
        // Kinglets
        'kinglet',
        // Creepers
        'creeper'
    ];
    
    for (var i = 0; i < migratoryFamilies.length; i++) {
        if (name.includes(migratoryFamilies[i])) {
            console.log('Auto-detected migrant (family):', species.common_name);
            return true;
        }
    }
    
    // 5. Known year-round residents (exclude these)
    var residentFamilies = [
        'cardinal', 'chickadee', 'titmouse', 'nuthatch',
        'carolina wren', 'red-bellied woodpecker', 'downy woodpecker',
        'hairy woodpecker', 'pileated woodpecker', 'barred owl',
        'great horned owl', 'screech-owl', 'turkey vulture',
        'red-tailed hawk', 'red-shouldered hawk', 'cooper\'s hawk',
        'mourning dove', 'rock pigeon', 'house sparrow', 'european starling',
        'house finch', 'blue jay', 'common grackle', 'brown-headed cowbird',
        'song sparrow', 'white-breasted nuthatch'
    ];
    
    for (var i = 0; i < residentFamilies.length; i++) {
        if (name === residentFamilies[i] || name.includes(residentFamilies[i])) {
            return false;
        }
    }
    
    // 6. Partial migrants - birds that some populations migrate
    var partialMigrants = [
        'american robin', 'american goldfinch', 'cedar waxwing',
        'dark-eyed junco', 'white-throated sparrow', 'hermit thrush'
    ];
    
    for (var i = 0; i < partialMigrants.length; i++) {
        if (name === partialMigrants[i]) {
            console.log('Auto-detected migrant (partial):', species.common_name);
            return true;
        }
    }
    
    // 7. Default: if we're not sure, don't include (conservative approach)
    // This prevents false positives
    return false;
}

// Create dynamic migration routes object from detected species
async function createDynamicMigrationRoutes() {
    var detectedSpecies = await loadDetectedMigratorySpecies();
    var routes = {};
    
    detectedSpecies.forEach(function(species) {
        var key = species.common_name.toLowerCase().replace(/[^a-z]/g, '');
        var route = generateMigrationRoute(species.common_name);
        
        // Add detection metadata
        route.detectionCount = species.count;
        route.firstDetected = species.first_heard;
        route.lastDetected = species.last_heard;
        route.avgConfidence = species.avg_confidence;
        
        routes[key] = route;
    });
    
    console.log('Generated ' + Object.keys(routes).length + ' dynamic migration routes');
    
    return routes;
}

// Update the migration map UI with detected species
async function updateMigrationMapUI() {
    var routes = await createDynamicMigrationRoutes();
    
    // Update the global MIGRATION_ROUTES object
    window.DYNAMIC_MIGRATION_ROUTES = routes;
    window.ALL_MIGRATION_ROUTES = routes; // Keep unfiltered copy
    
    // Generate species buttons
    renderSpeciesButtons(routes);
    
    // Set up search functionality
    setupSearchAndFilters();
    
    console.log('Migration map UI updated with ' + Object.keys(routes).length + ' species');
}

// Render species buttons
function renderSpeciesButtons(routes) {
    var buttonsContainer = document.getElementById('migration-species-buttons');
    if (!buttonsContainer) {
        console.warn('Migration species buttons container not found');
        return;
    }
    
    buttonsContainer.innerHTML = '';
    
    // Sort by detection count (most detected first) by default
    var sortedSpecies = Object.keys(routes).sort(function(a, b) {
        return routes[b].detectionCount - routes[a].detectionCount;
    });
    
    // Update count display
    updateSpeciesCount(sortedSpecies.length, sortedSpecies.length);
    
    if (sortedSpecies.length === 0) {
        buttonsContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">No migratory species detected yet. Keep birding!</div>';
        return;
    }
    
    sortedSpecies.forEach(function(key) {
        var route = routes[key];
        var button = createSpeciesButton(key, route);
        buttonsContainer.appendChild(button);
    });
}

// Create a species button
function createSpeciesButton(key, route) {
    var button = document.createElement('button');
    button.className = 'migration-species-btn';
    button.dataset.speciesKey = key;
    button.dataset.speciesName = route.name.toLowerCase();
    button.dataset.migrationType = route.type;
    button.dataset.detectionCount = route.detectionCount;
    button.dataset.lastDetected = route.lastDetected || '';
    
    // Button styling
    button.style.cssText = 'background: ' + route.color + '; color: white; font-size: 0.813rem; padding: 0.75rem 1rem; border-radius: 8px; position: relative; text-align: left; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
    
    // Species name and type
    var nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-weight: 600; margin-bottom: 0.25rem; padding-right: 30px;';
    nameDiv.textContent = route.name;
    button.appendChild(nameDiv);
    
    // Migration type label
    var typeLabels = {
        'neotropical': '🌴 Neotropical',
        'temperate': '🍂 Temperate', 
        'partial': '⚡ Partial',
        'nomadic': '🔄 Nomadic',
        'reverse': '❄️ Winter Visitor',
        'resident': '🏠 Resident'
    };
    
    var typeDiv = document.createElement('div');
    typeDiv.style.cssText = 'font-size: 0.688rem; opacity: 0.9; margin-bottom: 0.25rem;';
    typeDiv.textContent = typeLabels[route.type] || route.type;
    button.appendChild(typeDiv);
    
    // Detection info
    var infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'font-size: 0.688rem; opacity: 0.85;';
    infoDiv.textContent = route.detectionCount + ' detection' + (route.detectionCount !== 1 ? 's' : '');
    button.appendChild(infoDiv);
    
    // Detection count badge
    var badge = document.createElement('span');
    badge.textContent = route.detectionCount;
    badge.style.cssText = 'position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.3); color: white; border-radius: 999px; padding: 2px 8px; font-size: 0.688rem; font-weight: 700; min-width: 24px; text-align: center;';
    button.appendChild(badge);
    
    // Click handler
    button.onclick = function() { 
        // Remove active state from all buttons
        document.querySelectorAll('.migration-species-btn').forEach(function(btn) {
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            btn.style.transform = 'none';
        });
        
        // Add active state to clicked button
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        button.style.transform = 'scale(1.02)';
        
        showDynamicMigrationRoute(key); 
    };
    
    // Hover effects
    button.onmouseenter = function() {
        if (button.style.transform !== 'scale(1.02)') {
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            button.style.transform = 'translateY(-2px)';
        }
    };
    
    button.onmouseleave = function() {
        if (button.style.transform !== 'scale(1.02)') {
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            button.style.transform = 'none';
        }
    };
    
    return button;
}

// Update species count display
function updateSpeciesCount(displayed, total) {
    var countDisplay = document.getElementById('species-count-display');
    if (countDisplay) {
        if (displayed === total) {
            countDisplay.textContent = total + ' species';
        } else {
            countDisplay.textContent = displayed + ' of ' + total + ' species';
        }
    }
}

// Setup search and filter functionality
function setupSearchAndFilters() {
    var searchInput = document.getElementById('species-search');
    var typeFilter = document.getElementById('migration-type-filter');
    var sortSelect = document.getElementById('species-sort-migration');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterAndSortSpecies);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterAndSortSpecies);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndSortSpecies);
    }
}

// Filter and sort species based on current selections
function filterAndSortSpecies() {
    var searchTerm = document.getElementById('species-search').value.toLowerCase();
    var typeFilter = document.getElementById('migration-type-filter').value;
    var sortBy = document.getElementById('species-sort-migration').value;
    
    var buttons = document.querySelectorAll('.migration-species-btn');
    var visibleCount = 0;
    var totalCount = buttons.length;
    
    // Filter buttons
    buttons.forEach(function(button) {
        var speciesName = button.dataset.speciesName;
        var migrationType = button.dataset.migrationType;
        
        var matchesSearch = speciesName.includes(searchTerm);
        var matchesType = typeFilter === 'all' || migrationType === typeFilter;
        
        if (matchesSearch && matchesType) {
            button.style.display = '';
            visibleCount++;
        } else {
            button.style.display = 'none';
        }
    });
    
    // Sort visible buttons
    var container = document.getElementById('migration-species-buttons');
    var visibleButtons = Array.from(buttons).filter(function(btn) {
        return btn.style.display !== 'none';
    });
    
    visibleButtons.sort(function(a, b) {
        if (sortBy === 'name') {
            return a.dataset.speciesName.localeCompare(b.dataset.speciesName);
        } else if (sortBy === 'recent') {
            return new Date(b.dataset.lastDetected) - new Date(a.dataset.lastDetected);
        } else {
            // Sort by detections (default)
            return parseInt(b.dataset.detectionCount) - parseInt(a.dataset.detectionCount);
        }
    });
    
    // Re-append in sorted order
    visibleButtons.forEach(function(btn) {
        container.appendChild(btn);
    });
    
    // Update count
    updateSpeciesCount(visibleCount, totalCount);
}

// Show dynamic migration route
function showDynamicMigrationRoute(speciesKey) {
    if (!window.DYNAMIC_MIGRATION_ROUTES) {
        console.error('Dynamic routes not loaded yet');
        return;
    }
    
    var data = window.DYNAMIC_MIGRATION_ROUTES[speciesKey];
    if (!data) {
        console.error('Species route not found:', speciesKey);
        return;
    }
    
    // Use the existing showMigrationRoute logic but with dynamic data
    if (!migrationMap) {
        console.error('Migration map not initialized');
        return;
    }
    
    clearMigrationMap();
    
    console.log('Showing dynamic migration route for:', data.name);
    
    // Draw winter range
    var winterPoly = L.polygon(data.winterRange, {
        color: '#e67e22',
        fillColor: '#e67e22',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
    }).addTo(migrationMap);
    
    var winterPopup = '<div style="font-weight: 600;">' + data.name + '</div>' +
                     '<div style="font-size: 0.875rem; color: #6b7280;">Winter Range</div>' +
                     '<div style="font-size: 0.75rem; margin-top: 4px;">' +
                     '<strong>Detections:</strong> ' + data.detectionCount + '<br>' +
                     '<strong>First heard:</strong> ' + (data.firstDetected ? new Date(data.firstDetected).toLocaleDateString() : 'N/A') + '<br>' +
                     '<strong>Last heard:</strong> ' + (data.lastDetected ? new Date(data.lastDetected).toLocaleDateString() : 'N/A') +
                     '</div>';
    
    winterPoly.bindPopup(winterPopup);
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
    if (data.springRoute && data.springRoute.length > 1) {
        var springLine = L.polyline(data.springRoute, {
            color: '#27ae60',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(migrationMap);
        springLine.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Spring Migration Route (Northbound) ⬆</div>');
        currentMapLayers.push(springLine);
        
        // Add waypoint markers
        data.springRoute.forEach(function(point, idx) {
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
    }
    
    // Draw fall migration route
    if (data.fallRoute && data.fallRoute.length > 1) {
        var fallLine = L.polyline(data.fallRoute, {
            color: '#f39c12',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(migrationMap);
        fallLine.bindPopup('<div style="font-weight: 600;">' + data.name + '</div><div style="font-size: 0.875rem; color: #6b7280;">Fall Migration Route (Southbound) ⬇</div>');
        currentMapLayers.push(fallLine);
    }
    
    // Fit map bounds
    var allPoints = data.springRoute.concat(data.winterRange).concat(data.summerRange);
    var bounds = L.latLngBounds(allPoints);
    migrationMap.fitBounds(bounds, { padding: [50, 50] });
    
    console.log('Dynamic migration route displayed for:', data.name);
}

console.log('dynamic-migration.js loaded successfully');