import * as THREE from "three";
import * as BOX from "./constants.js";
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ColorThief from 'colorthief';


// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(BOX.w, BOX.h);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);


// Camera
const frustumSize = 0.5; // 0.5 meter view window
const aspect = BOX.w / BOX.h;

const camera = new THREE.OrthographicCamera(
  (-frustumSize * aspect) / 2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  -frustumSize / 2,
  0.01,  // near plane adjusted for small scale
  10     // far plane
);

// Position camera ~0.35m away instead of 300 units
camera.position.set(0.1, 0.1, -0.35);
camera.lookAt(0, 0, 0);


// Scene
const scene = new THREE.Scene();


// Ambient Light
const aLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(aLight);


// Directional Light
const dLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dLight.position.set(0.15, 0.25, 0.15); // Move light closer
dLight.castShadow = true;

// Shadow map bounds tuned to meters so shadows stay crisp
dLight.shadow.camera.near = 0.01;
dLight.shadow.camera.far = 1;
dLight.shadow.camera.left = -0.3;
dLight.shadow.camera.right = 0.3;
dLight.shadow.camera.top = 0.3;
dLight.shadow.camera.bottom = -0.3;
scene.add(dLight);

// Axes
const axesHelper = new THREE.AxesHelper(1000);
scene.add(axesHelper);


// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();


// Book Dimensions
const pageW = 0.19;
const pageH = 0.29;
const pageD = 0.03;

const bookCoverD = 0.01;
const bookD = pageD + bookCoverD * 2 + 0.005;
const bookW = 0.20;
const bookH = 0.30;

const bookCoverRadius = 0.005;
const bookSpineRadius = 0.005;


// Cover
const coverURL = 'https://logospressonline.com/cdn/shop/files/canon-classics-books-pride-and-prejudice-28066983542832.jpg?v=1711150623';

// Cover Material
const textureLoader = new THREE.TextureLoader();

const coverTexture = textureLoader.load(coverURL);
coverTexture.colorSpace = THREE.SRGBColorSpace;
// coverTexture.wrapS = THREE.ClampToEdgeWrapping;
// coverTexture.wrapT = THREE.ClampToEdgeWrapping;
// coverTexture.repeat.set(-1 / bookW, 1 / bookH);
// coverTexture.offset.set(0.5, 0.5);

// coverTexture.generateMipmaps = true;
// coverTexture.minFilter = THREE.LinearMipmapLinearFilter;
// coverTexture.magFilter = THREE.LinearFilter;

// coverTexture.needsUpdate = true;
const coverMaterial = new THREE.MeshStandardMaterial({ map: coverTexture });

// Book Material
const colorThief = new ColorThief();
const bookMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

function getDominantColorFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Required for cross-origin images

        img.onload = () => {
            try {
                const [r, g, b] = colorThief.getColor(img);
                resolve({ r, g, b });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => reject(new Error(`Failed to Load Image: ${imageUrl}`));
        img.src = imageUrl;
  });
}

try {
    const { r, g, b } = await getDominantColorFromUrl(coverURL);
    bookMaterial.color.setRGB(r / 255, g / 255, b / 255);
} 
catch (err) {
    console.warn('Error: ', err);
}

// Constructing Book
function BookCover(material) {
    // const L = -bookW / 2;
    // const R = +bookW / 2;

    // const T = +bookH / 2;
    // const B = -bookH / 2;

    // const shape = new THREE.Shape();
    // shape.moveTo(R, B);
    // shape.lineTo(L + bookCoverRadius, B);
    // shape.quadraticCurveTo(L, B, L, B + bookCoverRadius);
    // shape.lineTo(L, T - bookCoverRadius);
    // shape.quadraticCurveTo(L, T, L + bookCoverRadius, T);
    // shape.lineTo(R, T);
    // shape.lineTo(R, B);

    // const geometry = new THREE.ExtrudeGeometry(shape, {
    //     depth: bookCoverD, 
    //     bevelEnabled: false 
    // });

    // geometry.translate(0, 0, -bookCoverD / 2);

    const geometry = new RoundedBoxGeometry(bookW, bookH, bookCoverD, 2, 0.005);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}

function BookSpine() {
    // const L = -bookD / 2;
    // const R = +bookD / 2;

    // const T = +bookH / 2;
    // const B = -bookH / 2;

    // const shape = new THREE.Shape();
    // shape.moveTo(L, B + bookSpineRadius);
    // shape.quadraticCurveTo(L, B, L + bookSpineRadius, B);
    // shape.lineTo(R - bookSpineRadius, B);
    // shape.quadraticCurveTo(R, B, R, B + bookSpineRadius);
    // shape.lineTo(R, T - bookSpineRadius);
    // shape.quadraticCurveTo(R, T, R - bookSpineRadius, T);
    // shape.lineTo(L + bookSpineRadius, T);
    // shape.quadraticCurveTo(L, T, L, T - bookSpineRadius);
    // shape.lineTo(L, B + bookSpineRadius);

    const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const geometry = new RoundedBoxGeometry(bookCoverD, bookH, bookD);
    
    // geometry.translate(0, 0, -bookD / 2);

    const mesh = new THREE.Mesh(geometry, bookMaterial);
    mesh.castShadow = true;
    // mesh.rotation.y = THREE.MathUtils.degToRad(90); 
    return mesh;
}


function BookPages() {
    const geometry = new RoundedBoxGeometry(pageW, pageH, pageD, 2, 0.005);
    const material = new THREE.MeshStandardMaterial( { color: 0xFFFFFF } );
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}


function drawBook() {
    const bookCover1 = BookCover(coverMaterial);
    bookCover1.position.set(0, 0, 0);
    scene.add(bookCover1);

    const bookPages = BookPages();
    bookPages.position.set((bookW - pageW) / 2, 0, bookCover1.position.z + bookCoverD / 2 + pageD / 2);
    scene.add(bookPages);

    const bookCover2 = BookCover(bookMaterial);
    bookCover2.position.set(0, 0, pageD + (bookCoverD / 2) * 2);
    scene.add(bookCover2);

    const bookSpine = BookSpine();
    bookSpine.position.set(bookW / 2, 0, (bookCover1.position.z + bookCover2.position.z) / 2);
    scene.add(bookSpine);
}

drawBook();

// Render
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

