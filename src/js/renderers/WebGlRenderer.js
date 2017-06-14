
    var SpectrumAnalyzer3dRenderer = function()
    {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;

        var canvas = document.getElementById('songcanvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;


        this.cubes = [];


        // Loop keeps playing even when no sound
        this.init = function()
        {
            scene = new THREE.Scene();

            light = new THREE.PointLight( 0xffffff, 1 );
            // light.intensity = 100;
            // light.position.y = 250;

            camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
            camera.position.z = 1000;

            var max = app.fftSize * 0.5;
            var row, col, len = Math.floor(Math.sqrt(max)), increm = 100;
            console.log(len);
            for ( var i = 0; i < max; i++ )
            {
                col = i % len;
                row = Math.floor( i / len );
                // console.log(col,row);

                geometry = new THREE.BoxGeometry( 75, 75, 75 );
                // material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
                material = new THREE.MeshLambertMaterial( { color: 0xff0000, transparent: true, shading: THREE.FlatShading } );
                material.opacity = 0.5;

                mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = row * increm - ( len * increm * 0.5 );
                mesh.position.y = -500;
                mesh.position.z = col * increm - ( len * increm * 0.5 );

                scene.add( mesh );

                this.cubes.push( mesh );
            }
            console.log(this.cubes.length,app.fftSize);

            scene.add( light );
            // scene.add( new THREE.AmbientLight( 0x00ff00 ) );

            renderer = new THREE.WebGLRenderer( { canvas: canvas } );
            renderer.setSize( window.innerWidth, window.innerHeight );


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

            camera.position.x = Math.cos( timer ) * 1000;
            camera.position.z = Math.sin( timer ) * 1000;
            camera.lookAt( scene.position );

            renderer.render( scene, camera );
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