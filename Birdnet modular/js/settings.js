// Settings Module - User preferences and configuration
console.log('Loading BirdNET.settingsManager module...');

(function() {
    'use strict';
    
    const settingsManager = BirdNET.settingsManager = {};
    const utils = BirdNET.utils;
    
    // Show settings modal
    settingsManager.show = function() {
        const modal = document.getElementById('settings-modal');
        if (!modal) {
            settingsManager.createModal();
        }
        
        // Update form with current values
        settingsManager.updateForm();
        
        const modal2 = document.getElementById('settings-modal');
        if (modal2) {
            modal2.style.display = 'block';
        }
    };
    
    // Hide settings modal
    settingsManager.hide = function() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // Create settings modal
    settingsManager.createModal = function() {
        const modalHTML = `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">⚙️ Dashboard Settings</h2>
                        </div>
                        <span class="close" onclick="BirdNET.settingsManager.hide()">&times;</span>
                    </div>
                    
                    <div style="padding: 1rem 0;">
                        <h3 style="font-size: 1rem; margin-bottom: 1rem; color: #374151;">Data Loading</h3>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Maximum Detections to Load</label>
                            <select id="max-detections-setting" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px;">
                                <option value="1000">1,000 detections (Fast)</option>
                                <option value="5000">5,000 detections (Recommended)</option>
                                <option value="10000">10,000 detections (Detailed)</option>
                                <option value="25000">25,000 detections (Comprehensive)</option>
                                <option value="50000">50,000 detections (Maximum)</option>
                                <option value="75000">75,000+ detections (All - Slow)</option>
                            </select>
                            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                                More detections = better analytics but slower loading
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Auto-Refresh Interval</label>
                            <select id="refresh-interval-setting" style="width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px;">
                                <option value="15000">15 seconds</option>
                                <option value="30000">30 seconds (Default)</option>
                                <option value="60000">1 minute</option>
                                <option value="300000">5 minutes</option>
                                <option value="0">Disabled</option>
                            </select>
                        </div>
                        
                        <h3 style="font-size: 1rem; margin: 1.5rem 0 1rem 0; color: #374151;">Display Options</h3>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="show-scientific-names" style="margin-right: 0.5rem;">
                                <span>Show scientific names in species lists</span>
                            </label>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="enable-sounds" style="margin-right: 0.5rem;">
                                <span>Enable audio playback</span>
                            </label>
                        </div>
                        
                        <h3 style="font-size: 1rem; margin: 1.5rem 0 1rem 0; color: #374151;">Current Status</h3>
                        
                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px; font-size: 0.875rem;">
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Loaded Detections:</strong> <span id="current-detections-count">--</span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Loaded Species:</strong> <span id="current-species-count">--</span>
                            </div>
                            <div>
                                <strong>Last Refresh:</strong> <span id="last-refresh-time">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <button onclick="BirdNET.settingsManager.hide()" style="background: #6b7280;">Cancel</button>
                        <button onclick="BirdNET.settingsManager.save()" style="background: var(--primary);">Save & Reload</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };
    
    // Update form with current values
    settingsManager.updateForm = function() {
        const maxDetections = document.getElementById('max-detections-setting');
        if (maxDetections) {
            maxDetections.value = BirdNET.config.MAX_DETECTIONS_TO_LOAD;
        }
        
        const refreshInterval = document.getElementById('refresh-interval-setting');
        if (refreshInterval) {
            refreshInterval.value = BirdNET.config.REFRESH_INTERVAL;
        }
        
        const showScientific = document.getElementById('show-scientific-names');
        if (showScientific) {
            showScientific.checked = BirdNET.settings.showScientificNames;
        }
        
        const enableSounds = document.getElementById('enable-sounds');
        if (enableSounds) {
            enableSounds.checked = BirdNET.settings.enableSounds;
        }
        
        // Update current status
        const detectionsCount = document.getElementById('current-detections-count');
        if (detectionsCount) {
            detectionsCount.textContent = (BirdNET.data.detections || []).length.toLocaleString();
        }
        
        const speciesCount = document.getElementById('current-species-count');
        if (speciesCount) {
            speciesCount.textContent = (BirdNET.data.species || []).length.toLocaleString();
        }
        
        const lastRefresh = document.getElementById('last-refresh-time');
        if (lastRefresh) {
            lastRefresh.textContent = new Date().toLocaleString();
        }
    };
    
    // Save settings and reload
    settingsManager.save = function() {
        const maxDetections = document.getElementById('max-detections-setting');
        if (maxDetections) {
            BirdNET.config.MAX_DETECTIONS_TO_LOAD = parseInt(maxDetections.value);
        }
        
        const refreshInterval = document.getElementById('refresh-interval-setting');
        if (refreshInterval) {
            const newInterval = parseInt(refreshInterval.value);
            BirdNET.config.REFRESH_INTERVAL = newInterval;
        }
        
        const showScientific = document.getElementById('show-scientific-names');
        if (showScientific) {
            BirdNET.settings.showScientificNames = showScientific.checked;
        }
        
        const enableSounds = document.getElementById('enable-sounds');
        if (enableSounds) {
            BirdNET.settings.enableSounds = enableSounds.checked;
        }
        
        settingsManager.hide();
        
        // Reload data with new settings
        alert('Settings saved! Reloading data with new configuration...');
        location.reload();
    };
    
    console.log('✅ BirdNET.settingsManager module loaded');
    
})();
