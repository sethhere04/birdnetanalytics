/**
 * Theme and Enhanced UI Features
 * Handles dark mode, skeleton loaders, sparklines, and progress bars
 */

(function() {
    'use strict';

    // ============================================
    // Theme Management
    // ============================================

    const ThemeManager = {
        init() {
            // Load saved theme or default to light
            const savedTheme = localStorage.getItem('birdnet-theme') || 'light';
            this.setTheme(savedTheme, false);

            // Setup toggle button
            const toggleBtn = document.getElementById('theme-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggle());
            }

            console.log('✅ Theme manager initialized');
        },

        setTheme(theme, save = true) {
            document.documentElement.setAttribute('data-theme', theme);

            if (save) {
                localStorage.setItem('birdnet-theme', theme);
            }

            // Update charts if they exist
            if (window.BirdNET && window.BirdNET.charts) {
                setTimeout(() => {
                    this.updateChartColors(theme);
                }, 100);
            }
        },

        toggle() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        getTheme() {
            return document.documentElement.getAttribute('data-theme') || 'light';
        },

        updateChartColors(theme) {
            const isDark = theme === 'dark';
            const textColor = isDark ? '#f1f5f9' : '#111827';
            const gridColor = isDark ? '#334155' : '#e5e7eb';

            // Update all Chart.js instances
            if (window.Chart) {
                Chart.defaults.color = textColor;
                Chart.defaults.borderColor = gridColor;
            }

            // Trigger chart updates if available
            if (window.charts) {
                Object.values(window.charts).forEach(chart => {
                    if (chart && chart.options) {
                        if (chart.options.scales) {
                            Object.values(chart.options.scales).forEach(scale => {
                                if (scale.ticks) scale.ticks.color = textColor;
                                if (scale.grid) scale.grid.color = gridColor;
                            });
                        }
                        if (chart.options.plugins && chart.options.plugins.legend) {
                            chart.options.plugins.legend.labels.color = textColor;
                        }
                        chart.update('none');
                    }
                });
            }
        }
    };

    // ============================================
    // Skeleton Loaders
    // ============================================

    const SkeletonLoader = {
        createStatsSkeleton() {
            return `
                <div class="skeleton-stat">
                    <div class="skeleton skeleton-stat-value"></div>
                    <div class="skeleton skeleton-stat-label"></div>
                </div>
            `;
        },

        createCardSkeleton() {
            return `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                </div>
            `;
        },

        createTableRowSkeleton(columns = 4) {
            const cells = Array(columns).fill('<td><div class="skeleton"></div></td>').join('');
            return `<tr class="skeleton-row">${cells}</tr>`;
        },

        showStatsLoading(container) {
            if (!container) return;
            const skeletons = Array(4).fill(this.createStatsSkeleton()).join('');
            container.innerHTML = skeletons;
        },

        showCardsLoading(container, count = 3) {
            if (!container) return;
            const skeletons = Array(count).fill(this.createCardSkeleton()).join('');
            container.innerHTML = skeletons;
        },

        showTableLoading(tbody, rows = 5, columns = 4) {
            if (!tbody) return;
            const skeletonRows = Array(rows).fill(this.createTableRowSkeleton(columns)).join('');
            tbody.innerHTML = skeletonRows;
        }
    };

    // ============================================
    // Sparkline Charts (Mini line charts)
    // ============================================

    const Sparkline = {
        create(container, data, options = {}) {
            if (!container || !data || data.length === 0) return;

            const canvas = document.createElement('canvas');
            canvas.className = 'sparkline';
            container.innerHTML = '';
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const isDark = ThemeManager.getTheme() === 'dark';

            const defaultOptions = {
                type: 'line',
                data: {
                    labels: Array(data.length).fill(''),
                    datasets: [{
                        data: data,
                        borderColor: options.color || (isDark ? '#60a5fa' : '#2563eb'),
                        borderWidth: 2,
                        fill: false,
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
            };

            return new Chart(ctx, defaultOptions);
        }
    };

    // ============================================
    // Progress Bars
    // ============================================

    const ProgressBar = {
        create(value, max = 100, label = '') {
            const percentage = Math.min(100, Math.max(0, (value / max) * 100));

            return `
                <div class="progress-wrapper">
                    ${label ? `
                        <div class="progress-label">
                            <span>${label}</span>
                            <span>${value}/${max}</span>
                        </div>
                    ` : ''}
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        },

        update(container, value, max = 100) {
            const fill = container.querySelector('.progress-bar-fill');
            if (fill) {
                const percentage = Math.min(100, Math.max(0, (value / max) * 100));
                fill.style.width = `${percentage}%`;
            }
        }
    };

    // ============================================
    // Radial Progress Charts
    // ============================================

    const RadialProgress = {
        create(container, value, max = 100, label = '') {
            if (!container) return;

            const percentage = Math.min(100, Math.max(0, (value / max) * 100));
            const radius = 50;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;

            container.innerHTML = `
                <div class="radial-progress">
                    <svg class="radial-progress-circle" width="120" height="120" viewBox="0 0 120 120">
                        <circle class="radial-progress-bg" cx="60" cy="60" r="${radius}"></circle>
                        <circle class="radial-progress-fill" cx="60" cy="60" r="${radius}"
                                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"></circle>
                    </svg>
                    <div class="radial-progress-text">${Math.round(percentage)}%</div>
                </div>
                ${label ? `<div class="radial-progress-label">${label}</div>` : ''}
            `;
        },

        update(container, value, max = 100) {
            const circle = container.querySelector('.radial-progress-fill');
            const text = container.querySelector('.radial-progress-text');

            if (circle && text) {
                const percentage = Math.min(100, Math.max(0, (value / max) * 100));
                const radius = 50;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percentage / 100) * circumference;

                circle.style.strokeDashoffset = offset;
                text.textContent = `${Math.round(percentage)}%`;
            }
        }
    };

    // ============================================
    // Expose to global namespace
    // ============================================

    window.BirdNET = window.BirdNET || {};
    window.BirdNET.theme = ThemeManager;
    window.BirdNET.skeleton = SkeletonLoader;
    window.BirdNET.sparkline = Sparkline;
    window.BirdNET.progressBar = ProgressBar;
    window.BirdNET.radialProgress = RadialProgress;

    // Initialize theme on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }

})();
