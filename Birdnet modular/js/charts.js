/**
 * Charts Module - All Chart.js visualizations
 */

// Store chart instances
const chartInstances = {};

/**
 * Render daily activity chart (species count)
 */
export function renderDailyChart(daily, canvasId = 'daily-activity-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: daily.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Unique Species Per Day',
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
}

/**
 * Render hourly pattern chart
 */
export function renderHourlyChart(hourly, canvasId = 'hourly-pattern-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
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
}

/**
 * Render species distribution doughnut chart
 */
export function renderDistributionChart(diversity, canvasId = 'species-distribution-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
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
}

/**
 * Render monthly trend chart
 */
export function renderMonthlyChart(monthly, canvasId = 'monthly-trend-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
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
}

/**
 * Render weekly heatmap chart
 */
export function renderWeeklyHeatmap(weekly, canvasId = 'weekly-heatmap-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
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
}

/**
 * NEW: Render confidence distribution chart
 */
export function renderConfidenceChart(detections, canvasId = 'confidence-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const counts = Array(bins.length - 1).fill(0);

    detections.forEach(d => {
        const conf = parseFloat(d.confidence || 0);
        for (let i = 0; i < bins.length - 1; i++) {
            if (conf >= bins[i] && conf < bins[i + 1]) {
                counts[i]++;
                break;
            }
        }
    });

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
            datasets: [{
                label: 'Detections',
                data: counts,
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#eab308',
                    '#10b981',
                    '#3b82f6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Detection Confidence Distribution'
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
}

/**
 * Destroy a specific chart
 */
export function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

/**
 * Destroy all charts
 */
export function destroyAllCharts() {
    Object.keys(chartInstances).forEach(id => {
        chartInstances[id].destroy();
    });
}

/**
 * NEW: Render calendar heatmap for detections
 */
export function renderCalendarHeatmap(detections, canvasId = 'calendar-heatmap-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Group detections by date
    const dateMap = {};
    detections.forEach(d => {
        const date = d.date || (d.timestamp ? d.timestamp.split('T')[0] : null);
        if (date) {
            dateMap[date] = (dateMap[date] || 0) + 1;
        }
    });

    // Create last 90 days of data
    const days = [];
    const counts = [];
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        counts.push(dateMap[dateStr] || 0);
    }

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    // Color intensity based on count
    const maxCount = Math.max(...counts, 1);
    const colors = counts.map(count => {
        const intensity = count / maxCount;
        if (intensity === 0) return '#e5e7eb';
        if (intensity < 0.25) return '#c7d2fe';
        if (intensity < 0.5) return '#818cf8';
        if (intensity < 0.75) return '#6366f1';
        return '#4f46e5';
    });

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Detections',
                data: counts,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Detection Calendar (Last 90 Days)'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} detections`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            }
        }
    });
}

/**
 * NEW: Render hour × day of week heatmap
 */
export function renderHourDayHeatmap(detections, canvasId = 'hour-day-heatmap-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Create 7×24 grid (day of week × hour)
    const grid = Array(7).fill(0).map(() => Array(24).fill(0));

    detections.forEach(d => {
        const date = d.date && d.time ? new Date(`${d.date}T${d.time}`) : new Date(d.timestamp || d.DateTime);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        grid[day][hour]++;
    });

    // Flatten for Chart.js matrix chart (simulate with grouped bars)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const datasets = [];

    // Create dataset for each hour group (0-5, 6-11, 12-17, 18-23)
    const hourGroups = [
        { label: 'Night (0-5)', hours: [0,1,2,3,4,5], color: '#1e3a8a' },
        { label: 'Morning (6-11)', hours: [6,7,8,9,10,11], color: '#fbbf24' },
        { label: 'Afternoon (12-17)', hours: [12,13,14,15,16,17], color: '#f59e0b' },
        { label: 'Evening (18-23)', hours: [18,19,20,21,22,23], color: '#7c3aed' }
    ];

    hourGroups.forEach(group => {
        datasets.push({
            label: group.label,
            data: dayNames.map((_, dayIdx) => {
                return group.hours.reduce((sum, hour) => sum + grid[dayIdx][hour], 0);
            }),
            backgroundColor: group.color
        });
    });

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Activity by Day of Week and Time'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * NEW: Render year-over-year comparison
 */
export function renderYearOverYearChart(species, canvasId = 'year-over-year-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Group species by year from firstSeen
    const yearData = {};
    species.forEach(s => {
        if (s.firstSeen) {
            const year = new Date(s.firstSeen).getFullYear();
            if (!yearData[year]) {
                yearData[year] = { species: new Set(), detections: 0 };
            }
            yearData[year].species.add(s.commonName || s.common_name || s.scientificName);
            yearData[year].detections += (s.detections || s.count || 0);
        }
    });

    const years = Object.keys(yearData).sort();
    const speciesCounts = years.map(y => yearData[y].species.size);
    const detectionCounts = years.map(y => yearData[y].detections);

    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Unique Species',
                    data: speciesCounts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4
                },
                {
                    label: 'Total Detections',
                    data: detectionCounts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Year-over-Year Comparison'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Species Count'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Detections'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}
