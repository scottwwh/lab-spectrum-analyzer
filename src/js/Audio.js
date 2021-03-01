/* global AudioContext, webkitAudioContext */

/** WEB AUDIO **/

let initialized = false;
let audioElement;
let audioContext;
let sourceNode;
let analyser;

let isWebAudioSupported = false;
let hasUpdatedData = false;

let frequencyBinCount;

const fftSize = 512;

// TODO: Clean up supplying intro values for renderer
let waiting = true;

function init(el) {
    audioElement = el;
    audioElement.setAttribute( 'crossOrigin', 'anonymous' );
    audioElement.setAttribute( 'preload', 'auto' );

    // Older versions of FF?
    var canPlay = !!(audioElement.canPlayType && audioElement.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (!canPlay) {
        console.error('Does not support playback');
        return;
    }

    let events = String('canplay,playing,timeupdate,pause,play').split(',');
    // events = events.concat(String('seeked,seeking,emptied,abort,ended').split(','));
    events.forEach(e => {
        audioElement.addEventListener(e, audioElementHandler.bind(this), false);
    });
}

function initAudio() {
    if (initialized) return;

    console.log('Initialize audio context');
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        audioContext = (AudioContext) ? new AudioContext() : new webkitAudioContext() ;
        isWebAudioSupported = true;
        // console.log('isWebAudioSupported:', isWebAudioSupported);
    }

    if (isWebAudioSupported) {
        setupAudioNodes();
    } else {
        console.log('Web audio not supported');
    }

    initialized = true;
}


/** Event handlers **/

function audioElementHandler(e) {
    // console.log(e.type);

    if (e.type == 'canplay') {
        if (waiting) {
            hasUpdatedData = true;
        }
    } else if (e.type == 'playing') {
        // TBD
    } else if (e.type == 'timeupdate') {
        if (audioElement.paused) {
            // Update audio data once.. not sure if this requires temporarily playing the stream or not?
        } else {
            hasUpdatedData = true;
            // audioData = getFrequencyBinCount();
        }
    } else if (e.type == 'pause') {
        hasUpdatedData = false;
    } else if (e.type == 'play') {
        // TBD
    }
}



function setupAudioNodes() {
    analyser = (analyser || audioContext.createAnalyser());
    analyser.smoothingTimeConstant = 0.25; // 0.7;
    analyser.fftSize = fftSize;

    // Initial reference
    frequencyBinCount = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyBinCount); // This might break?

    // Firefox used to fail silently at this point
    // Ref: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
    //
    // Triggers error in Chrome when seeking position via media UI
    sourceNode = (sourceNode || audioContext.createMediaElementSource(audioElement));
    sourceNode.connect(analyser);
    sourceNode.connect(audioContext.destination);
}

function getFrequencyBinCount() {
    let values = [];

    if (waiting) {
        // Empty array
        values = initialAudioData();

        // Return to defaults
        hasUpdatedData = false;
        waiting = false;
    } else {
        // Normalize values to 0-1
        analyser.getByteFrequencyData(frequencyBinCount);
        for (let i = 0, max = frequencyBinCount.length; i < max; i++)
        {
            values[i] = frequencyBinCount[i] / 255;
        }
    }

    return values;
}

function initialAudioData() {
    return new Array(fftSize / 2).fill(0);
}

function play() {
    initAudio();
    audioElement.play();
}

function pause() {
    audioElement.pause();
}

function load(url) {
    // Prevent a memory leak/performance hit?
    //
    // This prevents playback?
    // if (this.sourceNode) this.sourceNode.disconnect();

    // this.audio.src = url;
    audioElement.src = url;
}

export default {
    init: init,
    play: play,
    pause: pause,
    loadSong: load,
    isPaused: () => { return audioElement.paused; },
    isWebAudioSupported: () => { return isWebAudioSupported; },
    hasUpdatedData: () => { return hasUpdatedData; },
    getFrequencyValues: getFrequencyBinCount,
    element: audioElement
};
