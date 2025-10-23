// Detection Trends Module - FIXED with proper chart destruction
console.log('detection-trends.js loading...');

// Fetch daily detection counts from species summary
async function fetchDailyDetectionCounts() {
    console.log('📊 Fetching detection trends from species summary data...');
    
    try {
        const response = await fetch(CONFIG.API_BASE + '/analytics/species/summary');
        if (!response.ok) throw new Error('Failed to fetch species summary');
        
        const speciesSummary = await response.json();
        console.log('✅ Loaded ' + speciesSummary.length + ' species');
        
        // Build daily counts from species data
        const dailyCounts = {};
        let totalDetections = 0;
        
        speciesSummary.forEach(function(species) {
            if (species.first_heard) {
                const firstDate = new Date(species.first_heard).toISOString().split('T')[0];
                dailyCounts[firstDate] = (dailyCounts[firstDate] || 0) + 1;
            }
            
            if (species.last_heard) {
                const lastDate = new Date(species.last_heard).toISOString().split('T')[0];
                if (lastDate !== new Date(species.first_heard).toISOString().split('T')[0]) {
                    dailyCounts[lastDate] = (dailyCounts[lastDate] || 0) + 1;
                }
            }
            
            if (species.count && species.first_heard && species.last_heard) {
                const first = new Date(species.first_heard);
                const last = new Date(species.last_heard);
                const days = Math.max(1, Math.floor((last - first) / (1000 * 60 * 60 * 24)));
                const perDay = Math.floor(species.count / days);
                
                for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
                    const dateKey = d.toISOString().split('T')[0];
                    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + perDay;
                }
                
                totalDetections += species.count;
            }
        });
        
        const dates = Object.keys(dailyCounts).sort();
        if (dates.length >= 2) {
            const firstDate = new Date(dates[0]);
            const lastDate = new Date(dates[dates.length - 1]);
            
            for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                if (!dailyCounts[dateKey]) {
                    dailyCounts[dateKey] = 0;
                }
            }
        }
        
        console.log('✅ Created trend data for ' + Object.keys(dailyCounts).length + ' days from ' + speciesSummary.length + ' species');
        console.log('📊 Total detections: ' + totalDetections.toLocaleString());
        
        const sampleDates = Object.keys(dailyCounts).sort().slice(-5);
        console.log('📈 Sample (last 5 days):');
        sampleDates.forEach(date => {
            console.log('   ' + date + ' : ' + dailyCounts[date] + ' detections');
        });
        
        return dailyCounts;
        
    } catch (error) {
        console.error('❌ Error fetching daily detection counts:', error);
        return {};
    }
}

// Calculate daily trends
function calculateDailyTrends(dailyCounts, daysBack) {
    console.log('📊 Calculating daily trends for last ' + daysBack + ' days...');
    
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(dailyCounts[dateKey] || 0);
    }
    
    const total = data.reduce(function(sum, c) { return sum + c; }, 0);
    console.log('✅ Total detections in period:', total);
    console.log('📈 Sample (first 5 days): ' + data.slice(0, 5).join(', '));
    
    return { labels: labels, data: data };
}

// Calculate weekly trends
function calculateWeeklyTrends(dailyCounts, weeksBack) {
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = weeksBack - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (now.getDay() + i * 7));
        
        let weekTotal = 0;
        for (let day = 0; day < 7; day++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + day);
            const dateKey = date.toISOString().split('T')[0];
            weekTotal += dailyCounts[dateKey] || 0;
        }
        
        data.push(weekTotal);
        labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return { labels: labels, data: data };
}

// Calculate monthly trends
function calculateMonthlyTrends(dailyCounts, monthsBack) {
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = monthsBack - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        let monthTotal = 0;
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            monthTotal += dailyCounts[dateKey] || 0;
        }
        
        data.push(monthTotal);
        labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    return { labels: labels, data: data };
}

// Calculate statistics
function calculateTrendStats(data) {
    if (data.length === 0) {
        return { peak: 0, average: 0, total: 0, trend: 'No data' };
    }
    
    const peak = Math.max.apply(Math, data);
    const total = data.reduce(function(sum, val) { return sum + val; }, 0);
    const average = Math.round(total / data.length * 10) / 10;
    
    let trend = 'Stable';
    if (data.length >= 3) {
        const recent = data.slice(-Math.min(7, data.length));
        const older = data.slice(0, Math.min(7, data.length));
        
        const recentAvg = recent.reduce(function(sum, val) { return sum + val; }, 0) / recent.length;
        const olderAvg = older.reduce(function(sum, val) { return sum + val; }, 0) / older.length;
        
        const percentChange = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100;
        
        if (percentChange > 15) trend = '📈 Increasing';
        else if (percentChange < -15) trend = '📉 Decreasing';
        else trend = '➡️ Stable';
    }
    
    return { peak: peak, average: average, total: total, trend: trend };
}

