import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(500, 500);
renderer.setPixelRatio(2);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0, 240);
camera.lookAt(0, 0, 0);

// Scene
const scene = new THREE.Scene();

// Light
const ambientLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(ambientLight);


// const spotLight = new THREE.SpotLight(0xFF00FF, 100);
// spotLight.position.set(100, 100, 100);
// spotLight.target.position.set(0, 0, 0);
// spotLight.castShadow = true;
// spotLight.angle = Math.PI/12;
// spotLight.decay = 0;
// spotLight.penumbra = 1;
// scene.add(spotLight);
// scene.add(spotLight.target);

// const spotLightHelper = new THREE.SpotLightHelper( spotLight );
// scene.add( spotLightHelper );


RectAreaLightUniformsLib.init();
const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(200, 200, 20),
    new THREE.MeshStandardMaterial({ color: 0xFF0000 })
);
mesh.castShadow = true;
mesh.receiveShadow = true;

const light = new THREE.RectAreaLight( 0x0000FF, 10, 50, 100 );
light.position.set( 0, 0, 11 );
light.power = 10000000000
light.lookAt( 0, 0, -100 );
scene.add( light );

// const helper = new RectAreaLightHelper( light );
// light.add( helper );

// const helper = new THREE.DirectionalLightHelper( light, 5 );
// scene.add( helper );

scene.add(mesh);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();

// Render
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
