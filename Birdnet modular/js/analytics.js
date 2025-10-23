// Analytics Module - Detection trends and statistics
console.log('Loading BirdNET.analytics module...');

(function() {
    'use strict';
    
    const analytics = BirdNET.analytics;
    const utils = BirdNET.utils;
    const api = BirdNET.api;
    const charts = BirdNET.charts;
    
    // Fetch daily detection counts
    analytics.fetchDailyDetectionCounts = async function() {
        try {
            console.log('Fetching daily detection counts...');
            
            // Try multiple possible endpoints
            const endpoints = [
                BirdNET.config.API_BASE + '/analytics/detections/daily',
                BirdNET.config.API_BASE.replace('/v2', '') + '/analytics/detections/daily'
            ];
            
            let data = null;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        data = await response.json();
                        console.log('✅ Fetched daily counts from:', endpoint);
                        break;
                    }
                } catch (err) {
                    continue;
                }
            }
            
            if (!data) {
                console.warn('⚠️ Daily detection counts endpoint not available');
                // Generate mock data from detections if possible
                return analytics.generateDailyCountsFromDetections();
            }
            
            BirdNET.data.dailyCounts = data;
            console.log('✅ Fetched daily counts');
            return data;
            
        } catch (error) {
            console.warn('Failed to fetch daily counts:', error);
            return analytics.generateDailyCountsFromDetections();
        }
    };
    
    // Generate daily counts from available detections data
    analytics.generateDailyCountsFromDetections = function() {
        console.log('📊 Generating daily counts from detection data...');
        
        const detections = BirdNET.data.detections || [];
        const dailyCounts = {};
        
        detections.forEach(function(detection) {
            const timestamp = utils.getDetectionTime(detection);
            const dateStr = timestamp.toISOString().split('T')[0];
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        });
        
        // Fill in missing days with zeros for last 30 days
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (!dailyCounts[dateStr]) {
                dailyCounts[dateStr] = 0;
            }
        }
        
        console.log('✅ Generated daily counts from ' + detections.length + ' detections');
        BirdNET.data.dailyCounts = dailyCounts;
        return dailyCounts;
    };
    
    // Calculate daily trends
    analytics.calculateDailyTrends = function(dailyCounts, days) {
        const labels = [];
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(dailyCounts[dateStr] || 0);
        }
        
        return { labels: labels, data: data };
    };
    
    // Calculate weekly trends
    analytics.calculateWeeklyTrends = function(dailyCounts, weeks) {
        const labels = [];
        const data = [];
        const today = new Date();
        
        for (let i = weeks - 1; i >= 0; i--) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            
            let weekTotal = 0;
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + d);
                const dateStr = date.toISOString().split('T')[0];
                weekTotal += dailyCounts[dateStr] || 0;
            }
            
            labels.push('Week of ' + weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(weekTotal);
        }
        
        return { labels: labels, data: data };
    };
    
    // Calculate monthly trends
    analytics.calculateMonthlyTrends = function(dailyCounts, months) {
        const labels = [];
        const data = [];
        const monthNames = [];
        const today = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            let monthTotal = 0;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = year + '-' + 
                              String(month + 1).padStart(2, '0') + '-' + 
                              String(day).padStart(2, '0');
                monthTotal += dailyCounts[dateStr] || 0;
            }
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            data.push(monthTotal);
            monthNames.push(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }
        
        return { labels: labels, data: data, months: monthNames };
    };
    
    // Calculate trend statistics
    analytics.calculateTrendStats = function(data) {
        if (data.length === 0) {
            return {
                peak: 0,
                average: 0,
                total: 0,
                trend: 'No data'
            };
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
            
            if (percentChange > 15) {
                trend = '📈 Increasing';
            } else if (percentChange < -15) {
                trend = '📉 Decreasing';
            } else {
                trend = '➡️ Stable';
            }
        }
        
        return {
            peak: peak,
            average: average,
            total: total,
            trend: trend
        };
    };
    
    // Update detection trends chart
    analytics.updateTrendsChart = async function() {
        const timeframe = document.getElementById('trends-timeframe')?.value || 'daily';
        const infoDiv = utils.getElement('trends-info');
        
        if (infoDiv) {
            infoDiv.textContent = 'Loading detection counts from BirdNET...';
        }
        
        try {
            const dailyCounts = await analytics.fetchDailyDetectionCounts();
            
            if (Object.keys(dailyCounts).length === 0) {
                if (infoDiv) {
                    infoDiv.innerHTML = '<span style="color: #f59e0b;">⚠️ No detection data available. Check that your BirdNET is running and has detection history.</span>';
                }
                
                const canvas = document.getElementById('detection-trends-chart');
                if (canvas && charts.detectionTrends) {
                    charts.detectionTrends.destroy();
                    delete charts.detectionTrends;
                }
                
                utils.setTextContent('peak-activity-stat', '--');
                utils.setTextContent('avg-daily-stat', '--');
                utils.setTextContent('total-period-stat', '--');
                utils.setTextContent('trend-direction-stat', '--');
                
                return;
            }
            
            const totalDetections = Object.values(dailyCounts).reduce(function(sum, c) { return sum + c; }, 0);
            
            let trendData;
            let chartLabel;
            
            if (timeframe === 'daily') {
                trendData = analytics.calculateDailyTrends(dailyCounts, 30);
                chartLabel = 'Daily Detections';
                if (infoDiv) {
                    infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing actual detection counts for the last 30 days (' + totalDetections.toLocaleString() + ' total detections)</span>';
                }
            } else if (timeframe === 'weekly') {
                trendData = analytics.calculateWeeklyTrends(dailyCounts, 12);
                chartLabel = 'Weekly Detections';
                if (infoDiv) {
                    infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing actual detection counts for the last 12 weeks (' + totalDetections.toLocaleString() + ' total detections)</span>';
                }
            } else if (timeframe === 'monthly') {
                trendData = analytics.calculateMonthlyTrends(dailyCounts, 12);
                chartLabel = 'Monthly Detections';
                if (infoDiv) {
                    infoDiv.innerHTML = '<span style="color: #10b981;">✅ Showing actual detection counts for the last 12 months (' + totalDetections.toLocaleString() + ' total detections)</span>';
                }
            }
            
            const stats = analytics.calculateTrendStats(trendData.data);
            
            utils.setTextContent('peak-activity-stat', stats.peak.toLocaleString());
            utils.setTextContent('avg-daily-stat', stats.average.toLocaleString());
            utils.setTextContent('total-period-stat', stats.total.toLocaleString());
            utils.setTextContent('trend-direction-stat', stats.trend);
            
            const canvas = document.getElementById('detection-trends-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (charts.detectionTrends) {
                charts.detectionTrends.destroy();
            }
            
            charts.detectionTrends = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendData.labels,
                    datasets: [{
                        label: chartLabel,
                        data: trendData.data,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
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
            
            console.log('✅ Trends chart updated');
            
        } catch (error) {
            console.error('Error updating trends chart:', error);
            if (infoDiv) {
                infoDiv.innerHTML = '<span style="color: #ef4444;">❌ Failed to load detection trends</span>';
            }
        }
    };
    
    // Initialize analytics event listeners
    analytics.initializeEventListeners = function() {
        const timeframeSelect = document.getElementById('trends-timeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', analytics.updateTrendsChart);
        }
        
        const refreshBtn = document.getElementById('refresh-trends');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', analytics.updateTrendsChart);
        }
    };
    
    console.log('✅ BirdNET.analytics module loaded');
    
})();
