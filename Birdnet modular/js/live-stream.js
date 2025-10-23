// Live stream functions
function displayDetection(detection) {
    var feed = document.getElementById('live-feed');
    var detectionElement = document.createElement('div');
    detectionElement.className = 'detection-item';
    
    var commonName = detection.common_name || 
                   detection.species || 
                   detection.commonName || 
                   detection.label || 
                   detection.bird_name ||
                   detection.name ||
                   detection.species_name ||
                   'Unknown Species';
    
    if (CONFIG.MIGRATORY_SPECIES.includes(commonName)) {
        detectionElement.classList.add('migratory');
    }
    
    var rarity = CONFIG.RARITY_SCORES[commonName] || 0;
    if (rarity > 30) {
        detectionElement.classList.add('rare');
    }
    
    var detectionTime;
    if (detection.beginTime) {
        detectionTime = new Date(detection.beginTime).toLocaleString();
    } else if (detection.date && detection.time) {
        detectionTime = new Date(detection.date + 'T' + detection.time).toLocaleString();
    } else if (detection.timestamp) {
        detectionTime = new Date(detection.timestamp).toLocaleString();
    } else if (detection.created_at) {
        detectionTime = new Date(detection.created_at).toLocaleString();
    } else {
        detectionTime = new Date().toLocaleString();
    }
        
    var confidence = 0;
    if (detection.confidence !== undefined) {
        confidence = Math.round(detection.confidence * 100);
    } else if (detection.score !== undefined) {
        confidence = Math.round(detection.score * 100);
    } else if (detection.probability !== undefined) {
        confidence = Math.round(detection.probability * 100);
    }
    
    detectionElement.innerHTML = '<strong>' + commonName + '</strong><br><small>Confidence: ' + confidence + '% | ' + detectionTime + '</small>';
    
    if (feed.firstChild && feed.firstChild.textContent && feed.firstChild.textContent.includes('Click "Start Stream"')) {
        feed.innerHTML = '';
    }
    
    feed.insertBefore(detectionElement, feed.firstChild);
    
    while (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
    }
}

function startRealDetectionStream() {
    if (!isStreaming) return;
    
    fetchRecentDetections().then(function(detections) {
        if (detections.length > 0) {
            detections.sort(function(a, b) {
                var timeA = getDetectionTimestamp(a);
                var timeB = getDetectionTimestamp(b);
                return new Date(timeB) - new Date(timeA);
            });
            
            var feed = document.getElementById('live-feed');
            feed.innerHTML = '';
            
            var recentDetections = detections.slice(0, 10);
            for (var i = recentDetections.length - 1; i >= 0; i--) {
                displayDetection(recentDetections[i]);
            }
            
            lastDetectionId = getDetectionId(detections[0]);
        }
    });
    
    detectionCheckInterval = setInterval(function() {
        if (!isStreaming) {
            clearInterval(detectionCheckInterval);
            return;
        }
        
        fetchRecentDetections().then(function(detections) {
            if (detections.length > 0) {
                detections.sort(function(a, b) {
                    var timeA = getDetectionTimestamp(a);
                    var timeB = getDetectionTimestamp(b);
                    return new Date(timeB) - new Date(timeA);
                });
                
                var currentDetectionId = getDetectionId(detections[0]);
                
                if (lastDetectionId && currentDetectionId !== lastDetectionId) {
                    var newDetections = [];
                    for (var i = 0; i < detections.length; i++) {
                        var detectionId = getDetectionId(detections[i]);
                        if (detectionId === lastDetectionId) break;
                        newDetections.push(detections[i]);
                    }
                    
                    for (var i = newDetections.length - 1; i >= 0; i--) {
                        displayDetection(newDetections[i]);
                    }
                }
                
                lastDetectionId = currentDetectionId;
            }
        }).catch(function(error) {
            console.error('Error polling detections:', error);
            document.getElementById('stream-status').textContent = 'Stream error';
        });
    }, 5000);
}

function toggleStream() {
    var button = document.getElementById('toggle-stream');
    var status = document.getElementById('stream-status');
    
    if (isStreaming) {
        isStreaming = false;
        button.textContent = 'Start Stream';
        status.textContent = 'Stream disconnected';
        if (detectionCheckInterval) {
            clearInterval(detectionCheckInterval);
            detectionCheckInterval = null;
        }
    } else {
        isStreaming = true;
        button.textContent = 'Stop Stream';
        status.textContent = 'Stream connected - monitoring...';
        startRealDetectionStream();
    }
}

function clearStream() {
    document.getElementById('live-feed').innerHTML = '<div style="color: #6b7280;">Click "Start Stream" to monitor live detections...</div>';
}