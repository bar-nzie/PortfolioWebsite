import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

let scene;
let camera;
let renderer;
let particles;
let frames = 0;

const colors = [0x8bcc9c, 0x8bcc9c, 0x086320];

const LEVEL_BOUNDS = {
    xMin: -50,
    xMax: 50,
    zMin: -50,
    zMax: 50
};

function main()
{
    //Scene
    scene = new THREE.Scene();

    //camera set up
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 40);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    //Screen resize
    const onWindowResize = () => {
        camera.aspect=window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
    }
     
    window.addEventListener('resize', onWindowResize);

    //renderer
    const canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFFFFF);

    //Cube
    class Box extends THREE.Mesh {
        constructor(width, height, length, colour, velocity = {x:0,y:0,z:0}, position = {x:0,y:0,z:0}) {
            super(
                new THREE.BoxGeometry(width, height, length),
                new THREE.MeshStandardMaterial({ color: colour })
            );
            this.width = width;
            this.height = height;
            this.length = length;
            this.velocity = velocity;
            this.gravity = -0.02;
            this.position.set(position.x, position.y, position.z);
        }

        get right() { return this.position.x + this.width / 2; }
        get left()  { return this.position.x - this.width / 2; }
        get top()   { return this.position.y + this.height / 2; }
        get bottom(){ return this.position.y - this.height / 2; }
        get front() { return this.position.z + this.length / 2; }
        get back()  { return this.position.z - this.length / 2; }

        update(plane) {
            this.velocity.y += this.gravity;
            this.position.x += this.velocity.x;
            this.position.z += this.velocity.z;

            if (this.bottom <= plane.top) {
                this.velocity.y = -this.velocity.y * 0.5;
                this.position.y = plane.top + this.height / 2;
            } else {
                this.position.y += this.velocity.y;
            }
        }
    }

    //Characters
    const testBox = new Box(
        1, 1, 1, 
        0xFFFFFF, 
        {x: 0, y: 0, z: 0}, // velocity starts at 0
        {x: 0, y: 3, z: 0}  // starting position
    );
    scene.add(testBox);
    testBox.receiveShadow = true;
    const plane = new Box(
        100, 1, 100, 
        0x32a852, 
        {x: 0, y: 0, z: 0},  // velocity (ignored)
        {x: 0, y: 0, z: 0}   // position
    );
    scene.add( plane );
    plane.receiveShadow = true;


    //Light
    const light = new THREE.DirectionalLight();
    light.position.set(100, 100, 100);
    light.castShadow = true;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    scene.add(light);


    //Keyboard Control
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    let rightPressed = false;
    let leftPressed = false;
    let upPressed = false;
    let downPressed = false;
    let spacePressed = false;

    function keyDownHandler(event){
        if(event.keyCode === 39) {
            rightPressed = true;
        } else if(event.keyCode === 37){
            leftPressed = true;
        }
        if(event.keyCode === 40){
            downPressed = true;
        } else if(event.keyCode === 38){
            upPressed = true;
        }
        if(event.keyCode === 32){
            spacePressed = true;
        }
    }
    function keyUpHandler(event){
        if(event.keyCode === 39) {
            rightPressed = false;
        } else if(event.keyCode === 37){
            leftPressed = false;
        }
        if(event.keyCode === 40){
            downPressed = false;
        } else if(event.keyCode === 38){
            upPressed = false;
        }
        if(event.keyCode === 32){
            spacePressed = false;
        }
    }

    //Render
    function animate()
    {
        const animator = requestAnimationFrame(animate);


        frames++;
        testBox.update(plane);

        //Movement
        if(rightPressed){
            testBox.position.x += 0.25;
        }
        if(leftPressed) {
            testBox.position.x -= 0.25;
        }
        if(downPressed) {
            testBox.position.z += 0.25;
        }
        if(upPressed) {
            testBox.position.z -= 0.25;
        }
        if (testBox.position.y <= 1.5) {
            if(spacePressed){
                testBox.velocity.y = 0.5  ;
            }
        }
        renderer.render(scene, camera);
    }
    animate();
}

window.onload = main;