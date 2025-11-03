/**
 * UI Rendering Module - All DOM manipulation and UI updates
 */

import * as charts from './charts.js';
import { getTodayActiveSpecies, getDiversityMetrics, calculateComparisonStats, getSpeciesForPeriod, calculateYearOverYear, calculateSpeciesStreaks, calculateRarityScores, detectActivityAnomalies, getMissingSpeciesAlerts, predictBestWatchTimes } from './analytics.js';
import { getCurrentSeason, getSeasonalRecommendations, getSpeciesFeedingData, getFeedingDataForSpecies } from './feeding.js';
import { analyzeMigrationPatterns } from './migration.js';
import * as AudioPlayer from './audio-player.js';

// Store species images loaded from API
let speciesImagesCache = {};

// Store current species data for gallery filters
let currentSpeciesData = [];

// Store current detections for period filtering
let currentDetections = [];

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
    // Store detections for period filtering
    currentDetections = detections;

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
        <div class="comparison-card clickable" onclick="window.showPeriodSpecies('today')">
            <div class="comparison-label">Today</div>
            <div class="comparison-value">${stats.today.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-change ${todayChange >= 0 ? 'positive' : 'negative'}">
                ${todayChange >= 0 ? '↑' : '↓'} ${Math.abs(todayChange)} vs yesterday
            </div>
        </div>
        <div class="comparison-card clickable" onclick="window.showPeriodSpecies('yesterday')">
            <div class="comparison-label">Yesterday</div>
            <div class="comparison-value">${stats.yesterday.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-meta">${stats.yesterday.detections} detections</div>
        </div>
        <div class="comparison-card clickable" onclick="window.showPeriodSpecies('thisWeek')">
            <div class="comparison-label">This Week</div>
            <div class="comparison-value">${stats.thisWeek.species}</div>
            <div class="comparison-subtext">species</div>
            <div class="comparison-change ${weekChange >= 0 ? 'positive' : 'negative'}">
                ${weekChange >= 0 ? '↑' : '↓'} ${Math.abs(weekChange)} vs last week
            </div>
        </div>
        <div class="comparison-card clickable" onclick="window.showPeriodSpecies('allTime')">
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
    // Store species data for gallery filters
    currentSpeciesData = speciesData;

    // Render unified species gallery (now shows ALL species)
    renderPhotoGallery(speciesData, 'detections', 0);

    // Setup gallery controls
    setupGalleryControls();

    // Render charts
    charts.renderConfidenceChart(detections);
    charts.renderCalendarHeatmap(detections);

    // Render next detection predictions
    renderNextDetectionPredictions(speciesData, detections);
}

/**
 * NEW: Render species photo gallery (now shows ALL species)
 */
export function renderPhotoGallery(speciesData, sortBy = 'detections', minConfidence = 0) {
    const container = document.getElementById('photo-gallery');
    if (!container) return;

    // Filter ALL species by confidence threshold (no longer filtering by images)
    let filteredSpecies = speciesData.filter(sp => {
        const avgConfidence = (sp.avgConfidence || sp.avg_confidence || 0) * 100;
        return avgConfidence >= minConfidence;
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
        container.innerHTML = '<div class="gallery-empty"><div class="empty-icon" style="font-size: 4rem;">🐦</div><p>No species match your criteria</p></div>';
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
    console.log('💡 renderInsights CALLED:', {
        analyticsExists: !!analytics,
        speciesCount: speciesData?.length || 0,
        detectionsCount: detections?.length || 0
    });

    // Activity anomalies (today's alerts)
    try {
        renderActivityAnomalies(detections, speciesData);
    } catch (error) {
        console.error('Error in renderActivityAnomalies:', error);
    }

    // Missing species alerts
    try {
        renderMissingSpeciesAlerts(speciesData, detections);
    } catch (error) {
        console.error('Error in renderMissingSpeciesAlerts:', error);
    }

    // Best watch times
    try {
        renderBestWatchTimes(detections);
    } catch (error) {
        console.error('Error in renderBestWatchTimes:', error);
    }

    // Predictive alerts (NEW)
    try {
        console.log('🎯 About to call renderPredictiveAlerts');
        renderPredictiveAlerts(detections, speciesData);
    } catch (error) {
        console.error('❌ Error in renderPredictiveAlerts:', error);
    }

    // Personalized recommendations (NEW)
    try {
        console.log('🎯 About to call renderPersonalizedRecommendations');
        renderPersonalizedRecommendations(detections, speciesData);
    } catch (error) {
        console.error('❌ Error in renderPersonalizedRecommendations:', error);
    }

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

    // Filter detections for this species
    const speciesDetections = detections.filter(d => {
        const detectionName = d.commonName || d.common_name || d.species || d.scientificName;
        return detectionName === speciesName;
    });

    // Create audio player component
    const audioPlayerHTML = AudioPlayer.createAudioPlayer(speciesDetections);

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

        <div class="species-detail-section">
            <h3>🔊 Audio Recordings</h3>
            ${audioPlayerHTML}
        </div>

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
    // Stop any playing audio
    AudioPlayer.stopCurrentAudio();

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
 * Show species for a specific time period in a modal
 */
export function showPeriodSpecies(period) {
    const periodData = getSpeciesForPeriod(period, currentDetections, currentSpeciesData);

    if (!periodData || periodData.species.length === 0) {
        return;
    }

    const modal = document.getElementById('period-species-modal');
    if (!modal) {
        console.error('Period species modal not found');
        return;
    }

    const modalContent = modal.querySelector('.modal-content');

    // Build species list HTML
    const speciesListHTML = periodData.species.map(species => {
        const imageUrl = getSpeciesImageUrl(species.name);
        return `
            <div class="species-item" onclick="window.showSpeciesDetail('${species.name.replace(/'/g, "\\'")}'); window.closePeriodModal();">
                <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                    ${!imageUrl ? '🐦' : ''}
                </div>
                <div class="species-info">
                    <div class="species-name">${species.name}</div>
                    <div class="species-meta">${species.count} detection${species.count !== 1 ? 's' : ''}</div>
                </div>
                <div class="species-count">${(species.avgConfidence * 100).toFixed(1)}%</div>
            </div>
        `;
    }).join('');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${periodData.label} Species</h2>
            <button class="modal-close" onclick="window.closePeriodModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="period-species-stats">
                <div class="stat-item">
                    <span class="stat-value">${periodData.species.length}</span>
                    <span class="stat-label">Unique Species</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${periodData.totalDetections}</span>
                    <span class="stat-label">Total Detections</span>
                </div>
            </div>
            <div class="species-list">
                ${speciesListHTML}
            </div>
        </div>
    `;

    modal.classList.add('active');
}

/**
 * Close period species modal
 */
export function closePeriodModal() {
    const modal = document.getElementById('period-species-modal');
    if (modal) {
        modal.classList.remove('active');
    }
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

/**
 * Render year-over-year comparison
 */
export function renderYearOverYear(detections, speciesData) {
    const container = document.getElementById('year-over-year-container');
    if (!container) return;

    const yoyData = calculateYearOverYear(detections, speciesData);

    if (!yoyData.lastYear.species || yoyData.lastYear.species === 0) {
        container.innerHTML = '<div class="empty-state"><p>Need at least one year of data for year-over-year comparison</p></div>';
        return;
    }

    const speciesChangeClass = parseInt(yoyData.changes.species) >= 0 ? 'positive' : 'negative';
    const detectionChangeClass = parseInt(yoyData.changes.detections) >= 0 ? 'positive' : 'negative';

    let html = `
        <div class="yoy-summary">
            <div class="yoy-card">
                <div class="yoy-label">This Year (YTD)</div>
                <div class="yoy-value">${yoyData.thisYear.species}</div>
                <div class="yoy-subtext">species</div>
                <div class="yoy-meta">${yoyData.thisYear.detections.toLocaleString()} detections</div>
            </div>
            <div class="yoy-card">
                <div class="yoy-label">Last Year (Same Period)</div>
                <div class="yoy-value">${yoyData.lastYear.species}</div>
                <div class="yoy-subtext">species</div>
                <div class="yoy-meta">${yoyData.lastYear.detections.toLocaleString()} detections</div>
            </div>
            <div class="yoy-card ${speciesChangeClass}">
                <div class="yoy-label">Species Change</div>
                <div class="yoy-value">${yoyData.changes.species >= 0 ? '+' : ''}${yoyData.changes.species}</div>
                <div class="yoy-subtext">${yoyData.changes.speciesPercent >= 0 ? '+' : ''}${yoyData.changes.speciesPercent}%</div>
            </div>
            <div class="yoy-card ${detectionChangeClass}">
                <div class="yoy-label">Detection Change</div>
                <div class="yoy-value">${yoyData.changes.detections >= 0 ? '+' : ''}${yoyData.changes.detections}</div>
                <div class="yoy-subtext">${yoyData.changes.detectionsPercent >= 0 ? '+' : ''}${yoyData.changes.detectionsPercent}%</div>
            </div>
        </div>
    `;

    if (yoyData.newSpecies.length > 0) {
        html += `
            <div class="yoy-highlights">
                <h4>🆕 New Species This Year (${yoyData.newSpecies.length})</h4>
                <div class="species-chips">
                    ${yoyData.newSpecies.slice(0, 10).map(s => `<span class="species-chip">${s}</span>`).join('')}
                    ${yoyData.newSpecies.length > 10 ? `<span class="species-chip-more">+${yoyData.newSpecies.length - 10} more</span>` : ''}
                </div>
            </div>
        `;
    }

    if (yoyData.missingSpecies.length > 0) {
        html += `
            <div class="yoy-highlights">
                <h4>❓ Not Seen This Year (${yoyData.missingSpecies.length})</h4>
                <div class="species-chips">
                    ${yoyData.missingSpecies.slice(0, 10).map(s => `<span class="species-chip missing">${s}</span>`).join('')}
                    ${yoyData.missingSpecies.length > 10 ? `<span class="species-chip-more">+${yoyData.missingSpecies.length - 10} more</span>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render species streaks
 */
export function renderSpeciesStreaks(detections, speciesData) {
    const container = document.getElementById('species-streaks-container');
    if (!container) return;

    const streaks = calculateSpeciesStreaks(detections, speciesData);

    if (streaks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No active streaks yet</p></div>';
        return;
    }

    const activeStreaks = streaks.filter(s => s.isActive);
    const inactiveStreaks = streaks.filter(s => !s.isActive).slice(0, 5);

    let html = '';

    if (activeStreaks.length > 0) {
        html += `
            <div class="streaks-section">
                <h4>🔥 Active Streaks (${activeStreaks.length})</h4>
                <div class="streaks-list">
                    ${activeStreaks.map(streak => {
                        const imageUrl = getSpeciesImageUrl(streak.species);
                        return `
                            <div class="streak-card active">
                                <div class="streak-header">
                                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                                        ${!imageUrl ? '🐦' : ''}
                                    </div>
                                    <div class="streak-info">
                                        <strong>${streak.species}</strong>
                                        <span class="streak-dates">Last seen: ${streak.lastSeen.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="streak-stats">
                                    <div class="streak-stat current">
                                        <div class="streak-icon">🔥</div>
                                        <div class="streak-numbers">
                                            <div class="streak-value">${streak.currentStreak}</div>
                                            <div class="streak-label">Current</div>
                                        </div>
                                    </div>
                                    <div class="streak-stat best">
                                        <div class="streak-icon">🏆</div>
                                        <div class="streak-numbers">
                                            <div class="streak-value">${streak.bestStreak}</div>
                                            <div class="streak-label">Best Ever</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (inactiveStreaks.length > 0) {
        html += `
            <div class="streaks-section">
                <h4>📊 Past Streaks (Best Records)</h4>
                <div class="streaks-list">
                    ${inactiveStreaks.map(streak => {
                        const imageUrl = getSpeciesImageUrl(streak.species);
                        return `
                            <div class="streak-card inactive">
                                <div class="streak-header">
                                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                                        ${!imageUrl ? '🐦' : ''}
                                    </div>
                                    <div class="streak-info">
                                        <strong>${streak.species}</strong>
                                        <span class="streak-dates">Last seen: ${streak.lastSeen.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="streak-stats">
                                    <div class="streak-stat best">
                                        <div class="streak-icon">🏆</div>
                                        <div class="streak-numbers">
                                            <div class="streak-value">${streak.bestStreak}</div>
                                            <div class="streak-label">Best Streak</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render rarity scores
 */
export function renderRarityScores(speciesData, detections) {
    const container = document.getElementById('rarity-scores-container');
    if (!container) return;

    const rarityScores = calculateRarityScores(speciesData, detections);

    if (rarityScores.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No species data available</p></div>';
        return;
    }

    const html = rarityScores.slice(0, 20).map(score => {
        const imageUrl = getSpeciesImageUrl(score.species);
        const rarityClass = score.rarityLevel.toLowerCase().replace(' ', '-');

        return `
            <div class="rarity-card ${rarityClass}" onclick="window.showSpeciesDetail('${score.species.replace(/'/g, "\\'")}')">
                <div class="rarity-header">
                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                        ${!imageUrl ? '🐦' : ''}
                    </div>
                    <div class="rarity-info">
                        <strong>${score.species}</strong>
                        <span class="rarity-badge ${rarityClass}">${score.rarityLevel}</span>
                    </div>
                </div>
                <div class="rarity-stats">
                    <div class="rarity-score">
                        <div class="score-bar">
                            <div class="score-fill ${rarityClass}" style="width: ${score.rarityScore}%"></div>
                        </div>
                        <span class="score-value">${score.rarityScore}/100</span>
                    </div>
                    <div class="rarity-meta">
                        ${score.detections} detection${score.detections !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="rarity-list">${html}</div>`;
}

/**
 * Render activity anomalies
 */
export function renderActivityAnomalies(detections, speciesData) {
    const container = document.getElementById('activity-anomalies-container');
    if (!container) return;

    const anomalies = detectActivityAnomalies(detections, speciesData);

    if (anomalies.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No unusual activity detected today</p></div>';
        return;
    }

    const html = anomalies.map(anomaly => {
        const typeClass = anomaly.type;
        return `
            <div class="anomaly-card ${typeClass}">
                <div class="anomaly-icon">${anomaly.icon}</div>
                <div class="anomaly-content">
                    <div class="anomaly-message">${anomaly.message}</div>
                    ${anomaly.average ? `<div class="anomaly-details">30-day average: ${anomaly.average} per day</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="anomalies-header">
            <h4>⚡ Today's Activity Alerts</h4>
            <span class="anomalies-count">${anomalies.length} alert${anomalies.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="anomalies-list">${html}</div>
    `;
}

/**
 * Render best watch times
 */
export function renderBestWatchTimes(detections) {
    const container = document.getElementById('best-watch-times-container');
    if (!container) return;

    const watchTimes = predictBestWatchTimes(detections);

    if (!watchTimes.today || watchTimes.today.bestTimes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Need more data to predict best watch times</p></div>';
        return;
    }

    const today = watchTimes.today;
    const html = `
        <div class="watch-times-today">
            <h4>⏰ Best Times Today (${today.day})</h4>
            <div class="best-times-list">
                ${today.bestTimes.map((time, index) => `
                    <div class="best-time-card rank-${index + 1}">
                        <div class="time-rank">#${index + 1}</div>
                        <div class="time-info">
                            <div class="time-label">${time.label}</div>
                            <div class="time-range">${time.time}</div>
                        </div>
                        <div class="time-activity">
                            <div class="activity-value">${time.activity}</div>
                            <div class="activity-label">detections</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="watch-times-weekly">
            <h4>📅 Weekly Pattern</h4>
            <div class="weekly-times-grid">
                ${watchTimes.weekly.map(day => `
                    <div class="weekly-day ${day.day === today.day ? 'today' : ''}">
                        <div class="day-name">${day.day.slice(0, 3)}</div>
                        <div class="day-best-time">${day.bestTimes[0].hour}:00</div>
                        <div class="day-activity">${day.peakActivity}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Render missing species alerts
 */
export function renderMissingSpeciesAlerts(speciesData, detections) {
    const container = document.getElementById('missing-species-container');
    if (!container) return;

    const alerts = getMissingSpeciesAlerts(speciesData, detections);

    if (alerts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>All regular visitors are on schedule!</p></div>';
        return;
    }

    const html = alerts.map(alert => {
        const imageUrl = getSpeciesImageUrl(alert.species);
        const urgencyClass = alert.urgency;

        return `
            <div class="missing-species-card ${urgencyClass}" onclick="window.showSpeciesDetail('${alert.species.replace(/'/g, "\\'")}')">
                <div class="missing-header">
                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                        ${!imageUrl ? '🐦' : ''}
                    </div>
                    <div class="missing-info">
                        <strong>${alert.species}</strong>
                        <span class="urgency-badge ${urgencyClass}">${alert.urgency} urgency</span>
                    </div>
                </div>
                <div class="missing-stats">
                    <div class="missing-stat">
                        <span class="stat-label">Last Seen</span>
                        <span class="stat-value">${alert.daysSinceLastSeen} days ago</span>
                    </div>
                    <div class="missing-stat">
                        <span class="stat-label">Usually Every</span>
                        <span class="stat-value">${alert.avgDaysBetween} days</span>
                    </div>
                    <div class="missing-stat">
                        <span class="stat-label">Overdue By</span>
                        <span class="stat-value">${alert.daysOverdue} days</span>
                    </div>
                </div>
                <div class="missing-message">${alert.message}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="missing-header-section">
            <h4>❓ Missing Regular Visitors</h4>
            <span class="missing-count">${alerts.length} species</span>
        </div>
        <div class="missing-list">${html}</div>
    `;
}

/**
 * Render Trends tab (Historical Patterns)
 */
export async function renderTrends(analytics, speciesData, detections) {
    console.log('📈 renderTrends called');

    // Year-over-Year Comparison
    try {
        renderYearOverYear(detections, speciesData);
    } catch (error) {
        console.error('Error in renderYearOverYear:', error);
    }

    // Species Streaks
    try {
        renderSpeciesStreaks(detections, speciesData);
    } catch (error) {
        console.error('Error in renderSpeciesStreaks:', error);
    }

    // Species Timeline (NEW)
    try {
        console.log('🎯 About to call renderSpeciesTimeline');
        renderSpeciesTimeline(detections, speciesData);
    } catch (error) {
        console.error('❌ Error in renderSpeciesTimeline:', error);
    }

    // Heatmap Calendar (NEW)
    try {
        console.log('🎯 About to call renderHeatmapCalendar');
        renderHeatmapCalendar(detections);
    } catch (error) {
        console.error('❌ Error in renderHeatmapCalendar:', error);
    }

    // Diversity Trends chart
    try {
        renderDiversityTrends(detections, 'daily');
    } catch (error) {
        console.error('Error in renderDiversityTrends:', error);
    }

    // Enhanced Predictions with weather
    try {
        const weatherModule = await import('./weather.js');
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
}

/**
 * Render Analytics tab (Deep Dive)
 */
export async function renderAnalytics(analytics, speciesData, detections) {
    console.log('🔬 renderAnalytics called');

    // Rarity Scores
    try {
        renderRarityScores(speciesData, detections);
    } catch (error) {
        console.error('Error in renderRarityScores:', error);
    }

    // Co-occurrence Analysis
    try {
        renderCoOccurrence(detections);
    } catch (error) {
        console.error('Error in renderCoOccurrence:', error);
    }

    // Weather correlation
    try {
        const weatherModule = await import('./weather.js');
        const weatherCorrelation = weatherModule.correlateWeatherWithActivity(detections);
        renderWeatherImpact(weatherCorrelation);
    } catch (error) {
        console.error('Error in weather correlation:', error);
    }

    // Species comparison (show empty state initially)
    try {
        renderSpeciesComparison(null);
    } catch (error) {
        console.error('Error in renderSpeciesComparison:', error);
    }

    // Bubble chart visualization (NEW)
    try {
        console.log('🎯 About to call renderBubbleChart');
        renderBubbleChart(speciesData, detections);
    } catch (error) {
        console.error('❌ Error in renderBubbleChart:', error);
    }

    // Milestone progress tracking (NEW)
    try {
        console.log('🎯 About to call renderMilestones');
        renderMilestones(speciesData, detections);
    } catch (error) {
        console.error('❌ Error in renderMilestones:', error);
    }
}

/**
 * Render heatmap calendar (GitHub-style contribution calendar)
 */
export function renderHeatmapCalendar(detections) {
    const container = document.getElementById('heatmap-calendar-container');
    if (!container) {
        console.warn('Heatmap container not found');
        return;
    }

    console.log('Rendering heatmap calendar with', detections.length, 'detections');

    if (!window.analyticsModule || !window.analyticsModule.generateHeatmapData) {
        console.error('generateHeatmapData not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const heatmapData = window.analyticsModule.generateHeatmapData(detections, 365);
    console.log('Generated heatmap data:', heatmapData.length, 'days');

    if (heatmapData.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No data available for heatmap</p></div>';
        return;
    }

    // Group by week
    const weeks = new Map();
    heatmapData.forEach(day => {
        if (!weeks.has(day.weekOfYear)) {
            weeks.set(day.weekOfYear, []);
        }
        weeks.get(day.weekOfYear).push(day);
    });

    const intensityColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

    let html = '<div class="heatmap-calendar">';
    html += '<div class="heatmap-months"></div>'; // Month labels
    html += '<div class="heatmap-grid">';

    // Render weeks
    weeks.forEach((days, weekNum) => {
        html += '<div class="heatmap-week">';
        for (let dow = 0; dow < 7; dow++) {
            const day = days.find(d => d.dayOfWeek === dow);
            if (day) {
                const color = intensityColors[day.intensity];
                html += `<div class="heatmap-day"
                    style="background-color: ${color}"
                    title="${day.dateString}: ${day.count} detections"
                    data-count="${day.count}"
                    data-date="${day.dateString}">
                </div>`;
            } else {
                html += '<div class="heatmap-day-empty"></div>';
            }
        }
        html += '</div>';
    });

    html += '</div>'; // heatmap-grid
    html += '<div class="heatmap-legend">';
    html += '<span>Less</span>';
    intensityColors.forEach((color, i) => {
        html += `<div class="legend-square" style="background-color: ${color}"></div>`;
    });
    html += '<span>More</span>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Render species timeline
 */
export function renderSpeciesTimeline(detections, speciesData) {
    const container = document.getElementById('species-timeline-container');
    if (!container) {
        console.warn('Timeline container not found');
        return;
    }

    console.log('Rendering species timeline with', speciesData.length, 'species');

    if (!window.analyticsModule || !window.analyticsModule.generateSpeciesTimeline) {
        console.error('generateSpeciesTimeline not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const timeline = window.analyticsModule.generateSpeciesTimeline(detections, speciesData);
    console.log('Generated timeline:', timeline.length, 'species');

    if (timeline.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No timeline data available</p></div>';
        return;
    }

    // Show top 20 species by total detections
    const topSpecies = timeline
        .sort((a, b) => b.totalDetections - a.totalDetections)
        .slice(0, 20);

    let html = '<div class="timeline-chart">';

    topSpecies.forEach(item => {
        const imageUrl = getSpeciesImageUrl(item.species);
        const startMonth = item.firstSeen.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = item.lastSeen.toLocaleDateString('en-US', { month: 'short' });

        html += `
            <div class="timeline-row">
                <div class="timeline-species-label">
                    <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                        ${!imageUrl ? '🐦' : ''}
                    </div>
                    <div class="timeline-species-info">
                        <strong>${item.species}</strong>
                        <span>${item.totalDetections} detections</span>
                    </div>
                </div>
                <div class="timeline-bar-container">
                    <div class="timeline-bar" style="left: ${getMonthOffset(item.firstSeen)}%; width: ${getMonthWidth(item.firstSeen, item.lastSeen)}%">
                        <span class="timeline-start">${startMonth}</span>
                        <span class="timeline-end">${endMonth}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Helper functions for timeline
function getMonthOffset(date) {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const diffTime = date - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays / 365) * 100;
}

function getMonthWidth(startDate, endDate) {
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max((diffDays / 365) * 100, 2); // Minimum 2% width
}

/**
 * Render bubble chart
 */
export function renderBubbleChart(speciesData, detections) {
    const container = document.getElementById('bubble-chart-container');
    if (!container) {
        console.warn('Bubble chart container not found');
        return;
    }

    console.log('Rendering bubble chart with', speciesData.length, 'species');

    if (!window.analyticsModule || !window.analyticsModule.generateBubbleChartData) {
        console.error('generateBubbleChartData not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const bubbleData = window.analyticsModule.generateBubbleChartData(speciesData, detections);
    console.log('Generated bubble data:', bubbleData.length, 'bubbles');

    if (bubbleData.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No data available for bubble chart</p></div>';
        return;
    }

    // Show top 30 species
    const topBubbles = bubbleData
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);

    let html = '<div class="bubble-chart">';
    html += '<div class="bubble-chart-info">Size = Rarity Score, Color = Confidence</div>';
    html += '<div class="bubble-container">';

    topBubbles.forEach((bubble, index) => {
        const size = Math.max(30, Math.min(100, bubble.size)); // Scale size 30-100px
        const confidenceColor = bubble.y >= 80 ? '#10b981' : bubble.y >= 60 ? '#3b82f6' : '#f59e0b';

        html += `
            <div class="bubble"
                style="width: ${size}px; height: ${size}px; background-color: ${confidenceColor}; opacity: 0.7;"
                title="${bubble.species}: ${bubble.count} detections, ${bubble.y.toFixed(1)}% confidence, ${bubble.size} rarity"
                onclick="window.showSpeciesDetail('${bubble.species.replace(/'/g, "\\'")}')">
                <div class="bubble-label">${bubble.species.split(' ')[0]}</div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div class="bubble-legend">';
    html += '<span style="color: #10b981">■</span> High Confidence (80%+) ';
    html += '<span style="color: #3b82f6">■</span> Medium (60-80%) ';
    html += '<span style="color: #f59e0b">■</span> Lower (<60%)';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Render predictive alerts
 */
export function renderPredictiveAlerts(detections, speciesData) {
    const container = document.getElementById('predictive-alerts-container');
    if (!container) {
        console.warn('Predictive alerts container not found');
        return;
    }

    console.log('Rendering predictive alerts');

    if (!window.analyticsModule || !window.analyticsModule.generatePredictiveAlerts) {
        console.error('generatePredictiveAlerts not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const alerts = window.analyticsModule.generatePredictiveAlerts(detections, speciesData);
    console.log('Generated alerts:', alerts.length);

    if (alerts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No alerts - all species are on schedule!</p></div>';
        return;
    }

    let html = '<div class="alerts-list">';

    alerts.slice(0, 10).forEach(alert => {
        const imageUrl = getSpeciesImageUrl(alert.species);

        html += `
            <div class="predictive-alert-card">
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <div class="alert-header">
                        <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                            ${!imageUrl ? '🐦' : ''}
                        </div>
                        <strong>${alert.species}</strong>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-details">Usually appears: ${alert.expectedTime} · ${alert.minutesLate} minutes late</div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render milestone progress tracking
 */
export function renderMilestones(speciesData, detections) {
    const container = document.getElementById('milestones-container');
    if (!container) {
        console.warn('Milestones container not found');
        return;
    }

    console.log('Rendering milestones');

    if (!window.analyticsModule || !window.analyticsModule.calculateMilestones) {
        console.error('calculateMilestones not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const milestones = window.analyticsModule.calculateMilestones(speciesData, detections);
    console.log('Generated milestones:', milestones.length);

    // Separate by type
    const speciesMilestones = milestones.filter(m => m.type === 'species');
    const detectionMilestones = milestones.filter(m => m.type === 'detections');

    let html = '<div class="milestones-grid">';

    // Species Milestones
    html += '<div class="milestone-section">';
    html += '<h4>🎯 Species Milestones</h4>';
    html += '<div class="milestone-cards">';

    speciesMilestones.forEach(milestone => {
        const achievedClass = milestone.achieved ? 'achieved' : '';
        html += `
            <div class="milestone-card ${achievedClass}">
                <div class="milestone-icon">${milestone.icon}</div>
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${milestone.progress}%"></div>
                    </div>
                    <div class="progress-text">${milestone.current} / ${milestone.target}</div>
                </div>
                ${!milestone.achieved ? `<div class="milestone-remaining">${milestone.remaining} to go</div>` : '<div class="milestone-achieved-text">✅ Completed!</div>'}
            </div>
        `;
    });

    html += '</div></div>'; // milestone-cards, milestone-section

    // Detection Milestones
    html += '<div class="milestone-section">';
    html += '<h4>📊 Detection Milestones</h4>';
    html += '<div class="milestone-cards">';

    detectionMilestones.forEach(milestone => {
        const achievedClass = milestone.achieved ? 'achieved' : '';
        html += `
            <div class="milestone-card ${achievedClass}">
                <div class="milestone-icon">${milestone.icon}</div>
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${milestone.progress}%"></div>
                    </div>
                    <div class="progress-text">${milestone.current.toLocaleString()} / ${milestone.target.toLocaleString()}</div>
                </div>
                ${!milestone.achieved ? `<div class="milestone-remaining">${milestone.remaining.toLocaleString()} to go</div>` : '<div class="milestone-achieved-text">✅ Completed!</div>'}
            </div>
        `;
    });

    html += '</div></div>'; // milestone-cards, milestone-section
    html += '</div>'; // milestones-grid

    container.innerHTML = html;
}

/**
 * Render personalized recommendations
 */
export function renderPersonalizedRecommendations(detections, speciesData) {
    const container = document.getElementById('recommendations-container');
    if (!container) {
        console.warn('Recommendations container not found');
        return;
    }

    console.log('Rendering recommendations');

    if (!window.analyticsModule || !window.analyticsModule.generatePersonalizedRecommendations) {
        console.error('generatePersonalizedRecommendations not available');
        container.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        return;
    }

    const recommendations = window.analyticsModule.generatePersonalizedRecommendations(detections, speciesData);
    console.log('Generated recommendations:', recommendations.length);

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recommendations available yet</p></div>';
        return;
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    let html = '<div class="recommendations-list">';

    recommendations.forEach(rec => {
        const priorityClass = `priority-${rec.priority}`;

        html += `
            <div class="recommendation-card ${priorityClass}">
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-content">
                    <div class="rec-title">${rec.title}</div>
                    <div class="rec-message">${rec.message}</div>
                    ${rec.action ? `<div class="rec-action">💡 ${rec.action}</div>` : ''}
                </div>
                <div class="rec-priority-badge">${rec.priority}</div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}
