
var SpectrumAnalyzerDefaultRenderer = function()
{
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    var canvas = document.getElementById('songcanvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

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

        canvasContext.clearRect(0, 0, WIDTH, HEIGHT);
        for ( var i = 0, len = values.length; i < len; i++ )
        {
            value = values[i] * canvas.width;

            x = ( canvas.width - value ) * 0.5;
            y = canvas.height - h * i;
            sy = colours.height - ( i / len * colours.height );

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
