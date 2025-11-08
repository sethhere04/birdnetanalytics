/**
 * Main Application Module - Coordinates all other modules
 */

import { API_CONFIG, fetchSpecies, fetchDetections, parseDetectionDate } from './api.js';
import * as Analytics from './analytics.js';
import * as UIRender from './ui-render.js';
import * as AudioPlayer from './audio-player.js';
import * as Alerts from './alerts.js';
import { TouchGestureHandler, TabSwipeNavigator } from './touch-gestures.js';

console.log('🚀 Main module loaded v2024103102 - starting BirdAnalytics initialization');

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

    // Register service worker for PWA
    registerServiceWorker();

    // Request notification permission
    requestNotificationPermission();

    // Set up event listeners
    setupEventListeners();

    // Initialize touch gestures for mobile
    setupTouchGestures();

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
    // Navigation item switching
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', () => {
            const tabName = navItem.dataset.tab;
            switchTab(tabName);
        });
    });

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadData());
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        // Load saved sidebar state
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        }

        // Toggle sidebar
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        });
    }

    // Load saved theme preference on startup
    const savedPreference = localStorage.getItem('theme-preference') || 'auto';
    applyThemePreference(savedPreference);

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const preference = localStorage.getItem('theme-preference') || 'auto';
            if (preference === 'auto') {
                applyThemePreference('auto');
            }
        });
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
            // Load current theme preference
            const currentPreference = localStorage.getItem('theme-preference') || 'auto';
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) {
                themeSelect.value = currentPreference;
            }

            // Load current data loading setting
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

        // Theme select handler
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const preference = e.target.value;
                localStorage.setItem('theme-preference', preference);
                applyThemePreference(preference);
            });
        }

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

    // Alerts modal setup
    const alertsToggle = document.getElementById('alerts-toggle');
    const alertsModal = document.getElementById('alerts-modal');
    const alertsClose = document.getElementById('alerts-close');
    const alertsCancel = document.getElementById('alerts-cancel');
    const alertsSave = document.getElementById('alerts-save');
    const addWatchedBtn = document.getElementById('add-watched-species');

    if (alertsToggle && alertsModal) {
        // Open alerts modal
        alertsToggle.addEventListener('click', () => {
            const config = Alerts.getAlertConfig();

            // Load current settings into UI
            document.getElementById('alerts-enabled').checked = config.enabled;
            document.getElementById('alerts-sound').checked = config.soundEnabled;
            document.getElementById('alerts-cooldown').value = config.cooldownMinutes.toString();
            document.getElementById('alert-watched').checked = config.alertTypes.specificSpecies;
            document.getElementById('alert-rare').checked = config.alertTypes.rareSpecies;
            document.getElementById('alert-new').checked = config.alertTypes.newSpecies;

            // Render watched species list
            renderWatchedSpeciesList();

            alertsModal.style.display = 'flex';
        });

        // Close alerts modal
        const closeAlertsModal = () => {
            alertsModal.style.display = 'none';
        };

        alertsClose?.addEventListener('click', closeAlertsModal);
        alertsCancel?.addEventListener('click', closeAlertsModal);

        // Click outside to close
        alertsModal.addEventListener('click', (e) => {
            if (e.target === alertsModal) {
                closeAlertsModal();
            }
        });

        // Save settings
        alertsSave?.addEventListener('click', () => {
            const config = {
                enabled: document.getElementById('alerts-enabled').checked,
                soundEnabled: document.getElementById('alerts-sound').checked,
                cooldownMinutes: parseInt(document.getElementById('alerts-cooldown').value, 10),
                alertTypes: {
                    specificSpecies: document.getElementById('alert-watched').checked,
                    rareSpecies: document.getElementById('alert-rare').checked,
                    newSpecies: document.getElementById('alert-new').checked
                },
                watchedSpecies: Alerts.getWatchedSpecies()
            };

            Alerts.saveAlertConfig(config);
            console.log('✅ Alert settings saved');
            closeAlertsModal();
        });

        // Add watched species
        addWatchedBtn?.addEventListener('click', () => {
            const species = AppState.data.analytics?.allSpecies || [];
            if (species.length === 0) {
                alert('No species data available yet. Please wait for data to load.');
                return;
            }

            const options = species.slice(0, 30).map((s, i) => `${i + 1}. ${s.name}`).join('\n');
            const selection = prompt(`Select a species to watch (enter number):\n\n${options}`, '1');

            if (!selection) return;

            const index = parseInt(selection.trim()) - 1;
            if (index >= 0 && index < species.length) {
                const speciesName = species[index].name;
                if (Alerts.addWatchedSpecies(speciesName)) {
                    console.log(`✅ Added ${speciesName} to watch list`);
                    renderWatchedSpeciesList();
                } else {
                    alert(`${speciesName} is already on your watch list`);
                }
            }
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

    // Export period species functions for onclick handlers
    window.showPeriodSpecies = (period) => {
        UIRender.showPeriodSpecies(period);
    };
    window.closePeriodModal = () => {
        UIRender.closePeriodModal();
    };

    // Export analytics module to window so new rendering functions can access it
    window.analyticsModule = Analytics;

    // Export audio player functions to window for onclick handlers
    window.playAudio = AudioPlayer.playAudio;
    window.playAudioInPlayer = AudioPlayer.playAudioInPlayer;
    window.stopCurrentAudio = AudioPlayer.stopCurrentAudio;

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

    // Remove watched species function
    window.removeWatchedSpecies = (speciesName) => {
        if (Alerts.removeWatchedSpecies(speciesName)) {
            console.log(`✅ Removed ${speciesName} from watch list`);
            renderWatchedSpeciesList();
        }
    };

    // Gallery collapse toggle
    window.toggleGalleryCollapse = () => {
        const gallery = document.getElementById('photo-gallery');
        const controls = document.getElementById('gallery-controls');
        const btn = document.getElementById('gallery-collapse-btn');

        if (!gallery || !btn) return;

        const isCollapsed = gallery.classList.contains('collapsed');

        if (isCollapsed) {
            gallery.classList.remove('collapsed');
            if (controls) controls.classList.remove('collapsed');
            btn.textContent = '▼';
            btn.setAttribute('aria-expanded', 'true');
        } else {
            gallery.classList.add('collapsed');
            if (controls) controls.classList.add('collapsed');
            btn.textContent = '▶';
            btn.setAttribute('aria-expanded', 'false');
        }
    };
}

/**
 * Set up touch gestures for mobile navigation
 */
function setupTouchGestures() {
    try {
        // Initialize gesture handler
        const gestureHandler = new TouchGestureHandler();
        gestureHandler.init();

        // Set up navigation swipe
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length > 0) {
            const tabNavigator = new TabSwipeNavigator(navItems, gestureHandler);
            tabNavigator.init();
            console.log('✅ Touch gestures enabled for navigation');
        }
    } catch (error) {
        console.error('❌ Failed to initialize touch gestures:', error);
    }
}

/**
 * Render watched species list in alerts modal
 */
function renderWatchedSpeciesList() {
    const watched = Alerts.getWatchedSpecies();
    const container = document.getElementById('watched-species-list');
    const countEl = document.getElementById('watched-count');

    if (!container) return;

    countEl.textContent = watched.length;

    if (watched.length === 0) {
        container.innerHTML = '<p class="empty-state-text">No species on watch list</p>';
        return;
    }

    container.innerHTML = watched.map(speciesName => {
        return '<div class="watched-species-item"><span class="watched-species-name">' + speciesName + '</span><button class="btn-remove" onclick="window.removeWatchedSpecies(\'' + speciesName.replace(/'/g, "\\'") + '\')" aria-label="Remove">✕</button></div>';
    }).join('');
}

/**
 * Switch to a different tab
 */
function switchTab(tabName) {
    // Update active navigation item UI
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    // Update page title
    updatePageTitle(tabName);

    // Store current tab
    AppState.currentTab = tabName;

    // Render the tab
    renderCurrentTab();
}

/**
 * Update page title based on current tab
 */
function updatePageTitle(tabName) {
    const pageTitleEl = document.getElementById('page-title');
    if (!pageTitleEl) return;

    const tabTitles = {
        'overview': '📊 Overview',
        'species': '🐦 Species',
        'insights': '💡 Insights',
        'trends': '📈 Trends',
        'analytics': '🔬 Analytics',
        'activity': '⏰ Activity',
        'migration': '🦅 Migration',
        'feeding': '🌻 Feeding'
    };

    pageTitleEl.textContent = tabTitles[tabName] || '📊 Dashboard';
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
        let newDetections = []; // Track new detections for alerts

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
            const [speciesData, fetchedDetections] = await Promise.all([
                fetchSpecies(),
                fetchDetections(AppState.data.lastDetectionTime)  // Pass last detection time
            ]);

            species = speciesData;
            AppState.data.species = species;
            newDetections = fetchedDetections; // Store for alert checking

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

        // Check for custom alerts (only on incremental refreshes with new detections)
        if (newDetections.length > 0) {
            Alerts.checkForAlerts(newDetections, AppState.data.analytics, AppState.data.speciesImages);
        }

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

    // Update quick stats bar
    updateQuickStats(analytics, species, detections);

    // Render current tab
    renderCurrentTab();
}

/**
 * Update the quick stats bar with current metrics
 */
function updateQuickStats(analytics, species, detections) {
    // Total Species
    const totalSpecies = species?.length || 0;
    document.getElementById('quick-stat-total-species').textContent = totalSpecies.toLocaleString();

    // Total Detections
    const totalDetections = detections?.length || 0;
    document.getElementById('quick-stat-total-detections').textContent = totalDetections.toLocaleString();

    // Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDetections = detections?.filter(d => {
        const detectionDate = parseDetectionDate(d);
        detectionDate.setHours(0, 0, 0, 0);
        return detectionDate.getTime() === today.getTime();
    }) || [];

    const todaySpecies = new Set(todayDetections.map(d => d.commonName || d.common_name || d.scientificName));

    document.getElementById('quick-stat-today-species').textContent = todaySpecies.size.toLocaleString();
    document.getElementById('quick-stat-today-detections').textContent = todayDetections.length.toLocaleString();
}

