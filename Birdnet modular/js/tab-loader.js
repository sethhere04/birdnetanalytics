// Tab Loader - Dynamic Tab Content Management
console.log('tab-loader.js loading...');

// Cache for loaded tab content
window.tabCache = {};

// Track which tabs have been loaded
window.loadedTabs = {
    overview: false,
    species: false,
    analytics: false,
    migration: false,
    feeding: false,
    live: false
};

/**
 * Load tab content from external file or template
 * @param {string} tabName - Name of the tab to load
 * @returns {Promise<string>} HTML content of the tab
 */
async function loadTabContent(tabName) {
    // Check cache first
    if (window.tabCache[tabName]) {
        console.log('📦 Loading tab from cache:', tabName);
        return window.tabCache[tabName];
    }
    
    try {
        console.log('🔄 Loading tab content:', tabName);
        
        // Try to load from external file
        const response = await fetch(`components/tab-${tabName}.html`);
        
        if (response.ok) {
            const html = await response.text();
            window.tabCache[tabName] = html;
            return html;
        } else {
            console.warn('Tab file not found, using inline content:', tabName);
            // Fall back to inline content (already in DOM)
            return null;
        }
    } catch (error) {
        console.error('Error loading tab content:', error);
        // Fall back to inline content
        return null;
    }
}

/**
 * Switch to a different tab
 * @param {string} tabName - Name of the tab to switch to
 */
async function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
            button.getAttribute('onclick')?.includes(tabName)) {
            button.classList.add('active');
        }
    });
    
    // Hide all tab content
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Get target tab
    const targetTab = document.getElementById('tab-' + tabName);
    
    if (!targetTab) {
        console.error('Tab not found:', tabName);
        return;
    }
    
    // Load tab content if not already loaded
    if (!window.loadedTabs[tabName]) {
        const content = await loadTabContent(tabName);
        
        if (content) {
            targetTab.innerHTML = content;
        }
        
        window.loadedTabs[tabName] = true;
    }
    
    // Show the target tab
    targetTab.classList.add('active');
    targetTab.style.display = 'block';
    
    // FIXED: Trigger tab initialization EVERY TIME (moved outside the if block)
    await initializeTabData(tabName);
    
    // Call BirdNET UI loadTabData if available
    if (BirdNET && BirdNET.ui && BirdNET.ui.loadTabData) {
        setTimeout(() => {
            BirdNET.ui.loadTabData(tabName);
        }, 100);
    }
}

/**
 * Initialize data for a specific tab
 * @param {string} tabName - Name of the tab to initialize
 */
async function initializeTabData(tabName) {
    console.log('🎬 Initializing tab data:', tabName);
    
    try {
        switch(tabName) {
            case 'overview':
                // Initialize overview data
                if (BirdNET.detections && BirdNET.detections.updateRecentDetections) {
                    await BirdNET.detections.updateRecentDetections();
                }
                break;
                
            case 'species':
                // Initialize species data
                if (BirdNET.species && BirdNET.species.updateSpeciesTable) {
                    await BirdNET.species.updateSpeciesTable();
                }
                break;
                
            case 'analytics':
                // Initialize analytics charts
                if (BirdNET.analytics && BirdNET.analytics.updateTrendsChart) {
                    await BirdNET.analytics.updateTrendsChart();
                }
                if (typeof updateAllRealAnalytics === 'function') {
                    await updateAllRealAnalytics();
                }
                break;
                
            case 'migration':
                // Initialize migration data
                if (typeof initializeAIMigrationSystem === 'function') {
                    initializeAIMigrationSystem();
                }
                if (typeof updatePersonalMigrationCalendar === 'function') {
                    await updatePersonalMigrationCalendar();
                }
                break;
                
            case 'feeding':
                // Initialize feeding recommendations
                if (BirdNET.feeding && BirdNET.feeding.updateDisplay) {
                    await BirdNET.feeding.updateDisplay();
                }
                // Update real feeding recommendations
                if (typeof updateRealFeedingRecommendations === 'function') {
                    await updateRealFeedingRecommendations();
                }
                // Update species attraction strategies
                if (typeof updateSpeciesAttractionDisplay === 'function') {
                    await updateSpeciesAttractionDisplay();
                }
                break;
                
            case 'live':
                // Initialize live view
                if (BirdNET.live && BirdNET.live.start) {
                    BirdNET.live.start();
                }
                break;
        }
    } catch (error) {
        console.error('Error initializing tab data:', error);
    }
}

/**
 * Preload a tab's content in the background
 * @param {string} tabName - Name of the tab to preload
 */
async function preloadTab(tabName) {
    if (window.loadedTabs[tabName]) {
        return; // Already loaded
    }
    
    try {
        const content = await loadTabContent(tabName);
        if (content) {
            const targetTab = document.getElementById('tab-' + tabName);
            if (targetTab) {
                targetTab.innerHTML = content;
                window.loadedTabs[tabName] = true;
                console.log('✅ Preloaded tab:', tabName);
            }
        }
    } catch (error) {
        console.error('Error preloading tab:', error);
    }
}

/**
 * Preload all tabs for better performance
 */
async function preloadAllTabs() {
    console.log('🔄 Preloading all tabs...');
    
    const tabs = ['overview', 'species', 'analytics', 'migration', 'feeding', 'live'];
    
    for (const tab of tabs) {
        if (!window.loadedTabs[tab]) {
            await preloadTab(tab);
            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('✅ All tabs preloaded');
}

/**
 * Clear tab cache (useful for development/refresh)
 */
function clearTabCache() {
    window.tabCache = {};
    window.loadedTabs = {
        overview: false,
        species: false,
        analytics: false,
        migration: false,
        feeding: false,
        live: false
    };
    console.log('🗑️ Tab cache cleared');
}

/**
 * Initialize tab system
 */
function initializeTabSystem() {
    console.log('🎬 Initializing tab system...');
    
    // Mark overview as loaded since it's the default active tab
    window.loadedTabs.overview = true;
    
    // Preload other tabs after a short delay (non-blocking)
    setTimeout(() => {
        preloadAllTabs();
    }, 2000);
    
    console.log('✅ Tab system initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTabSystem);
} else {
    initializeTabSystem();
}

// Export functions to global scope
window.switchTab = switchTab;
window.loadTabContent = loadTabContent;
window.initializeTabData = initializeTabData;
window.preloadTab = preloadTab;
window.preloadAllTabs = preloadAllTabs;
window.clearTabCache = clearTabCache;

console.log('✅ tab-loader.js loaded successfully');
