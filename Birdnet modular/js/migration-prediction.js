// Enhanced Migration Pattern Prediction with AI and Weather Integration (Imperial Units)
// FIXED VERSION with proper button IDs
console.log('migration-prediction.js loading... (Imperial Units - FIXED)');

// Dependency check - ensure AI_MIGRATION_CONFIG is loaded
if (typeof AI_MIGRATION_CONFIG === 'undefined') {
    console.error('AI_MIGRATION_CONFIG not loaded! Check that ai-migration-config.js loads before migration-prediction.js');
    // Create a fallback config to prevent errors
    window.AI_MIGRATION_CONFIG = {
        WEATHER_API_KEY: 'demo_mode',
        LOCATION: { lat: 39.9612, lon: -82.9988 },
        SPECIES_MIGRATION_DATA: {},
        PREDICTION_WEIGHTS: {
            seasonal_timing: 0.40,
            temperature: 0.25,
            wind_direction: 0.20,
            pressure: 0.10,
            forecast_stability: 0.05
        },
        CONFIDENCE_LEVELS: { high: 0.7, medium: 0.3, low: 0.0 },
        UI_SETTINGS: {
            show_probability_below: 10,
            max_species_displayed: 8,
            chart_days_ahead: 14,
            update_frequency: 3600000
        }
    };
} else {
    console.log('AI_MIGRATION_CONFIG loaded successfully (Imperial Units)');
}

// Fetch current weather data in imperial units
async function fetchWeatherData() {
    try {
        // Check if we have a valid API key
        if (!AI_MIGRATION_CONFIG.WEATHER_API_KEY || AI_MIGRATION_CONFIG.WEATHER_API_KEY === 'your_weather_api_key_here' || AI_MIGRATION_CONFIG.WEATHER_API_KEY === 'demo_mode') {
            throw new Error('No valid weather API key');
        }
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${AI_MIGRATION_CONFIG.LOCATION.lat}&lon=${AI_MIGRATION_CONFIG.LOCATION.lon}&appid=${AI_MIGRATION_CONFIG.WEATHER_API_KEY}&units=imperial`
        );
        
        if (!response.ok) {
            throw new Error('Weather API unavailable');
        }
        
        const data = await response.json();
        console.log('Real weather data fetched successfully (Imperial)');
        return data;
    } catch (error) {
        console.warn('Using simulated weather data (Imperial) - API key issue or network error');
        return generateSimulatedWeather();
    }
}

// Generate simulated weather data (Imperial units)
function generateSimulatedWeather() {
    const now = new Date();
    const month = now.getMonth();
    
    // Seasonal temperature ranges (Fahrenheit)
    let tempRange;
    if (month >= 2 && month <= 4) tempRange = [45, 65];      // Spring
    else if (month >= 5 && month <= 8) tempRange = [70, 90]; // Summer
    else if (month >= 9 && month <= 10) tempRange = [50, 70]; // Fall
    else tempRange = [25, 45];                                 // Winter
    
    const temp = Math.random() * (tempRange[1] - tempRange[0]) + tempRange[0];
    
    return {
        main: {
            temp: temp,
            pressure: 1013 + (Math.random() * 20 - 10)
        },
        wind: {
            speed: Math.random() * 15, // mph
            deg: Math.random() * 360
        },
        weather: [{
            description: ['clear sky', 'few clouds', 'scattered clouds', 'overcast clouds'][Math.floor(Math.random() * 4)]
        }]
    };
}

// Fetch weather forecast (Imperial units)
async function fetchWeatherForecast() {
    try {
        if (!AI_MIGRATION_CONFIG.WEATHER_API_KEY || AI_MIGRATION_CONFIG.WEATHER_API_KEY === 'your_weather_api_key_here' || AI_MIGRATION_CONFIG.WEATHER_API_KEY === 'demo_mode') {
            throw new Error('No valid weather API key');
        }
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${AI_MIGRATION_CONFIG.LOCATION.lat}&lon=${AI_MIGRATION_CONFIG.LOCATION.lon}&appid=${AI_MIGRATION_CONFIG.WEATHER_API_KEY}&units=imperial`
        );
        
        if (!response.ok) {
            throw new Error('Forecast API unavailable');
        }
        
        const data = await response.json();
        console.log('Forecast data fetched successfully (Imperial)');
        return data;
    } catch (error) {
        console.warn('Using simulated forecast data (Imperial)');
        return { list: [] };
    }
}

