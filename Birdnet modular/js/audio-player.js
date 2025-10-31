/**
 * Audio Player Module - Handles audio playback for bird detections
 */

import { getAudioUrl, hasAudio } from './api.js';

// Keep track of currently playing audio to stop it when a new one starts
let currentAudio = null;
let currentPlayButton = null;

/**
 * Create an inline audio player button for detections
 * @param {Object} detection - Detection object
 * @returns {string} - HTML string for audio button
 */
export function createAudioButton(detection) {
    if (!hasAudio(detection)) {
        return '';
    }

    const audioUrl = getAudioUrl(detection);
    if (!audioUrl) {
        return '';
    }

    const detectionId = detection.id || detection.detectionId || Math.random().toString(36);

    return '<button class="audio-btn" onclick="window.playAudio(\'' + audioUrl + '\', this)" data-audio-url="' + audioUrl + '" aria-label="Play audio" title="Play detection audio">▶</button>';
}

/**
 * Create a full audio player component for species detail modal
 * @param {Array} detections - Array of detections for this species
 * @returns {string} - HTML string for audio player
 */
export function createAudioPlayer(detections) {
    // Filter detections that have audio
    const audioDetections = detections.filter(d => hasAudio(d));

    if (audioDetections.length === 0) {
        return '<div class="audio-player-empty"><p>No audio recordings available for this species</p></div>';
    }

    // Show the 5 most recent detections with audio
    const recentDetections = audioDetections.slice(0, 5);

    let html = '<div class="audio-player-list">';
    html += '<div class="audio-player-header">Recent Recordings (' + audioDetections.length + ' total)</div>';

    recentDetections.forEach((detection, index) => {
        const audioUrl = getAudioUrl(detection);
        const date = new Date(detection.date + 'T' + detection.time);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const confidence = ((detection.confidence || 0) * 100).toFixed(1);

        html += '<div class="audio-player-item">';
        html += '<button class="audio-play-btn" onclick="window.playAudioInPlayer(this, \'' + audioUrl + '\')" data-index="' + index + '" aria-label="Play">';
        html += '<span class="play-icon">▶</span>';
        html += '<span class="pause-icon" style="display:none;">⏸</span>';
        html += '</button>';
        html += '<div class="audio-player-info">';
        html += '<div class="audio-player-date">' + dateStr + ' at ' + timeStr + '</div>';
        html += '<div class="audio-player-confidence">Confidence: ' + confidence + '%</div>';
        html += '</div>';
        html += '<div class="audio-player-controls">';
        html += '<div class="audio-progress-container"><div class="audio-progress-bar" data-index="' + index + '"><div class="audio-progress-fill"></div></div></div>';
        html += '<div class="audio-time"><span class="current-time">0:00</span> / <span class="total-time">0:00</span></div>';
        html += '</div>';
        html += '</div>';
    });

    html += '</div>';
    return html;
}

/**
 * Play audio with simple inline button (for detection lists)
 * @param {string} audioUrl - URL to audio file
 * @param {HTMLElement} button - Button element that was clicked
 */
export function playAudio(audioUrl, button) {
    // Stop currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentPlayButton) {
            currentPlayButton.textContent = '▶';
            currentPlayButton.classList.remove('playing');
        }
    }

    // If clicking the same button, just stop
    if (currentPlayButton === button && currentAudio) {
        currentAudio = null;
        currentPlayButton = null;
        return;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    currentPlayButton = button;

    button.textContent = '⏸';
    button.classList.add('playing');

    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        button.textContent = '❌';
        setTimeout(() => {
            button.textContent = '▶';
            button.classList.remove('playing');
        }, 2000);
    });

    audio.addEventListener('ended', () => {
        button.textContent = '▶';
        button.classList.remove('playing');
        currentAudio = null;
        currentPlayButton = null;
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio load error:', e);
        button.textContent = '❌';
        setTimeout(() => {
            button.textContent = '▶';
            button.classList.remove('playing');
        }, 2000);
        currentAudio = null;
        currentPlayButton = null;
    });
}

/**
 * Play audio with full player controls (for species detail modal)
 * @param {HTMLElement} button - Play button element
 * @param {string} audioUrl - URL to audio file
 */
export function playAudioInPlayer(button, audioUrl) {
    const playIcon = button.querySelector('.play-icon');
    const pauseIcon = button.querySelector('.pause-icon');
    const index = button.dataset.index;
    const progressBar = document.querySelector('.audio-progress-bar[data-index="' + index + '"]');
    const progressFill = progressBar ? progressBar.querySelector('.audio-progress-fill') : null;
    const audioItem = button.closest('.audio-player-item');
    const currentTimeEl = audioItem ? audioItem.querySelector('.current-time') : null;
    const totalTimeEl = audioItem ? audioItem.querySelector('.total-time') : null;

    // Stop currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentPlayButton) {
            const prevPlayIcon = currentPlayButton.querySelector('.play-icon');
            const prevPauseIcon = currentPlayButton.querySelector('.pause-icon');
            if (prevPlayIcon) prevPlayIcon.style.display = 'inline';
            if (prevPauseIcon) prevPauseIcon.style.display = 'none';
        }
    }

    // If clicking the same button, just stop
    if (currentPlayButton === button && currentAudio) {
        currentAudio = null;
        currentPlayButton = null;
        return;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    currentPlayButton = button;

    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'inline';

    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        alert('Failed to load audio. The recording may not be available.');
    });

    // Update progress bar
    audio.addEventListener('timeupdate', () => {
        if (progressFill && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = progress + '%';
        }
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    // Update total time when metadata loads
    audio.addEventListener('loadedmetadata', () => {
        if (totalTimeEl) {
            totalTimeEl.textContent = formatTime(audio.duration);
        }
    });

    // Reset when ended
    audio.addEventListener('ended', () => {
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        currentAudio = null;
        currentPlayButton = null;
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio load error:', e);
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        alert('Failed to load audio. The recording may not be available.');
        currentAudio = null;
        currentPlayButton = null;
    });

    // Make progress bar clickable to seek
    if (progressBar) {
        progressBar.onclick = (e) => {
            const rect = progressBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            audio.currentTime = percentage * audio.duration;
        };
    }
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/**
 * Stop any currently playing audio
 */
export function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentPlayButton) {
            const playIcon = currentPlayButton.querySelector('.play-icon');
            const pauseIcon = currentPlayButton.querySelector('.pause-icon');
            if (playIcon) {
                playIcon.style.display = 'inline';
            } else {
                currentPlayButton.textContent = '▶';
            }
            if (pauseIcon) pauseIcon.style.display = 'none';
            currentPlayButton.classList.remove('playing');
        }
        currentAudio = null;
        currentPlayButton = null;
    }
}
