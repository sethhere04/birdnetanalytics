# Backyard Birds Analytics

A modern, single-page application for tracking and analyzing bird activity in your backyard using BirdNET-Go data.

## Features

### 📊 Real-time Analytics
- **Total Species**: Track unique bird species detected
- **Total Detections**: Monitor all bird activity
- **Daily Active**: See today's bird visitors
- **Peak Hours**: Identify when birds are most active

### 📈 Visualizations
- **Daily Activity Trend**: 30-day detection timeline
- **Hourly Patterns**: See when birds visit throughout the day
- **Species Distribution**: Understand diversity in your backyard
- **Weekly Heatmap**: Identify which days have most activity

### 🦜 Species Tracking
- Top 10 most common visitors
- Complete species list with first/last seen dates
- Average confidence scores
- Detection counts per species

### 🤖 AI-Powered Insights
- Peak activity recommendations
- Activity trend analysis
- Species diversity metrics
- New visitor notifications

## Setup

1. **Configure API Endpoint**
   - Edit `app-new.js` line 7
   - Set your BirdNET-Go API URL:
   ```javascript
   apiBase: 'http://YOUR_IP:8080/api/v2'
   ```

2. **Open in Browser**
   - Simply open `index-new.html` in your web browser
   - No build process or server required!

3. **Auto-Refresh**
   - Data refreshes automatically every 60 seconds
   - Can be configured in `app-new.js` (line 8)

## API Endpoints Used

The app connects to these BirdNET-Go v2 API endpoints:

- `/analytics/species/summary` - Species summary data
- `/notes` or `/detections` - Individual bird detections

## File Structure

```
index-new.html   - Main HTML file with UI and styling
app-new.js       - Complete application logic
```

## Features by Tab

### Overview Tab
- Daily activity chart (last 30 days)
- Top 10 species list
- Hourly activity pattern
- Species distribution pie chart

### Species Tab
- Complete list of all detected species
- First seen / last seen dates
- Average confidence scores
- Total detection counts

### Activity Patterns Tab
- Weekly activity heatmap
- Recent activity timeline
- Detection history

### Insights Tab
- AI-generated insights about your bird activity
- Trends and patterns
- Diversity metrics
- New visitor alerts

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Data Privacy

All data stays local - the app only communicates with your BirdNET-Go instance. No external services or analytics.

## Customization

### Change Refresh Rate
Edit line 8 in `app-new.js`:
```javascript
refreshInterval: 60000  // milliseconds (60000 = 1 minute)
```

### Change Detection Limit
Edit line 9 in `app-new.js`:
```javascript
detectionLimit: 10000  // number of recent detections to fetch
```

### Modify Colors
Edit CSS variables in `index-new.html` (lines 20-30):
```css
:root {
    --primary: #2563eb;
    --success: #10b981;
    /* etc... */
}
```

## Troubleshooting

### No Data Showing
1. Check browser console (F12) for errors
2. Verify API URL is correct
3. Ensure BirdNET-Go is running and accessible
4. Check network tab to see API responses

### Charts Not Rendering
1. Check that Chart.js CDN is loading (requires internet)
2. Clear browser cache and reload

### Slow Performance
1. Reduce `detectionLimit` in configuration
2. Increase `refreshInterval` to reduce API calls

## Future Enhancements

Planned features:
- Migration predictions
- Weather correlation
- Audio playback
- Export data to CSV
- Species information lookup
- Custom date range filtering

## Support

This is a standalone application. Check the browser console for detailed logging and error messages.
