/**
 * Dense Dashboard Controller
 * Manages the data-dense dashboard layout and widgets
 */

(function() {
    'use strict';

    const DenseDashboard = {
        init() {
            console.log('🎛️ Initializing Dense Dashboard...');

            // Wait for data to be loaded
            setTimeout(() => {
                this.updateHeaderStats();
                this.createSparklines();
                this.createCharts();
                this.updateWidgets();
            }, 1000);

            // Auto-refresh every 30 seconds
            setInterval(() => {
                this.updateHeaderStats();
                this.updateWidgets();
            }, 30000);

            console.log('✅ Dense Dashboard initialized');
        },

        updateHeaderStats() {
            const species = BirdNET.data.species || [];
            const detections = BirdNET.data.detections || [];

            // Total Species
            const totalSpecies = species.length;
            document.getElementById('dense-total-species').textContent = totalSpecies.toLocaleString();
            document.getElementById('widget-species-count').textContent = totalSpecies.toLocaleString();

            // Total Detections
            const totalDetections = detections.length;
            document.getElementById('dense-total-detections').textContent = totalDetections.toLocaleString();

            // Average Confidence
            if (species.length > 0) {
                const avgConf = species.reduce((sum, s) => sum + (s.avg_confidence || 0), 0) / species.length;
                document.getElementById('dense-avg-confidence').textContent = Math.round(avgConf * 100) + '%';
                document.getElementById('widget-quality').textContent = Math.round(avgConf * 100) + '%';
            }

            // Active Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activeToday = species.filter(s => {
                if (!s.last_heard) return false;
                const lastHeard = new Date(s.last_heard);
                return lastHeard >= today;
            }).length;
            document.getElementById('dense-active-today').textContent = activeToday.toLocaleString();

            // Detection Rate (per hour)
            if (detections.length > 0) {
                // Calculate time span
                const times = detections.map(d => new Date(d.beginTime || d.timestamp).getTime());
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);
                const hours = (maxTime - minTime) / (1000 * 60 * 60);
                const rate = hours > 0 ? (detections.length / hours).toFixed(1) : 0;
                document.getElementById('widget-detection-rate').textContent = rate;
            }

            // Peak Activity
            const hourCounts = this.calculateHourlyActivity(detections);
            const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
            document.getElementById('widget-activity').textContent = hourCounts[peakHour] || 0;
        },

        calculateHourlyActivity(detections) {
            const hours = Array(24).fill(0);
            detections.forEach(d => {
                const date = new Date(d.beginTime || d.timestamp);
                const hour = date.getHours();
                hours[hour]++;
            });
            return hours;
        },

        createSparklines() {
            const detections = BirdNET.data.detections || [];
            if (detections.length === 0) return;

            // Get last 7 days of data
            const dailyData = this.getDailyData(detections, 7);

            // Species sparkline
            this.createSparkline('sparkline-species', dailyData.species, '#10b981');

            // Detections sparkline
            this.createSparkline('sparkline-detections', dailyData.detections, '#3b82f6');

            // Confidence sparkline
            this.createSparkline('sparkline-confidence', dailyData.confidence, '#f59e0b');

            // Activity sparkline (hourly for today)
            const hourlyData = this.calculateHourlyActivity(detections);
            this.createSparkline('sparkline-activity', hourlyData, '#8b5cf6');
        },

        getDailyData(detections, days) {
            const now = new Date();
            const species = {};
            const counts = {};
            const confidence = {};

            // Initialize
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split('T')[0];
                species[key] = new Set();
                counts[key] = 0;
                confidence[key] = [];
            }

            // Populate
            detections.forEach(d => {
                const date = new Date(d.beginTime || d.timestamp);
                const key = date.toISOString().split('T')[0];
                if (species[key]) {
                    species[key].add(d.commonName || d.common_name);
                    counts[key]++;
                    confidence[key].push(d.confidence || 0);
                }
            });

            return {
                species: Object.values(species).map(s => s.size),
                detections: Object.values(counts),
                confidence: Object.values(confidence).map(arr =>
                    arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) * 100 : 0
                )
            };
        },

        createSparkline(containerId, data, color) {
            const container = document.getElementById(containerId);
            if (!container || !data || data.length === 0) return;

            const canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);

            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: Array(data.length).fill(''),
                    datasets: [{
                        data: data,
                        borderColor: color,
                        backgroundColor: color + '20',
                        borderWidth: 2,
                        fill: true,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        },

        createCharts() {
            this.createTimelineChart();
            this.createSpeciesDistributionChart();
            this.createHourlyChart();
            this.createConfidenceChart();
            this.createWeeklyChart();
            this.createMonthlyChart();
        },

        createTimelineChart() {
            const canvas = document.getElementById('dense-timeline-chart');
            if (!canvas) return;

            const detections = BirdNET.data.detections || [];
            const dailyData = this.getDailyData(detections, 14);
            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: Array(14).fill('').map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (13 - i));
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }),
                    datasets: [{
                        label: 'Detections',
                        data: dailyData.detections,
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f620',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280' },
                            grid: { color: isDark ? '#334155' : '#e5e7eb' }
                        },
                        x: {
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280' },
                            grid: { display: false }
                        }
                    }
                }
            });
        },

        createSpeciesDistributionChart() {
            const canvas = document.getElementById('dense-species-chart');
            if (!canvas) return;

            const species = (BirdNET.data.species || []).slice(0, 5);
            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: species.map(s => s.common_name || 'Unknown'),
                    datasets: [{
                        data: species.map(s => s.count || 0),
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: isDark ? '#94a3b8' : '#6b7280',
                                boxWidth: 12,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        },

        createHourlyChart() {
            const canvas = document.getElementById('dense-hourly-chart');
            if (!canvas) return;

            const detections = BirdNET.data.detections || [];
            const hourlyData = this.calculateHourlyActivity(detections);
            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: Array(24).fill('').map((_, i) => i + ':00'),
                    datasets: [{
                        data: hourlyData,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { color: isDark ? '#334155' : '#e5e7eb' }
                        },
                        x: {
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        },

        createConfidenceChart() {
            const canvas = document.getElementById('dense-confidence-chart');
            if (!canvas) return;

            const detections = BirdNET.data.detections || [];
            const high = detections.filter(d => d.confidence >= 0.8).length;
            const medium = detections.filter(d => d.confidence >= 0.5 && d.confidence < 0.8).length;
            const low = detections.filter(d => d.confidence < 0.5).length;
            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: ['High (≥80%)', 'Medium (50-79%)', 'Low (<50%)'],
                    datasets: [{
                        data: [high, medium, low],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: isDark ? '#94a3b8' : '#6b7280',
                                boxWidth: 10,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        },

        createWeeklyChart() {
            const canvas = document.getElementById('dense-weekly-chart');
            if (!canvas) return;

            const detections = BirdNET.data.detections || [];
            const dailyData = this.getDailyData(detections, 7);
            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        data: dailyData.detections,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { color: isDark ? '#334155' : '#e5e7eb' }
                        },
                        x: {
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        },

        createMonthlyChart() {
            const canvas = document.getElementById('dense-monthly-chart');
            if (!canvas) return;

            const isDark = BirdNET.theme && BirdNET.theme.getTheme() === 'dark';

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'This Year',
                        data: [120, 150, 180, 200, 220, 250],
                        borderColor: '#3b82f6',
                        tension: 0.4
                    }, {
                        label: 'Last Year',
                        data: [100, 130, 160, 170, 190, 200],
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: isDark ? '#94a3b8' : '#6b7280',
                                boxWidth: 10,
                                font: { size: 10 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { color: isDark ? '#334155' : '#e5e7eb' }
                        },
                        x: {
                            ticks: { color: isDark ? '#94a3b8' : '#6b7280', font: { size: 9 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        },

        updateWidgets() {
            this.updateTopSpecies();
            this.updateRecentDetections();
            this.updateRareSightings();
        },

        updateTopSpecies() {
            const tbody = document.querySelector('#dense-top-species tbody');
            if (!tbody) return;

            const species = (BirdNET.data.species || []).slice(0, 10);
            if (species.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No data</td></tr>';
                return;
            }

            tbody.innerHTML = species.map(s => `
                <tr onclick="openSpeciesModal('${s.common_name}')" style="cursor: pointer;">
                    <td>${s.common_name || 'Unknown'}</td>
                    <td><strong>${s.count || 0}</strong></td>
                    <td><span class="mini-badge mini-badge-${
                        s.avg_confidence >= 0.8 ? 'success' :
                        s.avg_confidence >= 0.5 ? 'warning' : 'info'
                    }">${Math.round((s.avg_confidence || 0) * 100)}%</span></td>
                </tr>
            `).join('');
        },

        updateRecentDetections() {
            const container = document.getElementById('dense-recent-list');
            if (!container) return;

            const detections = (BirdNET.data.detections || []).slice(0, 10);
            if (detections.length === 0) {
                container.innerHTML = '<div>No recent detections</div>';
                return;
            }

            container.innerHTML = detections.map(d => `
                <div class="compact-list-item" onclick="openSpeciesModal('${d.commonName || d.common_name}')">
                    <span class="list-item-label">${d.commonName || d.common_name || 'Unknown'}</span>
                    <span class="list-item-value">${Math.round((d.confidence || 0) * 100)}%</span>
                </div>
            `).join('');
        },

        updateRareSightings() {
            const container = document.getElementById('dense-rare-list');
            if (!container) return;

            const species = (BirdNET.data.species || [])
                .filter(s => (s.count || 0) <= 3)
                .slice(0, 10);

            if (species.length === 0) {
                container.innerHTML = '<div>No rare sightings</div>';
                return;
            }

            container.innerHTML = species.map(s => `
                <div class="compact-list-item" onclick="openSpeciesModal('${s.common_name}')">
                    <span class="list-item-label">${s.common_name || 'Unknown'}</span>
                    <span class="list-item-value">${s.count || 0} detection${s.count === 1 ? '' : 's'}</span>
                </div>
            `).join('');
        }
    };

    // Expose to global namespace
    window.DenseDashboard = DenseDashboard;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => DenseDashboard.init(), 1500);
        });
    } else {
        setTimeout(() => DenseDashboard.init(), 1500);
    }

})();
