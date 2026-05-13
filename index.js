import * as THREE from "three";
import * as CIRCLE from "./circle.js";
import * as BOX from "./constants.js";


// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(BOX.w, BOX.h);
document.body.appendChild(renderer.domElement);


// Camera
const camera = new THREE.OrthographicCamera(-BOX.w / 2, +BOX.w / 2, +BOX.h / 2, -BOX.h / 2, 1, 1000);


// Scene
const scene = new THREE.Scene();


// Circles
const instancedMesh = CIRCLE.initializeGrid(BOX.w, BOX.h);
scene.add(instancedMesh);


// Create Ambient Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);


// Functions
const interpolate = (x) => Math.pow(x, 10);
const distance = (dX, dY) => Math.sqrt((dX ** 2) + (dY ** 2));


// Handler for Mouse Movement
let prevMouseX = Infinity;
let prevMouseY = Infinity;


function onMouseMove(e) {
    const mouseX = e.clientX + (-BOX.w / 2);
    const mouseY = -(e.clientY + (-BOX.h / 2));

    const deltaX = prevMouseX === Infinity ? 0 : mouseX - prevMouseX;
    const deltaY = prevMouseY === Infinity ? 0 : mouseY - prevMouseY;

    let i = 0;
    for (let rowIdx = 1; rowIdx <= CIRCLE.nRows; rowIdx++) {
        for (let colIdx = 1; colIdx <= CIRCLE.nCols; colIdx++) {
            const posY = CIRCLE.getYPos(rowIdx);
            const posX = CIRCLE.getXPos(colIdx);

            const dist = distance(posX - mouseX, posY - mouseY);
            const maxDist = 200;

            const scalar = Math.max(0, 1 - dist / maxDist);
            const interpolatedScalar = interpolate(scalar);

            // Scale
            const matrix = new THREE.Matrix4();
            instancedMesh.getMatrixAt(i, matrix);

            // Decompose Matrix
            // We need to access the position part
            // of the matrix, hence the decomposing.
            const p = new THREE.Vector3(); 
            const q = new THREE.Quaternion();
            const s = new THREE.Vector3();
            matrix.decompose(p, q, s);

            // Update Scale
            const updatedScale = (val) => Math.min(4, val + interpolatedScalar);
            s.set(updatedScale(s.getComponent(0)), updatedScale(s.getComponent(1)), 1);
            
            // Putting the Matrix Back
            matrix.compose(p, q, s);
            instancedMesh.setMatrixAt(i, matrix);

            // Brightness
            const color = new THREE.Color();
            instancedMesh.getColorAt(i, color);

            const updatedBrightness = Math.min(color.r + interpolatedScalar, 1)
            instancedMesh.setColorAt(i, new THREE.Color(updatedBrightness, 0, 0));

            i++;
        }
    }

    instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.instanceMatrix.needsUpdate = true;

    prevMouseX = mouseX;
    prevMouseY = mouseY;
}


// Animate
function animate() {
    let i = 0;
    for(let rIdx = 0; rIdx < CIRCLE.nRows; rIdx++) {
        for(let colIdx = 0; colIdx < CIRCLE.nCols; colIdx++) {
            // Update Brightness
            const color = new THREE.Color();
            instancedMesh.getColorAt(i, color);

            const updatedBrightness = Math.max(0, color.r - 0.01);
            instancedMesh.setColorAt(i, new THREE.Color(updatedBrightness, 0, 0));

            // Update Scale
            const matrix = new THREE.Matrix4();
            instancedMesh.getMatrixAt(i, matrix);

            const p = new THREE.Vector3(); 
            const q = new THREE.Quaternion();
            const s = new THREE.Vector3();
            matrix.decompose(p, q, s);

            // Update Scale
            const updatedScale = (val) => Math.max(1, val - 0.01);
            s.set(updatedScale(s.getComponent(0)), updatedScale(s.getComponent(1)), 1);
            
            // Putting the Matrix Back
            matrix.compose(p, q, s);
            instancedMesh.setMatrixAt(i, matrix);

            i++;
        }
    }

    instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Render
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.addEventListener("mousemove", onMouseMove);
animate();