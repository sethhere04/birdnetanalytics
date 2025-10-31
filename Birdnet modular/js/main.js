/**
 * Main Application Module - Coordinates all other modules
 */

import { API_CONFIG, fetchSpecies, fetchDetections, parseDetectionDate } from './api.js';
import * as Analytics from './analytics.js';
import * as UIRender from './ui-render.js';

console.log('🚀 Main module loaded - starting BirdAnalytics initialization');

/**
 * Main application state
 */
const AppState = {
    data: {
        species: [],
        detections: [],
        analytics: null,
        speciesImages: {},
        lastDetectionTime: null  // Track most recent detection for incremental loading
    },
    filters: {
        dateRange: 'all',
        speciesFilter: ''
    },
    currentTab: 'overview',
    isInitialLoad: true  // Flag to track if this is the first load
};

/**
 * Initialize the application
 */
export async function init() {
    console.log('🔧 Initializing BirdAnalytics...');

    // Request notification permission
    requestNotificationPermission();

    // Set up event listeners
    setupEventListeners();

    // Load initial data
    await loadData();

    // Start auto-refresh
    startAutoRefresh();

    console.log('✅ BirdAnalytics initialized successfully');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadData());
    }

    // Dark mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);

        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }

    // Modal close (clicking outside)
    const modal = document.getElementById('species-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                UIRender.closeSpeciesModal();
            }
        });
    }

    // Diversity period selector
    const diversityPeriodSelect = document.getElementById('diversity-period-select');
    if (diversityPeriodSelect) {
        diversityPeriodSelect.addEventListener('change', (e) => {
            const periodType = e.target.value;
            UIRender.renderDiversityTrends(AppState.data.detections, periodType);
        });
    }

    // Date range filter
    const dateRangeFilter = document.getElementById('date-range-filter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', (e) => {
            applyFilters({ dateRange: e.target.value });
        });
    }

    // Settings modal
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const settingsCancel = document.getElementById('settings-cancel');
    const settingsSave = document.getElementById('settings-save');
    const initialLoadLimitSelect = document.getElementById('initial-load-limit');

    if (settingsToggle && settingsModal) {
        // Open settings modal
        settingsToggle.addEventListener('click', () => {
            // Load current setting
            const currentLimit = API_CONFIG.initialLoadLimit;
            initialLoadLimitSelect.value = currentLimit.toString();

            // Update status display
            const statusDiv = document.getElementById('current-detection-count');
            if (AppState.data.detections.length > 0) {
                statusDiv.innerHTML = `
                    Currently loaded: <strong>${AppState.data.detections.length.toLocaleString()}</strong> detections<br>
                    Setting: <strong>${currentLimit.toLocaleString()}</strong> max on startup
                `;
            } else {
                statusDiv.innerHTML = `Setting: <strong>${currentLimit.toLocaleString()}</strong> max on startup`;
            }

            settingsModal.style.display = 'flex';
        });

        // Close settings modal
        const closeModal = () => {
            settingsModal.style.display = 'none';
        };

        settingsClose?.addEventListener('click', closeModal);
        settingsCancel?.addEventListener('click', closeModal);

        // Click outside to close
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeModal();
            }
        });

        // Save settings
        settingsSave?.addEventListener('click', () => {
            const newLimit = parseInt(initialLoadLimitSelect.value, 10);
            API_CONFIG.initialLoadLimit = newLimit;
            console.log(`✅ Settings saved: initialLoadLimit = ${newLimit}`);
            console.log('🔄 Reloading page to apply new settings...');

            // Reload the page to apply new settings
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }

    // Export functions to window for onclick handlers
    window.showSpeciesDetail = (speciesName) => {
        UIRender.showSpeciesDetail(
            speciesName,
            AppState.data.analytics,
            AppState.data.species,
            AppState.data.detections
        );
    };
    window.closeSpeciesModal = () => {
        UIRender.closeSpeciesModal();
    };

    // Export analytics module to window so new rendering functions can access it
    window.analyticsModule = Analytics;

    // Weather setup handler
    window.showWeatherSetup = async () => {
        const { isWeatherConfigured, getWeatherConfig, setWeatherConfig } = await import('./weather.js');

        const config = getWeatherConfig();
        const apiKey = prompt('Enter your OpenWeatherMap API key:\n(Get free key at: https://openweathermap.org/api)', config.apiKey || '');

        if (!apiKey) return;

        const lat = prompt('Enter your latitude:', config.location?.lat || '');
        const lon = prompt('Enter your longitude:', config.location?.lon || '');

        if (lat && lon) {
            setWeatherConfig(apiKey, { lat: parseFloat(lat), lon: parseFloat(lon) });
            alert('Weather configuration saved! Refreshing data...');
            loadData();
        }
    };

    // Species selector handler
    window.showSpeciesSelector = () => {
        const species = AppState.data.analytics?.topSpecies || [];
        if (species.length === 0) {
            alert('No species data available yet. Please wait for data to load.');
            return;
        }

        const options = species.slice(0, 20).map((s, i) => `${i + 1}. ${s.name}`).join('\n');
        const selection = prompt(`Select 2-4 species to compare (enter numbers separated by commas):\n\n${options}`, '1,2');

        if (!selection) return;

        const indices = selection.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < species.length);

        if (indices.length < 2 || indices.length > 4) {
            alert('Please select between 2 and 4 species.');
            return;
        }

        const selectedSpecies = indices.map(i => species[i].name);
        const comparison = Analytics.compareSpecies(selectedSpecies, AppState.data.detections, AppState.data.species);
        UIRender.renderSpeciesComparison(comparison);
    };
}

