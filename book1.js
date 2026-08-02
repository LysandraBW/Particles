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
// camera.position.set(0, 0.35, 0);
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
const pageW = 0.199;
const pageH = 0.297;
const pageD = 0.03;

const bookCoverD = 0.001;
const bookD = pageD + bookCoverD * 2;
const bookW = 0.20;
const bookH = 0.30;

const bookCoverRadius = 5;
const bookSpineRadius = 0.005;


// Cover
const coverURL = 'https://m.media-amazon.com/images/I/71bamGNpoQL._AC_UF1000,1000_QL80_.jpg';

// Cover Material
const textureLoader = new THREE.TextureLoader();

const coverTexture = textureLoader.load(coverURL);
coverTexture.colorSpace = THREE.SRGBColorSpace;
coverTexture.generateMipmaps = true;
coverTexture.minFilter = THREE.LinearMipmapLinearFilter;
coverTexture.magFilter = THREE.LinearFilter;
coverTexture.needsUpdate = true;
const coverMaterial = new THREE.MeshStandardMaterial({ map: coverTexture });

// Book Material
const colorThief = new ColorThief();
const bookMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
const bookBorderMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

function getColorPairFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                const primary = colorThief.getColor(img);
                const [pR, pG, pB] = primary;
                
                const palette = colorThief.getPalette(img, 8) || [primary];

                // Luminance Helper: 0.2126*R + 0.7152*G + 0.0722*B
                const getLuminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const domLuminance = getLuminance(primary);

                let secondary = palette[0];
                let maxContrast = -1;
                
                for (const color of palette) {
                    const [r, g, b] = color;

                    // Skip colors that are identical to the dominant color
                    if (r === pR && g === pG && b === pB) continue;

                    const contrast = Math.abs(getLuminance(color) - domLuminance);

                    if (contrast > maxContrast) {
                        maxContrast = contrast;
                        secondary = color;
                    }
                }

                resolve({
                    primary: { r: pR, g: pG, b: pB },
                    secondary: { r: secondary[0], g: secondary[1], b: secondary[2] }
                });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => reject(new Error(`Failed to Load Image: ${imageUrl}`));
        img.src = imageUrl;
    });
}


function getDarkerColor({ r, g, b }, factor = 0.6) {
    console.log(r, g, b)
    // Convert 0-255 RGB to THREE.Color (0.0 - 1.0 range)
    const color = new THREE.Color().setRGB(r / 255, g / 255, b / 255);
    
    const hsl = {};
    color.getHSL(hsl);

    // Multiply existing lightness by the factor instead of capping it
    // e.g., 0.7 keeps 70% of the original brightness (30% darker)
    color.setHSL(hsl.h, hsl.s, hsl.l * factor);

    return color;
}


try {
    const { primary, secondary } = await getColorPairFromUrl(coverURL);
    bookMaterial.color.setRGB(primary.r / 255, primary.g / 255, primary.b / 255);
    bookBorderMaterial.color.copy(getDarkerColor(primary));
} 
catch (err) {
    console.warn('Error: ', err);
}

// Constructing Book
function BookCover(material) {
    const geometry = new RoundedBoxGeometry(bookW, bookH, 0.01, 5, 0.005);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}


function BookBorder(points) {
    const path = new THREE.CurvePath();

    const p1 = new THREE.Vector3(points[0][0], points[0][1], points[0][2]);
    const p2 = new THREE.Vector3(points[1][0], points[1][1], points[1][2]);
    const p3 = new THREE.Vector3(points[2][0], points[2][1], points[2][2]);
    const p4 = new THREE.Vector3(points[3][0], points[3][1], points[3][2]);

    path.add(new THREE.LineCurve3(p1, p2));
    path.add(new THREE.LineCurve3(p2, p3));
    path.add(new THREE.LineCurve3(p3, p4));
    path.add(new THREE.LineCurve3(p4, p1));

    const geometry = new THREE.TubeGeometry(path, 1000, 0.0033, 428, true);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });

    const mesh = new THREE.Mesh(geometry, bookBorderMaterial);
    mesh.castShadow = true;

    return mesh;
}


function BookSpine() {
    const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const geometry = new THREE.BoxGeometry(bookCoverD, bookH, bookD);
    
    const mesh = new THREE.Mesh(geometry, bookMaterial);
    mesh.castShadow = true;
    
    return mesh;
}



function BookPages() {
    const geometry = new RoundedBoxGeometry(pageW, pageH, pageD, 2, 0.005);
    const material = new THREE.MeshStandardMaterial( { color: 0xF0EDE6 } );
    
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

    const bookBorder1 = BookBorder([
        [-bookW/2, -bookH/2, 0],
        [+bookW/2, -bookH/2, 0],
        [+bookW/2, +bookH/2, 0],
        [-bookW/2, +bookH/2, 0]
    ]);
    scene.add(bookBorder1);

    const bookBorder2 = BookBorder([
        [-bookW/2, -bookH/2, bookD - bookCoverD],
        [+bookW/2, -bookH/2, bookD - bookCoverD],
        [+bookW/2, +bookH/2, bookD - bookCoverD],
        [-bookW/2, +bookH/2, bookD - bookCoverD]
    ]);
    scene.add(bookBorder2);

    const bookBorder3 = BookBorder([
        [+bookW/2, +bookH/2, 0],
        [+bookW/2, +bookH/2, bookD - bookCoverD],
        [+bookW/2, -bookH/2, bookD - bookCoverD],
        [+bookW/2, -bookH/2, 0],
    ]);
    scene.add(bookBorder3);

    const bookCover2 = BookCover(bookMaterial);
    bookCover2.position.set(0, 0, pageD + (bookCoverD / 2) * 2);
    scene.add(bookCover2);

    const bookSpine = BookSpine();
    bookSpine.position.set(bookW / 2 + 0.002, 0, (bookCover1.position.z + bookCover2.position.z) / 2);
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

