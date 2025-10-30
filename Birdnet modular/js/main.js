/**
 * Main Application Module - Coordinates all other modules
 */

import { API_CONFIG, fetchSpecies, fetchDetections } from './api.js';
import { analyzeData } from './analytics.js';
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
        speciesImages: {}
    },
    filters: {
        dateRange: 'all',
        speciesFilter: ''
    },
    currentTab: 'overview'
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

    // Export functions to window for onclick handlers
    window.showSpeciesDetail = (speciesName) => {
        UIRender.showSpeciesDetail(speciesName, AppState.data.analytics);
    };
    window.closeSpeciesModal = () => {
        UIRender.closeSpeciesModal();
    };

    // Export analytics module to window so new rendering functions can access it
    window.analyticsModule = Analytics;
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
 * Load data from API
 */
async function loadData() {
    console.log('📡 Fetching data from BirdNET-Go API...');
    UIRender.showLoading();

    try {
        // Fetch species summary and recent detections in parallel
        const [species, detections] = await Promise.all([
            fetchSpecies(),
            fetchDetections()
        ]);

        console.log(`✅ Loaded ${species.length} species and ${detections.length} recent detections`);

        // Store raw data
        AppState.data.species = species;
        AppState.data.detections = detections;

        // Load species images from API thumbnail_url
        loadSpeciesImages(species);

        // Analyze data
        AppState.data.analytics = analyzeData(species, detections, AppState.filters);

        // Check for rare species and send notifications
        checkForRareSpecies(AppState.data.analytics);

        // Update UI
        updateUI();

    } catch (error) {
        console.error('❌ Error loading data:', error);
        UIRender.showError('Failed to load bird data. Check API connection.');
    } finally {
        UIRender.hideLoading();
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
        loadData();
    }, API_CONFIG.refreshInterval);
}

/**
 * Apply filters (for future expansion)
 */
export function applyFilters(filters) {
    AppState.filters = { ...AppState.filters, ...filters };

    // Re-analyze with new filters
    AppState.data.analytics = analyzeData(
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
