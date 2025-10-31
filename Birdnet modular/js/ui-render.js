/**
 * UI Rendering Module - All DOM manipulation and UI updates
 */

import * as charts from './charts.js';
import { getTodayActiveSpecies, getDiversityMetrics, calculateComparisonStats } from './analytics.js';
import { getCurrentSeason, getSeasonalRecommendations, getSpeciesFeedingData, getFeedingDataForSpecies } from './feeding.js';
import { analyzeMigrationPatterns } from './migration.js';

// Store species images loaded from API
let speciesImagesCache = {};

// Store current species data for gallery filters
let currentSpeciesData = [];

/**
 * Set species images cache
 */
export function setSpeciesImages(images) {
    speciesImagesCache = images;
}

/**
 * Get species image URL from cache
 */
export function getSpeciesImageUrl(speciesName) {
    return speciesImagesCache[speciesName] || null;
}

/**
 * Update dashboard header stats
 */
export function updateDashboardHeader(analytics) {
    // Header stats removed - stats are now shown within individual tabs

    // Update filtered count (if filter info element exists)
    const filterInfo = document.getElementById('filter-info');
    if (filterInfo) {
        if (analytics.filteredDetections !== analytics.totalDetections) {
            filterInfo.textContent = `Showing ${analytics.filteredDetections} of ${analytics.totalDetections} detections`;
            filterInfo.style.display = 'block';
        } else {
            filterInfo.style.display = 'none';
        }
    }
}

/**
 * Render overview tab
 */
export function renderOverview(analytics, speciesData, detections) {
    // Daily activity chart
    charts.renderDailyChart(analytics.daily);

    // Top species list
    renderTopSpeciesList(analytics.topSpecies.slice(0, 10));

    // Today's active species
    renderTodayActiveSpecies(detections, speciesData);

    // Hourly pattern chart
    charts.renderHourlyChart(analytics.hourly);

    // Species distribution chart
    charts.renderDistributionChart(analytics.diversity);

    // Monthly trend
    charts.renderMonthlyChart(analytics.monthly);

    // NEW: Render comparison cards
    renderComparisonCards(detections, speciesData);

    // NEW: Render diversity metrics
    renderDiversityMetrics(speciesData);
}

/**
 * Render top species list
 */
export function renderTopSpeciesList(species) {
    const container = document.getElementById('top-species-list');
    if (!container) return;

    if (species.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦜</div><p>No species detected yet</p></div>';
        return;
    }

    container.innerHTML = species.map(s => {
        const imageUrl = getSpeciesImageUrl(s.name);
        return `
        <div class="species-item" onclick="window.showSpeciesDetail('${s.name.replace(/'/g, "\\'")}')">
            <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                ${!imageUrl ? '🐦' : ''}
            </div>
            <div class="species-info">
                <div class="species-name">${s.name}</div>
                <div class="species-meta">${(s.avgConfidence * 100).toFixed(1)}% confidence</div>
            </div>
            <div class="species-count">${s.count}</div>
        </div>
    `}).join('');
}

/**
 * Render today's active species grid
 */
