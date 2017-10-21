
// Dev
// import * as THREE from 'three';
// import * as OrbitControls from 'three/examples/js/controls/OrbitControls';

// TODO: Figure out why we're still pulling in all modules?
// import { Scene, PointLight, PerspectiveCamera, BoxGeometry, MeshLambertMaterial, Mesh, FlatShading, WebGLRenderer } from 'three/build/three.modules';
import * as THREE from 'three';


const colors = [0x00FFFF, 0x1CFFE3, 0x39FFC6, 0x55FFAA, 0x71FF8E, 0x8EFF71, 0xAAFF55, 0xC6FF39, 0xE3FF1C, 0xFFFF00]


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
        // document.addEventListener( 'mousemove', this.onMouseMove );

        
        this.scene = new THREE.Scene();

        var light = new THREE.PointLight( 0xffffff, 1 );
        // light.intensity = 100;
        light.position.y = 500;

        this.camera = new THREE.PerspectiveCamera( 75, app.WIDTH / app.HEIGHT, 1, 10000 );


        var birdsEye = false;


        if (birdsEye) { // Bird's eye grid
            this.camera.position.y = 1500;
            this.camera.position.z = 10; // 1500;
        } else {
            this.camera.position.y = 500;
            this.camera.position.z = 1000; // 1500;
        }

        

        // frequencyBinCount may not be available when renderer is initialized, and is always half of fftSize
        var group = new THREE.Group();
        var max = app.fftSize * 0.5;
        var row, col,
            len = Math.floor(Math.sqrt(max)),
            d = 100; // Distance

        // console.log(max, len);
        for (var i = 0; i < max; i++)
        {
            let hex = i.toString(16);
            if (hex.length == 1)
                hex = '0' + hex;

            col = i % len;
            row = Math.floor(i / len);

            const transparent = true;
            var geometry = new THREE.SphereGeometry(100 * 0.5, 4, 12);
            var material = new THREE.MeshLambertMaterial( { color: colors[0], transparent: transparent, flatShading: true } );
            // material.opacity = 0;

            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = row * d;
            mesh.position.y = 0;
            mesh.position.z = col * d;

            group.add( mesh );

            this.cubes.push( mesh );
        }
        this.scene.add(group);
        this.scene.add(light);


        var box = new THREE.Box3().setFromObject(group);
        // console.log(box.getSize(), box.min, box.max, group.position);

        if (birdsEye) {
            group.position.x += box.getSize().x * -0.5;
            group.position.z += box.getSize().z * 0.5;
            group.rotation.y = Math.PI * 0.5;
        } else {
            group.position.x += box.getSize().x * 0.5;
            group.position.z += box.getSize().z * -0.5;
            group.rotation.y = Math.PI * -0.5;
        }


        this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
        this.renderer.setSize(app.WIDTH, app.HEIGHT);

        // controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        // controls.addEventListener( 'change', this.render ); // remove when using animation loop
        // enable animation loop when using damping or autorotation
        // controls.enableDamping = true;
        // controls.dampingFactor = 0.25;
        // controls.enableZoom = false;
    };

    // var controls;

    this.render = function(values)
    {
        this.cubes.forEach((cube, i) => {
            // TODO: Figure out what is causing error when setting values[i] to a const:
            //
            //  THREE.Matrix3.getInverse(): can't invert matrix, determinant is 0
            //
            let value = values[i] * Math.PI;
            cube.scale.y = value * 2 + 0.5;
            cube.rotation.y = value;
            cube.material.opacity = values[i] * 0.75;

            const color = colors[Math.floor(values[i] * 10)];
            cube.material.color.set(color);
        });

        // Works, suckily
        // this.camera.position.x = mouseX + 1000;

        // this.camera.position.x += ( mouseX - this.camera.position.x ) * 0.025;
        // this.camera.position.y += ( mouseY - this.camera.position.y ) * 0.025;
        // camera.position.z = particles.geometry.vertices[ pos ].position.z + 300;


        // Running into big performance issues when camera rotates around the back of low-end samples
        // const timer = 0.0001 * Date.now();
        // this.camera.position.x = Math.cos( timer ) * 1500;
        // this.camera.position.z = Math.sin( timer ) * 1500;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    };

    this.resize = function() {
        this.camera.aspect = app.WIDTH / app.HEIGHT;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(app.WIDTH, app.HEIGHT);
    }


    var mouseX; // = event.clientX - windowHalfX;
    var mouseY; // = event.clientY - windowHalfY;

    this.onMouseMove = function( event ) {
        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    }
};

export default SpectrumAnalyzer3dRenderer;