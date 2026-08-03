import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(500, 500);
renderer.setPixelRatio(2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0, 200);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.0));

const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 10),
    new THREE.MeshStandardMaterial({ color: 0xFFFF00 })
);
mesh.position.set(0, 0, 0);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

const slats = [];
for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    mat.colorWrite = false;

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(25, 500, 10),
        mat
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const baseX = (i - 1) * 30;
    mesh.position.set(baseX, i * 10, 50);
    mesh.userData.baseX = baseX;

    mesh.rotation.z = THREE.MathUtils.degToRad(30);
    scene.add(mesh);
    slats.push(mesh);
}

const light = new THREE.DirectionalLight(0xFF0000, 1);
light.position.set(0, 0, 500);
light.target.position.set(0, 0, 0);
light.castShadow = true;
light.shadow.camera.left = -100;
light.shadow.camera.right = 100;
light.shadow.camera.top = 100;
light.shadow.camera.bottom = -100;
light.shadow.camera.near = 1;      // add — you're missing near/far, using defaults (0.5/500) which is fine here but worth being explicit
light.shadow.camera.far = 500;
light.shadow.mapSize.set(2048, 2048); // add — default is only 512x512, too low-res for soft blur to look clean
light.shadow.radius = 36;           // add — this is what actually creates the blur, only works with VSM/PCFSoft
light.shadow.blurSamples = 24; 
scene.add(light, light.target);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();
    const amplitude = 5;   // how far left/right it swings
    const speed = 1;

    slats.forEach(slat => {
        slat.position.x = slat.userData.baseX + Math.sin(t * speed) * amplitude;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
