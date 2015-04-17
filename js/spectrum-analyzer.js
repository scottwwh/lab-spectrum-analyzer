


var lab; // Defined in containing page until we've encapsulated all of this



// Not currently working
var DropTarget = function()
{
    this.dropTarget;


    this.init = function()
    {
        this.dropTarget = document.getElementById( 'drop-target' );
        this.dropTarget.addEventListener( 'drop', this.drop, false );
        this.dropTarget.addEventListener( 'dragenter', this.dragHandler, false );
        this.dropTarget.addEventListener( 'dragover', this.dragHandler, false );
        this.dropTarget.addEventListener( 'dragleave', this.dragHandler, false );
    };

    this.drop = function( e )
    {
        e.stopPropagation();
        e.preventDefault();


        var data = e.dataTransfer || e.originalEvent.dataTransfer;

        // alert( e );
        console.log( data, data.items[0].type );


        if ( data.files.length == 1 )
        {
            var url = data.files[0].name;
            if ( url.substring( url.length - 3 ) == 'mp3' )
            {
                // loadSong(url);

                var reader = new FileReader();

                reader.onload = function(fileEvent) {
                    var data = fileEvent.target.result;
                    // initAudio(data);
                    // console.log(data);
                    console.log(fileEvent.target);
                    loadSong(data);
                };

                console.log(data.files);
                reader.readAsArrayBuffer(data.files[0]);

            }
        }
        else
        {
            data.items[0].getAsString( loadSongFromSC );
        }

        // console.log( data.files );

        $('#drop-target').hide();

        return false;
    };

    this.dragHandler = function( e )
    {
        if ( e.type == 'dragover' )
        {
            e.stopPropagation();
            e.preventDefault();
        }
        else if ( e.type == 'dragenter' )
        {
            $('#drop-target').addClass( 'over' );
        }
        else if ( e.type == 'dragleave' )
        {
            $('#drop-target').removeClass( 'over' );
        }

        return false;
    };
};








var audio;
var audioContext;
var audioAnimation;
// var audioBuffer;
var sourceNode;
var analyser;

if ( typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined" )
{
    window.audioContext = AudioContext || webkitAudioContext ;
    audioContext = new audioContext();
}
else
{
    alert( 'Sorry, your browser does not support AudioContext' );
}





var isInitialized = false;

function initAudio()
{
    audio = document.getElementsByTagName('audio')[0];

    var canPlay = !! ( audio.canPlayType && audio.canPlayType('audio/mpeg;').replace(/no/, ''));
    if ( ! canPlay )
    {
        alert( "Doesn't support playback" );
        return;
    }


    audio.setAttribute( 'preload', 'auto' ); // See if this solves issue w/ stream never playing
    // audio.removeAttribute( 'controls' );

    audio.addEventListener("canplay", function(e) {
        // Hide loading graphic

        // Does nothing in FF
        setupAudioNodes();

        // Works immediately in FF
        // audio.play();

    }, false);
    audio.addEventListener("playing", function(e) {
        console.log( "Playing a duration of", audio.duration );
    }, false);
    audio.addEventListener("timeupdate", function(e) {
        // console.log( "timeupdate" );
    }, false);
    audio.addEventListener("pause", function(e) {
        $('#drop-target').removeClass('over');
        $('#drop-target').show();
    }, false);
    audio.addEventListener("play", function(e) {
        $('#drop-target').removeClass('over');
        $('#drop-target').hide();
    }, false);
}




function loadSong(url)
{
    if ( ! isInitialized )
    {
        // Show loading graphic


        // Can I remove an HTML element?
        // if (audio) audio.remove();


        if (sourceNode) sourceNode.disconnect();
        cancelAnimationFrame(audioAnimation);

        initAudio();

        isInitialized = true;
    }


    audio.src = url;
}




function setupAudioNodes()
{
    // console.log( analyser, audioContext.createAnalyser() );
    analyser = (analyser || audioContext.createAnalyser());
    analyser.smoothingTimeConstant = 0.25; // 0.7;
    analyser.fftSize = lab.fftSize;

    // console.log(audio);

    // If this is enabled, then Firefox will fail silently
    // Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
    //
    // Triggers error in Chrome when seeking position via media UI
    sourceNode = (sourceNode || audioContext.createMediaElementSource(audio));

    if ( true )
    {
        sourceNode.connect(analyser);
        sourceNode.connect(audioContext.destination);
        // analyser.connect(audioContext.destination);
        // console.log( analyser, sourceNode );
    }

    audio.play();
    update();
}



function update()
{
    // console.log( 'update' );
    var array =  new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    // console.log(array.length);

    // Normalize values
    for ( var i = 0; i < (array.length); i++ )
    {
        values[ i ] = array[ i ] / 255;
    }

    lab.renderer.render();

    audioAnimation = requestAnimationFrame(update);
}







/** SoundCloud wrapper **/

// Resolve SC stream from URL
function loadSongFromSC( url )
{
    var scClientId = 'a20b2507998bc9f8f0874f12de0efb84';
    var resolvedUrl = 'http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=' + scClientId;

    // console.log(url);

    $.ajax({
        url: resolvedUrl,
        type: 'GET',
        success: function( result )
        {
            console.log( result );

            // We can use this as a visualization fallback for FF due to CORS annoyance..
            if ( 'firefox' == 'true' )
            {
                var waveform = new Image();
                waveform.src = result.waveform_url;
                document.body.appendChild( waveform );
            }

            if ( result.streamable )
            {
                document.getElementById( 'credits' ).style.display = 'block';
                document.getElementById( 'title' ).innerHTML = result.title;
                document.getElementById( 'user' ).innerHTML = result.user.username;
                document.getElementById( 'user' ).href = result.permalink_url;

                var songUrl = result.stream_url + '?client_id=' + scClientId;
                loadSong( songUrl );

                // Update location for linking
                lab.setURL( url );

                _gaq.push(['_trackPageview']);
            }
            else
            {
                alert( "Sorry, that link can't be streamed" );
            }
        },
        error: function( data ) {
            alert( "Sorry, that link couldn't be streamed.." );
        }
    });
}








var SpectrumAnalyzer = function()
{
    this.fftSize = 256;
    this.renderer = null;


    // Initialize - and grab an SC URL?
    this.init = function()
    {
        // Initialize existing links
        var els = document.querySelectorAll('.song');
        for ( var i = 0; i < els.length; i++ )
            els[i].addEventListener( 'click', this.loadDefaultSong.bind( this ) );


        // Check for URL to load
        var url = this.getURL();
        if ( url != null )
        {
            loadSongFromSC( url );
        }

        this.renderer.init();

        window.addEventListener( 'resize', this.resize.bind(this) );
    };

    this.loadDefaultSong = function(e)
    {
        e.preventDefault();

        var path = e.currentTarget.getAttribute('href');
        if ( path.indexOf( 'soundcloud' ) > -1 )
        {
            loadSongFromSC( path );
        }
        else
        {
            loadSong( path );
        }
    };





    this.resize = function(e)
    {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;

        this.renderer.resize( WIDTH, HEIGHT );
    };

    this.getURL = function()
    {
        if ( window.location.href.indexOf( '?url=' ) > -1 )
            return decodeURIComponent( window.location.href.substr( window.location.href.indexOf( '?url=' ) + 5 ) );

        return null;
    };

    this.setURL = function( url )
    {
        if ( this.getURL() == url )
            return;

        var pos = ( window.location.href.indexOf( '?url=' ) == -1 ) ? window.location.href.length : window.location.href.indexOf( '?url=' ) ;
        var location = window.location.href.substr( 0, pos ) + '?url=' + encodeURIComponent( url );

        // Need to support updates when state changes
        window.history.pushState( {}, "", location );
    }

};





// List of normalized values
var values = [];






/** Rendering **/

var CanvasRenderer = function()
{
    var canvas = document.getElementById('songcanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    WIDTH = canvas.width;
    HEIGHT = canvas.height;
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

    this.render = function()
    {
        var h = canvas.height / values.length;
        var w = canvas.width / colours.width;
        var value;
        var x, y, sy;
        // console.log( h, w );

        canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

        /*
         // Not a very interesting effect, could be better to play around with the form's boundary?
         canvasContext.fillStyle = "rgba( 0,0,0,0.2 )";
         canvasContext.rect(0, 0, WIDTH, HEIGHT);
         canvasContext.fill();
         */

        for ( var i = 0; i < ( values.length ); i++ )
        {
            value = values[i] * canvas.width;

            x = ( canvas.width - value ) * 0.5;
            y = canvas.height - h * i;
            sy = colours.height - ( i / values.length * colours.height );
            // console.log( sy );

            canvasContext.drawImage( colours, 0, sy, colours.width, 1, x, y, value, h - 1 );
        }
    };

    this.resize = function( w, h )
    {
        canvas.setAttribute( 'height', h );
        canvas.setAttribute( 'width', w );

        canvas.height = h;
        canvas.width = w;
    }
};

