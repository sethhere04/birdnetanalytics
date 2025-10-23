// Audio Player Module
console.log('Loading BirdNET audio player module...');

(function() {
    'use strict';
    
    const audio = BirdNET.audio;
    const api = BirdNET.api;
    const utils = BirdNET.utils;
    
    // Play audio for a specific detection
    audio.play = function(noteId, speciesName) {
        console.log('Playing audio for note ID:', noteId, speciesName);
        
        // Stop currently playing audio if any
        if (audio.current) {
            audio.current.pause();
            audio.current = null;
            audio.updateButton(audio.currentId, false);
        }
        
        const audioUrl = api.getAudioClipUrl(noteId);
        
        try {
            audio.current = new Audio(audioUrl);
            audio.currentId = noteId;
            
            // Update button to show playing state
            audio.updateButton(noteId, true);
            
            // Start playback
            audio.current.play().catch(function(error) {
                console.error('Audio playback failed:', error);
                alert('Could not play audio clip for ' + speciesName + '\n\nError: ' + error.message);
                audio.updateButton(noteId, false);
                audio.current = null;
                audio.currentId = null;
            });
            
            // Reset button when audio finishes
            audio.current.addEventListener('ended', function() {
                audio.updateButton(noteId, false);
                audio.current = null;
                audio.currentId = null;
            });
            
            // Handle loading errors
            audio.current.addEventListener('error', function(e) {
                console.error('Audio loading error:', e);
                alert('Error loading audio clip for ' + speciesName + 
                      '\n\nThe audio file may not exist or has been deleted.');
                audio.updateButton(noteId, false);
                audio.current = null;
                audio.currentId = null;
            });
            
        } catch (error) {
            console.error('Error creating audio:', error);
            alert('Failed to create audio player for ' + speciesName);
        }
    };
    
    // Stop currently playing audio
    audio.stop = function() {
        if (audio.current) {
            audio.current.pause();
            audio.current = null;
            audio.updateButton(audio.currentId, false);
            audio.currentId = null;
        }
    };
    
    // Update play button appearance
    audio.updateButton = function(noteId, isPlaying) {
        const button = document.getElementById('play-btn-' + noteId);
        if (button) {
            if (isPlaying) {
                button.textContent = '⏸️';
                button.title = 'Stop';
                button.style.background = '#ef4444';
            } else {
                button.textContent = '▶️';
                button.title = 'Play audio';
                button.style.background = '#10b981';
            }
        }
    };
    
    // Create audio play button
    audio.createButton = function(noteId, speciesName) {
        if (!noteId) return '';
        
        const sanitizedName = utils.sanitizeHTML(speciesName);
        
        return '<button id="play-btn-' + noteId + '" ' +
               'onclick="BirdNET.audio.play(' + noteId + ', \'' + sanitizedName + '\')" ' +
               'style="background: #10b981; color: white; border: none; padding: 0.375rem 0.75rem; ' +
               'border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; ' +
               'transition: opacity 0.2s;" ' +
               'onmouseover="this.style.opacity=\'0.8\'" ' +
               'onmouseout="this.style.opacity=\'1\'" ' +
               'title="Play audio">' +
               '▶️' +
               '</button>';
    };
    
    // Cleanup audio resources
    audio.cleanup = function() {
        if (audio.current) {
            audio.current.pause();
            audio.current = null;
            audio.currentId = null;
        }
    };
    
    console.log('✅ BirdNET audio player module loaded');
    
})();
