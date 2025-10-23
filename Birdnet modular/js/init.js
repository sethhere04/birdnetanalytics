// Initialization Script - Ensures proper startup
console.log('🚀 Starting BirdNET Dashboard initialization...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

async function initializeDashboard() {
    console.log('📋 DOM ready, initializing dashboard...');
    
    try {
        // Verify namespace exists
        if (typeof BirdNET === 'undefined') {
            throw new Error('BirdNET namespace not found! Make sure config.js loaded first.');
        }
        
        // Verify required modules
        const requiredModules = ['config', 'utils', 'api', 'audio', 'updates', 'ui'];
        const missingModules = requiredModules.filter(m => !BirdNET[m] || Object.keys(BirdNET[m]).length === 0);
        
        if (missingModules.length > 0) {
            console.warn('⚠️ Missing modules:', missingModules);
            console.warn('Some features may not work. Check that all JS files are loaded.');
        }
        
        console.log('✅ All core modules present');
        
        // Initialize UI event listeners
        if (BirdNET.ui && BirdNET.ui.initializeEventListeners) {
            BirdNET.ui.initializeEventListeners();
            console.log('✅ Event listeners initialized');
        }
        
        // Initialize optional module event listeners
        if (BirdNET.analytics && BirdNET.analytics.initializeEventListeners) {
            BirdNET.analytics.initializeEventListeners();
        }
        
        if (BirdNET.liveStream && BirdNET.liveStream.initializeEventListeners) {
            BirdNET.liveStream.initializeEventListeners();
        }
        
        // Load initial data
        console.log('📡 Loading initial data...');
        await loadInitialData();
        
        // Set up auto-refresh
        if (BirdNET.settings.enableAutoRefresh) {
            startAutoRefresh();
        }
        
        // Switch to overview tab
        if (window.switchTab) {
            switchTab('overview');
        }
        
        console.log('🎉 Dashboard initialization complete!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showInitializationError(error);
    }
}

async function loadInitialData() {
    try {
        // Fetch species data
        if (BirdNET.api && BirdNET.api.fetchData) {
            await BirdNET.api.fetchData();
        } else {
            throw new Error('API module not loaded');
        }
        
        // Fetch detections (load more for analytics)
        if (BirdNET.api.fetchAllDetections) {
            console.log('📊 Loading detections for comprehensive analytics...');
            await BirdNET.api.fetchAllDetections(BirdNET.config.MAX_DETECTIONS_TO_LOAD);
        } else if (BirdNET.api.fetchDetections) {
            await BirdNET.api.fetchDetections(BirdNET.config.RECENT_DETECTIONS_DISPLAY);
        }
        
        // Update all UI elements
        if (BirdNET.updates && BirdNET.updates.all) {
            await BirdNET.updates.all();
        } else if (BirdNET.updates) {
            // Fallback: update individual components
            if (BirdNET.updates.systemStatus) BirdNET.updates.systemStatus();
            if (BirdNET.updates.metrics) BirdNET.updates.metrics();
            if (BirdNET.updates.speciesTable) BirdNET.updates.speciesTable();
            if (BirdNET.updates.speciesGallery) BirdNET.updates.speciesGallery();
            if (BirdNET.updates.newestSpecies) BirdNET.updates.newestSpecies();
            if (BirdNET.updates.recentDetections) await BirdNET.updates.recentDetections();
        }
        
        console.log('✅ Initial data loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        throw error;
    }
}

function startAutoRefresh() {
    console.log('⏱️ Starting auto-refresh (every 30 seconds)');
    
    setInterval(async function() {
        try {
            console.log('🔄 Auto-refresh triggered');
            
            if (BirdNET.api && BirdNET.api.fetchData) {
                await BirdNET.api.fetchData();
            }
            
            if (BirdNET.updates && BirdNET.updates.all) {
                await BirdNET.updates.all();
            }
            
            console.log('✅ Auto-refresh complete');
            
        } catch (error) {
            console.error('❌ Auto-refresh failed:', error);
        }
    }, 30000);
}

function showInitializationError(error) {
    const container = document.querySelector('.container');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background: #fee2e2; border: 2px solid #ef4444; padding: 2rem; border-radius: 8px; margin: 2rem 0; text-align: center;';
        errorDiv.innerHTML = `
            <h2 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Initialization Error</h2>
            <p style="color: #7f1d1d; margin-bottom: 1rem;">${error.message}</p>
            <button onclick="location.reload()" style="background: #ef4444; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Reload Page
            </button>
        `;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// Expose refresh function globally
window.refreshAllData = async function() {
    console.log('🔄 Manual refresh triggered');
    try {
        await loadInitialData();
        alert('✅ Data refreshed successfully!');
    } catch (error) {
        console.error('Refresh failed:', error);
        alert('❌ Failed to refresh data. Check console for details.');
    }
};

console.log('✅ Initialization script loaded');
