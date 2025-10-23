// AI Migration Prediction Configuration and Setup Guide

var AI_MIGRATION_CONFIG = {
    // ===========================================
    // SETUP INSTRUCTIONS
    // ===========================================
    
    // 1. Get a free weather API key from OpenWeatherMap:
    //    - Visit: https://openweathermap.org/api
    //    - Sign up for a free account
    //    - Get your API key from the dashboard
    //    - Replace the key below with your actual key
    
    WEATHER_API_KEY: '86db1cb901a37d269c221964716f63ed', // Remember to regenerate this for security!
    
    // 2. Update your location coordinates:
    //    - Find your coordinates at: https://www.latlong.net/
    //    - Update the lat/lon values below
    
    LOCATION: {
        lat: 39.9612,  // Your latitude
        lon: -82.9988, // Your longitude
        name: 'Columbus, OH' // Optional: location name for display
    },
    
    // ===========================================
    // MACHINE LEARNING PARAMETERS
    // ===========================================
    
    // Weights for different prediction factors (should sum to 1.0)
    PREDICTION_WEIGHTS: {
        seasonal_timing: 0.40,    // Historical arrival/departure timing
        temperature: 0.25,        // Current temperature vs species threshold
        wind_direction: 0.20,     // Favorable wind patterns
        pressure: 0.10,           // Barometric pressure trends
        forecast_stability: 0.05  // Weather forecast consistency
    },
    
    // Confidence thresholds
    CONFIDENCE_LEVELS: {
        high: 0.7,     // 70%+ seasonal factor = high confidence
        medium: 0.3,   // 30-70% seasonal factor = medium confidence
        low: 0.0       // <30% seasonal factor = low confidence
    },
    
    // ===========================================
    // SPECIES-SPECIFIC MIGRATION DATA
    // ===========================================
    
    // Temperature thresholds in Fahrenheit, distances in miles
    SPECIES_MIGRATION_DATA: {
        'Ruby-throated Hummingbird': {
            spring_arrival: { mean: 105, std: 8, earliest: 95, latest: 120 },
            fall_departure: { mean: 245, std: 12, earliest: 230, latest: 270 },
            migration_triggers: {
                min_temperature: 59,        // Fahrenheit
                favorable_wind: [135, 225], // South winds (degrees)
                pressure_preference: 'rising',
                moon_phase_influence: 0.1   // Slight influence
            },
            flight_characteristics: {
                altitude: 'low',            // Low, medium, high
                distance_per_day: 20,       // Miles
                weather_sensitivity: 'high' // High, medium, low
            }
        },
        
        'Yellow-rumped Warbler': {
            spring_arrival: { mean: 91, std: 6, earliest: 80, latest: 105 },
            fall_departure: { mean: 305, std: 15, earliest: 285, latest: 330 },
            migration_triggers: {
                min_temperature: 54,        // Fahrenheit
                favorable_wind: [135, 270], // South to southwest
                pressure_preference: 'stable',
                moon_phase_influence: 0.15
            },
            flight_characteristics: {
                altitude: 'medium',
                distance_per_day: 50,
                weather_sensitivity: 'medium'
            }
        },
        
        'White-throated Sparrow': {
            spring_arrival: { mean: 79, std: 10, earliest: 65, latest: 100 },
            fall_departure: { mean: 320, std: 18, earliest: 300, latest: 350 },
            migration_triggers: {
                min_temperature: 46,        // Fahrenheit
                favorable_wind: [180, 270], // Southwest
                pressure_preference: 'rising',
                moon_phase_influence: 0.05
            },
            flight_characteristics: {
                altitude: 'low',
                distance_per_day: 30,
                weather_sensitivity: 'high'
            }
        },
        
        'Baltimore Oriole': {
            spring_arrival: { mean: 100, std: 7, earliest: 88, latest: 115 },
            fall_departure: { mean: 250, std: 14, earliest: 235, latest: 275 },
            migration_triggers: {
                min_temperature: 64,        // Fahrenheit
                favorable_wind: [135, 225], // South winds
                pressure_preference: 'rising',
                moon_phase_influence: 0.2
            },
            flight_characteristics: {
                altitude: 'medium',
                distance_per_day: 40,
                weather_sensitivity: 'medium'
            }
        },
        
        'Dark-eyed Junco': {
            spring_departure: { mean: 95, std: 12, earliest: 80, latest: 115 },
            fall_arrival: { mean: 288, std: 10, earliest: 275, latest: 305 },
            migration_triggers: {
                max_temperature: 41,        // Fahrenheit - They prefer cold
                favorable_wind: [315, 45],  // North winds
                pressure_preference: 'falling',
                moon_phase_influence: 0.1
            },
            flight_characteristics: {
                altitude: 'low',
                distance_per_day: 25,
                weather_sensitivity: 'low'
            }
        }
    },
    
    // ===========================================
    // ADVANCED PREDICTION ALGORITHMS
    // ===========================================
    
    // Machine learning model parameters
    ML_PARAMETERS: {
        // Gaussian distribution for seasonal timing
        seasonal_window_days: 30,
        
        // Temperature sensitivity curves (Fahrenheit)
        temperature_curve_steepness: 0.1,
        
        // Wind direction tolerance (degrees)
        wind_tolerance: 45,
        
        // Pressure change sensitivity (inches of mercury)
        pressure_sensitivity: 0.15,
        
        // Forecast lookahead days
        forecast_days: 5
    },
    
    // Regional migration corridor data
    MIGRATION_CORRIDORS: {
        'Atlantic Flyway': {
            peak_wind_direction: 180, // South
            optimal_pressure: 30.0,  // inches of mercury
            species: ['Ruby-throated Hummingbird', 'Baltimore Oriole']
        },
        'Mississippi Flyway': {
            peak_wind_direction: 200, // Southwest
            optimal_pressure: 29.9,  // inches of mercury
            species: ['Yellow-rumped Warbler', 'White-throated Sparrow']
        }
    },
    
    // ===========================================
    // DATA SOURCES AND VALIDATION
    // ===========================================
    
    DATA_SOURCES: {
        // Weather data
        primary_weather: 'OpenWeatherMap',
        backup_weather: 'WeatherAPI', // Alternative if primary fails
        
        // Migration data sources (for future enhancement)
        ebird_api: 'https://ebird.org/ws2.0/',
        migration_timing: 'Cornell BirdCast',
        radar_data: 'NEXRAD', // For detecting migration flocks
        
        // Validation sources
        citizen_science: 'eBird sightings',
        research_stations: 'Bird observatories',
        satellite_tracking: 'GPS tagged birds'
    },
    
    // Model accuracy tracking
    ACCURACY_METRICS: {
        prediction_window: 7,     // Days ahead to predict
        acceptable_error: 3,      // Days off from actual arrival
        confidence_threshold: 0.6, // Minimum confidence to show prediction
        
        // Performance tracking
        correct_predictions: 0,
        total_predictions: 0,
        
        // Calibration data
        last_calibration: null,
        calibration_frequency: 30 // Days between calibrations
    },
    
    // ===========================================
    // USER INTERFACE SETTINGS
    // ===========================================
    
    UI_SETTINGS: {
        // Display preferences
        show_probability_below: 10,  // Hide predictions below 10%
        max_species_displayed: 8,    // Maximum species in forecast
        update_frequency: 3600000,   // 1 hour in milliseconds
        
        // Alert thresholds
        high_probability_alert: 75,  // Alert user when probability > 75%
        rare_species_alert: true,    // Special alerts for rare species
        
        // Chart settings
        chart_days_ahead: 14,        // Days to show in probability chart
        chart_update_interval: 6,    // Hours between chart updates
        
        // Notification settings
        enable_notifications: false, // Browser notifications
        notification_threshold: 80   // Probability threshold for notifications
    }
};

