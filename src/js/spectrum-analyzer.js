
import DefaultRenderer from './renderers/DefaultRenderer';
import WebGlRenderer from './renderers/WebGlRenderer';

import SoundcloudSource from './audioSources/SoundcloudSource';



/**
 * App logic
 */
var SpectrumAnalyzer = function()
{
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;

    /* Audio */

    this.audio;
    this.audioContext;
    this.audioAnimation;
    this.sourceNode;
    this.analyser;
    this.supportsWebAudio = false;
    this.fftSize = 512;

    // Set to 'new <renderer>()' from /renderers
    this.renderer = null;
    this.timeout = null;
    this.baseURL = 'https://soundcloud.com/';

    // TODO: Remove this? Default song countdown?
    this.defaultInterval = null;
    this.defaultTime = null;


    /*
    var url = document.querySelector('.song').getAttribute('href');
    const resolveURL = SoundcloudSource.resolveURL(url);
    resolveURL.then((successMessage) => {
        console.log('successMessage:', successMessage);
    }).catch((failureMessage) => {
        console.log('failureMessage:', failureMessage);
    });
    */


    /**
     * Initialize - and grab an SC URL?
     */
    this.init = function(playDefault)
    {
        // Initialize existing links
        var els = document.querySelectorAll('.song');
        for ( var i = 0; i < els.length; i++ ) {
            els[i].addEventListener( 'click', this.loadSongFromClick.bind( this ) );
        }

        this.initAudio();

        if ( ! this.supportsWebAudio )
            document.querySelector('p.compatibility').innerHTML = "(Your browser does not support WebAudio)";


        /* RENDERER */

        // TODO: Check support for WebGL and if so:
        this.renderer = new WebGlRenderer(this);

        // Check renderer
        if (this.renderer) {
            console.log('Found renderer', this.renderer);
        } else {
            console.warn('No renderer set, fall back to default');
            this.renderer = new DefaultRenderer(this);
        }

        this.renderer.init();


        /* DRAG AND DROP */

        var dropTarget = document.querySelector('body');
        var dragEvents = 'dragenter,dragover,dragleave';
        dragEvents.split(',').forEach(e => {
            dropTarget.addEventListener(e, this.dragHandler.bind(this), false);
        });
        dropTarget.addEventListener( 'drop', this.dropHandler.bind(this), false );
        

        window.addEventListener( 'hashchange', this.hashChange.bind(this) );
        window.addEventListener( 'mousemove', this.mouseHandler.bind(this) );
        window.addEventListener( 'resize', this.resize.bind(this) );


        /* MENU */

        // this.hideNav();
        document.querySelector('input').addEventListener('keyup', e => {
            this.resolveSoundcloudURL(e.currentTarget.value);
        });



        /* AUDIO */

        // Check for current URL and load
        var url = this.getURL();
        if (url != null)
        {
            // /*
            this.resolveSoundcloudURL(url);

            // Load track now because URL will be disregarded in setURL (??)
            this.trackEvent('Load SoundCloud URL', url, null, false);
            // */

        // Play default song
        } else if (playDefault) {
            // Show a big Play button
            /*
            this.updateStatus('Loading in 5s...');

            var time = new Date().getTime();
            this.defaultInterval = setInterval(function() {
                this.initDefaultPlayback(time);
            }.bind(this), 1000);
            */

            // console.log('hi');
            var url = document.querySelector('.song').getAttribute('href');
            this.resolveSoundcloudURL(url);
        }
    };


    /**
     * Default song countdown
     */
    /*
    this.initDefaultPlayback = function(time) {
        var delta = new Date().getTime() - time;
        if (delta < 5000) {
            var msg = 'Loading in ' + Math.round(5 - delta / 1000) + 's...';
            this.updateStatus(msg);

        } else {
            clearTimeout(this.defaultInterval);

            var url = document.querySelector('.song').getAttribute('href');
            this.resolveSoundcloudURL(url);
        }
    };
    */

    this.initAudio = function()
    {
        if ( typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined" )
        {
            this.audioContext = ( AudioContext ) ? new AudioContext() : new webkitAudioContext() ;
            this.supportsWebAudio = true;
        }

        this.audio = document.getElementsByTagName('audio')[0];
        this.audio.setAttribute( 'crossOrigin', 'anonymous' );
        this.audio.setAttribute( 'preload', 'auto' );

        document.querySelector('#play').addEventListener('click', e => {
            this.audio.play();
        });

        // Older versions of FF?
        var canPlay = !! ( this.audio.canPlayType && this.audio.canPlayType('audio/mpeg;').replace(/no/, ''));
        if ( ! canPlay )
        {
            alert( "Doesn't support playback" );
            return;
        }

        if ( this.supportsWebAudio ) {
            this.setupAudioNodes();
        }

        this.audio.addEventListener("canplay", this.audioHandler.bind(this), false );
        this.audio.addEventListener("playing", this.audioHandler.bind(this), false );
        this.audio.addEventListener("timeupdate", this.audioHandler.bind(this), false );
        this.audio.addEventListener("pause", this.audioHandler.bind(this), false );
        this.audio.addEventListener("play", this.audioHandler.bind(this), false );

        // Debug
        this.audio.addEventListener("seeked", this.audioHandler.bind(this), false ); // Occasionally not firing in Chrome
        // this.audio.addEventListener("seeking", this.audioHandler.bind(this), false );
        // this.audio.addEventListener("emptied", this.audioHandler.bind(this), false );
        // this.audio.addEventListener("abort", this.audioHandler.bind(this), false );
        // this.audio.addEventListener("ended", this.audioHandler.bind(this), false );
    };





    /** Event handlers **/

    this.audioHandler = function(e)
    {
        // console.log(e.type);

        if (e.type == 'canplay')
        {
            console.log('Show a big ass Play button!');
        }
        else if (e.type == 'playing')
        {
            /*
            if ( this.supportsWebAudio ) {
                // This works but animation jumps when resumed..
                // this.update();
            }
            */

            // Not sure what this accomplishes..
        }
        else if (e.type == 'timeupdate')
        {
            // TBD?
        }
        else if (e.type == 'pause')
        {
            // This works but animation jumps when resumed
            // cancelAnimationFrame( this.audioAnimation );
        }
        else if (e.type == 'play')
        {
            // Hide big ass Play button

            // Rely on user input to start
            if ( this.supportsWebAudio ) {
                this.update();
            }
        }
    };

    /** WEB AUDIO **/

    this.frequencyBinCount;

    this.setupAudioNodes = function()
    {
        this.analyser = (this.analyser || this.audioContext.createAnalyser());
        this.analyser.smoothingTimeConstant = 0.25; // 0.7;
        this.analyser.fftSize = this.fftSize;

        // Initial reference
        this.frequencyBinCount = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(this.frequencyBinCount); // This might break?

        // Firefox used to fail silently at this point
        // Ref: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
        //
        // Triggers error in Chrome when seeking position via media UI
        this.sourceNode = (this.sourceNode || this.audioContext.createMediaElementSource(this.audio));
        this.sourceNode.connect(this.analyser);
        this.sourceNode.connect(this.audioContext.destination);
    };






    /* UI */

    // Combine with dropHandler ?
    this.dragHandler = function(e)
    {
        // Forgot why I'm doing this..
        if ( e.type == 'dragover' )
        {
            e.stopPropagation();
            e.preventDefault();
        }
        else if ( e.type == 'dragenter' )
        {
            e.currentTarget.classList.add('over');
        }
        else if ( e.type == 'dragleave' )
        {
            e.currentTarget.classList.remove('over');
        }
    };

    // TODO: Improve this a lot!
    this.dropHandler = function(e)
    {
        // console.log(this, e.currentTarget);
        e.stopPropagation();
        e.preventDefault();

        this.updateStatus('Loading...');

        // This is good
        var data = e.dataTransfer || e.originalEvent.dataTransfer;
        if ( data.files.length > 0
                && data.files[0].name.indexOf( '.mp3' ) > -1
                )
        {
            // Ref: http://stackoverflow.com/questions/10413548/javascript-filereader-using-a-lot-of-memory
            var url = window.URL || window.webkitURL;
            var src = url.createObjectURL( data.files[0] );
            this.updateStatus( data.files[0].name );
            this.loadSong( src );
        }
        // This is stupid!
        else if ( data.getData("URL").indexOf('soundcloud.com') > -1 )
        {
            console.warn('Undocumented behaviour for debugging!');
            // this.resolveSoundcloudURL( data.getData("URL") );
        }
        else
        {
            this.updateStatus( "Sorry, that didn't work - try something else." )
        }

        e.currentTarget.classList.remove( 'over' );

        return false;
    };


    this.mouseHandler = function(e)
    {
        this.showNav();
    };

    this.resize = function(e)
    {
        this.WIDTH = window.innerWidth;
        this.HEIGHT = window.innerHeight;

        if (this.renderer) {
            // console.log('Resize to ' + this.WIDTH, this.HEIGHT);
            this.renderer.resize();
        } else {
            console.warn('No renderer set');
        }
    };

    this.showNav = function()
    {
        var els = document.querySelectorAll('nav');
        for ( var i = 0; i < els.length; i++ )
            els[i].classList.remove('hide');

        this.hideNav();
    };

    this.hideNav = function()
    {
        if ( this.timeout )
            clearTimeout( this.timeout );

        // console.log('Hey!');
        this.timeout = setTimeout( function(e) {
            var els = document.querySelectorAll('nav');
            for ( var i = 0; i < els.length; i++ )
                els[i].classList.add('hide');
        }, 10000 );
    };





    this.update = function()
    {
        this.analyser.getByteFrequencyData(this.frequencyBinCount);

        // Normalize values to 0-1
        var values = [];
        for ( var i = 0; i < (this.frequencyBinCount.length); i++ )
        {
            values[ i ] = this.frequencyBinCount[ i ] / 255;
        }

        this.renderer.render( values );

        this.audioAnimation = requestAnimationFrame( this.update.bind(this) );
    };



    /* UI */

    this.updateStatus = function( str )
    {
        document.querySelector('p.status').innerHTML = str;
    };

    this.loadSongFromClick = function(e)
    {
        e.preventDefault();


        // Unstyle links
        document.querySelectorAll('.song').forEach(el => {
            el.classList.remove('enabled');
        });

        // Style active link
        e.currentTarget.classList.add('enabled');


        var path = e.currentTarget.getAttribute('href');
        if ( path.indexOf( 'soundcloud' ) > -1 )
        {
            this.resolveSoundcloudURL( path );
        }
        else
        {
            this.loadSong( path );
        }
    };



    this.resolveSoundcloudURL = function(url)
    {
        // This should be a separate value, e.g. currentValidSource..
        if (this.currentSource != url) {
            this.currentSource = url;
        } else {
            return;
        }

        if (SoundcloudSource.isValidURL(url)) {
            const resolvedURL = SoundcloudSource.resolveURL(url);
            resolvedURL.then((data) => {
                console.log('successMessage:', data);
                this.onResolveSoundcloudURLSuccess(data);
            }).catch((failureMessage) => {
                console.warn('failureMessage:', failureMessage);
                console.warn("Sorry, that link can't be streamed");
                document.querySelector('input').classList.remove('valid');
                document.querySelector('input').classList.add('invalid');
            });
            
        } else {
            console.log('Invalid URL');
            return;
        }
    };

    this.onResolveSoundcloudURLSuccess = function(result) {

        // Update status
        this.updateStatus('Loading...');

        // Update active song link
        var a = document.createElement('a');
        a.appendChild( document.createTextNode( result.title ) );
        a.setAttribute( 'href', result.permalink_url );
        var el = document.querySelector('p.status');
        if (el.childNodes.length > 0)
            el.removeChild(el.childNodes[0]);
        el.appendChild(a);

        // Update audio source
        this.loadSong(SoundcloudSource.getAudioURL(result.stream_url));

        // Update router
        this.setURL(this.currentSource);

        // Update song list (if possible!)
        // ....

        // Update search bar
        document.querySelector('input').classList.remove('invalid');
        document.querySelector('input').classList.add('valid');
    }




    /* AUDIO */

    // Load an alreadu-resolved SC URL
    this.loadSong = function(url)
    {
        // Prevent a memory leak/performance hit?
        //
        // This prevents playback?
        // if (this.sourceNode) this.sourceNode.disconnect();

        this.audio.src = url;
    };





    /* ROUTER */

    this.hashChange = function(e)
    {
        if ( e.newURL != this.getURL() )
            this.resolveSoundcloudURL( this.getURL(e.newURL) );
    };

    this.getURL = function( url )
    {
        if ( url )
            return this.baseURL + url.substr( url.indexOf( 'url=' ) + 4 );

        if ( window.location.href.indexOf( 'url=' ) > -1 )
            return this.baseURL + window.location.hash.substr( window.location.hash.indexOf( 'url=' ) + 4 );

        return null;
    };

    this.setURL = function( url )
    {
        if ( this.getURL() == url )
            return;

        this.trackEvent( 'Load SoundCloud URL', url, null, false );

        url = url.replace( this.baseURL,'' );
        window.location.hash = 'url=' + url;
    };



    /** CONVENIENCE **/

    this.trackEvent = function( action, label, value, noninteraction ) {};
};


export default SpectrumAnalyzer;