import DefaultRenderer from './renderers/DefaultRenderer';
import WebGlRenderer from './renderers/WebGlRenderer';

import Audio from './Audio';
import SoundcloudSource from './audioSources/SoundcloudSource';


let audio = Audio;


/**
 * App logic
 */
var SpectrumAnalyzer = function()
{
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;

    // Audio + rendering
    this.fftSize = 512; // Duplicated in Audio at the moment
    this.audioAnimation = null;

    // Set to 'new <renderer>()' from /renderers
    this.renderer = null;

    // Nav
    this.timeout = null;

    // Used by router, duplicates SC source module
    this.baseURL = 'https://soundcloud.com/';


    this.tempAudioElement;


    /**
     * Initialize - and grab an SC URL?
     */
    this.init = function(playDefault)
    {
        // Initialize existing links
        var els = document.querySelectorAll('.song');
        for ( var i = 0; i < els.length; i++ ) {
            // TODO: This should autoplay the song (response to user input)
            els[i].addEventListener( 'click', this.loadSongFromClick.bind( this ) );
        }

        const audioElement = document.querySelector('audio');
        this.tempAudioElement = audioElement;

        audioElement.addEventListener('canplay', this.audioElementHandler.bind(this));
        audioElement.addEventListener('play', this.audioElementHandler.bind(this));
        audioElement.addEventListener('pause', this.audioElementHandler.bind(this));
        audioElement.addEventListener('timeupdate', this.audioElementHandler.bind(this));
        audio.init(audioElement);


        document.querySelector('#play').addEventListener('click', () => {
            audio.play();
        });

        if (!audio.isWebAudioSupported()) {
            document.querySelector('p.compatibility').innerHTML = '(Your browser does not support WebAudio)';
        }


        /* RENDERER */

        // TODO: Check support for WebGL and if so:
        this.renderer = new WebGlRenderer(this);

        // Check renderer
        if (this.renderer) {
            // console.log('Found renderer', this.renderer);
        } else {
            // console.warn('No renderer set, fall back to default');
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


        /* SEARCH */

        document.querySelector('input').addEventListener('keyup', e => {
            this.resolveSoundcloudURL(e.currentTarget.value);
        });


        /* AUDIO */

        // Check for current URL and load
        var url = this.getURL();
        if (url != null)
        {
            this.resolveSoundcloudURL(url);

            // Load track now because URL will be disregarded in setURL (??)
            this.trackEvent('Load SoundCloud URL', url, null, false);

        // Play default song
        } else if (playDefault) {

            // Show a big loading graphic
            url = document.querySelector('.song').getAttribute('href');
            this.resolveSoundcloudURL(url);
        }
    };

    // Move all of this into Audio element
    this.audioElementHandler = function(e) {
        // console.log(e.type);
        if (e.type == 'canplay') {
            // this.audioDataHasChanged = true;
            document.querySelector('span#play').classList.remove('hide');

            // Should only be called once per song
            if (!this.audioAnimation) {
                this.update();
            }
        } else if (e.type == 'timeupdate') {
            if (this.tempAudioElement.paused) {
                // Update audio data once.. not sure if this requires temporarily playing the stream or not?
            } else {
                this.audioDataHasChanged = true;
            }
        } else if (e.type == 'pause') {
            document.querySelector('span#play').classList.remove('hide');

            // Fix performance issues with play/pause on audio element
            if (this.audioAnimation) {
                this.audioDataHasChanged = false;
                // cancelAnimationFrame(this.audioAnimation);
                // this.audioAnimation = null;
            }
        } else if (e.type == 'play') {
            // this.audioDataHasChanged = true;
            document.querySelector('span#play').classList.add('hide');

            // Rely on user input to start
            // This should perhaps only be triggered on canplay ?
            // if (audio.isWebAudioSupported()) {
            //     this.update();
            // }
        }
    };

    this.audioDataHasChanged = false;

    // Drive render loop while audio is playing
    this.update = function() {
        if (this.audioDataHasChanged) {
            // console.log('Update audio data');
            this.renderer.updateAudioData(audio.getFrequencyValues());
        }
        this.renderer.render();

        // TODO: Should this be cleared when a new song loads?
        this.audioAnimation = requestAnimationFrame(this.update.bind(this));
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
        if (data.files.length > 0 && data.files[0].name.indexOf( '.mp3' ) > -1)
        {
            // Ref: http://stackoverflow.com/questions/10413548/javascript-filereader-using-a-lot-of-memory
            var url = window.URL || window.webkitURL;
            var src = url.createObjectURL( data.files[0] );
            this.updateStatus( data.files[0].name );
            audio.loadSong( src );
        } else if (data.getData('URL').indexOf('soundcloud.com') > -1) {
            console.warn('Undocumented behaviour for debugging!');
            // this.resolveSoundcloudURL( data.getData("URL") );
        } else {
            this.updateStatus('Sorry, that did not work - try something else.');
        }

        e.currentTarget.classList.remove( 'over' );

        return false;
    };


    this.mouseHandler = () => {
        this.showNav();
    };

    this.resize = () => {
        this.WIDTH = window.innerWidth;
        this.HEIGHT = window.innerHeight;

        if (this.renderer) {
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
        this.timeout = setTimeout(() => {
            var els = document.querySelectorAll('nav');
            for ( var i = 0; i < els.length; i++ )
                els[i].classList.add('hide');
        }, 10000 );
    };



    /* UI */

    this.updateStatus = function( str )
    {
        document.querySelector('p.status').innerHTML = str;
    };

    this.loadSongFromClick = function(e)
    {
        e.preventDefault();

        // TODO: Centralize this on Audio element?
        cancelAnimationFrame(this.audioAnimation);
        this.audioAnimation = null;

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
            audio.loadSong( path );
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
                // console.log('successMessage:', data);
                this.onResolveSoundcloudURLSuccess(data);
            }).catch((err) => {
                console.warn('failureMessage:', err);
                document.querySelector('input').classList.remove('valid');
                document.querySelector('input').classList.add('invalid');
            });
            
        } else {
            // console.log('Invalid URL');
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
        audio.loadSong(SoundcloudSource.getAudioURL(result.stream_url));

        // Update router
        this.setURL(this.currentSource);

        // Update search bar
        document.querySelector('input').classList.remove('invalid');
        document.querySelector('input').classList.add('valid');
    };



    /* ROUTER */

    this.hashChange = function(e) {
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

    this.setURL = function( url ) {
        if ( this.getURL() == url )
            return;

        this.trackEvent('Load SoundCloud URL', url, null, false);

        url = url.replace(this.baseURL, '');
        window.location.hash = 'url=' + url;
    };

    /**
     * This will be overridden by implementation, e.g.:
     * 
     *      this.trackEvent = function(action, label, value, nonInteraction) {};
     **/
    this.trackEvent = function() {};
};

export default SpectrumAnalyzer;