/**
 * Render the current active tab
 */
function renderCurrentTab() {
    const { analytics, species, detections } = AppState.data;

    console.log('📑 renderCurrentTab called:', {
        currentTab: AppState.currentTab,
        hasAnalytics: !!analytics,
        speciesCount: species?.length || 0,
        detectionsCount: detections?.length || 0
    });

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
            console.log('🎯 Calling renderInsights with:', { analytics, speciesCount: species.length, detectionsCount: detections.length });
            UIRender.renderInsights(analytics, species, detections);
            break;
        case 'trends':
            console.log('📈 Calling renderTrends');
            UIRender.renderTrends(analytics, species, detections);
            break;
        case 'analytics':
            console.log('🔬 Calling renderAnalytics');
            UIRender.renderAnalytics(analytics, species, detections);
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
 * Get system color scheme preference
 */
function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

/**
 * Apply theme preference (auto, light, or dark)
 */
function applyThemePreference(preference) {
    let themeToApply;

    if (preference === 'auto') {
        themeToApply = getSystemTheme();
        console.log(`🎨 Auto theme: using system preference (${themeToApply})`);
    } else {
        themeToApply = preference;
    }

    setTheme(themeToApply);
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

    // Update toggle checkbox and label in settings modal
    const themeToggleSetting = document.getElementById('theme-toggle-setting');
    const themeLabelText = document.getElementById('theme-label-text');

    if (themeToggleSetting) {
        themeToggleSetting.checked = (theme === 'dark');
    }

    if (themeLabelText) {
        themeLabelText.textContent = (theme === 'dark') ? 'Dark Mode' : 'Light Mode';
    }

    console.log(`🎨 Theme switched to ${theme} mode`);
}

/**
 * Register service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    }
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

/**
 * Audio playback functions - exposed globally for inline onclick handlers
 */

// Store currently playing audio
let currentDetectionAudio = null;
let currentDetectionButton = null;

window.playDetectionAudio = function(audioUrl, button) {
    // Stop currently playing audio
    if (currentDetectionAudio) {
        currentDetectionAudio.pause();
        currentDetectionAudio.currentTime = 0;
        if (currentDetectionButton) {
            currentDetectionButton.textContent = '▶';
            currentDetectionButton.classList.remove('playing');
        }
    }

    // If clicking the same button, just stop
    if (currentDetectionButton === button && currentDetectionAudio) {
        currentDetectionAudio = null;
        currentDetectionButton = null;
        return;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    currentDetectionAudio = audio;
    currentDetectionButton = button;

    button.textContent = '⏸';
    button.classList.add('playing');

    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        button.textContent = '❌';
        setTimeout(() => {
            button.textContent = '▶';
            button.classList.remove('playing');
        }, 2000);
    });

    audio.addEventListener('ended', () => {
        button.textContent = '▶';
        button.classList.remove('playing');
        currentDetectionAudio = null;
        currentDetectionButton = null;
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio load error:', e);
        button.textContent = '❌';
        setTimeout(() => {
            button.textContent = '▶';
            button.classList.remove('playing');
        }, 2000);
        currentDetectionAudio = null;
        currentDetectionButton = null;
    });
};