export function renderTodayActiveSpecies(detections, speciesData) {
    const container = document.getElementById('today-species-grid');
    if (!container) return;

    const todaySpecies = getTodayActiveSpecies(detections, speciesData);

    if (todaySpecies.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">🦜</div><p>No species detected today yet</p></div>';
        return;
    }

    container.innerHTML = todaySpecies.map(s => {
        const thumbnail = s.thumbnail || getSpeciesImageUrl(s.name);
        return `
            <div class="today-species-card" onclick="window.showSpeciesDetail('${s.name.replace(/'/g, "\\'")}')">
                ${thumbnail ?
                    `<div class="today-species-image" style="background-image: url(${thumbnail})"></div>` :
                    `<div class="today-species-placeholder">🐦</div>`
                }
                <div class="today-species-name">${s.name}</div>
                <div class="today-species-count">${s.count} detection${s.count !== 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

/**
 * NEW: Render comparison cards
 */
export function renderComparisonCards(detections, speciesData) {
    const container = document.getElementById('comparison-cards');
    if (!container) return;

    const stats = calculateComparisonStats(detections, speciesData);

    const todayChange = stats.today.species - stats.yesterday.species;
    const weekChange = stats.thisWeek.species - stats.lastWeek.species;

    container.innerHTML = `
        <div class="comparison-card">
            <div class="comparison-label">Today</div>
            <div class="comparison-value">${stats.today.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-change ${todayChange >= 0 ? 'positive' : 'negative'}">
                ${todayChange >= 0 ? '↑' : '↓'} ${Math.abs(todayChange)} vs yesterday
            </div>
        </div>
        <div class="comparison-card">
            <div class="comparison-label">Yesterday</div>
            <div class="comparison-value">${stats.yesterday.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-meta">${stats.yesterday.detections} detections</div>
        </div>
        <div class="comparison-card">
            <div class="comparison-label">This Week</div>
            <div class="comparison-value">${stats.thisWeek.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-change ${weekChange >= 0 ? 'positive' : 'negative'}">
                ${weekChange >= 0 ? '↑' : '↓'} ${Math.abs(weekChange)} vs last week
            </div>
        </div>
        <div class="comparison-card">
            <div class="comparison-label">All Time</div>
            <div class="comparison-value">${stats.allTime.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-meta">${stats.allTime.detections.toLocaleString()} total detections</div>
        </div>
    `;
}

/**
 * NEW: Render diversity metrics
 */
export function renderDiversityMetrics(speciesData) {
    const container = document.getElementById('diversity-metrics');
    if (!container) return;

    const metrics = getDiversityMetrics(speciesData);

    container.innerHTML = `
        <div class="diversity-card">
            <div class="diversity-title">Shannon Diversity Index</div>
            <div class="diversity-value">${metrics.shannon.value}</div>
            <div class="diversity-interpretation">${metrics.shannon.interpretation}</div>
            <div class="diversity-description">${metrics.shannon.description}</div>
        </div>
        <div class="diversity-card">
            <div class="diversity-title">Simpson's Index</div>
            <div class="diversity-value">${metrics.simpson.value}</div>
            <div class="diversity-interpretation">${metrics.simpson.interpretation}</div>
            <div class="diversity-description">${metrics.simpson.description}</div>
        </div>
        <div class="diversity-card">
            <div class="diversity-title">Species Evenness</div>
            <div class="diversity-value">${metrics.evenness.value}</div>
            <div class="diversity-interpretation">${metrics.evenness.interpretation}</div>
            <div class="diversity-description">${metrics.evenness.description}</div>
        </div>
        <div class="diversity-card">
            <div class="diversity-title">Species Richness</div>
            <div class="diversity-value">${metrics.richness.value}</div>
            <div class="diversity-interpretation">Total Species</div>
            <div class="diversity-description">${metrics.richness.description}</div>
        </div>
    `;
}

/**
 * Render species tab
 */
export function renderSpecies(analytics, detections, speciesData) {
    const allSpecies = analytics.allSpecies;

    // Store species data for gallery filters
    currentSpeciesData = speciesData;

    // NEW: Render photo gallery
    renderPhotoGallery(speciesData, 'detections', 0);

    // Setup gallery controls
    setupGalleryControls();

    // Render all species list with search/filter capability
    const container = document.getElementById('all-species-container');
    if (!container) return;

    if (allSpecies.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦜</div><p>No species detected yet</p></div>';
        return;
    }

    container.innerHTML = allSpecies.map(s => {
        const imageUrl = getSpeciesImageUrl(s.name);
        const firstSeen = s.firstSeen.toLocaleDateString();
        const lastSeen = s.lastSeen.toLocaleDateString();

        return `
        <div class="species-card" onclick="window.showSpeciesDetail('${s.name.replace(/'/g, "\\'")}')">
            <div class="species-card-image${imageUrl ? '' : ' placeholder'}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                ${!imageUrl ? '🐦' : ''}
            </div>
            <div class="species-card-content">
                <div class="species-card-name">${s.name}</div>
                <div class="species-card-stats">
                    <span>${s.count} detections</span>
                    <span>${(s.avgConfidence * 100).toFixed(1)}% confidence</span>
                </div>
                <div class="species-card-dates">
                    <div>First: ${firstSeen}</div>
                    <div>Last: ${lastSeen}</div>
                </div>
            </div>
        </div>
    `}).join('');

    // NEW: Render confidence chart
    charts.renderConfidenceChart(detections);

    // NEW: Render calendar heatmap
    charts.renderCalendarHeatmap(detections);

    // NEW: Render next detection predictions
    renderNextDetectionPredictions(speciesData, detections);
}

/**
 * NEW: Render species photo gallery
 */
export function renderPhotoGallery(speciesData, sortBy = 'detections', minConfidence = 0) {
    const container = document.getElementById('photo-gallery');
    if (!container) return;

    // Filter species with images and above confidence threshold
    let filteredSpecies = speciesData.filter(sp => {
        const speciesName = sp.commonName || sp.common_name || sp.scientificName;
        const imageUrl = getSpeciesImageUrl(speciesName);
        const avgConfidence = (sp.avgConfidence || sp.avg_confidence || 0) * 100;
        return imageUrl && avgConfidence >= minConfidence;
    });

    // Sort based on selection
    switch (sortBy) {
        case 'detections':
            filteredSpecies.sort((a, b) => (b.detections || b.count || 0) - (a.detections || a.count || 0));
            break;
        case 'confidence':
            filteredSpecies.sort((a, b) => {
                const aConf = a.avgConfidence || a.avg_confidence || 0;
                const bConf = b.avgConfidence || b.avg_confidence || 0;
                return bConf - aConf;
            });
            break;
        case 'recent':
            filteredSpecies.sort((a, b) => {
                const aDate = new Date(a.lastSeen || a.last_seen || 0);
                const bDate = new Date(b.lastSeen || b.last_seen || 0);
                return bDate - aDate;
            });
            break;
        case 'alphabetical':
            filteredSpecies.sort((a, b) => {
                const aName = a.commonName || a.common_name || a.scientificName || '';
                const bName = b.commonName || b.common_name || b.scientificName || '';
                return aName.localeCompare(bName);
            });
            break;
    }

    if (filteredSpecies.length === 0) {
        container.innerHTML = '<div class="gallery-empty"><div class="empty-icon" style="font-size: 4rem;">📸</div><p>No species with photos match your criteria</p></div>';
        return;
    }

    container.innerHTML = filteredSpecies.map(sp => {
        const speciesName = sp.commonName || sp.common_name || sp.scientificName;
        const imageUrl = getSpeciesImageUrl(speciesName);
        const count = sp.detections || sp.count || 0;
        const confidence = ((sp.avgConfidence || sp.avg_confidence || 0) * 100).toFixed(1);
        const lastSeen = new Date(sp.lastSeen || sp.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="gallery-item" onclick="window.showSpeciesDetail('${speciesName.replace(/'/g, "\\'")}')">
                ${imageUrl ?
                    `<img src="${imageUrl}" alt="${speciesName}" class="gallery-item-image" loading="lazy">` :
                    `<div class="gallery-item-placeholder">🐦</div>`
                }
                <div class="gallery-item-badge">${confidence}%</div>
                <div class="gallery-item-info">
                    <div class="gallery-item-name">${speciesName}</div>
                    <div class="gallery-item-stats">
                        <span>${count} detections</span>
                        <span>Last: ${lastSeen}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Setup gallery controls
 */
function setupGalleryControls() {
    const sortSelect = document.getElementById('gallery-sort');
    const confidenceSlider = document.getElementById('confidence-filter');
    const confidenceLabel = document.getElementById('confidence-label');

    if (sortSelect && !sortSelect.dataset.initialized) {
        sortSelect.addEventListener('change', (e) => {
            const minConfidence = confidenceSlider ? parseInt(confidenceSlider.value) : 0;
            // Use currentSpeciesData from module scope instead of closure
            renderPhotoGallery(currentSpeciesData, e.target.value, minConfidence);
        });
        sortSelect.dataset.initialized = 'true';
    }

    if (confidenceSlider && !confidenceSlider.dataset.initialized) {
        confidenceSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            if (confidenceLabel) {
                confidenceLabel.textContent = `Min Confidence: ${value}%`;
            }
            const sortBy = sortSelect ? sortSelect.value : 'detections';
            // Use currentSpeciesData from module scope instead of closure
            renderPhotoGallery(currentSpeciesData, sortBy, parseInt(value));
        });
        confidenceSlider.dataset.initialized = 'true';
    }
}

/**
 * Render activity tab
 */
export function renderActivity(analytics, detections) {
    // Weekly heatmap
    charts.renderWeeklyHeatmap(analytics.weekly);

    // NEW: Hour × Day heatmap
    charts.renderHourDayHeatmap(detections);

    // NEW: Peak activity predictions
    renderPeakPredictions(detections);

    // Timeline
    renderTimeline(analytics.recent);

    // Rare species
    renderRareSpecies(analytics.rarest);
}

/**
 * Render timeline
 */
export function renderTimeline(recent) {
    const container = document.getElementById('activity-timeline');
    if (!container) return;

    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
        return;
    }

    container.innerHTML = recent.map(d => {
        const species = d.commonName || d.common_name || d.scientificName || 'Unknown';
        const date = d.timestamp.toLocaleDateString();
        const time = d.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const confidence = ((d.confidence || 0) * 100).toFixed(1);

        return `
            <div class="timeline-item">
                <div class="timeline-time">${date} at ${time}</div>
                <div class="timeline-content">
                    <strong>${species}</strong> detected (${confidence}% confidence)
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render rare species
 */
export function renderRareSpecies(rarest) {
    const container = document.getElementById('rare-species-list');
    if (!container) return;

    if (rarest.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No rare species yet</p></div>';
        return;
    }

    container.innerHTML = rarest.map(s => {
        const imageUrl = getSpeciesImageUrl(s.name);
        return `
        <div class="species-item">
            <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                ${!imageUrl ? '💎' : ''}
            </div>
            <div class="species-info">
                <div class="species-name">${s.name}</div>
                <div class="species-meta">Last seen: ${s.lastSeen.toLocaleDateString()}</div>
            </div>
            <div class="species-count">${s.count}</div>
        </div>
    `}).join('');
}

/**
 * Render migration tab
 */
export function renderMigration(speciesData) {
    const migrations = analyzeMigrationPatterns(speciesData);
    const container = document.getElementById('migration-calendar');

    if (!container) return;

    if (migrations.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦅</div><p>Not enough data to predict migration patterns</p></div>';
        return;
    }

    // Group by status
    const grouped = {
        present: migrations.filter(m => m.prediction.status === 'present'),
        expected: migrations.filter(m => m.prediction.status === 'expected'),
        migrating: migrations.filter(m => m.prediction.status === 'migrating'),
        departed: migrations.filter(m => m.prediction.status === 'departed')
    };

    const statusColors = {
        present: '#10b981',
        expected: '#3b82f6',
        migrating: '#f59e0b',
        departed: '#6b7280'
    };

    const statusLabels = {
        present: '✅ Currently Present',
        expected: '🔜 Expected Soon',
        migrating: '🦅 Migrating Through',
        departed: '📅 Departed'
    };

    let html = '';

    for (const [status, items] of Object.entries(grouped)) {
        if (items.length === 0) continue;

        html += `
            <div class="migration-section">
                <h3 class="migration-section-title" style="color: ${statusColors[status]}">
                    ${statusLabels[status]} (${items.length})
                </h3>
                <div class="migration-grid">
        `;

        items.forEach(m => {
            const imageUrl = getSpeciesImageUrl(m.species);
            const confidenceColor = m.confidence === 'high' ? '#10b981' : m.confidence === 'medium' ? '#f59e0b' : '#6b7280';

            html += `
                <div class="migration-card" style="border-left-color: ${statusColors[status]}">
                    <div class="migration-card-header">
                        <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                            ${!imageUrl ? '🐦' : ''}
                        </div>
                        <div class="migration-card-title">
                            <strong>${m.species}</strong>
                            <span class="migration-badge" style="background-color: ${statusColors[status]}">${m.pattern}</span>
                        </div>
                    </div>
                    <div class="migration-card-body">
                        <div class="migration-stat">
                            <span class="migration-label">First Seen</span>
                            <span class="migration-value">${m.firstSeen.toLocaleDateString()}</span>
                        </div>
                        <div class="migration-stat">
                            <span class="migration-label">Last Seen</span>
                            <span class="migration-value">${m.lastSeen.toLocaleDateString()}</span>
                        </div>
                        <div class="migration-stat">
                            <span class="migration-label">Detections</span>
                            <span class="migration-value">${m.detectionCount}</span>
                        </div>
                        ${m.prediction.countdown ? `
                        <div class="migration-countdown">
                            <div class="countdown-icon">⏰</div>
                            <div class="countdown-text">
                                <strong>Expected in ${m.prediction.countdown.text}</strong>
                                <small>Next arrival: ${m.prediction.nextDate?.toLocaleDateString()}</small>
                            </div>
                        </div>
                        ` : ''}
                        <div class="migration-prediction">
                            <strong>Prediction:</strong> ${m.prediction.message}
                        </div>
                        <div class="migration-confidence" style="color: ${confidenceColor}">
                            ${m.confidence} confidence
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render insights tab
 */
export async function renderInsights(analytics, speciesData, detections) {
    // Render diversity trends chart (default to daily view)
    renderDiversityTrends(detections, 'daily');

    // Render co-occurrence analysis
    renderCoOccurrence(detections);

    // Weather correlation (async)
    const weatherModule = await import('./weather.js');
    const weatherCorrelation = weatherModule.correlateWeatherWithActivity(detections);
    renderWeatherImpact(weatherCorrelation);

    // Enhanced predictions with weather
    try {
        const currentWeather = await weatherModule.getCurrentWeather();
        const forecast = await weatherModule.getWeatherForecast();
        const analyticsModule = window.analyticsModule;
        const predictions = analyticsModule.predictActivityWithWeather(detections, {
            current: currentWeather,
            forecast: forecast
        });
        renderEnhancedPredictions(predictions);
    } catch (error) {
        console.log('Weather forecast unavailable, showing basic predictions');
        const analyticsModule = window.analyticsModule;
        const predictions = analyticsModule.predictPeakActivity(detections, 7);
        renderEnhancedPredictions(predictions);
    }

    // Species comparison (show empty state initially)
    renderSpeciesComparison(null);

    // Render AI-powered insights
    const container = document.getElementById('insights-list');
    if (!container) return;

    if (analytics.insights.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💡</div><p>Not enough data for insights yet</p></div>';
        return;
    }

    container.innerHTML = analytics.insights.map(insight => `
        <div class="insight-card">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <h3 class="insight-title">${insight.title}</h3>
                <p class="insight-text">${insight.text}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Render feeding tab
 */
export function renderFeeding(speciesData) {
    renderSeasonalFeeding();
    renderSpeciesFeedingGuide(speciesData);
}

/**
 * Render seasonal feeding recommendations
 */
export function renderSeasonalFeeding() {
    const container = document.getElementById('seasonal-feeding');
    if (!container) return;

    const recommendations = getSeasonalRecommendations();

    container.innerHTML = `
        <div class="season-card">
            <div class="season-header">
                <span class="season-icon">${recommendations.icon}</span>
                <div>
                    <h3>${recommendations.title}</h3>
                    <span class="season-badge ${recommendations.badge}">${getCurrentSeason()}</span>
                </div>
            </div>
            <p class="season-description">${recommendations.description}</p>

            <div class="feeding-section">
                <h4>🌾 Recommended Foods</h4>
                <div class="food-grid">
                    ${recommendations.foods.map(food => `
                        <div class="food-card">
                            <strong>${food.name}</strong>
                            <p>${food.reason}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="feeding-section">
                <h4>💡 Seasonal Tips</h4>
                <ul class="tips-list">
                    ${recommendations.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Render species-specific feeding guide
 */
export function renderSpeciesFeedingGuide(speciesData) {
    const container = document.getElementById('species-feeding-guide');
    if (!container) return;

    const topSpecies = speciesData
        .sort((a, b) => (b.detections || b.count || 0) - (a.detections || a.count || 0))
        .slice(0, 20);

    const { speciesWithFeeding, allFoods, allFeeders } = getSpeciesFeedingData(topSpecies);

    if (speciesWithFeeding.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No feeding data available for your detected species</p></div>';
        return;
    }

    let html = `
        <div class="feeding-summary">
            <h3>🎯 Shopping List for Your Backyard</h3>
            <p>Based on your ${speciesWithFeeding.length} most common species with known preferences:</p>

            <div class="recommendation-grid">
                <div class="recommendation-card">
                    <h4>🌾 Food to Buy</h4>
                    <ul>
                        ${Object.entries(allFoods)
                            .sort((a, b) => b[1].length - a[1].length)
                            .slice(0, 8)
                            .map(([food, birds]) => `
                                <li>
                                    <strong>${food}</strong>
                                    <span class="food-count">Attracts ${birds.length} of your species</span>
                                </li>
                            `).join('')}
                    </ul>
                </div>

                <div class="recommendation-card">
                    <h4>🏠 Feeders to Use</h4>
                    <ul>
                        ${Object.entries(allFeeders)
                            .sort((a, b) => b[1].length - a[1].length)
                            .slice(0, 6)
                            .map(([feeder, birds]) => `
                                <li>
                                    <strong>${feeder}</strong>
                                    <span class="food-count">For ${birds.length} of your species</span>
                                </li>
                            `).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="species-feeding-list">
            <h3>🐦 Individual Species Preferences</h3>
            ${speciesWithFeeding.map(species => {
                const speciesName = species.displayName;
                const imageUrl = getSpeciesImageUrl(speciesName);
                const feedingData = getFeedingDataForSpecies(speciesName);
                if (!feedingData) return '';

                return `
                    <div class="species-feeding-card">
                        <div class="species-feeding-header">
                            <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                                ${!imageUrl ? '🐦' : ''}
                            </div>
                            <div>
                                <strong>${speciesName}</strong>
                                <div class="species-diet-badge">${feedingData.diet || 'Various'}</div>
                            </div>
                        </div>
                        <div class="feeding-details">
                            <div>
                                <strong>Favorite Foods:</strong>
                                <div class="food-tags">
                                    ${feedingData.foods.map(f => `<span class="food-tag">${f}</span>`).join('')}
                                </div>
                            </div>
                            <div>
                                <strong>Feeder Types:</strong>
                                <div class="food-tags">
                                    ${feedingData.feeder.map(f => `<span class="feeder-tag">${f}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Show species detail modal with Wikipedia integration
 */
export async function showSpeciesDetail(speciesName, analytics, speciesData, detections) {
    const species = analytics.allSpecies.find(s => s.name === speciesName);
    if (!species) return;

    // Try to find the original species data for scientific name
    let scientificName = null;
    if (speciesData) {
        const originalSpecies = speciesData.find(s =>
            (s.commonName || s.common_name || s.scientificName) === speciesName
        );
        if (originalSpecies) {
            scientificName = originalSpecies.scientificName || originalSpecies.scientific_name;
        }
    }

    // Get feeding preferences from database
    const feedingPrefs = getFeedingDataForSpecies(speciesName);

    // Get migration pattern
    let migrationStatus = null;
    if (speciesData) {
        const patterns = analyzeMigrationPatterns(speciesData);
        const pattern = patterns.find(p => p.species === speciesName);
        if (pattern) {
            migrationStatus = pattern.pattern;
        }
    }

    const imageUrl = getSpeciesImageUrl(speciesName);
    const modal = document.getElementById('species-modal');
    const modalContent = modal.querySelector('.species-modal-content');

    const firstSeen = species.firstSeen.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const lastSeen = species.lastSeen.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Show modal with enhanced info
    modalContent.innerHTML = `
        <button class="modal-close" onclick="window.closeSpeciesModal()">&times;</button>
        ${imageUrl ?
            `<div class="species-detail-image" style="background-image: url(${imageUrl})"></div>` :
            `<div class="species-detail-placeholder">🐦</div>`
        }
        <h2 class="species-detail-name">${speciesName}</h2>
        ${scientificName ? `<div class="species-scientific-name">${scientificName}</div>` : ''}

        <div class="species-detail-stats">
            <div class="stat">
                <div class="stat-label">Total Detections</div>
                <div class="stat-value">${species.count}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Avg Confidence</div>
                <div class="stat-value">${(species.avgConfidence * 100).toFixed(1)}%</div>
            </div>
            <div class="stat">
                <div class="stat-label">First Seen</div>
                <div class="stat-value">${firstSeen}</div>
            </div>
            <div class="stat">
                <div class="stat-label">Last Seen</div>
                <div class="stat-value">${lastSeen}</div>
            </div>
        </div>

        ${migrationStatus ? `
            <div class="species-detail-section">
                <h3>🦅 Migration Pattern</h3>
                <div class="migration-badge migration-${migrationStatus.toLowerCase()}">${migrationStatus}</div>
            </div>
        ` : ''}

        ${feedingPrefs ? `
            <div class="species-detail-section">
                <h3>🌾 Feeding Preferences</h3>
                <div class="feeding-info">
                    <div class="feeding-subsection">
                        <strong>Diet:</strong> ${feedingPrefs.diet}
                    </div>
                    <div class="feeding-subsection">
                        <strong>Favorite Foods:</strong>
                        <div class="food-tags">
                            ${feedingPrefs.foods.slice(0, 5).map(f => `<span class="food-tag">${f}</span>`).join('')}
                        </div>
                    </div>
                    <div class="feeding-subsection">
                        <strong>Recommended Feeders:</strong>
                        <div class="food-tags">
                            ${feedingPrefs.feeder.map(f => `<span class="feeder-tag">${f}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="species-info-section">
            <div class="loading-inline">
                <div class="spinner-small"></div>
                <span>Loading additional information...</span>
            </div>
        </div>
    `;

    modal.classList.add('active');

    // Fetch Wikipedia data
    try {
        const wikiData = await fetchWikipediaInfo(speciesName);
        const infoSection = modalContent.querySelector('.species-info-section');

        if (wikiData) {
            infoSection.innerHTML = `
                <div class="species-description">
                    <h3>About This Species</h3>
                    <p>${wikiData.extract}</p>
                    ${wikiData.url ? `<a href="${wikiData.url}" target="_blank" class="wiki-link">Read more on Wikipedia →</a>` : ''}
                </div>
                ${wikiData.conservation ? `
                    <div class="conservation-status">
                        <strong>Conservation Status:</strong> ${wikiData.conservation}
                    </div>
                ` : ''}
            `;
        } else {
            infoSection.innerHTML = `
                <div class="species-description">
                    <p style="color: var(--text-light); font-style: italic;">Additional information not available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching Wikipedia data:', error);
        const infoSection = modalContent.querySelector('.species-info-section');
        if (infoSection) {
            infoSection.innerHTML = `
                <div class="species-description">
                    <p style="color: var(--text-light); font-style: italic;">Unable to load additional information</p>
                </div>
            `;
        }
    }
}

/**
 * Fetch Wikipedia information for a species
 */
async function fetchWikipediaInfo(speciesName) {
    try {
        // Clean up the species name for search
        const searchName = speciesName.replace(/'/g, '').trim();

        // Use Wikipedia REST API
        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) return null;

        const data = await response.json();

        return {
            extract: data.extract || data.description || 'No description available.',
            url: data.content_urls?.desktop?.page || null,
            conservation: data.conservation_status || null
        };
    } catch (error) {
        console.error('Wikipedia fetch error:', error);
        return null;
    }
}

/**
 * Close species detail modal
 */
export function closeSpeciesModal() {
    const modal = document.getElementById('species-modal');
    modal.classList.remove('active');
}

/**
 * Show error message
 */
export function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        console.error('Error:', message);
        return;
    }

    errorContainer.innerHTML = `
        <div class="error-message">
            <span class="error-icon">⚠️</span>
            <span>${message}</span>
            <button class="error-close" onclick="this.parentElement.remove()">&times;</button>
        </div>
    `;
    errorContainer.style.display = 'block';

    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

/**
 * Show loading state
 */
export function showLoading() {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'flex';
}

/**
 * Hide loading state
 */
export function hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
}

/**
 * Show subtle refresh indicator (for background auto-refresh)
 */
export function showRefreshIndicator() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
    }
}

/**
 * Hide refresh indicator
 */
export function hideRefreshIndicator() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.remove('refreshing');
        refreshBtn.disabled = false;
    }
}

/**
 * Render diversity trends chart
 */
export function renderDiversityTrends(detections, periodType = 'daily') {
    const periods = periodType === 'daily' ? 30 : periodType === 'weekly' ? 12 : 12;
    const trendsData = window.analyticsModule.calculateDiversityTrends(detections, periodType, periods);
    charts.renderDiversityTrendsChart(trendsData);
}

/**
 * Render peak activity predictions
 */
export function renderPeakPredictions(detections) {
    const predictions = window.analyticsModule.predictPeakActivity(detections, 7);
    const container = document.getElementById('peak-predictions-container');

    if (!container) return;

    if (predictions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Not enough data to predict peak activity</p></div>';
        return;
    }

    let html = '<div class="prediction-grid">';

    predictions.forEach(pred => {
        const confidenceColor = pred.confidence === 'high' ? '#10b981' : pred.confidence === 'medium' ? '#f59e0b' : '#6b7280';
        const todayClass = pred.isToday ? ' prediction-today' : '';

        html += `
            <div class="prediction-card${todayClass}">
                <div class="prediction-header">
                    <div class="prediction-day">
                        <strong>${pred.dayName}</strong>
                        <span class="prediction-date">${pred.dateStr}</span>
                        ${pred.isToday ? '<span class="badge-today">Today</span>' : ''}
                    </div>
                </div>
                <div class="prediction-body">
                    <div class="prediction-peak">
                        <div class="prediction-icon">⏰</div>
                        <div class="prediction-time">
                            <strong>Peak: ${pred.timeRange}</strong>
                            <span>Expected ${pred.peakActivity} detections</span>
                        </div>
                    </div>
                    <div class="prediction-stats">
                        <div class="prediction-stat">
                            <span class="stat-label">Avg Activity</span>
                            <span class="stat-value">${pred.expectedActivity}/hour</span>
                        </div>
                        <div class="prediction-stat">
                            <span class="stat-label">Confidence</span>
                            <span class="stat-value" style="color: ${confidenceColor}">${pred.confidence}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render species co-occurrence analysis
 */
export function renderCoOccurrence(detections) {
    const coOccurrences = window.analyticsModule.calculateCoOccurrence(detections, 3);
    const container = document.getElementById('cooccurrence-container');

    if (!container) return;

    if (coOccurrences.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Not enough data to analyze species co-occurrence</p></div>';
        return;
    }

    let html = '<div class="cooccurrence-intro"><p>These species are frequently detected together within the same hour:</p></div>';
    html += '<div class="cooccurrence-list">';

    // Show top 15 pairs
    coOccurrences.slice(0, 15).forEach((pair, index) => {
        const strength = pair.count > 10 ? 'strong' : pair.count > 5 ? 'moderate' : 'weak';
        const strengthColor = strength === 'strong' ? '#10b981' : strength === 'moderate' ? '#3b82f6' : '#6b7280';

        html += `
            <div class="cooccurrence-item">
                <div class="cooccurrence-rank">#${index + 1}</div>
                <div class="cooccurrence-species">
                    <div class="species-pair">
                        <span class="species-name">${pair.species1}</span>
                        <span class="pair-connector">&</span>
                        <span class="species-name">${pair.species2}</span>
                    </div>
                </div>
                <div class="cooccurrence-metrics">
                    <span class="cooccurrence-count">${pair.count} times</span>
                    <span class="cooccurrence-strength" style="color: ${strengthColor}">${strength}</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render next detection predictions
 */
export function renderNextDetectionPredictions(speciesData, detections) {
    const predictions = window.analyticsModule.predictNextDetection(speciesData, detections);
    const container = document.getElementById('next-detection-container');

    if (!container) return;

    if (predictions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Not enough data to predict next detections</p></div>';
        return;
    }

    let html = '<div class="next-detection-grid">';

    // Show top 20 predictions
    predictions.slice(0, 20).forEach(pred => {
        const confidenceColor = pred.confidence === 'high' ? '#10b981' : pred.confidence === 'medium' ? '#f59e0b' : '#6b7280';
        const isOverdue = pred.hoursUntilNext < 0;
        const imageUrl = getSpeciesImageUrl(pred.species);

        html += `
            <div class="next-detection-card${isOverdue ? ' detection-overdue' : ''}">
                <div class="detection-header">
                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                        ${!imageUrl ? '🐦' : ''}
                    </div>
                    <div class="detection-species">
                        <strong>${pred.species}</strong>
                        <span class="detection-count">${pred.detectionCount} detections</span>
                    </div>
                </div>
                <div class="detection-body">
                    <div class="detection-prediction">
                        <div class="prediction-icon">${isOverdue ? '⚠️' : '🕐'}</div>
                        <div class="prediction-info">
                            <strong>${pred.message}</strong>
                            <small>${pred.nextExpected.toLocaleString()}</small>
                        </div>
                    </div>
                    <div class="detection-stats">
                        <div class="detection-stat">
                            <span class="stat-label">Avg Interval</span>
                            <span class="stat-value">${pred.avgInterval < 24 ? Math.round(pred.avgInterval) + 'h' : Math.round(pred.avgInterval / 24) + 'd'}</span>
                        </div>
                        <div class="detection-stat">
                            <span class="stat-label">Confidence</span>
                            <span class="stat-value" style="color: ${confidenceColor}">${pred.confidence}</span>
                        </div>
                    </div>
                    <div class="detection-last-seen">
                        Last seen: ${pred.lastSeen.toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render weather impact widget
 */
export function renderWeatherImpact(weatherCorrelation) {
    const container = document.getElementById('weather-impact-widget');
    if (!container) return;

    if (!weatherCorrelation || !weatherCorrelation.hasData || !weatherCorrelation.current) {
        container.innerHTML = '<div class="weather-widget"><div class="weather-header"><h3>🌤️ Weather Impact</h3><button class="btn-link" onclick="window.showWeatherSetup()">⚙️ Setup</button></div><div class="weather-empty"><p>Weather integration not configured</p><button class="btn-primary" onclick="window.showWeatherSetup()">Configure Weather</button></div></div>';
        return;
    }

    const analysis = weatherCorrelation.current;
    const activityClass = getActivityClass(analysis.activityScore);

    const factorsHTML = analysis.factors.length > 0 ? '<div class="weather-factors"><div class="factors-title">Impact Factors:</div>' + analysis.factors.map(f => '<div class="factor-item"><span class="factor-impact ' + (f.impact.startsWith('+') ? 'positive' : 'negative') + '">' + f.impact + '</span><span class="factor-name">' + f.factor + '</span><span class="factor-reason">' + f.reason + '</span></div>').join('') + '</div>' : '';

    const recsHTML = weatherCorrelation.recommendations.length > 0 ? '<div class="weather-recommendations">' + weatherCorrelation.recommendations.map(rec => '<div class="recommendation-item ' + rec.type + '"><span class="rec-icon">' + rec.icon + '</span><span class="rec-message">' + rec.message + '</span></div>').join('') + '</div>' : '';

    const rainHTML = analysis.rain > 0 ? '<div class="weather-detail-item"><span class="icon">🌧️</span><span>' + analysis.rain.toFixed(2) + '"</span></div>' : '';

    container.innerHTML = '<div class="weather-widget"><div class="weather-header"><h3>🌤️ Current Weather Impact</h3><button class="btn-link" onclick="window.showWeatherSetup()">⚙️</button></div><div class="weather-current"><div class="weather-main"><div class="weather-temp">' + Math.round(analysis.temperature) + '°F</div><div class="weather-condition">' + analysis.condition + '</div></div><div class="weather-details"><div class="weather-detail-item"><span class="icon">💨</span><span>' + Math.round(analysis.windSpeed) + ' mph</span></div><div class="weather-detail-item"><span class="icon">💧</span><span>' + analysis.humidity + '%</span></div>' + rainHTML + '</div></div><div class="weather-activity"><div class="activity-score ' + activityClass + '"><div class="activity-label">Bird Activity</div><div class="activity-value">' + analysis.activityLevel + '</div><div class="activity-score-num">' + analysis.activityScore + '/10</div></div><div class="activity-recent"><div class="recent-label">Last 2 hours</div><div class="recent-value">' + analysis.recentDetections + ' detections</div><div class="recent-rate">' + analysis.avgPerHour + '/hour</div></div></div>' + factorsHTML + recsHTML + '</div>';
}

/**
 * Render species comparison tool
 */
export function renderSpeciesComparison(comparison) {
    const container = document.getElementById('species-comparison-container');
    if (!container) return;

    if (!comparison || !comparison.species || comparison.species.length < 2) {
        container.innerHTML = '<div class="comparison-empty"><p>Select 2-4 species to compare</p><button class="btn-primary" onclick="window.showSpeciesSelector()">Select Species</button></div>';
        return;
    }

    const summaryHTML = comparison.summary.map(s => '<div class="summary-item">• ' + s + '</div>').join('');

    const speciesCardsHTML = comparison.species.map(species => {
        const hasData = species.count > 0;
        const statsHTML = hasData ? '<div class="species-card-stats"><div class="stat-item"><div class="stat-label">Avg Confidence</div><div class="stat-value">' + (species.avgConfidence * 100).toFixed(1) + '%</div></div><div class="stat-item"><div class="stat-label">First Seen</div><div class="stat-value">' + species.firstSeen.toLocaleDateString() + '</div></div></div><div class="species-peak-times"><div class="peak-label">Peak Activity Times:</div>' + species.peakHours.map((peak, i) => '<div class="peak-time-item"><span class="peak-rank">#' + (i + 1) + '</span><span class="peak-time">' + peak.label + '</span><span class="peak-count">' + peak.count + ' detections</span></div>').join('') + '</div>' : '<div class="no-data">No detections found</div>';

        return '<div class="comparison-species-card"><div class="species-card-header"><h4>' + species.name + '</h4><div class="species-card-count">' + species.count + ' detections</div></div>' + statsHTML + '</div>';
    }).join('');

    const overlapsHTML = comparison.overlaps.length > 0 ? '<div class="comparison-overlaps"><h4>Activity Overlap</h4><div class="overlaps-grid">' + comparison.overlaps.map(overlap => '<div class="overlap-item"><div class="overlap-species">' + overlap.species1 + ' & ' + overlap.species2 + '</div><div class="overlap-bar"><div class="overlap-fill" style="width: ' + overlap.overlapPercentage + '%"></div></div><div class="overlap-percentage">' + overlap.overlapPercentage + '%</div><div class="overlap-detail">' + overlap.overlapHours + '/' + overlap.totalHours + ' hours overlap</div></div>').join('') + '</div></div>' : '';

    container.innerHTML = '<div class="species-comparison"><div class="comparison-header"><h3>🆚 Species Comparison</h3><button class="btn-link" onclick="window.showSpeciesSelector()">Change Selection</button></div><div class="comparison-summary">' + summaryHTML + '</div><div class="comparison-grid">' + speciesCardsHTML + '</div>' + overlapsHTML + '<div class="comparison-chart"><canvas id="comparison-hourly-chart"></canvas></div></div>';

    renderComparisonChart(comparison.species);
}

/**
 * Render comparison hourly activity chart
 */
function renderComparisonChart(species) {
    const canvas = document.getElementById('comparison-hourly-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const colors = ['#667eea', '#f56565', '#48bb78', '#ed8936'];
    const datasets = species.map((s, index) => {
        const color = colors[index % colors.length];
        return {
            label: s.name,
            data: s.hourlyPattern,
            borderColor: color,
            backgroundColor: color + '33',
            borderWidth: 2,
            tension: 0.4,
            fill: false
        };
    });

    window.comparisonChart = new Chart(ctx, {
        type: 'line',
        data: { labels: hours.map(h => h + ':00'), datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: { display: true, text: 'Hourly Activity Comparison', font: { size: 16 } },
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Detections' } },
                x: { title: { display: true, text: 'Hour of Day' } }
            }
        }
    });
}

/**
 * Render enhanced predictions with weather
 */
export function renderEnhancedPredictions(predictions) {
    const container = document.getElementById('enhanced-predictions-container');
    if (!container) return;

    if (!predictions || predictions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No predictions available</p></div>';
        return;
    }

    const cardsHTML = predictions.slice(0, 7).map(pred => {
        const confidenceClass = pred.confidence >= 70 ? 'high' : pred.confidence >= 40 ? 'medium' : 'low';
        const hasWeather = pred.weather && pred.weather.temp;

        const weatherHTML = hasWeather ? '<div class="prediction-weather"><div class="weather-temp">' + Math.round(pred.weather.temp) + '°F</div><div class="weather-desc">' + pred.weather.description + '</div></div>' : '';

        const factorsHTML = pred.weatherFactors && pred.weatherFactors.length > 0 ? '<div class="prediction-factors">' + pred.weatherFactors.map(factor => '<div class="factor-tag">' + factor + '</div>').join('') + '</div>' : '';

        const adjustmentHTML = pred.weatherAdjustment ? '<div class="weather-adjustment ' + (pred.weatherAdjustment > 0 ? 'positive' : 'negative') + '">' + (pred.weatherAdjustment > 0 ? '+' : '') + pred.weatherAdjustment + '% weather impact</div>' : '';

        const peakTimesHTML = pred.peakTimes && pred.peakTimes.length > 0
            ? '<div class="prediction-times"><div class="times-label">Peak Times:</div>' + pred.peakTimes.slice(0, 2).map(time => '<div class="time-item">' + time.label + '</div>').join('') + '</div>'
            : '';

        return '<div class="enhanced-prediction-card"><div class="prediction-date"><div class="date-day">' + pred.date.toLocaleDateString('en-US', { weekday: 'short' }) + '</div><div class="date-date">' + pred.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</div></div>' + weatherHTML + '<div class="prediction-activity"><div class="activity-label">Expected Activity</div><div class="activity-confidence ' + confidenceClass + '"><div class="confidence-bar"><div class="confidence-fill" style="width: ' + pred.confidence + '%"></div></div><div class="confidence-value">' + pred.confidence + '%</div></div></div>' + peakTimesHTML + factorsHTML + adjustmentHTML + '</div>';
    }).join('');

    container.innerHTML = '<div class="enhanced-predictions-grid">' + cardsHTML + '</div>';
}

/**
 * Get activity class based on score
 */
function getActivityClass(score) {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'moderate';
    if (score >= 2) return 'low';
    return 'very-low';
}