// Update the detection trends chart - FIXED WITH PROPER CHART DESTRUCTION
async function updateDetectionTrendsChart() {
    const timeframeSelect = document.getElementById('trends-timeframe');
    const infoDiv = document.getElementById('trends-info');
    
    if (!timeframeSelect || !infoDiv) {
        console.warn('⚠️ Detection trends UI elements not found - skipping update');
        return;
    }
    
    const timeframe = timeframeSelect.value;
    infoDiv.textContent = 'Loading detection counts from BirdNET...';
    
    try {
        const dailyCounts = await fetchDailyDetectionCounts();
        
        if (Object.keys(dailyCounts).length === 0) {
            infoDiv.innerHTML = '<span style="color: #f59e0b;">⚠️ No detection data available.</span>';
            
            // Destroy existing chart
            if (window.charts && window.charts.detectionTrends) {
                window.charts.detectionTrends.destroy();
                delete window.charts.detectionTrends;
            }
            
            const peakStat = document.getElementById('peak-activity-stat');
            const avgStat = document.getElementById('avg-daily-stat');
            const totalStat = document.getElementById('total-period-stat');
            const trendStat = document.getElementById('trend-direction-stat');
            
            if (peakStat) peakStat.textContent = '--';
            if (avgStat) avgStat.textContent = '--';
            if (totalStat) totalStat.textContent = '--';
            if (trendStat) trendStat.textContent = '--';
            
            return;
        }
        
        const totalDetections = Object.values(dailyCounts).reduce(function(sum, c) { return sum + c; }, 0);
        
        let trendData;
        let chartLabel;
        
        if (timeframe === 'daily') {
            trendData = calculateDailyTrends(dailyCounts, 30);
            chartLabel = 'Daily Detections';
            infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing last 30 days (' + totalDetections.toLocaleString() + ' total)</span>';
        } else if (timeframe === 'weekly') {
            trendData = calculateWeeklyTrends(dailyCounts, 12);
            chartLabel = 'Weekly Detections';
            infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing last 12 weeks (' + totalDetections.toLocaleString() + ' total)</span>';
        } else {
            trendData = calculateMonthlyTrends(dailyCounts, 12);
            chartLabel = 'Monthly Detections';
            infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing last 12 months (' + totalDetections.toLocaleString() + ' total)</span>';
        }
        
        const stats = calculateTrendStats(trendData.data);
        
        const peakStat = document.getElementById('peak-activity-stat');
        const avgStat = document.getElementById('avg-daily-stat');
        const totalStat = document.getElementById('total-period-stat');
        const trendStat = document.getElementById('trend-direction-stat');
        
        if (peakStat) peakStat.textContent = stats.peak + ' detections';
        if (avgStat) avgStat.textContent = stats.average + ' per period';
        if (totalStat) totalStat.textContent = stats.total + ' total';
        if (trendStat) trendStat.textContent = stats.trend;
        
        const canvas = document.getElementById('detection-trends-chart');
        if (!canvas) {
            console.error('❌ Detection trends chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // CRITICAL FIX: Destroy existing chart before creating new one
        if (window.charts && window.charts.detectionTrends) {
            window.charts.detectionTrends.destroy();
            delete window.charts.detectionTrends;
        }
        
        // Ensure charts object exists
        if (!window.charts) {
            window.charts = {};
        }
        
        window.charts.detectionTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: chartLabel,
                    data: trendData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            title: function(context) { return trendData.labels[context[0].dataIndex]; },
                            label: function(context) { return context.parsed.y + ' detections'; }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Detections' },
                        ticks: { precision: 0 }
                    },
                    x: {
                        title: { 
                            display: true, 
                            text: timeframe === 'daily' ? 'Date' : timeframe === 'weekly' ? 'Week Starting' : 'Month'
                        },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
        
        console.log('✅ Detection trends chart updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating detection trends:', error);
        if (infoDiv) {
            infoDiv.innerHTML = '<span style="color: #ef4444;">❌ Error: ' + error.message + '</span>';
        }
    }
}

// Initialize event listeners
function initializeDetectionTrendsEvents() {
    const timeframeSelect = document.getElementById('trends-timeframe');
    const refreshButton = document.getElementById('refresh-trends');
    
    if (timeframeSelect) {
        timeframeSelect.addEventListener('change', updateDetectionTrendsChart);
        console.log('✅ Timeframe selector event listener added');
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', updateDetectionTrendsChart);
        console.log('✅ Refresh button event listener added');
    }
}

// Export functions
window.updateDetectionTrendsChart = updateDetectionTrendsChart;
window.initializeDetectionTrendsEvents = initializeDetectionTrendsEvents;

console.log('✅ detection-trends.js loaded successfully');
