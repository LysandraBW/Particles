import * as THREE from "three";
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import ColorThief from "colorthief";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

console.log(`Device Pixel Ratio: ${window.devicePixelRatio}`);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(200, 200);
renderer.setPixelRatio(2);
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0, 240);
camera.lookAt(0, 0, 0);

// Scene
const scene = new THREE.Scene();

// Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 10);
// directionalLight.position.set(-300, 300, 100);
// scene.add(directionalLight);

// Axes
const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();

// Box
const url1 = "https://m.media-amazon.com/images/M/MV5BZDNhMGYwM2UtMTdlZS00MGQ1LWI2YzAtODY5YWI1MjYyNzRmXkEyXkFqcGc@._V1_.jpg";
const url2 = "https://m.media-amazon.com/images/I/81Hzc23-ZcL._AC_UF1000,1000_QL80_.jpg";
const textureLoader = new THREE.TextureLoader();
const texture = await textureLoader.loadAsync(url1);
texture.colorSpace = THREE.SRGBColorSpace;

const textureAspect = texture.source.data.width / texture.source.data.height;
console.log(`Texture Aspect: ${textureAspect}`);

const textureMaterial = new THREE.MeshStandardMaterial({ map: texture });

const coverGeometry = new THREE.BoxGeometry(textureAspect * 190, 190, 1);
const coverMesh = new THREE.Mesh(coverGeometry, textureMaterial);
coverMesh.position.set(0, 0, 5)
// scene.add(coverMesh);

const colorThief = new ColorThief();

const getLuminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function getColorsFromImage(imageURL) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'Anonymous';

        image.onload = () => {
            try {
                const primary = colorThief.getColor(image);
                const primaryLuminance = getLuminance(primary);

                const palette = colorThief.getPalette(image, 16) || [primary];

                let secondary = palette[0];
                let maxContrast = -1;
                let maxSaturation = -1;

                for (const color of palette) {
                    if (
                        (color[0] === primary[0]) && 
                        (color[1] === primary[1]) && 
                        (color[2] === primary[2])
                    )
                        continue;

                    const contrast = Math.abs(primaryLuminance - getLuminance(color));
                    if (contrast > maxContrast) {
                        maxContrast = contrast;
                        secondary = color;
                    }
                }

                resolve({
                    primary,
                    secondary
                });
            }
            catch (err) {
                reject(err);
            }
        }

        image.onerror = () => reject(new Error(`Failed to Load Image: ${imageURL}`));
        image.src = imageURL;
    });
}

const colors = await getColorsFromImage(url1);
console.log(colors);

// Box
// const geometry = new RoundedBoxGeometry(textureAspect * 200, 200, 10, 2, 100);
// const material = new THREE.MeshStandardMaterial({color: 0xFF0000});
// material.color.setRGB(colors.primary[0] / 255, colors.primary[1] / 255, colors.primary[2] / 255);

// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

// Spine
// const spineGeometry = new RoundedBoxGeometry(100, 200);
// const spineMaterial = new THREE.MeshStandardMaterial({color: 0xFF0000});
// spineMaterial.color.setRGB(colors.secondary[0] / 255, colors.secondary[1] / 255, colors.secondary[2] / 255);

// const spineMesh = new THREE.Mesh(spineGeometry, spineMaterial);
// scene.add(spineMesh);

const fontLoader = new FontLoader();
const fontURL = "./Newsreader_60pt-SemiBold.json";
const font = await fontLoader.loadAsync(fontURL);
const fontReg = await fontLoader.loadAsync('./InstrumentSans-SemiBold.json');

const geometry = new TextGeometry('The Call of Chthulu', {
	font: font,
	size: 12,
	depth: 0,
	curveSegments: 12
});

const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

const mesh = new THREE.Mesh(geometry, material);
mesh.rotateZ(THREE.MathUtils.degToRad(90));
scene.add(mesh)

const geometry1 = new TextGeometry('Book Author', {
	font: fontReg,
	size: 8,
	depth: 0,
	curveSegments: 12
});

const material1 = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

const mesh1 = new THREE.Mesh(geometry1, material1);
mesh1.position.set( mesh.position.x + 20, 0, 0)
mesh1.rotateZ(THREE.MathUtils.degToRad(90));
scene.add(mesh1)

// Render
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
