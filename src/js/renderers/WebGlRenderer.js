
    var SpectrumAnalyzer3dRenderer = function(app)
    {
        var app = app;
        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;

        var canvas = document.getElementById('songcanvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;


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
            // light.position.y = 250;

            this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
            this.camera.position.z = 1000;

            var max = app.fftSize * 0.5;
            var row, col, len = Math.floor(Math.sqrt(max)), increm = 100;
            console.log(len);
            for ( var i = 0; i < max; i++ )
            {
                col = i % len;
                row = Math.floor( i / len );
                // console.log(col,row);

                var geometry = new THREE.BoxGeometry( 75, 75, 75 );
                // material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
                var material = new THREE.MeshLambertMaterial( { color: 0xff0000, transparent: true, shading: THREE.FlatShading } );
                material.opacity = 0.5;

                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = row * increm - ( len * increm * 0.5 );
                mesh.position.y = -500;
                mesh.position.z = col * increm - ( len * increm * 0.5 );

                this.scene.add( mesh );

                this.cubes.push( mesh );
            }
            console.log(this.cubes.length,app.fftSize);

            this.scene.add( light );
            // scene.add( new THREE.AmbientLight( 0x00ff00 ) );

            this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
            this.renderer.setSize( window.innerWidth, window.innerHeight );


            // document.body.appendChild( renderer.domElement );
            // var blar = app.fftSize;

            // this.render();
        };

        // this.render = function( values )
        this.render = function( values )
        {
            // requestAnimationFrame( this.render.bind(this) );
            var timer = 0.0001 * Date.now();

            console.log(values.length);

            var value;
            for ( var i = 0; i < this.cubes.length; i++ )
            {
                value = values[i] * Math.PI;
                this.cubes[i].scale.y = value * 2 + 0.5;
                // this.cubes[i].rotation.x = value;
                this.cubes[i].rotation.y = value;
                // this.cubes[i].rotation.z = value;
            }

            this.camera.position.x = Math.cos( timer ) * 1000;
            this.camera.position.z = Math.sin( timer ) * 1000;
            this.camera.lookAt( this.scene.position );

            this.renderer.render( this.scene, this.camera );
        };

        this.resize = function( w, h )
        {
            canvas.setAttribute( 'height', h );
            canvas.setAttribute( 'width', w );

            canvas.height = h;
            canvas.width = w;
        }
    };

export default SpectrumAnalyzer3dRenderer;