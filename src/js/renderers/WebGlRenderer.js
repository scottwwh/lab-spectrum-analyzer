
import * as THREE from 'three';


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
            this.camera.position.y = 750;

            // frequencyBinCount may not be available when renderer is initialized, and is always  half of fftSize
            var max = app.fftSize * 0.5;
            var row, col,
                len = Math.floor(Math.sqrt(max)),
                d = 100, // Distance
                offset = len * d * -0.5;

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
                mesh.position.x = row * d + offset;
                mesh.position.y = 0; // Math.random() * 100 - 50;
                mesh.position.z = col * d + offset;

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

            this.camera.position.x = Math.cos( timer ) * 1500;
            this.camera.position.z = Math.sin( timer ) * 1500;
            this.camera.lookAt( this.scene.position );

            this.renderer.render( this.scene, this.camera );
        };

        this.resize = function() {
            this.renderer.setSize(app.WIDTH, app.HEIGHT);
        }
    };

export default SpectrumAnalyzer3dRenderer;