/**
 * Backyard Birds Analytics - Enhanced Version
 * API Base: http://192.168.68.129:8080/api/v2/
 */

const BirdAnalytics = {
    // Configuration
    config: {
        apiBase: 'http://192.168.68.129:8080/api/v2',
        refreshInterval: 60000, // 1 minute
        detectionLimit: 10000,
        useWikipediaImages: true
    },

    // Data storage
    data: {
        species: [],
        detections: [],
        analytics: null,
        speciesImages: {},
        migrations: null
    },

    // Charts
    charts: {},

    // Filters
    filters: {
        dateRange: 'all', // all, today, week, month
        speciesFilter: ''
    },

    /**
     * Parse detection date/time from API format
     * API format: { "date": "2025-10-27", "time": "10:53:12" }
     */
    parseDetectionDate(detection) {
        // Handle separate date and time fields (BirdNET-Go v2 format)
        if (detection.date && detection.time) {
            return new Date(`${detection.date}T${detection.time}`);
        }

        // Fallback to other formats
        if (detection.begin_time) return new Date(detection.begin_time);
        if (detection.timestamp) return new Date(detection.timestamp);
        if (detection.date) return new Date(detection.date);
        if (detection.DateTime) return new Date(detection.DateTime);

        // Last resort - use current time
        return new Date();
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('🦜 Initializing Enhanced Backyard Birds Analytics...');

        // Set up event listeners
        this.setupTabs();
        this.setupFilters();
        this.setupExport();

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

            // Analyze migration patterns
            this.data.migrations = this.analyzeMigrationPatterns();

            // Load species images
            this.loadSpeciesImages();

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
            return [];
        }
    },

    /**
     * Fetch detections from API with pagination
     */
    async fetchDetections() {
        try {
            const endpoints = [
                '/detections',
                '/notes'
            ];

            // Try each endpoint
            for (const endpoint of endpoints) {
                try {
                    console.log(`📡 Trying endpoint: ${endpoint}`);
                    const detections = await this.fetchAllDetectionsPaginated(endpoint);

                    if (detections.length > 0) {
                        console.log(`✅ Successfully loaded ${detections.length} total detections from ${endpoint}`);
                        return detections;
                    }
                } catch (e) {
                    console.warn(`❌ Endpoint ${endpoint} failed:`, e.message);
                    continue;
                }
            }

            console.warn('⚠️ No detections endpoint available');
            return [];
        } catch (error) {
            console.error('❌ Failed to fetch detections:', error);
            return [];
        }
    },

    /**
     * Fetch all detections using pagination
     */
    async fetchAllDetectionsPaginated(endpoint) {
        const batchSize = 1000;
        let offset = 0;
        let allDetections = [];
        let consecutiveEmpty = 0;

        while (true) {
            try {
                const url = `${this.config.apiBase}${endpoint}?limit=${batchSize}&offset=${offset}`;
                console.log(`  📥 Fetching batch: offset=${offset}, limit=${batchSize}`);

                const response = await fetch(url);

                if (!response.ok) {
                    console.warn(`  ⚠️ HTTP ${response.status} - stopping pagination`);
                    break;
                }

                const data = await response.json();
                const detections = Array.isArray(data) ? data : (data.data || []);

                if (detections.length === 0) {
                    consecutiveEmpty++;
                    if (consecutiveEmpty >= 2) {
                        console.log(`  ✓ No more records found`);
                        break;
                    }
                    offset += batchSize;
                    continue;
                }

                consecutiveEmpty = 0;
                allDetections.push(...detections);
                console.log(`  ✓ Loaded ${detections.length} records (total: ${allDetections.length})`);

                // If we got fewer records than requested, we've reached the end
                if (detections.length < batchSize) {
                    console.log(`  ✓ Reached end of data`);
                    break;
                }

                offset += batchSize;

                // Safety limit to prevent infinite loops
                if (allDetections.length >= 100000) {
                    console.warn(`  ⚠️ Reached safety limit of 100,000 records`);
                    break;
                }

            } catch (error) {
                console.error(`  ❌ Error fetching batch at offset ${offset}:`, error);
                break;
            }
        }

        return allDetections;
    },

    /**
     * Load species thumbnail images from Wikipedia
     */
    async loadSpeciesImages() {
        const species = this.data.analytics?.topSpecies || [];

        for (const sp of species.slice(0, 20)) {
            if (this.data.speciesImages[sp.name]) continue;

            try {
                const searchName = sp.name.replace(' ', '_');
                const response = await fetch(
                    `https://en.wikipedia.org/api/rest_v1/page/summary/${searchName}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.thumbnail) {
                        this.data.speciesImages[sp.name] = data.thumbnail.source;
                        console.log(`✅ Loaded image for ${sp.name}`);
                    }
                }
            } catch (error) {
                console.warn(`No image found for ${sp.name}`);
            }
        }

        // Refresh species displays with images
        this.renderOverview();
        this.renderSpecies();
    },

    /**
     * Analyze migration patterns
     */
    analyzeMigrationPatterns() {
        const detections = this.data.detections;
        if (detections.length === 0) return [];

        // Group by species
        const speciesData = {};

        detections.forEach(d => {
            const species = d.commonName || d.common_name || d.scientificName || 'Unknown';
            const date = this.parseDetectionDate(d);

            if (!speciesData[species]) {
                speciesData[species] = {
                    name: species,
                    detections: []
                };
            }

            speciesData[species].detections.push(date);
        });

        // Analyze each species
        const migrations = [];

        for (const [species, data] of Object.entries(speciesData)) {
            const dates = data.detections.sort((a, b) => a - b);

            // Get day of year for each detection
            const daysOfYear = dates.map(d => this.getDayOfYear(d));

            // Calculate presence by month
            const monthlyPresence = Array(12).fill(0);
            dates.forEach(d => {
                monthlyPresence[d.getMonth()]++;
            });

            // Determine pattern
            const pattern = this.classifyMigrationPattern(monthlyPresence, dates);

            // Calculate statistics
            const firstSeen = dates[0];
            const lastSeen = dates[dates.length - 1];
            const avgDayOfYear = daysOfYear.reduce((a, b) => a + b, 0) / daysOfYear.length;

            // Predict next arrival/departure
            const prediction = this.predictMigration(pattern, daysOfYear, monthlyPresence);

            migrations.push({
                species,
                pattern: pattern.type,
                firstSeen,
                lastSeen,
                detectionCount: dates.length,
                monthlyPresence,
                prediction,
                confidence: this.calculateConfidence(dates)
            });
        }

        return migrations.sort((a, b) => {
            const aDate = a.prediction.nextDate || new Date(9999, 0, 1);
            const bDate = b.prediction.nextDate || new Date(9999, 0, 1);
            return aDate - bDate;
        });
    },

    /**
     * Get day of year (1-366)
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    },

    /**
     * Classify migration pattern
     */
    classifyMigrationPattern(monthlyPresence, dates) {
        const presentMonths = monthlyPresence.filter(c => c > 0).length;
        const total = monthlyPresence.reduce((a, b) => a + b, 0);

        // Year-round resident
        if (presentMonths >= 10) {
            return { type: 'resident', description: 'Year-round resident' };
        }

        // Summer resident (May-August)
        const summer = monthlyPresence.slice(4, 8).reduce((a, b) => a + b, 0);
        if (summer / total > 0.6) {
            return { type: 'summer', description: 'Summer breeding visitor' };
        }

        // Winter resident (November-February)
        const winter = monthlyPresence.slice(10, 12).reduce((a, b) => a + b, 0) +
                      monthlyPresence.slice(0, 2).reduce((a, b) => a + b, 0);
        if (winter / total > 0.6) {
            return { type: 'winter', description: 'Winter visitor' };
        }

        // Transient (spring/fall migration)
        return { type: 'transient', description: 'Migratory (passing through)' };
    },

    /**
     * Predict migration timing
     */
    predictMigration(pattern, daysOfYear, monthlyPresence) {
        const today = new Date();
        const currentDay = this.getDayOfYear(today);

        if (pattern.type === 'resident') {
            return {
                status: 'present',
                message: 'Expected year-round',
                nextDate: null
            };
        }

        const avgDay = daysOfYear.reduce((a, b) => a + b, 0) / daysOfYear.length;
        const minDay = Math.min(...daysOfYear);
        const maxDay = Math.max(...daysOfYear);

        let status, message, nextDate;

        if (pattern.type === 'summer') {
            if (currentDay >= minDay && currentDay <= maxDay) {
                status = 'present';
                message = `Expected until ~${this.formatDayOfYear(maxDay)}`;
                nextDate = this.getDayOfYearAsDate(maxDay);
            } else if (currentDay < minDay) {
                status = 'expected';
                message = `Expected to arrive ~${this.formatDayOfYear(minDay)}`;
                nextDate = this.getDayOfYearAsDate(minDay);
            } else {
                status = 'departed';
                message = `Expected to return ~${this.formatDayOfYear(minDay)} next year`;
                const next = new Date(today.getFullYear() + 1, 0, minDay);
                nextDate = next;
            }
        } else if (pattern.type === 'winter') {
            const winterStart = 305; // ~November 1
            const winterEnd = 75;    // ~March 15

            if (currentDay >= winterStart || currentDay <= winterEnd) {
                status = 'present';
                message = 'Currently present for winter';
                nextDate = this.getDayOfYearAsDate(winterEnd);
            } else if (currentDay < winterStart) {
                status = 'expected';
                message = `Expected to arrive ~${this.formatDayOfYear(winterStart)}`;
                nextDate = this.getDayOfYearAsDate(winterStart);
            } else {
                status = 'departed';
                message = `Expected to return ~${this.formatDayOfYear(winterStart)}`;
                nextDate = this.getDayOfYearAsDate(winterStart);
            }
        } else { // transient
            const springWindow = currentDay >= minDay - 30 && currentDay <= minDay + 30;
            const fallWindow = currentDay >= maxDay - 30 && currentDay <= maxDay + 30;

            if (springWindow || fallWindow) {
                status = 'migrating';
                message = 'May appear during migration';
                nextDate = new Date();
            } else if (currentDay < minDay) {
                status = 'expected';
                message = `Spring migration ~${this.formatDayOfYear(minDay)}`;
                nextDate = this.getDayOfYearAsDate(minDay);
            } else {
                status = 'departed';
                message = `Next spring migration ~${this.formatDayOfYear(minDay)}`;
                const next = new Date(today.getFullYear() + 1, 0, minDay);
                nextDate = next;
            }
        }

        return { status, message, nextDate };
    },

    /**
     * Format day of year as readable date
     */
    formatDayOfYear(day) {
        const date = new Date(new Date().getFullYear(), 0, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    /**
     * Get date object from day of year
     */
    getDayOfYearAsDate(day) {
        return new Date(new Date().getFullYear(), 0, day);
    },

    /**
     * Calculate confidence
     */
    calculateConfidence(dates) {
        const years = new Set(dates.map(d => d.getFullYear())).size;
        const count = dates.length;

        if (years >= 3 && count >= 20) return 'high';
        if (years >= 2 && count >= 10) return 'medium';
        return 'low';
    },

    /**
     * Analyze data to generate insights
     */
    analyzeData() {
        const { species, detections } = this.data;

        if (detections.length === 0) {
            return this.getEmptyAnalytics();
        }

        // Apply filters
        const filteredDetections = this.applyFilters(detections);

        return {
            // Basic stats
            totalSpecies: new Set(detections.map(d => d.commonName || d.common_name || d.scientificName)).size,
            totalDetections: detections.length,
            filteredDetections: filteredDetections.length,

            // Time-based analytics
            daily: this.analyzeDailyActivity(filteredDetections),
            hourly: this.analyzeHourlyPattern(filteredDetections),
            weekly: this.analyzeWeeklyPattern(filteredDetections),
            monthly: this.analyzeMonthlyPattern(filteredDetections),

            // Species analytics
            topSpecies: this.getTopSpecies(filteredDetections),
            allSpecies: this.getAllSpeciesStats(filteredDetections),
            diversity: this.calculateDiversity(filteredDetections),
            rarest: this.getRarestSpecies(filteredDetections),

            // Recent activity
            today: this.getTodayStats(filteredDetections),
            recent: this.getRecentDetections(filteredDetections, 50),

            // Insights
            insights: this.generateInsights(filteredDetections)
        };
    },

    /**
     * Apply date range filters
     */
    applyFilters(detections) {
        let filtered = [...detections];

        // Date range filter
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            const cutoff = new Date();

            switch (this.filters.dateRange) {
                case 'today':
                    cutoff.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoff.setDate(cutoff.getDate() - 7);
                    break;
                case 'month':
                    cutoff.setMonth(cutoff.getMonth() - 1);
                    break;
            }

            filtered = filtered.filter(d => {
                const date = this.parseDetectionDate(d);
                return date >= cutoff;
            });
        }

        // Species name filter
        if (this.filters.speciesFilter) {
            const search = this.filters.speciesFilter.toLowerCase();
            filtered = filtered.filter(d => {
                const name = (d.commonName || d.common_name || d.scientificName || '').toLowerCase();
                return name.includes(search);
            });
        }

        return filtered;
    },

    /**
     * Analyze monthly pattern
     */
    analyzeMonthlyPattern(detections) {
        const months = Array(12).fill(0);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        detections.forEach(d => {
            const date = this.parseDetectionDate(d);
            months[date.getMonth()]++;
        });

        return months.map((count, index) => ({ month: monthNames[index], count }));
    },

    /**
     * Get rarest species
     */
    getRarestSpecies(detections) {
        const topSpecies = this.getTopSpecies(detections);
        return topSpecies.filter(s => s.count <= 3).slice(0, 10);
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
            const date = this.parseDetectionDate(d);
            const key = date.toISOString().split('T')[0];
            if (days[key]) {
                days[key].count++;
                days[key].species.add(d.commonName || d.common_name || d.scientificName);
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
            const date = this.parseDetectionDate(d);
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
            const date = this.parseDetectionDate(d);
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
            const species = d.commonName || d.common_name || d.scientificName || 'Unknown';
            if (!speciesCounts[species]) {
                speciesCounts[species] = {
                    name: species,
                    count: 0,
                    totalConfidence: 0,
                    firstSeen: this.parseDetectionDate(d),
                    lastSeen: this.parseDetectionDate(d)
                };
            }

            speciesCounts[species].count++;
            speciesCounts[species].totalConfidence += parseFloat(d.confidence || 0);

            const date = this.parseDetectionDate(d);
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
            const date = this.parseDetectionDate(d);
            return date >= today;
        });

        const species = new Set(todayDetections.map(d => d.commonName || d.common_name || d.scientificName));

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
                timestamp: this.parseDetectionDate(d)
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
        const monthly = this.analyzeMonthlyPattern(detections);

        // Peak activity time
        const peakHour = hourly.reduce((max, h) => h.count > max.count ? h : max, hourly[0]);
        insights.push({
            type: 'peak-time',
            icon: '🕐',
            title: 'Peak Activity Hour',
            text: `Most bird activity occurs at ${peakHour.hour}:00 with ${peakHour.count} average detections. Set up your camera or sit by the window during this time!`
        });

        // Most common bird
        if (topSpecies.length > 0) {
            const top = topSpecies[0];
            const percentage = ((top.count / detections.length) * 100).toFixed(1);
            insights.push({
                type: 'common-species',
                icon: '👑',
                title: 'Most Common Visitor',
                text: `${top.name} is your backyard champion, accounting for ${percentage}% of all detections (${top.count} total sightings).`
            });
        }

        // Recent activity trend
        const last7Days = daily.slice(-7);
        const prev7Days = daily.slice(-14, -7);
        const recentAvg = last7Days.reduce((sum, d) => sum + d.count, 0) / 7;
        const prevAvg = prev7Days.reduce((sum, d) => sum + d.count, 0) / 7;
        const change = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg * 100).toFixed(1) : 0;

        if (Math.abs(change) > 10) {
            insights.push({
                type: 'activity-trend',
                icon: change > 0 ? '📈' : '📉',
                title: 'Activity Trend',
                text: `Bird activity has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% over the past week. ${change > 0 ? 'Great time for birding!' : 'Activity may pick up soon.'}`
            });
        }

        // Species diversity
        const uniqueSpecies = new Set(detections.map(d => d.commonName || d.common_name || d.scientificName)).size;
        insights.push({
            type: 'diversity',
            icon: '🌈',
            title: 'Species Diversity',
            text: `You've detected ${uniqueSpecies} different species in your backyard. ${uniqueSpecies >= 15 ? 'Excellent diversity!' : uniqueSpecies >= 8 ? 'Good variety!' : 'More species may appear as seasons change.'}`
        });

        // New species this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const newSpecies = topSpecies.filter(s => s.firstSeen >= weekAgo);
        if (newSpecies.length > 0) {
            insights.push({
                type: 'new-species',
                icon: '🆕',
                title: 'New Visitors This Week',
                text: `${newSpecies.length} new species detected: ${newSpecies.map(s => s.name).slice(0, 3).join(', ')}${newSpecies.length > 3 ? ' and more' : ''}.`
            });
        }

        // Best month
        const bestMonth = monthly.reduce((max, m) => m.count > max.count ? m : max, monthly[0]);
        insights.push({
            type: 'best-month',
            icon: '📅',
            title: 'Most Active Month',
            text: `${bestMonth.month} is your busiest month with ${bestMonth.count} detections. Plan your bird watching activities accordingly!`
        });

        // Rare visitors
        const rare = topSpecies.filter(s => s.count <= 3);
        if (rare.length > 0) {
            insights.push({
                type: 'rare-visitors',
                icon: '💎',
                title: 'Rare Visitors',
                text: `You've had ${rare.length} species with 3 or fewer sightings. Keep watching - you might see them again!`
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
            filteredDetections: 0,
            daily: [],
            hourly: [],
            weekly: [],
            monthly: [],
            topSpecies: [],
            allSpecies: [],
            diversity: [],
            rarest: [],
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

        // Update filtered count
        const filterInfo = document.getElementById('filter-info');
        if (filterInfo) {
            if (analytics.filteredDetections !== analytics.totalDetections) {
                filterInfo.textContent = `Showing ${analytics.filteredDetections} of ${analytics.totalDetections} detections`;
                filterInfo.style.display = 'block';
            } else {
                filterInfo.style.display = 'none';
            }
        }

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
            case 'migration':
                this.renderMigration();
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

        // Monthly trend
        this.renderMonthlyChart(analytics.monthly);
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
                }, {
                    label: 'Unique Species',
                    data: daily.map(d => d.speciesCount),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
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
     * Get species image URL
     */
    getSpeciesImageUrl(speciesName) {
        if (this.data.speciesImages[speciesName]) {
            return this.data.speciesImages[speciesName];
        }
        // Return bird emoji as fallback
        return null;
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

        container.innerHTML = species.map(s => {
            const imageUrl = this.getSpeciesImageUrl(s.name);
            return `
            <div class="species-item" onclick="BirdAnalytics.showSpeciesDetail('${s.name.replace(/'/g, "\\'")}')">
                <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                    ${!imageUrl ? '🐦' : ''}
                </div>
                <div class="species-info">
                    <div class="species-name">${s.name}</div>
                    <div class="species-meta">${(s.avgConfidence * 100).toFixed(1)}% confidence</div>
                </div>
                <div class="species-count">${s.count}</div>
            </div>
        `}).join('');
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
     * Render monthly chart
     */
    renderMonthlyChart(monthly) {
        const canvas = document.getElementById('monthly-trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthly.map(m => m.month),
                datasets: [{
                    label: 'Detections',
                    data: monthly.map(m => m.count),
                    backgroundColor: '#10b981'
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

        container.innerHTML = analytics.allSpecies.map(s => {
            const imageUrl = this.getSpeciesImageUrl(s.name);
            return `
            <div class="species-item" onclick="BirdAnalytics.showSpeciesDetail('${s.name.replace(/'/g, "\\'")}')">
                <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                    ${!imageUrl ? '🐦' : ''}
                </div>
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
        `}).join('');
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

        // Rare species
        this.renderRareSpecies(analytics.rarest);
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
            const species = d.commonName || d.common_name || d.scientificName || 'Unknown';
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
     * Render rare species
     */
    renderRareSpecies(rarest) {
        const container = document.getElementById('rare-species-list');
        if (!container) return;

        if (rarest.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No rare species yet</p></div>';
            return;
        }

        container.innerHTML = rarest.map(s => {
            const imageUrl = this.getSpeciesImageUrl(s.name);
            return `
            <div class="species-item">
                <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                    ${!imageUrl ? '💎' : ''}
                </div>
                <div class="species-info">
                    <div class="species-name">${s.name}</div>
                    <div class="species-meta">Last seen: ${s.lastSeen.toLocaleDateString()}</div>
                </div>
                <div class="species-count">${s.count}</div>
            </div>
        `}).join('');
    },

    /**
     * Render migration tab
     */
    renderMigration() {
        const migrations = this.data.migrations;
        const container = document.getElementById('migration-calendar');

        if (!container) return;

        if (!migrations || migrations.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🦅</div><p>Not enough data to predict migration patterns</p></div>';
            return;
        }

        // Group by status
        const grouped = {
            present: migrations.filter(m => m.prediction.status === 'present'),
            expected: migrations.filter(m => m.prediction.status === 'expected'),
            migrating: migrations.filter(m => m.prediction.status === 'migrating'),
            departed: migrations.filter(m => m.prediction.status === 'departed')
        };

        const statusColors = {
            present: '#10b981',
            expected: '#3b82f6',
            migrating: '#f59e0b',
            departed: '#6b7280'
        };

        const statusLabels = {
            present: '✅ Currently Present',
            expected: '🔜 Expected Soon',
            migrating: '🦅 Migrating Through',
            departed: '📅 Departed'
        };

        let html = '';

        for (const [status, items] of Object.entries(grouped)) {
            if (items.length === 0) continue;

            html += `
                <div class="migration-section">
                    <h3 class="migration-section-title" style="color: ${statusColors[status]}">
                        ${statusLabels[status]} (${items.length})
                    </h3>
                    <div class="migration-grid">
            `;

            items.forEach(m => {
                const imageUrl = this.getSpeciesImageUrl(m.species);
                const confidenceColor = m.confidence === 'high' ? '#10b981' : m.confidence === 'medium' ? '#f59e0b' : '#6b7280';

                html += `
                    <div class="migration-card" style="border-left-color: ${statusColors[status]}">
                        <div class="migration-card-header">
                            <div class="species-icon${imageUrl ? ' species-image' : ''}" style="${imageUrl ? `background-image: url(${imageUrl})` : ''}">
                                ${!imageUrl ? '🐦' : ''}
                            </div>
                            <div class="migration-card-title">
                                <div class="species-name">${m.species}</div>
                                <div class="migration-pattern">${m.pattern}</div>
                            </div>
                        </div>
                        <div class="migration-card-body">
                            <p class="migration-message">${m.prediction.message}</p>
                            <div class="migration-stats">
                                <div class="migration-stat-item">
                                    <span class="label">Detections:</span>
                                    <span class="value">${m.detectionCount}</span>
                                </div>
                                <div class="migration-stat-item">
                                    <span class="label">First seen:</span>
                                    <span class="value">${m.firstSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div class="migration-stat-item">
                                    <span class="label">Last seen:</span>
                                    <span class="value">${m.lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div class="migration-stat-item">
                                    <span class="label">Confidence:</span>
                                    <span class="value" style="color: ${confidenceColor}">${m.confidence}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
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
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-text">${insight.text}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Show species detail modal
     */
    showSpeciesDetail(speciesName) {
        const species = this.data.analytics.allSpecies.find(s => s.name === speciesName);
        if (!species) return;

        const migration = this.data.migrations?.find(m => m.species === speciesName);
        const imageUrl = this.getSpeciesImageUrl(speciesName);

        const modal = document.getElementById('species-modal');
        if (!modal) return;

        const modalBody = modal.querySelector('.modal-body');

        modalBody.innerHTML = `
            <div class="species-detail">
                ${imageUrl ? `<img src="${imageUrl}" alt="${speciesName}" class="species-detail-image">` : ''}
                <h2>${speciesName}</h2>

                <div class="species-detail-stats">
                    <div class="stat-item">
                        <div class="stat-label">Total Detections</div>
                        <div class="stat-value">${species.count}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Confidence</div>
                        <div class="stat-value">${(species.avgConfidence * 100).toFixed(1)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">First Seen</div>
                        <div class="stat-value">${species.firstSeen.toLocaleDateString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Last Seen</div>
                        <div class="stat-value">${species.lastSeen.toLocaleDateString()}</div>
                    </div>
                </div>

                ${migration ? `
                    <div class="species-detail-section">
                        <h3>Migration Pattern</h3>
                        <p><strong>Pattern:</strong> ${migration.pattern}</p>
                        <p><strong>Status:</strong> ${migration.prediction.message}</p>
                        <p><strong>Confidence:</strong> ${migration.confidence}</p>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'flex';
    },

    /**
     * Export data to CSV
     */
    exportToCSV() {
        const { analytics } = this.data;

        if (!analytics || analytics.allSpecies.length === 0) {
            alert('No data to export');
            return;
        }

        let csv = 'Species,Total Detections,Avg Confidence,First Seen,Last Seen\n';

        analytics.allSpecies.forEach(s => {
            csv += `"${s.name}",${s.count},${(s.avgConfidence * 100).toFixed(1)}%,${s.firstSeen.toLocaleDateString()},${s.lastSeen.toLocaleDateString()}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bird-detections-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Exported data to CSV');
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
     * Set up filters
     */
    setupFilters() {
        const dateRangeSelect = document.getElementById('date-range-filter');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.data.analytics = this.analyzeData();
                this.updateDashboard();
            });
        }

        const speciesSearch = document.getElementById('species-search');
        if (speciesSearch) {
            speciesSearch.addEventListener('input', (e) => {
                this.filters.speciesFilter = e.target.value;
                this.data.analytics = this.analyzeData();
                this.updateDashboard();
            });
        }
    },

    /**
     * Set up export
     */
    setupExport() {
        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }
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
