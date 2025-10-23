// Charts Module - Chart Management and Utilities
console.log('charts.js loading...');

// Create BirdNET namespace if it doesn't exist
if (typeof BirdNET === 'undefined') {
    window.BirdNET = {};
}

// Charts module
BirdNET.charts = (function() {
    'use strict';
    
    // Store chart instances
    const chartInstances = {};
    
    /**
     * Create or update a chart
     * @param {string} canvasId - ID of the canvas element
     * @param {object} config - Chart.js configuration
     * @returns {Chart} Chart instance
     */
    function createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn('Canvas not found:', canvasId);
            return null;
        }
        
        // Destroy existing chart if it exists
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }
        
        // Create new chart
        const ctx = canvas.getContext('2d');
        chartInstances[canvasId] = new Chart(ctx, config);
        
        return chartInstances[canvasId];
    }
    
    /**
     * Destroy a chart
     * @param {string} canvasId - ID of the canvas element
     */
    function destroyChart(canvasId) {
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
            delete chartInstances[canvasId];
        }
    }
    
    /**
     * Get chart instance
     * @param {string} canvasId - ID of the canvas element
     * @returns {Chart|null} Chart instance or null
     */
    function getChart(canvasId) {
        return chartInstances[canvasId] || null;
    }
    
    /**
     * Destroy all charts
     */
    function destroyAll() {
        Object.keys(chartInstances).forEach(function(canvasId) {
            destroyChart(canvasId);
        });
    }
    
    /**
     * Update chart data
     * @param {string} canvasId - ID of the canvas element
     * @param {object} newData - New data for the chart
     */
    function updateChartData(canvasId, newData) {
        const chart = chartInstances[canvasId];
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
    
    // Public API
    return {
        create: createChart,
        destroy: destroyChart,
        get: getChart,
        destroyAll: destroyAll,
        updateData: updateChartData
    };
})();

console.log('✅ charts.js loaded successfully');