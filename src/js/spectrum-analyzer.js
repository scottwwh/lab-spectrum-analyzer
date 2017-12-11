import DefaultRenderer from './renderers/DefaultRenderer';
import WebGlRenderer from './renderers/WebGlRenderer';

import Audio from './Audio';
import Resolver from './AudioResolver';
import Router from './Router';

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
            const url = e.currentTarget.value;
            if (Resolver.isValidURL(url)) { 
                this.resolveUrl(url);
            }
        });



        /* AUDIO */

        // Check for current URL and load
        let url = Router.getURL();
        console.log('getURL():', url);
        if (url != null && url != 'local') {
            
            this.resolveUrl(url);

        } else if (playDefault) {

            // TODO: Add debug flag for local development for this, as I don't want
            // to be streaming MP3s..
            //
            // const songs = ['02 - staring at the sun.mp3','08. tipper - unlock the geometry.mp3','212-andre_3000-behold_a_lady-rns.mp3'];
            // url = songs[Math.floor(Math.random() * songs.length)];

            // Load first song from links
            const el = document.querySelector('.song');
            el.classList.add('enabled');
            url = el.getAttribute('href');
            this.resolveUrl(url);
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
        // console.log('dropHandler');
        e.stopPropagation();
        e.preventDefault();

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

    this.showNav = function() {
        var els = document.querySelectorAll('nav');
        for ( var i = 0; i < els.length; i++ )
            els[i].classList.remove('hide');

        this.hideNav();
    };

    this.hideNav = function() {
        if ( this.timeout )
            clearTimeout( this.timeout );

        this.timeout = setTimeout(() => {
            var els = document.querySelectorAll('nav');
            for ( var i = 0; i < els.length; i++ )
                els[i].classList.add('hide');
        }, 10000 );
    };



    /* UI */

    this.updateStatus = function(text, link = null) {
        const elText = document.createTextNode(text);
        let el = null;
        if (link) {
            el = document.createElement('a');
            el.setAttribute('href', link);
            el.appendChild(elText);
        } else {
            el = elText;
        }

        const elParent = document.querySelector('p.status');
        if (elParent.childNodes.length > 0)
            elParent.removeChild(elParent.childNodes[0]);
        elParent.appendChild(el);
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

        Resolver.resolveUrl(url).then(song => {

            // TODO: Show a big loading graphic
            this.updateStatus(song.name, song.link);

            // Update audio source
            audio.loadSong(song.src);

            Router.setURL(Resolver.getCurrentSource());

            // Update search bar
            document.querySelector('input').classList.remove('invalid');
            document.querySelector('input').classList.add('valid');

        }).catch(err => {

            // Temporary convention to work around non-critical rejections
            if (err instanceof Object) {
                console.warn(err.msg);
            } else {
                console.error(err);
                document.querySelector('input').classList.remove('valid');
                document.querySelector('input').classList.add('invalid');
            }

        });
    };


    /* ROUTER */

    this.hashChange = function(e) {
        if (Router.isNewSource(e.newURL)) {
            this.resolveUrl(Router.getURL(e.newURL));
        }
    };


    /* Tracking
     *
     * This will be overridden by implementation, e.g.:
     * 
     *      this.trackEvent = function(action, label, value, nonInteraction) {};
     **/
    this.trackEvent = function() {};
};

export default SpectrumAnalyzer;