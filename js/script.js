import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
const enemiesToRemove = [];

const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const upBtn = document.getElementById("up-btn");
const downBtn = document.getElementById("down-btn");
const jumpBtn = document.getElementById("jump-btn");

function main()
{
    //Scene
    scene = new THREE.Scene();

    //camera set up
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 40);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    
    //renderer
    const canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0xFFFFFF);
    scene.fog = new THREE.Fog(0x8bcc9c, 0, 200);
    
    //Screen resize
    window.addEventListener('resize', () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    });
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
            // Apply gravity
            this.velocity.y += this.gravity;

            // Update horizontal position
            this.position.x += this.velocity.x;
            this.position.z += this.velocity.z;

            // Update vertical position
            this.position.y += this.velocity.y;

            // Ground collision
            if (this.bottom < plane.top) {
                this.position.y = plane.top + this.height / 2; // reset on top of plane
                this.velocity.y = 0; // stop vertical motion
            }
        }
    }

    function boxCollision({box1, box2}) {
        const xCollision = box1.right >= box2.left && box1.left <= box2.right;
        const yCollision = box1.bottom <= box2.top && box1.top >= box2.bottom;
        const zCollision = box1.front >= box2.back && box1.back <= box2.front;

        return xCollision && yCollision && zCollision;
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
    const enemies = [];


    //Light
    const light = new THREE.DirectionalLight();
    light.position.set(100, 100, 100);
    light.castShadow = true;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    scene.add(light);

    //skybox 
    let bgMesh;
    const loader = new THREE.TextureLoader();
    
    loader.load('/Assets/Forest.png', function(texture){
        var skyboxGeo = new THREE.SphereGeometry(100, 60, 40)
        var skyboxMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        })
        skyboxGeo.scale( -1, 1, 1);
        bgMesh = new THREE.Mesh( skyboxGeo, skyboxMat );
        scene.add(bgMesh);
        bgMesh.position.set(0, 0, 0)
    });

    drawParticles();

    //particles
    function drawParticles(){
        particles = new THREE.Group();
        scene.add(particles);
        const geometry = new THREE.TetrahedronGeometry(0.1,0);
    
        for(let i = 0; i < 5000; i++) {
            const material = new THREE.MeshPhongMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                shading: THREE.FlatShading
            });
            const mesh = new THREE.Mesh(geometry,material);
            mesh.position.set((Math.random() - 0.5) * 100,
                            (Math.random() - 0.5) * 100,
                            (Math.random() - 0.5) * 100);
            mesh.updateMatrix();
            mesh.matrixAutoUpdate = false;
            particles.add(mesh);
        }
    }

    //Scenery
    class Scenery {
        constructor(position = {x: 0, y: 0, z: 0}, modelPath ="") {
            this.position = position;
            this.modelPath = modelPath;
            this.tree = null;
            this.loadTrees(this.position);
        }
        async loadTrees(position){
            const loader = new GLTFLoader();
            const treeData = await loader.loadAsync(this.modelPath);
            this.tree = this.setupModel(treeData);
            scene.add(this.tree);
            this.tree.position.set(position.x, position.y, position.z);
        }
        setupModel(data) {
            const model = data.scene.children[0];
            return model;
        }
    }
    for (let i=0; i <= 25; i++) {
        const tree = new Scenery({x: (Math.random()- 0.5) * 100, y: 0, z: (Math.random() * 20)- 45 }, 'Assets/Tree.glb')
    }
    for (let i=0; i <= 25; i++) {
        const tree = new Scenery({x: (Math.random()- 0.5) * 100, y: 0, z: (Math.random() * -20)+ 45 }, 'Assets/Tree.glb')
    }
    for (let i=0; i <= 25; i++) {
        const tree = new Scenery({x: (Math.random() * -20)+ 45, y: 0, z: (Math.random()- 0.5) * 100 }, 'Assets/Tree.glb')
    }
    for (let i=0; i <= 25; i++) {
        const tree = new Scenery({x: (Math.random() * 20)- 45, y: 0, z: (Math.random()- 0.5) * 100 }, 'Assets/Tree.glb')
    }


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

    //Mobile controls  
    function addMobileTouch(button, setter) {
        button.addEventListener("touchstart", (e) => { e.preventDefault(); setter(true); });
        button.addEventListener("touchend", (e) => { e.preventDefault(); setter(false); });
    }

    // Map buttons to control booleans
    addMobileTouch(leftBtn, (state) => leftPressed = state);
    addMobileTouch(rightBtn, (state) => rightPressed = state);
    addMobileTouch(upBtn, (state) => upPressed = state);
    addMobileTouch(downBtn, (state) => downPressed = state);
    addMobileTouch(jumpBtn, (state) => spacePressed = state);

    //Render
    function animate()
    {
        const animator = requestAnimationFrame(animate);

        //Enemy Logic
        enemies.forEach((enemyTop, index) => {
            enemyTop.update(plane);
            if(
                boxCollision({
                    box1: testBox,
                    box2: enemyTop
                })
            ){
                console.log("collision");
                cancelAnimationFrame(animator);
            }
            if (
                enemyTop.position.x < LEVEL_BOUNDS.xMin ||
                enemyTop.position.x > LEVEL_BOUNDS.xMax ||
                enemyTop.position.z < LEVEL_BOUNDS.zMin ||
                enemyTop.position.z > LEVEL_BOUNDS.zMax
            ) {
                enemiesToRemove.push(index);
            }
        });
        enemies.forEach((enemyBottom, index) => {
            enemyBottom.update(plane);
            if(
                boxCollision({
                    box1: testBox,
                    box2: enemyBottom
                })
            ){
                console.log("collision");
                cancelAnimationFrame(animator);
            }
            if (
                enemyBottom.position.x < LEVEL_BOUNDS.xMin ||
                enemyBottom.position.x > LEVEL_BOUNDS.xMax ||
                enemyBottom.position.z < LEVEL_BOUNDS.zMin ||
                enemyBottom.position.z > LEVEL_BOUNDS.zMax
            ) {
                enemiesToRemove.push(index);
            }
        });
        enemies.forEach((enemyRight, index) => {
            enemyRight.update(plane);
            if(
                boxCollision({
                    box1: testBox,
                    box2: enemyRight
                })
            ){
                console.log("collision");
                cancelAnimationFrame(animator);
            }
            if (
                enemyRight.position.x < LEVEL_BOUNDS.xMin ||
                enemyRight.position.x > LEVEL_BOUNDS.xMax ||
                enemyRight.position.z < LEVEL_BOUNDS.zMin ||
                enemyRight.position.z > LEVEL_BOUNDS.zMax
            ) {
                enemiesToRemove.push(index);
            }
        });
        enemies.forEach((enemyLeft, index) => {
            enemyLeft.update(plane);
            if(
                boxCollision({
                    box1: testBox,
                    box2: enemyLeft
                })
            ){
                console.log("collision");
                cancelAnimationFrame(animator);
            }
            if (
                enemyLeft.position.x < LEVEL_BOUNDS.xMin ||
                enemyLeft.position.x > LEVEL_BOUNDS.xMax ||
                enemyLeft.position.z < LEVEL_BOUNDS.zMin ||
                enemyLeft.position.z > LEVEL_BOUNDS.zMax
            ) {
                enemiesToRemove.push(index);
            }
        });
        if (frames % 10 === 0) {
            const enemyTop = new Box(1, 1, 1, 0xFF0000, {x: 0, y: -0.01, z: 0.1}, {x: (Math.random()- 0.5) * 100, y: 3, z: -40});
            scene.add( enemyTop );
            enemyTop.castShadow = true;
            enemies.push(enemyTop);
            const enemyBottom = new Box(1, 1, 1, 0xFF0000, {x: 0, y: -0.01, z: -0.1}, {x: (Math.random()- 0.5) * 100, y: 3, z: 40});
            scene.add( enemyBottom );
            enemyBottom.castShadow = true;
            enemies.push(enemyBottom);
            const enemyRight = new Box(1, 1, 1, 0xFF0000, {x: -0.1, y: -0.01, z: 0}, {x: 40, y: 3, z: (Math.random()- 0.5) * 100});
            scene.add( enemyRight );
            enemyRight.castShadow = true;
            enemies.push(enemyRight);
            const enemyLeft = new Box(1, 1, 1, 0xFF0000, {x: 0.1, y: -0.01, z: 0}, {x: -40, y: 3, z: (Math.random()- 0.5) * 100});
            scene.add( enemyLeft );
            enemyLeft.castShadow = true;
            enemies.push(enemyLeft);
        }
        enemiesToRemove.forEach(indexToRemove => {
            const enemyToRemove = enemies[indexToRemove];
            scene.remove(enemyToRemove);
        });

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
        if(testBox.bottom <= plane.top && spacePressed) {
            testBox.velocity.y = 0.5;
        }

        particles.rotation.x += 0.001;
        particles.rotation.y -= 0.003;
        renderer.render(scene, camera);
    }
    animate();
}

window.onload = main;