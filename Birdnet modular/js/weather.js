/**
 * Weather Module - Weather data integration and correlation
 */

const WEATHER_CONFIG = {
    get apiKey() {
        return localStorage.getItem('weather_api_key') || '';
    },
    set apiKey(value) {
        localStorage.setItem('weather_api_key', value);
    },
    get location() {
        const saved = localStorage.getItem('weather_location');
        return saved ? JSON.parse(saved) : null;
    },
    set location(value) {
        localStorage.setItem('weather_location', JSON.stringify(value));
    },
    cacheTimeout: 10 * 60 * 1000 // 10 minutes
};

/**
 * Get current weather data
 * Uses OpenWeatherMap API (free tier)
 */
export async function getCurrentWeather() {
    // Check if we have API key and location
    if (!WEATHER_CONFIG.apiKey || !WEATHER_CONFIG.location) {
        return null;
    }

    // Check cache first
    const cached = getCachedWeather();
    if (cached) {
        console.log('☀️ Using cached weather data');
        return cached;
    }

    try {
        const { lat, lon } = WEATHER_CONFIG.location;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_CONFIG.apiKey}&units=imperial`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Weather API request failed:', response.status);
            return null;
        }

        const data = await response.json();
        const weather = {
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            windGust: data.wind.gust || data.wind.speed,
            clouds: data.clouds.all,
            rain: data.rain?.['1h'] || 0,
            snow: data.snow?.['1h'] || 0,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            sunrise: data.sys.sunrise * 1000,
            sunset: data.sys.sunset * 1000,
            timestamp: Date.now()
        };

        // Cache the result
        cacheWeather(weather);
        console.log('☀️ Fetched fresh weather data:', weather);
        return weather;
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        return null;
    }
}

/**
 * Get weather forecast for next 5 days
 */
export async function getWeatherForecast() {
    if (!WEATHER_CONFIG.apiKey || !WEATHER_CONFIG.location) {
        return null;
    }

    try {
        const { lat, lon } = WEATHER_CONFIG.location;
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_CONFIG.apiKey}&units=imperial`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Weather forecast API request failed:', response.status);
            return null;
        }

        const data = await response.json();

        // Group by day and get daily averages
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = [];
            }
            dailyForecasts[date].push({
                temp: item.main.temp,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed,
                rain: item.rain?.['3h'] || 0,
                clouds: item.clouds.all,
                description: item.weather[0].description,
                icon: item.weather[0].icon
            });
        });

        // Calculate daily averages
        const forecast = Object.keys(dailyForecasts).slice(0, 5).map(date => {
            const dayData = dailyForecasts[date];
            return {
                date: new Date(date),
                temp: average(dayData.map(d => d.temp)),
                humidity: average(dayData.map(d => d.humidity)),
                windSpeed: average(dayData.map(d => d.windSpeed)),
                rain: sum(dayData.map(d => d.rain)),
                clouds: average(dayData.map(d => d.clouds)),
                description: dayData[Math.floor(dayData.length / 2)].description,
                icon: dayData[Math.floor(dayData.length / 2)].icon
            };
        });

        return forecast;
    } catch (error) {
        console.error('Failed to fetch weather forecast:', error);
        return null;
    }
}

/**
 * Correlate weather with bird activity
 */
export function correlateWeatherWithActivity(detections, weatherHistory = []) {
    if (detections.length === 0) {
        return getEmptyCorrelation();
    }

    // If no weather history provided, use current conditions for analysis
    const currentWeather = getCachedWeather();
    if (!currentWeather && weatherHistory.length === 0) {
        return getEmptyCorrelation();
    }

    // Group detections by hour to analyze activity patterns
    const hourlyActivity = {};
    detections.forEach(detection => {
        const date = parseDetectionDate(detection);
        const hour = date.getHours();
        const key = `${date.toDateString()}_${hour}`;

        if (!hourlyActivity[key]) {
            hourlyActivity[key] = {
                count: 0,
                date: date,
                hour: hour
            };
        }
        hourlyActivity[key].count++;
    });

    // Calculate current weather impact (simplified)
    const analysis = analyzeCurrentConditions(currentWeather, detections);

    return {
        current: analysis,
        hasData: true,
        recommendations: generateWeatherRecommendations(analysis)
    };
}

/**
 * Analyze how current weather conditions affect bird activity
 */
