/**
 * UI Rendering Module - All DOM manipulation and UI updates
 */

import * as charts from './charts.js';
import { getTodayActiveSpecies, getDiversityMetrics, calculateComparisonStats } from './analytics.js';
import { getCurrentSeason, getSeasonalRecommendations, getSpeciesFeedingData } from './feeding.js';
import { analyzeMigrationPatterns } from './migration.js';

// Store species images loaded from API
let speciesImagesCache = {};

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
    document.getElementById('total-species').textContent = analytics.totalSpecies;
    document.getElementById('total-detections').textContent = analytics.totalDetections.toLocaleString();
    document.getElementById('active-today').textContent = analytics.today.species;

    const peakHour = analytics.hourly.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 });
    document.getElementById('most-active-time').textContent = `${peakHour.hour}:00`;

    // Update filtered count
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
}

/**
 * Render activity tab
 */
export function renderActivity(analytics, detections) {
    // Weekly heatmap
    charts.renderWeeklyHeatmap(analytics.weekly);

    // NEW: Hour × Day heatmap
    charts.renderHourDayHeatmap(detections);

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
export function renderInsights(analytics) {
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
                const imageUrl = getSpeciesImageUrl(species.name);
                const feedingData = getSpeciesFeedingData([species]).speciesWithFeeding[0];
                if (!feedingData) return '';

                return `
                    <div class="species-feeding-card">
                        <div class="species-feeding-header">
                            <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                                ${!imageUrl ? '🐦' : ''}
                            </div>
                            <div>
                                <strong>${species.name}</strong>
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
 * Show species detail modal
 */
export function showSpeciesDetail(speciesName, analytics) {
    const species = analytics.allSpecies.find(s => s.name === speciesName);
    if (!species) return;

    const imageUrl = getSpeciesImageUrl(speciesName);
    const modal = document.getElementById('species-modal');
    const modalContent = modal.querySelector('.species-modal-content');

    const firstSeen = species.firstSeen.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const lastSeen = species.lastSeen.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    modalContent.innerHTML = `
        <button class="modal-close" onclick="window.closeSpeciesModal()">&times;</button>
        ${imageUrl ?
            `<div class="species-detail-image" style="background-image: url(${imageUrl})"></div>` :
            `<div class="species-detail-placeholder">🐦</div>`
        }
        <h2 class="species-detail-name">${speciesName}</h2>
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
    `;

    modal.classList.add('active');
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