window.showSpectrogram = async function(audioUrl, speciesName, button) {
    const modal = document.getElementById('spectrogram-modal');
    const title = document.getElementById('spectrogram-title');
    const canvas = document.getElementById('spectrogram-canvas');
    const audio = document.getElementById('spectrogram-audio');

    if (!modal || !canvas || !audio) return;

    title.textContent = `Spectrogram - ${speciesName}`;
    audio.src = audioUrl;
    modal.style.display = 'flex';

    // Show loading state
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading audio...', canvas.width / 2, canvas.height / 2);

    try {
        // Fetch and decode audio
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Generate spectrogram
        drawSpectrogram(canvas, audioBuffer);
    } catch (error) {
        console.error('Error generating spectrogram:', error);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading audio', canvas.width / 2, canvas.height / 2);
    }
};

window.closeSpectrogramModal = function() {
    const modal = document.getElementById('spectrogram-modal');
    const audio = document.getElementById('spectrogram-audio');
    if (modal) modal.style.display = 'none';
    if (audio) {
        audio.pause();
        audio.src = '';
    }
};

window.downloadAudio = async function(audioUrl, filename) {
    try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading audio:', error);
        alert('Failed to download audio. The recording may not be available.');
    }
};

/**
 * Draw spectrogram on canvas from audio buffer
 */
