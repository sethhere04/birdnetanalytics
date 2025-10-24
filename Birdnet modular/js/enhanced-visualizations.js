/**
 * Enhanced Visualizations Demo
 * Showcases sparklines, progress bars, and radial charts in the dashboard
 */

(function() {
    'use strict';

    const EnhancedViz = {
        init() {
            // Wait for data to be loaded
            if (window.BirdNET && window.BirdNET.api) {
                this.setupEnhancedStats();
            }

            console.log('✅ Enhanced visualizations initialized');
        },

        setupEnhancedStats() {
            // Add enhanced stat cards with sparklines after initial data load
            const originalLoadStats = window.loadDashboardMetrics;

            window.loadDashboardMetrics = async function() {
                if (originalLoadStats) {
                    await originalLoadStats();
                }

                // Add sparklines to stat cards after a short delay
                setTimeout(() => {
                    EnhancedViz.addSparklinesToStats();
                }, 500);
            };
        },

        addSparklinesToStats() {
            // Get recent detection data for sparklines
            if (!window.BirdNET || !window.BirdNET.api) return;

            window.BirdNET.api.getDetections()
                .then(detections => {
                    if (!detections || detections.length === 0) return;

                    // Calculate daily counts for last 7 days
                    const dailyCounts = this.calculateDailyCounts(detections, 7);

                    // Add sparkline to each stat card
                    this.addSparklineToStatCard('total-species', dailyCounts.species);
                    this.addSparklineToStatCard('total-detections', dailyCounts.detections);
                })
                .catch(err => console.error('Error adding sparklines:', err));
        },

        calculateDailyCounts(detections, days) {
            const now = new Date();
            const speciesByDay = {};
            const detectionsByDay = {};

            // Initialize arrays for each day
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                speciesByDay[dateKey] = new Set();
                detectionsByDay[dateKey] = 0;
            }

            // Count detections and species per day
            detections.forEach(d => {
                const date = new Date(d.date || d.beginTime || d.timestamp);
                const dateKey = date.toISOString().split('T')[0];

                if (detectionsByDay[dateKey] !== undefined) {
                    detectionsByDay[dateKey]++;
                    speciesByDay[dateKey].add(d.commonName || d.scientificName);
                }
            });

            return {
                species: Object.values(speciesByDay).map(s => s.size),
                detections: Object.values(detectionsByDay)
            };
        },

        addSparklineToStatCard(statId, data) {
            const statCard = document.getElementById(statId)?.closest('.stat-card');
            if (!statCard || !data || data.length === 0) return;

            // Check if sparkline already exists
            if (statCard.querySelector('.sparkline-container')) return;

            const container = document.createElement('div');
            container.className = 'sparkline-container';
            container.style.marginTop = '0.5rem';
            statCard.appendChild(container);

            // Create sparkline
            if (window.BirdNET && window.BirdNET.sparkline) {
                window.BirdNET.sparkline.create(container, data);
            }
        },

        // Add progress bars to species detection rates
        addProgressBarsToSpeciesTable() {
            const speciesTable = document.getElementById('species-table');
            if (!speciesTable) return;

            const rows = speciesTable.querySelectorAll('tbody tr');
            if (rows.length === 0) return;

            // Find max detection count
            let maxDetections = 0;
            rows.forEach(row => {
                const detectionCell = row.cells[1];
                if (detectionCell) {
                    const count = parseInt(detectionCell.textContent) || 0;
                    maxDetections = Math.max(maxDetections, count);
                }
            });

            // Add progress bars
            rows.forEach(row => {
                const detectionCell = row.cells[1];
                if (detectionCell && maxDetections > 0) {
                    const count = parseInt(detectionCell.textContent) || 0;
                    const originalText = detectionCell.textContent;

                    detectionCell.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="min-width: 40px; font-weight: 600;">${originalText}</span>
                            <div style="flex: 1;">
                                ${window.BirdNET.progressBar.create(count, maxDetections)}
                            </div>
                        </div>
                    `;
                }
            });
        },

        // Add radial progress to confidence scores
        addRadialProgressToAnalytics() {
            const section = document.querySelector('#tab-analytics .section');
            if (!section) return;

            // Create a new section for confidence metrics
            const confidenceSection = document.createElement('div');
            confidenceSection.className = 'section';
            confidenceSection.innerHTML = `
                <h2>📊 Detection Quality Metrics</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 2rem; justify-items: center;">
                    <div id="radial-high-confidence"></div>
                    <div id="radial-medium-confidence"></div>
                    <div id="radial-low-confidence"></div>
                </div>
            `;

            // Insert before other analytics sections
            const analyticsTab = document.getElementById('tab-analytics');
            if (analyticsTab) {
                analyticsTab.insertBefore(confidenceSection, analyticsTab.firstChild);
            }

            // Calculate and display confidence metrics
            this.updateConfidenceMetrics();
        },

        updateConfidenceMetrics() {
            if (!window.BirdNET || !window.BirdNET.api) return;

            window.BirdNET.api.getDetections()
                .then(detections => {
                    if (!detections || detections.length === 0) return;

                    const total = detections.length;
                    const high = detections.filter(d => d.confidence >= 0.8).length;
                    const medium = detections.filter(d => d.confidence >= 0.5 && d.confidence < 0.8).length;
                    const low = detections.filter(d => d.confidence < 0.5).length;

                    const highContainer = document.getElementById('radial-high-confidence');
                    const mediumContainer = document.getElementById('radial-medium-confidence');
                    const lowContainer = document.getElementById('radial-low-confidence');

                    if (window.BirdNET.radialProgress) {
                        if (highContainer) {
                            window.BirdNET.radialProgress.create(highContainer, high, total, 'High Confidence (≥80%)');
                        }
                        if (mediumContainer) {
                            window.BirdNET.radialProgress.create(mediumContainer, medium, total, 'Medium Confidence (50-79%)');
                        }
                        if (lowContainer) {
                            window.BirdNET.radialProgress.create(lowContainer, low, total, 'Low Confidence (<50%)');
                        }
                    }
                })
                .catch(err => console.error('Error updating confidence metrics:', err));
        },

        // Enhance loading states with skeleton screens
        enhanceLoadingStates() {
            // Override loading placeholders with skeleton screens
            const loadingPlaceholders = document.querySelectorAll('.loading-placeholder');

            loadingPlaceholders.forEach(placeholder => {
                const parent = placeholder.closest('.stats-grid');
                if (parent && window.BirdNET && window.BirdNET.skeleton) {
                    window.BirdNET.skeleton.showStatsLoading(parent);
                }
            });

            // Table loading states
            const tables = document.querySelectorAll('tbody');
            tables.forEach(tbody => {
                const loadingRow = tbody.querySelector('.loading-placeholder');
                if (loadingRow && window.BirdNET && window.BirdNET.skeleton) {
                    const columns = loadingRow.getAttribute('colspan') || 4;
                    window.BirdNET.skeleton.showTableLoading(tbody, 5, parseInt(columns));
                }
            });
        }
    };

    // Expose to global namespace
    window.BirdNET = window.BirdNET || {};
    window.BirdNET.enhancedViz = EnhancedViz;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => EnhancedViz.init(), 1000);
        });
    } else {
        setTimeout(() => EnhancedViz.init(), 1000);
    }

})();