// Calculate migration probability for a species
function calculateMigrationProbability(speciesName, currentWeather, forecastData) {
    const speciesData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
    if (!speciesData) {
        return { probability: 0, factors: [], confidence: 'Low', seasonalFactor: 0 };
    }
    
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    
    let seasonalFactor = 0;
    const factors = [];
    
    // Check spring arrival window
    if (speciesData.spring_arrival_start <= dayOfYear && dayOfYear <= speciesData.spring_arrival_end) {
        const midPoint = (speciesData.spring_arrival_start + speciesData.spring_arrival_end) / 2;
        seasonalFactor = 1 - Math.abs(dayOfYear - midPoint) / ((speciesData.spring_arrival_end - speciesData.spring_arrival_start) / 2);
        factors.push('Spring arrival window');
    }
    
    // Check fall departure window
    if (speciesData.fall_departure_start <= dayOfYear && dayOfYear <= speciesData.fall_departure_end) {
        const midPoint = (speciesData.fall_departure_start + speciesData.fall_departure_end) / 2;
        const factor = 1 - Math.abs(dayOfYear - midPoint) / ((speciesData.fall_departure_end - speciesData.fall_departure_start) / 2);
        seasonalFactor = Math.max(seasonalFactor, factor);
        factors.push('Fall departure window');
    }
    
    // Temperature factor (Fahrenheit)
    let tempFactor = 0;
    const currentTemp = currentWeather.main.temp;
    if (currentTemp >= speciesData.optimal_temp_min && currentTemp <= speciesData.optimal_temp_max) {
        tempFactor = 1;
        factors.push('Optimal temperature');
    } else {
        const tempDiff = Math.min(
            Math.abs(currentTemp - speciesData.optimal_temp_min),
            Math.abs(currentTemp - speciesData.optimal_temp_max)
        );
        tempFactor = Math.max(0, 1 - (tempDiff / 20));
        if (tempFactor > 0.3) factors.push('Acceptable temperature');
    }
    
    // Wind direction factor
    let windFactor = 0;
    const windDeg = currentWeather.wind.deg;
    const favorableWinds = speciesData.favorable_wind_directions || [];
    
    if (favorableWinds.length > 0) {
        favorableWinds.forEach(direction => {
            const dirDegrees = {'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315}[direction] || 0;
            const diff = Math.abs(windDeg - dirDegrees);
            const normalizedDiff = Math.min(diff, 360 - diff);
            if (normalizedDiff < 45) {
                windFactor = Math.max(windFactor, 1 - (normalizedDiff / 45));
            }
        });
        if (windFactor > 0.5) factors.push('Favorable winds');
    } else {
        windFactor = 0.5;
    }
    
    // Pressure factor (convert to inHg)
    const pressure = currentWeather.main.pressure * 0.02953;
    let pressureFactor = 0;
    if (pressure >= 29.8 && pressure <= 30.2) {
        pressureFactor = 1;
        factors.push('Stable pressure');
    } else {
        pressureFactor = Math.max(0, 1 - Math.abs(pressure - 30) / 2);
    }
    
    // Forecast stability
    let forecastFactor = 0.5;
    if (forecastData.list && forecastData.list.length > 0) {
        const temps = forecastData.list.slice(0, 8).map(f => f.main.temp);
        const tempVariance = Math.max(...temps) - Math.min(...temps);
        forecastFactor = tempVariance < 15 ? 1 : Math.max(0, 1 - (tempVariance / 30));
        if (forecastFactor > 0.7) factors.push('Stable forecast');
    }
    
    // Calculate weighted probability
    const weights = AI_MIGRATION_CONFIG.PREDICTION_WEIGHTS;
    const probability = (
        seasonalFactor * weights.seasonal_timing +
        tempFactor * weights.temperature +
        windFactor * weights.wind_direction +
        pressureFactor * weights.pressure +
        forecastFactor * weights.forecast_stability
    ) * 100;
    
    // Determine confidence level
    let confidence = 'Low';
    if (seasonalFactor > AI_MIGRATION_CONFIG.CONFIDENCE_LEVELS.high) {
        confidence = 'High';
    } else if (seasonalFactor > AI_MIGRATION_CONFIG.CONFIDENCE_LEVELS.medium) {
        confidence = 'Medium';
    }
    
    return {
        probability: Math.min(100, Math.max(0, probability)),
        factors: factors,
        confidence: confidence,
        seasonalFactor: seasonalFactor
    };
}

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
}