/**
 * Switch to a different tab
 */
function switchTab(tabName) {
    // Update active tab UI
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`)?.classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    // Store current tab
    AppState.currentTab = tabName;

    // Render the tab
    renderCurrentTab();
}

/**
 * Load data from API with incremental loading support
 * @param {boolean} silent - If true, don't show full-screen loading overlay (for auto-refresh)
 */
async function loadData(silent = false) {
    console.log('📡 Fetching data from BirdNET-Go API...');

    if (!silent) {
        UIRender.showLoading();
    } else {
        UIRender.showRefreshIndicator();
    }

    try {
        let detections;
        let species;

        // Capture previous species count BEFORE updating
        const previousSpeciesCount = AppState.data.species.length;

        if (AppState.isInitialLoad) {
            // Initial load: Fetch detections up to configured limit
            console.log('🔄 Initial load - fetching detections...');
            const estimatedPages = Math.ceil(API_CONFIG.initialLoadLimit / 100);
            const estimatedSeconds = Math.ceil(estimatedPages / 2); // Roughly 2 pages per second
            console.log(`⏳ Loading up to ${API_CONFIG.initialLoadLimit.toLocaleString()} detections (~${estimatedPages} pages, ~${estimatedSeconds}s)`);
            console.log(`💡 Tip: Adjust initialLoadLimit in Settings to change load speed vs data completeness`);

            const [speciesData, allDetections] = await Promise.all([
                fetchSpecies(),
                fetchDetections()  // Fetches up to initialLoadLimit
            ]);

            species = speciesData;
            AppState.data.species = species;
            detections = allDetections;
            AppState.isInitialLoad = false;

            console.log(`✅ Initial load: ${species.length} species and ${detections.length} total detections`);
        } else {
            // Incremental load: Only fetch NEW detections since last check
            console.log('🔄 Incremental refresh - fetching only new detections...');
            const [speciesData, newDetections] = await Promise.all([
                fetchSpecies(),
                fetchDetections(AppState.data.lastDetectionTime)  // Pass last detection time
            ]);

            species = speciesData;
            AppState.data.species = species;

            if (newDetections.length > 0) {
                console.log(`✅ Found ${newDetections.length} new detections since last refresh`);

                // Prepend new detections to existing array (newest first)
                AppState.data.detections = [...newDetections, ...AppState.data.detections];

                // Optional: Trim to keep only last 10000 detections in memory (to prevent memory bloat)
                if (AppState.data.detections.length > 10000) {
                    AppState.data.detections = AppState.data.detections.slice(0, 10000);
                    console.log(`🗑️ Trimmed to 10,000 most recent detections`);
                }

                detections = AppState.data.detections;
            } else {
                console.log('ℹ️ No new detections since last refresh');
                detections = AppState.data.detections;
            }
        }

        // Update the last detection time from the most recent detection
        if (detections.length > 0) {
            const latestDetection = detections[0];
            const latestTime = parseDetectionDate(latestDetection);
            AppState.data.lastDetectionTime = latestTime;
        }

        AppState.data.detections = detections;

        // Debug: Log species count changes
        if (previousSpeciesCount > 0 && AppState.data.species.length !== previousSpeciesCount) {
            console.warn(`⚠️ Species count changed from ${previousSpeciesCount} to ${AppState.data.species.length}`);
        }

        // Load images only when species list changes or on first load
        if (previousSpeciesCount === 0 || AppState.data.species.length !== previousSpeciesCount) {
            console.log(`📸 Loading species thumbnails (${AppState.data.species.length} species)`);
            loadSpeciesImages(AppState.data.species);
        }

        // Analyze data
        AppState.data.analytics = Analytics.analyzeData(species, detections, AppState.filters);

        // Check for rare species and send notifications
        checkForRareSpecies(AppState.data.analytics);

        // Update UI
        updateUI();

    } catch (error) {
        console.error('❌ Error loading data:', error);
        if (!silent) {
            UIRender.showError('Failed to load bird data. Check API connection.');
        }
    } finally {
        if (!silent) {
            UIRender.hideLoading();
        } else {
            UIRender.hideRefreshIndicator();
        }
    }
}

/**
 * Load species images from API thumbnail_url field
 */
function loadSpeciesImages(species) {
    const images = {};

    species.forEach(sp => {
        const speciesName = sp.commonName || sp.common_name || sp.scientificName;
        if (sp.thumbnail_url) {
            images[speciesName] = sp.thumbnail_url;
        }
    });

    AppState.data.speciesImages = images;
    UIRender.setSpeciesImages(images);

    console.log(`📸 Loaded ${Object.keys(images).length} species thumbnails from API`);
}

/**
 * Update all UI components
 */
function updateUI() {
    const { analytics, species, detections } = AppState.data;

    if (!analytics) return;

    // Update dashboard header
    UIRender.updateDashboardHeader(analytics);

    // Render current tab
    renderCurrentTab();
}

/**
 * Render the current active tab
 */
function renderCurrentTab() {
    const { analytics, species, detections } = AppState.data;

    if (!analytics) return;

    switch (AppState.currentTab) {
        case 'overview':
            UIRender.renderOverview(analytics, species, detections);
            break;
        case 'species':
            UIRender.renderSpecies(analytics, detections, species);
            break;
        case 'activity':
            UIRender.renderActivity(analytics, detections);
            break;
        case 'migration':
            UIRender.renderMigration(species);
            break;
        case 'feeding':
            UIRender.renderFeeding(species);
            break;
        case 'insights':
            UIRender.renderInsights(analytics, species, detections);
            break;
    }
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadData(true); // Silent refresh - don't show full-screen loading overlay
    }, API_CONFIG.refreshInterval);
}

/**
 * Apply filters (for future expansion)
 */
export function applyFilters(filters) {
    AppState.filters = { ...AppState.filters, ...filters };

    // Re-analyze with new filters
    AppState.data.analytics = Analytics.analyzeData(
        AppState.data.species,
        AppState.data.detections,
        AppState.filters
    );

    // Update UI
    updateUI();
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

/**
 * Set theme and update UI
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update toggle button
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (theme === 'dark') {
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Light Mode';
    } else {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Dark Mode';
    }

    console.log(`🎨 Theme switched to ${theme} mode`);
}

/**
 * Request notification permission from user
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log(`📢 Notification permission: ${permission}`);
        });
    }
}

/**
 * Check for rare species and send notifications
 */
function checkForRareSpecies(analytics) {
    if (!analytics || !analytics.rarest || analytics.rarest.length === 0) return;

    // Only notify if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
        // Get previously notified species from localStorage
        const notifiedKey = 'notified_rare_species';
        const notified = JSON.parse(localStorage.getItem(notifiedKey) || '{}');
        const today = new Date().toDateString();

        // Check each rare species (1-3 detections)
        analytics.rarest.forEach(species => {
            const speciesKey = `${species.name}_${today}`;

            // Only notify once per day per species
            if (!notified[speciesKey]) {
                // Send notification
                const notification = new Notification('🦅 Rare Bird Detected!', {
                    body: `${species.name} spotted! This is a rare visitor with only ${species.count} detection${species.count > 1 ? 's' : ''}.`,
                    icon: species.image || '/bird-icon.png',
                    tag: species.name,
                    requireInteraction: false
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Mark as notified
                notified[speciesKey] = Date.now();
                localStorage.setItem(notifiedKey, JSON.stringify(notified));

                console.log(`📢 Notification sent for rare species: ${species.name}`);
            }
        });

        // Clean up old notifications (older than 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        Object.keys(notified).forEach(key => {
            if (notified[key] < sevenDaysAgo) {
                delete notified[key];
            }
        });
        localStorage.setItem(notifiedKey, JSON.stringify(notified));
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
