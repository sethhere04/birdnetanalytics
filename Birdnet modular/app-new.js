/**
 * Backyard Birds Analytics - Modern Single Page Application
 * API Base: http://192.168.68.129:8080/api/v2/
 */

const BirdAnalytics = {
    // Configuration
    config: {
        apiBase: 'http://192.168.68.129:8080/api/v2',
        refreshInterval: 60000, // 1 minute
        detectionLimit: 10000
    },

    // Data storage
    data: {
        species: [],
        detections: [],
        analytics: null
    },

    // Charts
    charts: {},

    /**
     * Initialize the application
     */
    async init() {
        console.log('🦜 Initializing Backyard Birds Analytics...');

        // Set up tab switching
        this.setupTabs();

        // Load data
        await this.loadData();

        // Set up auto-refresh
        setInterval(() => this.loadData(), this.config.refreshInterval);

        console.log('✅ Application initialized');
    },

    /**
     * Load all data from API
     */
    async loadData() {
        try {
            console.log('📡 Fetching data from API...');

            // Fetch species and detections in parallel
            const [species, detections] = await Promise.all([
                this.fetchSpecies(),
                this.fetchDetections()
            ]);

            this.data.species = species;
            this.data.detections = detections;

            // Analyze data
            this.data.analytics = this.analyzeData();

            // Update UI
            this.updateDashboard();

            console.log(`✅ Loaded ${species.length} species, ${detections.length} detections`);
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError('Failed to load data. Check API connection.');
        }
    },

    /**
     * Fetch species summary from API
     */
    async fetchSpecies() {
        try {
            const response = await fetch(`${this.config.apiBase}/analytics/species/summary`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('Species endpoint failed, trying alternative...');
            // Return empty array if endpoint not available
            return [];
        }
    },

    /**
     * Fetch detections from API
     */
    async fetchDetections() {
        try {
            const endpoints = [
                `/detections?limit=${this.config.detectionLimit}`,
                `/notes?limit=${this.config.detectionLimit}&offset=0`
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${this.config.apiBase}${endpoint}`);
                    if (response.ok) {
                        const data = await response.json();
                        const detections = Array.isArray(data) ? data : (data.data || []);
                        console.log(`✅ Found ${detections.length} detections from ${endpoint}`);
                        return detections;
                    }
                } catch (e) {
                    continue;
                }
            }

            console.warn('No detections endpoint available');
            return [];
        } catch (error) {
            console.error('Failed to fetch detections:', error);
            return [];
        }
    },

    /**
     * Analyze data to generate insights
     */
    analyzeData() {
        const { species, detections } = this.data;

        if (detections.length === 0) {
            return this.getEmptyAnalytics();
        }

        return {
            // Basic stats
            totalSpecies: new Set(detections.map(d => d.common_name || d.scientificName)).size,
            totalDetections: detections.length,

            // Time-based analytics
            daily: this.analyzeDailyActivity(detections),
            hourly: this.analyzeHourlyPattern(detections),
            weekly: this.analyzeWeeklyPattern(detections),

            // Species analytics
            topSpecies: this.getTopSpecies(detections),
            allSpecies: this.getAllSpeciesStats(detections),
            diversity: this.calculateDiversity(detections),

            // Recent activity
            today: this.getTodayStats(detections),
            recent: this.getRecentDetections(detections, 50),

            // Insights
            insights: this.generateInsights(detections)
        };
    },

    /**
     * Analyze daily activity (last 30 days)
     */
    analyzeDailyActivity(detections) {
        const days = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            days[key] = { count: 0, species: new Set() };
        }

        // Count detections per day
        detections.forEach(d => {
            const date = new Date(d.begin_time || d.timestamp || d.date);
            const key = date.toISOString().split('T')[0];
            if (days[key]) {
                days[key].count++;
                days[key].species.add(d.common_name || d.scientificName);
            }
        });

        return Object.entries(days).map(([date, data]) => ({
            date,
            count: data.count,
            speciesCount: data.species.size
        }));
    },

    /**
     * Analyze hourly pattern
     */
    analyzeHourlyPattern(detections) {
        const hours = Array(24).fill(0);

        detections.forEach(d => {
            const date = new Date(d.begin_time || d.timestamp || d.date);
            const hour = date.getHours();
            hours[hour]++;
        });

        return hours.map((count, hour) => ({ hour, count }));
    },

    /**
     * Analyze weekly pattern (day of week)
     */
    analyzeWeeklyPattern(detections) {
        const days = Array(7).fill(0);

        detections.forEach(d => {
            const date = new Date(d.begin_time || d.timestamp || d.date);
            const day = date.getDay();
            days[day]++;
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days.map((count, index) => ({ day: dayNames[index], count }));
    },

    /**
     * Get top species by detection count
     */
    getTopSpecies(detections) {
        const speciesCounts = {};

        detections.forEach(d => {
            const species = d.common_name || d.scientificName || 'Unknown';
            if (!speciesCounts[species]) {
                speciesCounts[species] = {
                    name: species,
                    count: 0,
                    totalConfidence: 0,
                    firstSeen: new Date(d.begin_time || d.timestamp || d.date),
                    lastSeen: new Date(d.begin_time || d.timestamp || d.date)
                };
            }

            speciesCounts[species].count++;
            speciesCounts[species].totalConfidence += parseFloat(d.confidence || 0);

            const date = new Date(d.begin_time || d.timestamp || d.date);
            if (date < speciesCounts[species].firstSeen) {
                speciesCounts[species].firstSeen = date;
            }
            if (date > speciesCounts[species].lastSeen) {
                speciesCounts[species].lastSeen = date;
            }
        });

        return Object.values(speciesCounts)
            .map(s => ({
                ...s,
                avgConfidence: s.totalConfidence / s.count
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Get all species stats
     */
    getAllSpeciesStats(detections) {
        return this.getTopSpecies(detections);
    },

    /**
     * Calculate diversity metrics
     */
    calculateDiversity(detections) {
        const topSpecies = this.getTopSpecies(detections);
        const total = detections.length;

        return topSpecies.slice(0, 10).map(s => ({
            name: s.name,
            count: s.count,
            percentage: ((s.count / total) * 100).toFixed(1)
        }));
    },

    /**
     * Get today's stats
     */
    getTodayStats(detections) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayDetections = detections.filter(d => {
            const date = new Date(d.begin_time || d.timestamp || d.date);
            return date >= today;
        });

        const species = new Set(todayDetections.map(d => d.common_name || d.scientificName));

        return {
            count: todayDetections.length,
            species: species.size
        };
    },

    /**
     * Get recent detections
     */
    getRecentDetections(detections, limit = 50) {
        return detections
            .map(d => ({
                ...d,
                timestamp: new Date(d.begin_time || d.timestamp || d.date)
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    },

    /**
     * Generate AI insights
     */
    generateInsights(detections) {
        const insights = [];
        const hourly = this.analyzeHourlyPattern(detections);
        const topSpecies = this.getTopSpecies(detections);
        const daily = this.analyzeDailyActivity(detections);

        // Peak activity time
        const peakHour = hourly.reduce((max, h) => h.count > max.count ? h : max, hourly[0]);
        insights.push({
            type: 'peak-time',
            title: 'Peak Activity Hour',
            text: `Most bird activity occurs at ${peakHour.hour}:00 with ${peakHour.count} average detections.`
        });

        // Most common bird
        if (topSpecies.length > 0) {
            const top = topSpecies[0];
            const percentage = ((top.count / detections.length) * 100).toFixed(1);
            insights.push({
                type: 'common-species',
                title: 'Most Common Visitor',
                text: `${top.name} accounts for ${percentage}% of all detections (${top.count} total).`
            });
        }

        // Recent activity trend
        const last7Days = daily.slice(-7);
        const prev7Days = daily.slice(-14, -7);
        const recentAvg = last7Days.reduce((sum, d) => sum + d.count, 0) / 7;
        const prevAvg = prev7Days.reduce((sum, d) => sum + d.count, 0) / 7;
        const change = ((recentAvg - prevAvg) / prevAvg * 100).toFixed(1);

        if (Math.abs(change) > 10) {
            insights.push({
                type: 'activity-trend',
                title: 'Activity Trend',
                text: `Bird activity has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% over the past week.`
            });
        }

        // Species diversity
        const uniqueSpecies = new Set(detections.map(d => d.common_name || d.scientificName)).size;
        insights.push({
            type: 'diversity',
            title: 'Species Diversity',
            text: `You've detected ${uniqueSpecies} different species. ${topSpecies.length >= 3 ? 'Great diversity!' : 'More species may appear as seasons change.'}`
        });

        // New species this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const newSpecies = topSpecies.filter(s => s.firstSeen >= weekAgo);
        if (newSpecies.length > 0) {
            insights.push({
                type: 'new-species',
                title: 'New Visitors',
                text: `${newSpecies.length} new species detected this week: ${newSpecies.map(s => s.name).join(', ')}.`
            });
        }

        return insights;
    },

    /**
     * Get empty analytics structure
     */
    getEmptyAnalytics() {
        return {
            totalSpecies: 0,
            totalDetections: 0,
            daily: [],
            hourly: [],
            weekly: [],
            topSpecies: [],
            allSpecies: [],
            diversity: [],
            today: { count: 0, species: 0 },
            recent: [],
            insights: []
        };
    },

    /**
     * Update dashboard UI
     */
    updateDashboard() {
        const { analytics } = this.data;

        if (!analytics) return;

        // Update header stats
        document.getElementById('total-species').textContent = analytics.totalSpecies;
        document.getElementById('total-detections').textContent = analytics.totalDetections.toLocaleString();
        document.getElementById('active-today').textContent = analytics.today.species;

        const peakHour = analytics.hourly.reduce((max, h) => h.count > max.count ? h : max, { hour: 0 });
        document.getElementById('most-active-time').textContent = `${peakHour.hour}:00`;

        // Update current tab
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        this.renderTab(activeTab);
    },

    /**
     * Render specific tab
     */
    renderTab(tabName) {
        const { analytics } = this.data;

        if (!analytics) return;

        switch (tabName) {
            case 'overview':
                this.renderOverview();
                break;
            case 'species':
                this.renderSpecies();
                break;
            case 'activity':
                this.renderActivity();
                break;
            case 'insights':
                this.renderInsights();
                break;
        }
    },

    /**
     * Render overview tab
     */
    renderOverview() {
        const { analytics } = this.data;

        // Daily activity chart
        this.renderDailyChart(analytics.daily);

        // Top species list
        this.renderTopSpeciesList(analytics.topSpecies.slice(0, 10));

        // Hourly pattern chart
        this.renderHourlyChart(analytics.hourly);

        // Species distribution chart
        this.renderDistributionChart(analytics.diversity);
    },

    /**
     * Render daily activity chart
     */
    renderDailyChart(daily) {
        const canvas = document.getElementById('daily-activity-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: daily.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Detections',
                    data: daily.map(d => d.count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    /**
     * Render top species list
     */
    renderTopSpeciesList(species) {
        const container = document.getElementById('top-species-list');
        if (!container) return;

        if (species.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦜</div><p>No species detected yet</p></div>';
            return;
        }

        container.innerHTML = species.map(s => `
            <div class="species-item">
                <div class="species-icon">🐦</div>
                <div class="species-info">
                    <div class="species-name">${s.name}</div>
                    <div class="species-meta">${(s.avgConfidence * 100).toFixed(1)}% confidence</div>
                </div>
                <div class="species-count">${s.count}</div>
            </div>
        `).join('');
    },

    /**
     * Render hourly pattern chart
     */
    renderHourlyChart(hourly) {
        const canvas = document.getElementById('hourly-pattern-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourly.map(h => `${h.hour}:00`),
                datasets: [{
                    label: 'Detections',
                    data: hourly.map(h => h.count),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    /**
     * Render species distribution chart
     */
    renderDistributionChart(diversity) {
        const canvas = document.getElementById('species-distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: diversity.map(d => d.name),
                datasets: [{
                    data: diversity.map(d => d.count),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
                        '#a8edea', '#fed6e3'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    /**
     * Render species tab
     */
    renderSpecies() {
        const { analytics } = this.data;
        const container = document.getElementById('all-species-list');

        if (!container) return;

        if (analytics.allSpecies.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦜</div><p>No species detected yet</p></div>';
            return;
        }

        container.innerHTML = analytics.allSpecies.map(s => `
            <div class="species-item">
                <div class="species-icon">🐦</div>
                <div class="species-info">
                    <div class="species-name">${s.name}</div>
                    <div class="species-meta">
                        First seen: ${s.firstSeen.toLocaleDateString()} •
                        Last seen: ${s.lastSeen.toLocaleDateString()} •
                        ${(s.avgConfidence * 100).toFixed(1)}% avg confidence
                    </div>
                </div>
                <div class="species-count">${s.count}</div>
            </div>
        `).join('');
    },

    /**
     * Render activity tab
     */
    renderActivity() {
        const { analytics } = this.data;

        // Weekly heatmap
        this.renderWeeklyHeatmap(analytics.weekly);

        // Recent activity timeline
        this.renderTimeline(analytics.recent);
    },

    /**
     * Render weekly heatmap
     */
    renderWeeklyHeatmap(weekly) {
        const canvas = document.getElementById('weekly-heatmap-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekly.map(w => w.day),
                datasets: [{
                    label: 'Detections',
                    data: weekly.map(w => w.count),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    /**
     * Render activity timeline
     */
    renderTimeline(recent) {
        const container = document.getElementById('activity-timeline');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
            return;
        }

        container.innerHTML = recent.slice(0, 20).map(d => {
            const time = d.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const date = d.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const species = d.common_name || d.scientificName || 'Unknown';
            const confidence = ((d.confidence || 0) * 100).toFixed(1);

            return `
                <div class="timeline-item">
                    <div class="timeline-time">${date} at ${time}</div>
                    <div class="timeline-content">
                        <strong>${species}</strong> detected (${confidence}% confidence)
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render insights tab
     */
    renderInsights() {
        const { analytics } = this.data;
        const container = document.getElementById('insights-container');

        if (!container) return;

        if (analytics.insights.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Not enough data to generate insights</p></div>';
            return;
        }

        container.innerHTML = analytics.insights.map(insight => `
            <div class="insight-box">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    },

    /**
     * Set up tab switching
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show corresponding content
                tabContents.forEach(content => {
                    content.style.display = 'none';
                });

                const targetContent = document.getElementById(`tab-${tabName}`);
                if (targetContent) {
                    targetContent.style.display = 'block';
                }

                // Render tab content
                this.renderTab(tabName);
            });
        });
    },

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        // Could add a toast notification here
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BirdAnalytics.init());
} else {
    BirdAnalytics.init();
}