// Generate AI-enhanced migration forecast (Imperial units)
async function generateAIMigrationForecast() {
    const weatherData = await fetchWeatherData();
    const forecastData = await fetchWeatherForecast();
    
    const species = Object.keys(AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA);
    const forecasts = [];
    
    species.forEach(speciesName => {
        const prediction = calculateMigrationProbability(speciesName, weatherData, forecastData);
        
        if (prediction.probability > AI_MIGRATION_CONFIG.UI_SETTINGS.show_probability_below) {
            const currentDate = new Date();
            const speciesData = AI_MIGRATION_CONFIG.SPECIES_MIGRATION_DATA[speciesName];
            
            // Estimate arrival/departure date based on current conditions
            let estimatedDate = new Date();
            const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
            
            if (speciesData.spring_arrival_start <= dayOfYear && dayOfYear <= speciesData.spring_arrival_end) {
                const daysToMidpoint = Math.floor((speciesData.spring_arrival_start + speciesData.spring_arrival_end) / 2) - dayOfYear;
                estimatedDate.setDate(estimatedDate.getDate() + daysToMidpoint);
            } else if (speciesData.fall_departure_start <= dayOfYear && dayOfYear <= speciesData.fall_departure_end) {
                const daysToMidpoint = Math.floor((speciesData.fall_departure_start + speciesData.fall_departure_end) / 2) - dayOfYear;
                estimatedDate.setDate(estimatedDate.getDate() + daysToMidpoint);
            }
            
            forecasts.push({
                species: speciesName,
                probability: Math.round(prediction.probability),
                confidence: prediction.confidence,
                estimatedDate: estimatedDate.toLocaleDateString(),
                factors: prediction.factors,
                weatherConditions: {
                    temperature: Math.round(weatherData.main.temp),
                    windDirection: getWindDirection(weatherData.wind.deg),
                    windSpeed: Math.round(weatherData.wind.speed)
                }
            });
        }
    });
    
    // Sort by probability
    forecasts.sort((a, b) => b.probability - a.probability);
    
    // Limit to max species
    const limitedForecasts = forecasts.slice(0, AI_MIGRATION_CONFIG.UI_SETTINGS.max_species_displayed);
    
    return {
        forecasts: limitedForecasts,
        lastUpdated: new Date().toLocaleString(),
        weatherSummary: {
            temperature: Math.round(weatherData.main.temp),
            conditions: weatherData.weather[0].description,
            windSpeed: Math.round(weatherData.wind.speed),
            windDirection: getWindDirection(weatherData.wind.deg),
            pressure: Math.round(weatherData.main.pressure * 0.02953 * 100) / 100
        }
    };
}

// Update the migration forecast display (Imperial units)
async function updateAIMigrationForecast() {
    try {
        console.log('Updating AI migration forecast (Imperial)...');
        const forecast = await generateAIMigrationForecast();
        
        // Update the forecast table
        const forecastTbody = document.querySelector('#ai-forecast-table tbody');
        if (!forecastTbody) {
            console.warn('AI forecast table not found - make sure HTML includes the AI sections');
            return;
        }
        
        forecastTbody.innerHTML = '';
        
        if (forecast.forecasts.length === 0) {
            forecastTbody.innerHTML = '<tr><td colspan="4">No high-probability migrations predicted at this time</td></tr>';
        } else {
            forecast.forecasts.forEach(function(f) {
                const row = forecastTbody.insertRow();
                const confidenceClass = f.confidence === 'High' ? 'success' : f.confidence === 'Medium' ? 'warning' : 'info';
                const probabilityClass = f.probability > 70 ? 'success' : f.probability > 40 ? 'warning' : 'info';
                
                row.innerHTML = 
                    '<td>' + f.species + '</td>' +
                    '<td><span class="badge badge-' + probabilityClass + '">' + f.probability + '%</span></td>' +
                    '<td>' + f.estimatedDate + '</td>' +
                    '<td>' + f.weatherConditions.temperature + '°F, ' + f.weatherConditions.windDirection + '</td>';
            });
        }
        
        // Update weather summary (Imperial units)
        const weatherSummary = document.getElementById('weather-summary');
        if (weatherSummary) {
            weatherSummary.innerHTML = 
                '<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #0ea5e9;">' +
                '<strong>Current Conditions:</strong> ' + forecast.weatherSummary.temperature + '°F, ' + 
                forecast.weatherSummary.conditions + '<br>' +
                '<strong>Wind:</strong> ' + forecast.weatherSummary.windSpeed + ' mph from ' + forecast.weatherSummary.windDirection + ' | ' +
                '<strong>Pressure:</strong> ' + forecast.weatherSummary.pressure + ' inHg<br>' +
                '<small>Last updated: ' + forecast.lastUpdated + '</small>' +
                '</div>';
        }
        
        // Update forecast info
        const forecastInfo = document.getElementById('ai-forecast-info');
        if (forecastInfo) {
            forecastInfo.innerHTML = '<p>AI-enhanced predictions based on weather patterns, historical data, and current conditions. Showing ' + 
                forecast.forecasts.length + ' species with migration probability > ' + AI_MIGRATION_CONFIG.UI_SETTINGS.show_probability_below + '%</p>';
        }
        
        console.log('AI migration forecast updated successfully (Imperial)');
        
    } catch (error) {
        console.error('Error updating AI migration forecast:', error);
        const forecastInfo = document.getElementById('ai-forecast-info');
        if (forecastInfo) {
            forecastInfo.innerHTML = '<p style="color: #ef4444;">Error loading weather data for AI predictions. Check console for details.</p>';
        }
    }
}