function analyzeCurrentConditions(weather, detections) {
    if (!weather) {
        return null;
    }

    // Get recent activity (last 2 hours)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const recentDetections = detections.filter(d => {
        const date = parseDetectionDate(d);
        return date.getTime() > twoHoursAgo;
    });

    const recentCount = recentDetections.length;
    const avgPerHour = recentCount / 2;

    // Determine activity level based on conditions
    let activityScore = 5; // Base score 1-10
    let factors = [];

    // Temperature impact (ideal: 60-75°F)
    if (weather.temp >= 60 && weather.temp <= 75) {
        activityScore += 2;
        factors.push({ factor: 'Temperature', impact: '+2', reason: 'Ideal temperature range' });
    } else if (weather.temp < 32 || weather.temp > 90) {
        activityScore -= 2;
        factors.push({ factor: 'Temperature', impact: '-2', reason: weather.temp < 32 ? 'Very cold' : 'Very hot' });
    } else if (weather.temp < 50 || weather.temp > 80) {
        activityScore -= 1;
        factors.push({ factor: 'Temperature', impact: '-1', reason: weather.temp < 50 ? 'Cold' : 'Hot' });
    }

    // Rain impact
    if (weather.rain > 0.1) {
        activityScore -= 3;
        factors.push({ factor: 'Rain', impact: '-3', reason: `${weather.rain.toFixed(2)}" rainfall` });
    }

    // Wind impact (high winds reduce activity)
    if (weather.windSpeed > 15) {
        activityScore -= 2;
        factors.push({ factor: 'Wind', impact: '-2', reason: `${weather.windSpeed.toFixed(0)} mph winds` });
    } else if (weather.windSpeed > 10) {
        activityScore -= 1;
        factors.push({ factor: 'Wind', impact: '-1', reason: `${weather.windSpeed.toFixed(0)} mph winds` });
    }

    // Cloud cover (some clouds are good, too many reduce activity)
    if (weather.clouds > 80) {
        activityScore -= 1;
        factors.push({ factor: 'Cloud Cover', impact: '-1', reason: 'Overcast' });
    } else if (weather.clouds >= 30 && weather.clouds <= 60) {
        activityScore += 1;
        factors.push({ factor: 'Cloud Cover', impact: '+1', reason: 'Partial clouds (comfortable)' });
    }

    // Normalize score to 1-10
    activityScore = Math.max(1, Math.min(10, activityScore));

    return {
        temperature: weather.temp,
        condition: weather.description,
        windSpeed: weather.windSpeed,
        humidity: weather.humidity,
        rain: weather.rain,
        activityScore: activityScore,
        activityLevel: getActivityLevel(activityScore),
        recentDetections: recentCount,
        avgPerHour: avgPerHour.toFixed(1),
        factors: factors
    };
}

/**
 * Generate recommendations based on weather analysis
 */
function generateWeatherRecommendations(analysis) {
    if (!analysis) return [];

    const recommendations = [];

    if (analysis.activityScore >= 8) {
        recommendations.push({
            type: 'positive',
            message: 'Perfect conditions for bird watching! High activity expected.',
            icon: '🌟'
        });
    }

    if (analysis.rain > 0.1) {
        recommendations.push({
            type: 'info',
            message: 'Birds may seek shelter during rain. Activity will increase after it stops.',
            icon: '🌧️'
        });
    }

    if (analysis.temperature < 40) {
        recommendations.push({
            type: 'tip',
            message: 'Cold weather - consider high-fat foods like suet and peanuts.',
            icon: '🥶'
        });
    }

    if (analysis.temperature > 85) {
        recommendations.push({
            type: 'warning',
            message: 'Hot weather - ensure fresh water is available. Clean feeders more frequently.',
            icon: '🔥'
        });
    }

    if (analysis.windSpeed > 15) {
        recommendations.push({
            type: 'info',
            message: 'Windy conditions reduce activity. Birds prefer sheltered areas.',
            icon: '💨'
        });
    }

    return recommendations;
}

/**
 * Get activity level label from score
 */
function getActivityLevel(score) {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Moderate';
    if (score >= 2) return 'Low';
    return 'Very Low';
}

/**
 * Parse detection date (import from api.js logic)
 */
function parseDetectionDate(detection) {
    if (detection.date && detection.time) {
        return new Date(`${detection.date}T${detection.time}`);
    }
    if (detection.begin_time) return new Date(detection.begin_time);
    if (detection.timestamp) return new Date(detection.timestamp);
    if (detection.DateTime) return new Date(detection.DateTime);
    return new Date();
}

/**
 * Cache weather data
 */
function cacheWeather(weather) {
    localStorage.setItem('weather_cache', JSON.stringify(weather));
}

/**
 * Get cached weather if still valid
 */
function getCachedWeather() {
    const cached = localStorage.getItem('weather_cache');
    if (!cached) return null;

    try {
        const weather = JSON.parse(cached);
        const age = Date.now() - weather.timestamp;

        if (age < WEATHER_CONFIG.cacheTimeout) {
            return weather;
        }
    } catch (e) {
        console.error('Failed to parse cached weather:', e);
    }

    return null;
}

/**
 * Get empty correlation result
 */
function getEmptyCorrelation() {
    return {
        current: null,
        hasData: false,
        recommendations: []
    };
}

/**
 * Utility functions
 */
function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

/**
 * Check if weather is configured
 */
export function isWeatherConfigured() {
    return !!(WEATHER_CONFIG.apiKey && WEATHER_CONFIG.location);
}

/**
 * Get weather configuration
 */
export function getWeatherConfig() {
    return {
        apiKey: WEATHER_CONFIG.apiKey,
        location: WEATHER_CONFIG.location
    };
}

/**
 * Set weather configuration
 */
export function setWeatherConfig(apiKey, location) {
    WEATHER_CONFIG.apiKey = apiKey;
    WEATHER_CONFIG.location = location;
}

/**
 * Clear weather cache
 */
export function clearWeatherCache() {
    localStorage.removeItem('weather_cache');
}
