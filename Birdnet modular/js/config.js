// BirdNET Dashboard Configuration
// Centralized namespace to prevent global pollution
console.log('Loading BirdNET namespace and configuration...');

// Create single global namespace
window.BirdNET = window.BirdNET || {
    // Configuration
    config: {
        API_BASE: 'http://192.168.68.129:8080/api/v2',
        REFRESH_INTERVAL: 30000,
        DEFAULT_CONFIDENCE_THRESHOLD: 0.1,
        MAX_DETECTIONS_TO_LOAD: 5000,  // Load up to 5000 detections for analytics
        RECENT_DETECTIONS_DISPLAY: 100  // Show 100 in recent table
    },
    
    // Data stores
    data: {
        species: [],
        speciesSummary: [],  // Alias for backward compatibility
        originalSpecies: [],
        detections: [],
        recentDetections: [],  // Alias for backward compatibility
        dailyCounts: {}
    },
    
    // Charts registry
    charts: {},
    
    // Audio player state
    audio: {
        current: null,
        currentId: null
    },
    
    // UI state
    ui: {
        activeTab: 'overview',
        filters: {
            dateRange: 'all',
            confidenceThreshold: 0.1,
            sortBy: 'count',
            searchTerm: ''
        }
    },
    
    // Cache for API responses and computed data
    cache: {
        speciesInfo: {},
        weather: null,
        lastFetch: {}
    },
    
    // Feature flags and settings
    settings: {
        enableAutoRefresh: true,
        showScientificNames: true,
        enableSounds: true,
        darkMode: false
    },
    
    // Utility functions namespace
    utils: {},
    
    // API functions namespace
    api: {},
    
    // UI update functions namespace
    updates: {},
    
    // Migration analysis namespace
    migration: {},
    
    // Analytics namespace
    analytics: {},
    
    // Feeding recommendations namespace
    feeding: {}
};

// Configuration constants
BirdNET.config.MIGRATORY_SPECIES = [
    'Ruby-throated Hummingbird',
    'Baltimore Oriole',
    'Rose-breasted Grosbeak',
    'Indigo Bunting',
    'Scarlet Tanager',
    'Wood Thrush',
    'American Redstart',
    'Black-throated Green Warbler',
    'Yellow Warbler',
    'Common Yellowthroat',
    'Eastern Phoebe',
    'Tree Swallow',
    'Barn Swallow',
    'Chimney Swift',
    'Ruby-crowned Kinglet',
    'White-throated Sparrow',
    'Dark-eyed Junco',
    'American Goldfinch',
    'Cedar Waxwing',
    'Purple Martin'
];

BirdNET.config.RARITY_SCORES = {
    'Pileated Woodpecker': 45,
    'Red-headed Woodpecker': 50,
    'Scarlet Tanager': 40,
    'Rose-breasted Grosbeak': 35,
    'Indigo Bunting': 30,
    'Baltimore Oriole': 25,
    'Ruby-throated Hummingbird': 20,
    'Cedar Waxwing': 25,
    'Purple Martin': 30,
    'Wood Thrush': 35,
    'Hermit Thrush': 40,
    'Winter Wren': 45,
    'Golden-crowned Kinglet': 35,
    'Pine Warbler': 30,
    'Black-throated Green Warbler': 40,
    'American Redstart': 30,
    'Ovenbird': 35,
    'Common Yellowthroat': 15,
    'Yellow Warbler': 20
};

BirdNET.config.CONSERVATION_STATUS = {
    'Wood Thrush': 'Declining',
    'Chimney Swift': 'Declining',
    'Eastern Meadowlark': 'Declining',
    'Bobolink': 'Declining',
    'Barn Swallow': 'Declining',
    'Purple Martin': 'Declining',
    'Common Grackle': 'Declining',
    'Red-headed Woodpecker': 'Near Threatened'
};

console.log('✅ BirdNET namespace initialized');
console.log('Available namespaces:', Object.keys(BirdNET));

// Global alias for backward compatibility with older modules
window.CONFIG = BirdNET.config;

console.log('✅ CONFIG global alias created for backward compatibility');