// Create migration probability chart
function createMigrationProbabilityChart() {
    const canvas = document.getElementById('migration-probability-chart');
    if (!canvas) {
        console.warn('Migration probability chart canvas not found');
        return;
    }
    
    console.log('Creating migration probability chart...');
    // Chart implementation would go here
}

// Load prediction details
async function loadPredictionDetails() {
    const factorsList = document.getElementById('prediction-factors-list');
    if (!factorsList) return;
    
    const forecast = await generateAIMigrationForecast();
    
    let detailsHTML = '';
    forecast.forecasts.forEach(function(f) {
        if (f.factors && f.factors.length > 0) {
            detailsHTML += '<div class="trigger-item" style="margin-bottom: 1rem;">';
            detailsHTML += '<strong>' + f.species + '</strong>';
            detailsHTML += '<div>Prediction factors: ' + f.factors.join(', ') + '</div>';
            detailsHTML += '</div>';
        }
    });
    
    factorsList.innerHTML = detailsHTML || '<div>No detailed factors available</div>';
}

// FIX #4: Event handlers for AI forecast functionality with CORRECT button IDs
function initializeAIMigrationEvents() {
    console.log('Initializing AI migration event handlers (Imperial - FIXED)...');
    
    // FIX: The correct button ID from Index.html is 'ai-forecast-refresh' (not 'refresh-ai-forecast')
    const refreshButton = document.getElementById('ai-forecast-refresh');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log('Refresh button clicked');
            updateAIMigrationForecast();
        });
        console.log('✅ AI forecast refresh button handler added (ID: ai-forecast-refresh)');
    } else {
        console.warn('⚠️ AI forecast refresh button not found (looking for ID: ai-forecast-refresh)');
    }
    
    // FIX: The correct button ID from Index.html is 'ai-forecast-details-toggle' (not 'toggle-forecast-details')
    const toggleButton = document.getElementById('ai-forecast-details-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const details = document.getElementById('ai-forecast-details');
            const button = this;
            
            if (details && details.style.display === 'none') {
                details.style.display = 'block';
                button.textContent = '📊 Hide Detailed Analysis';
                loadPredictionDetails();
            } else if (details) {
                details.style.display = 'none';
                button.textContent = '📊 Show Detailed Analysis';
            }
        });
        console.log('✅ AI forecast details toggle handler added (ID: ai-forecast-details-toggle)');
    } else {
        console.warn('⚠️ AI forecast details toggle button not found (looking for ID: ai-forecast-details-toggle)');
    }
}

// Initialize AI migration system (Imperial units)
function initializeAIMigrationSystem() {
    console.log('Initializing AI Migration Prediction System (Imperial Units - FIXED)...');
    
    // Check if required functions exist
    if (typeof getConfigurationStatus === 'function') {
        // Validate configuration
        const configStatus = getConfigurationStatus();
        if (!configStatus.isValid) {
            console.warn('AI Migration configuration issues:', configStatus.issues);
        }
    } else {
        console.warn('getConfigurationStatus function not found - check ai-migration-config.js');
    }
    
    // Initialize event handlers
    initializeAIMigrationEvents();
    
    // Initial data load
    updateAIMigrationForecast();
    createMigrationProbabilityChart();
    
    // Set up auto-refresh
    const updateInterval = AI_MIGRATION_CONFIG.UI_SETTINGS.update_frequency;
    setInterval(updateAIMigrationForecast, updateInterval);
    
    console.log('✅ AI Migration Prediction System initialized successfully (Imperial Units)');
}

console.log('✅ migration-prediction.js loaded successfully (Imperial Units - FIXED)');
console.log('initializeAIMigrationSystem function defined:', typeof initializeAIMigrationSystem);