function drawSpectrogram(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // FFT parameters
    const fftSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor((channelData.length - fftSize) / hopSize);

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Calculate spectrogram
    const freqBins = fftSize / 2;
    const imageData = ctx.createImageData(width, height);

    for (let frame = 0; frame < numFrames; frame++) {
        const x = Math.floor((frame / numFrames) * width);
        if (x >= width) break;

        const start = frame * hopSize;
        const window = channelData.slice(start, start + fftSize);

        // Apply Hamming window
        for (let i = 0; i < window.length; i++) {
            window[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (window.length - 1));
        }

        // Simple magnitude calculation (not true FFT, but fast approximation)
        const magnitudes = new Array(height).fill(0);
        for (let freq = 0; freq < height; freq++) {
            let sum = 0;
            const binSize = Math.max(1, Math.floor(window.length / height));
            for (let i = 0; i < binSize; i++) {
                const idx = freq * binSize + i;
                if (idx < window.length) {
                    sum += Math.abs(window[idx]);
                }
            }
            magnitudes[freq] = sum / binSize;
        }

        // Normalize and draw
        const maxMag = Math.max(...magnitudes);
        for (let y = 0; y < height; y++) {
            const magnitude = magnitudes[height - y - 1] / maxMag;
            const pixelIndex = (y * width + x) * 4;

            // Color mapping (blue -> green -> yellow -> red)
            const intensity = Math.pow(magnitude, 0.5) * 255;
            if (intensity < 64) {
                imageData.data[pixelIndex] = 0;
                imageData.data[pixelIndex + 1] = 0;
                imageData.data[pixelIndex + 2] = intensity * 4;
            } else if (intensity < 128) {
                imageData.data[pixelIndex] = 0;
                imageData.data[pixelIndex + 1] = (intensity - 64) * 4;
                imageData.data[pixelIndex + 2] = 255;
            } else if (intensity < 192) {
                imageData.data[pixelIndex] = (intensity - 128) * 4;
                imageData.data[pixelIndex + 1] = 255;
                imageData.data[pixelIndex + 2] = 255 - (intensity - 128) * 4;
            } else {
                imageData.data[pixelIndex] = 255;
                imageData.data[pixelIndex + 1] = 255 - (intensity - 192) * 4;
                imageData.data[pixelIndex + 2] = 0;
            }
            imageData.data[pixelIndex + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Add labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('Time →', width - 50, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency →', 0, 0);
    ctx.restore();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
