/** WEB AUDIO **/

let audioElement;
let _audioContext;
let _audioAnimation;
let sourceNode;
let analyser;
let isWebAudioSupported = false;
let frequencyBinCount;

const fftSize = 512;


function initAudio(el)
{
    if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
        _audioContext = ( AudioContext ) ? new AudioContext() : new webkitAudioContext() ;
        isWebAudioSupported = true;
        console.log('isWebAudioSupported:', isWebAudioSupported);
    }

    audioElement = el;
    audioElement.setAttribute( 'crossOrigin', 'anonymous' );
    audioElement.setAttribute( 'preload', 'auto' );

    // Older versions of FF?
    var canPlay = !!(audioElement.canPlayType && audioElement.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (!canPlay) {
        console.error( "Doesn't support playback" );
        return;
    }

    if (isWebAudioSupported) {
        setupAudioNodes();
    }

    audioElement.addEventListener("canplay", audioElementHandler.bind(this), false );
    audioElement.addEventListener("playing", audioElementHandler.bind(this), false );
    audioElement.addEventListener("timeupdate", audioElementHandler.bind(this), false );
    audioElement.addEventListener("pause", audioElementHandler.bind(this), false );
    audioElement.addEventListener("play", audioElementHandler.bind(this), false );

    // Debug
    audioElement.addEventListener("seeked", audioElementHandler.bind(this), false ); // Occasionally not firing in Chrome
    // audioElement.addEventListener("seeking", audioElementHandler.bind(this), false );
    // audioElement.addEventListener("emptied", audioElementHandler.bind(this), false );
    // audioElement.addEventListener("abort", audioElementHandler.bind(this), false );
    // audioElement.addEventListener("ended", audioElementHandler.bind(this), false );
};





/** Event handlers **/

function audioElementHandler(e)
{
    // console.log(e.type);

    if (e.type == 'canplay')
    {
        console.log('Show a big ass Play button!');
    }
    else if (e.type == 'playing')
    {
    }
    else if (e.type == 'timeupdate')
    {
        // TBD?
    }
    else if (e.type == 'pause')
    {
        // This works but animation jumps when resumed
        // cancelAnimationFrame( _audioAnimation );
    }
    else if (e.type == 'play')
    {
        // Hide big ass Play button

        // Rely on user input to start
        if ( isWebAudioSupported ) {
            // this.update();
        }
    }
};

function setupAudioNodes()
{
    analyser = (analyser || _audioContext.createAnalyser());
    analyser.smoothingTimeConstant = 0.25; // 0.7;
    analyser.fftSize = fftSize;

    // Initial reference
    frequencyBinCount = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyBinCount); // This might break?

    // Firefox used to fail silently at this point
    // Ref: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
    //
    // Triggers error in Chrome when seeking position via media UI
    sourceNode = (sourceNode || _audioContext.createMediaElementSource(audioElement));
    sourceNode.connect(analyser);
    sourceNode.connect(_audioContext.destination);
};

function getFrequencyBinCount() {
    analyser.getByteFrequencyData(frequencyBinCount);

    // Normalize values to 0-1
    let values = [];
    for (let i = 0, max = frequencyBinCount.length; i < max; i++)
    {
        values[i] = frequencyBinCount[i] / 255;
    }

    return values;
}

function play() {
    audioElement.play();
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
    init: initAudio,
    play: play,
    loadSong: load,
    isWebAudioSupported: () => { return isWebAudioSupported },
    getFrequencyValues: getFrequencyBinCount
};
