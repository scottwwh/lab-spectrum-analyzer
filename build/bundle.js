(function () {
'use strict';

var DefaultRenderer = function(app)
{
    var app = app;

    var canvas = document.getElementById('songcanvas');
    canvas.width = app.WIDTH;
    canvas.height = app.HEIGHT;

    var canvasContext = canvas.getContext("2d");
    var colours = document.getElementById('colourTable');
    var coloursContext = colours.getContext("2d");


    // Loop keeps playing even when no sound
    this.init = function()
    {
        // Colours
        var gradient = coloursContext.createLinearGradient(0,0,0,colours.height);
        gradient.addColorStop(0,'#ffcc00');
        gradient.addColorStop(0.5,'#006600');
        gradient.addColorStop(1.0,'#000066');
        coloursContext.fillStyle = gradient;
        coloursContext.fillRect( 0, 0, colours.width, colours.height );

        // Add noise
        var offsetX = colours.width * 0.075;
        var x,y;
        for ( var i = 0; i < 2500; i++ )
        {
            x = Math.floor( colours.width * Math.random() * 0.85 );
            y = Math.floor( colours.height * Math.random() );

            coloursContext.fillStyle = 'rgba( 255, 255, 255, 0.2 )';
            coloursContext.fillRect( x  + offsetX, y, 1, 1 );
            coloursContext.fill();
        }

        // Highlight
        gradient = coloursContext.createLinearGradient(0,0,colours.width,0);
        gradient.addColorStop( 0.1, "rgba( 255, 255, 255, 0 )" );
        gradient.addColorStop( 0.3, "rgba( 255, 255, 255, 0.25 )" );
        gradient.addColorStop( 0.485, "rgba( 255, 255, 255, 0.6 )" );
        gradient.addColorStop( 0.49, "rgba( 255, 255, 255, 0.8 )" );
        gradient.addColorStop( 0.5, "rgba( 255, 255, 255, 0.6 )" );
        gradient.addColorStop( 0.51, "rgba( 255, 255, 255, 0.8 )" );
        gradient.addColorStop( 0.515, "rgba( 255, 255, 255, 0.6 )" );
        gradient.addColorStop( 0.7, "rgba( 255, 255, 255, 0.25 )" );
        gradient.addColorStop( 0.9, "rgba( 255, 255, 255, 0 )" );
        coloursContext.fillStyle = gradient;
        coloursContext.fillRect( 0, 0, colours.width, colours.height );
    };

    this.render = function( values )
    {
        var h = canvas.height / values.length;
        var w = canvas.width / colours.width;
        var value;
        var x, y, sy;

        canvasContext.clearRect(0, 0, app.WIDTH, app.HEIGHT);
        for ( var i = 0, len = values.length; i < len; i++ )
        {
            value = values[i] * canvas.width;

            x = ( canvas.width - value ) * 0.5;
            y = canvas.height - h * i;
            sy = colours.height - ( i / len * colours.height );

            canvasContext.drawImage( colours, 0, sy, colours.width, 1, x, y, value, h - 1 );
        }
    };

    this.resize = function()
    {
        canvas.setAttribute('height', app.HEIGHT);
        canvas.setAttribute('width', app.WIDTH);

        canvas.height = app.HEIGHT;
        canvas.width = app.WIDTH;
    };
};

var SpectrumAnalyzer3dRenderer = function(app)
    {
        var app = app;
        // var WIDTH = window.innerWidth;
        // var HEIGHT = window.innerHeight;

        var canvas = document.getElementById('songcanvas');
        canvas.width = app.WIDTH;
        canvas.height = app.HEIGHT;


        this.cubes = [];
        this.scene;
        this.camera;
        this.renderer;


        // Loop keeps playing even when no sound
        this.init = function()
        {
            this.scene = new THREE.Scene();

            var light = new THREE.PointLight( 0xffffff, 1 );
            // light.intensity = 100;
            light.position.y = 500;

            this.camera = new THREE.PerspectiveCamera( 75, app.WIDTH / app.HEIGHT, 1, 10000 );
            this.camera.position.y = 500;

            // Despite the count being correct, I'm only seeing 16x8 cubes?
            var max = app.fftSize; // * 0.5;
            var row, col,
                len = Math.floor(Math.sqrt(max)),
                d = 100, // Distance
                offsetX = len * 0.5 * d * -0.5,
                offsetZ = len * d * -0.5;

            // console.log(max, len);
            for (var i = 0; i < max; i++)
            {
                // console.log(i);
                col = i % len;
                row = Math.floor(i / len);
                // console.log(row, col);

                var geometry = new THREE.BoxGeometry( 75, 75, 75 );
                var material = new THREE.MeshLambertMaterial( { color: 0xff0000, transparent: true, shading: THREE.FlatShading } );
                material.opacity = 0.5;

                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = row * d + offsetX;
                mesh.position.y = 0; // Math.random() * 100 - 50;
                mesh.position.z = col * d + offsetZ;

                this.scene.add( mesh );
                this.cubes.push( mesh );
            }
            // console.log(this.cubes.length, app.fftSize);

            this.scene.add( light );

            this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
            this.renderer.setSize(app.WIDTH, app.HEIGHT);
        };

        this.render = function(values)
        {
            var timer = 0.0001 * Date.now();

            var value;
            for ( var i = 0; i < this.cubes.length; i++ )
            {
                value = values[i] * Math.PI;
                this.cubes[i].scale.y = value * 2 + 0.5;
                this.cubes[i].rotation.y = value;
            }

            this.camera.position.x = Math.cos( timer ) * 1000;
            this.camera.position.z = Math.sin( timer ) * 1000;
            this.camera.lookAt( this.scene.position );

            this.renderer.render( this.scene, this.camera );
        };

        this.resize = function() {
            this.renderer.setSize(app.WIDTH, app.HEIGHT);
        };
    };

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
    this.fftSize = 256;

    // Set to 'new <renderer>()' from /renderers
    this.renderer = null;
    this.timeout = null;
    this.baseURL = 'https://soundcloud.com/';


    // Initialize - and grab an SC URL?
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
        this.renderer = new SpectrumAnalyzer3dRenderer(this);

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
            this.resolveSoundcloudURL(url);

            // Load track now because URL will be disregarded in setURL (??)
            this.trackEvent('Load SoundCloud URL', url, null, false);

        // Play default song
        } else if (playDefault) {
            this.updateStatus('Loading in 5s...');

            var time = new Date().getTime();
            this.defaultInterval = setInterval(function() {
                this.initDefaultPlayback(time);
            }.bind(this), 1000);
        }
    };

    this.defaultInterval = null;
    this.defaultTime = null;

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

        // Older versions of FF?
        var canPlay = !! ( this.audio.canPlayType && this.audio.canPlayType('audio/mpeg;').replace(/no/, ''));
        if ( ! canPlay )
        {
            alert( "Doesn't support playback" );
            return;
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
            // Hide loading graphic

            if ( this.supportsWebAudio )
            {
                cancelAnimationFrame( this.audioAnimation );
                this.setupAudioNodes();
            }
            else
            {
                this.audio.play();
            }
        }
        else if (e.type == 'playing')
        {
            // console.log( "Playing a duration of", this.audio.duration );
        }
        else if (e.type == 'timeupdate')
        {
        }
        else if (e.type == 'pause')
        {
        }
        else if (e.type == 'play')
        {
        }
    };


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
            // document.querySelector('#drop-target').classList.add( 'over' );
            e.currentTarget.classList.add('over');
        }
        else if ( e.type == 'dragleave' )
        {
            // document.querySelector('#drop-target').classList.remove( 'over' );
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
            this.updateStatus( "Sorry, that didn't work - try something else." );
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

    this.hashChange = function(e)
    {
        if ( e.newURL != this.getURL() )
            this.resolveSoundcloudURL( this.getURL(e.newURL) );
    };


    /** Nav **/

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




    /** WEB AUDIO **/

    this.setupAudioNodes = function()
    {
        this.analyser = (this.analyser || this.audioContext.createAnalyser());
        this.analyser.smoothingTimeConstant = 0.25; // 0.7;
        this.analyser.fftSize = this.fftSize;

        // Firefox used to fail silently at this point
        // Ref: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
        //
        // Triggers error in Chrome when seeking position via media UI
        this.sourceNode = (this.sourceNode || this.audioContext.createMediaElementSource(this.audio));
        this.sourceNode.connect(this.analyser);
        this.sourceNode.connect(this.audioContext.destination);

        this.audio.play();

        this.update();
    };

    this.update = function()
    {
        // console.log('update');

        var array =  new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);

        // Normalize values to 0-1
        var values = [];
        for ( var i = 0; i < (array.length); i++ )
        {
            values[ i ] = array[ i ] / 255;
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



    /* SoundCloud */

    this.currentSource = null;

    // TODO: Proxy this request?
    var scClientId = 'a20b2507998bc9f8f0874f12de0efb84';
    var resolvedUrl = 'http://api.soundcloud.com/resolve.json?url=';

    // Resolve SC stream from URL
    this.resolveSoundcloudURL = function(url)
    {
        // Validate URL
        //
        // TODO: Reduce suckitude and combine with other logic!
        if (url.indexOf('https://soundcloud.com/') == -1) {
            // Red border
            return;
        } else {
            // Green border
            console.log('Validate URL:', url);
        }

        
        // TODO: Confirm that URL has changed
        if (this.currentSource != url) {
            this.currentSource = url;
        } else {
            console.log('URL is already set..');
            return;
        }

        var request = new XMLHttpRequest();
        request.open('GET', resolvedUrl + url + '&client_id=' + scClientId, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                var data = JSON.parse(request.responseText);
                this.onResolveSoundcloudURLSuccess(data);
            } else {
                // We reached our target server, but it returned an error
                console.warn("Error?");
                // document.querySelector('input').classList.remove('valid');
                // document.querySelector('input').classList.add('invalid');
            }
        }.bind(this);

        request.onerror = function(err) {
            // There was a connection error of some sort
            console.warn('Error attempting to resolve URL:', err);
            // document.querySelector('input').classList.remove('valid');
            // document.querySelector('input').classList.add('invalid');
        };

        request.send();
    };

    this.onResolveSoundcloudURLSuccess = function(result) {
        if (result.streamable)
        {
            this.updateStatus('Loading...');

            var a = document.createElement('a');
            a.appendChild( document.createTextNode( result.title ) );
            a.setAttribute( 'href', result.permalink_url );

            var el = document.querySelector('p.status');
            if ( el.childNodes.length > 0 )
                el.removeChild( el.childNodes[0] );

            el.appendChild( a );

            var songUrl = result.stream_url + '?client_id=' + scClientId;
            this.loadSong( songUrl );

            // Update location for linking
            this.setURL(this.currentSource);

            document.querySelector('input').classList.remove('invalid');
            document.querySelector('input').classList.add('valid');
        }
        else
        {
            console.warn("Sorry, that link can't be streamed");
            document.querySelector('input').classList.remove('valid');
            document.querySelector('input').classList.add('invalid');
        }
    };




    /* AUDIO */

    // Load an alreadu-resolved SC URL
    this.loadSong = function(url)
    {
        if (this.sourceNode) this.sourceNode.disconnect();

        this.audio.src = url;
    };





    /** Getters and setters **/

    /* Current location */

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

var app = new SpectrumAnalyzer();
app.trackEvent = function( action, label, value, noninteraction )
{
    if ( typeof _gaq !== 'undefined' )
        _gaq.push([ '_trackEvent', 'Spectrum Analyzer', action, label, value, noninteraction ]);
};
app.init(true);
// app.init(false);

}());