// ===========================================
// SETUP VALIDATION AND HELPERS
// ===========================================

function validateAIConfiguration() {
    const issues = [];
    
    // Check if weather API key is set
    if (AI_MIGRATION_CONFIG.WEATHER_API_KEY === 'your_weather_api_key_here') {
        issues.push('Weather API key not configured - using simulated data');
    }
    
    // Validate coordinates
    const lat = AI_MIGRATION_CONFIG.LOCATION.lat;
    const lon = AI_MIGRATION_CONFIG.LOCATION.lon;
    
    if (lat < -90 || lat > 90) {
        issues.push('Invalid latitude: ' + lat);
    }
    
    if (lon < -180 || lon > 180) {
        issues.push('Invalid longitude: ' + lon);
    }
    
    // Validate prediction weights
    const weights = AI_MIGRATION_CONFIG.PREDICTION_WEIGHTS;
    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
    
    if (Math.abs(weightSum - 1.0) > 0.01) {
        issues.push('Prediction weights do not sum to 1.0: ' + weightSum);
    }
    
    return issues;
}

function getConfigurationStatus() {
    const issues = validateAIConfiguration();
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        hasWeatherAPI: AI_MIGRATION_CONFIG.WEATHER_API_KEY !== 'your_weather_api_key_here',
        speciesCount: Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA).length,
        lastValidation: new Date().toISOString()
    };
}

// Initialize configuration validation
console.log('AI Migration Prediction System Configuration (Imperial Units):');
const status = getConfigurationStatus();

if (status.hasWeatherAPI) {
    console.log('✓ Weather API configured');
} else {
    console.warn('⚠ Weather API key needed for live data - using simulated data');
}

if (status.issues.length === 0) {
    console.log('✓ Configuration valid');
} else {
    console.warn('Configuration issues:', status.issues);
}

console.log('✓ ' + status.speciesCount + ' species configured for AI prediction (Fahrenheit)');

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_MIGRATION_CONFIG;
}