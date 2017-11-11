import DefaultRenderer from './renderers/DefaultRenderer';
import WebGlRenderer from './renderers/WebGlRenderer';

import Audio from './Audio';
import Resolver from './AudioResolver';


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
    this.init = function(playDefault = false)
    {
        // Initialize existing links
        var els = document.querySelectorAll('.song');
        for ( var i = 0; i < els.length; i++ ) {
            // TODO: This should autoplay the song (response to user input)
            els[i].addEventListener( 'click', this.loadSongFromClick.bind( this ) );
        }

        const audioElement = document.querySelector('audio');

        audioElement.addEventListener('canplay', this.audioElementHandler.bind(this));
        audioElement.addEventListener('play', this.audioElementHandler.bind(this));
        audioElement.addEventListener('pause', this.audioElementHandler.bind(this));
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
        window.addEventListener('keyup', this.keyHandler.bind(this));

        


        /* SEARCH */

        document.querySelector('input').addEventListener('keyup', e => {
            this.resolveSoundcloudURL(e.currentTarget.value);
        });


        /* AUDIO */

        // Check for current URL and load
        var url = this.getURL();
        if (url != null) {
            this.resolveSoundcloudURL(url);

            // Load track now because URL will be disregarded in setURL (??)
            this.trackEvent('Load SoundCloud URL', url, null, false);

        // Play default song
        } else if (playDefault) {

            if (false) {
                // Show a big loading graphic
                url = document.querySelector('.song').getAttribute('href');
                // this.resolveSoundcloudURL(url);
                this.resolveUrl(url);
            } else {
                // Do something
                let localMp3 = './audio/';
                // localMp3 += '02 - staring at the sun.mp3';
                // localMp3 += '08. tipper - unlock the geometry.mp3';
                localMp3 += '212-andre_3000-behold_a_lady-rns.mp3';
                this.resolveUrl(localMp3);
            }
        }
    };

    this.keyHandler = function(e) {
        // Ignore event if it originates from the search box
        if (e.srcElement.nodeName === 'INPUT') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // console.log(e, e.keyCode, audio);
        if (e.keyCode == 32) {
            if (audio.isPaused()) {
                audio.play();
            } else {
                audio.pause();
            }
        }
    };

    // Move all of this into Audio element
    this.audioElementHandler = function(e) {
        if (e.type == 'canplay') {
            if (this.audioAnimation) {
                // Do nothing, rAF has already been triggered?
            } else {
                document.querySelector('span#play').classList.remove('hide');
                this.update();
            }
        } else if (e.type == 'pause') {
            document.querySelector('span#play').classList.remove('hide');
        } else if (e.type == 'play') {
            document.querySelector('span#play').classList.add('hide');
        }
    };

    // Drive render loop while audio is playing
    this.update = function() {
        // console.log('UPDATE!');

        if (audio.hasUpdatedData()) {
            // console.log('Update audio data');
            this.renderer.updateAudioData(audio.getFrequencyValues());

            // Pushing freq data into a buffer to avoid the boolean was exceptionally slow?
            // this.renderer.updateAudioData(audio.getData());            
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
    this.dropHandler = function(e) {
        console.log('dropHandler');
        e.stopPropagation();
        e.preventDefault();

        this.updateStatus('Loading...');

        const data = e.dataTransfer || e.originalEvent.dataTransfer;
        Resolver.resolveData(data).then(song => {
            this.updateStatus(song.name);
            audio.loadSong(song.src);
        }).catch(err => {
            console.warn(err);
        });

        e.currentTarget.classList.remove('over');

        // Necessary?
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

    this.loadSongFromClick = function(e) {
        e.preventDefault();

        cancelAnimationFrame(this.audioAnimation);
        this.audioAnimation = null;

        // Unstyle links
        document.querySelectorAll('.song').forEach(el => {
            el.classList.remove('enabled');
        });

        // Style active link
        e.currentTarget.classList.add('enabled');

        this.resolveUrl(e.currentTarget.getAttribute('href'));
    };

    this.resolveUrl = function(url) {
        if (url.indexOf('soundcloud') > -1) {
            this.resolveSoundcloudURL(url);
        } else {
            audio.loadSong(url);
        }
    };

    this.resolveSoundcloudURL = function(url)
    {
        /*
        // This is incorrect, because setting this value does not
        // guarantee that it has been resolved/loaded..
        if (this.currentSource != url) {
            this.currentSource = url;
        } else {
            return false;
        }
        */

        Resolver.resolveUrl(url).then(song => {

            // Update status
            this.updateStatus('Loading...');

            // Update active song link
            var a = document.createElement('a');
            a.appendChild( document.createTextNode(song.name));
            a.setAttribute('href', song.link);
            var el = document.querySelector('p.status');
            if (el.childNodes.length > 0)
                el.removeChild(el.childNodes[0]);
            el.appendChild(a);

            // Update audio source
            audio.loadSong(song.src);

            // Update router - this will not work at the minute?
            console.log(song.currentSource);
            this.currentSource = song.currentSource;
            this.setURL(song.currentSource);

            // Update search bar
            document.querySelector('input').classList.remove('invalid');
            document.querySelector('input').classList.add('valid');

        }).catch(err => {
            console.warn(err);
            document.querySelector('input').classList.remove('valid');
            document.querySelector('input').classList.add('invalid');
        });
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