import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import ColorThief from "colorthief";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

function getLuminance([r, g, b]) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getColorsFromImage(imageURL) {
    return new Promise((resolve, reject) => {
        const colorThief = new ColorThief();

        const image = new Image();
        image.crossOrigin = 'Anonymous';

        image.onload = () => {
            try {
                const primary = colorThief.getColor(image);
                const primaryLuminance = getLuminance(primary);

                const palette = colorThief.getPalette(image, 4) || [primary];

                let secondary = palette[0];
                let maxContrast = Infinity;
                let maxSaturation = -1;

                for (const color of palette) {
                    if (
                        (color[0] === primary[0]) && 
                        (color[1] === primary[1]) && 
                        (color[2] === primary[2])
                    )
                        continue;

                    const contrast = Math.abs(primaryLuminance - getLuminance(color));
                    if (contrast <= maxContrast) {
                        maxContrast = contrast;
                        secondary = color;
                    }
                }

                let tertiary = palette[0];
                const secondaryLuminance = getLuminance(secondary);
                maxContrast = -1;
                maxSaturation = -1;
                
                // Contrasting Color to Secondary
                for (const color of palette) {
                    if (
                        (color[0] === primary[0]) && 
                        (color[1] === primary[1]) && 
                        (color[2] === primary[2])
                    )
                        continue;

                    if (
                        (color[0] === secondary[0]) && 
                        (color[1] === secondary[1]) && 
                        (color[2] === secondary[2])
                    )
                        continue;

                    const contrast = Math.abs(secondaryLuminance - getLuminance(color));
                    if (contrast >= maxContrast) {
                        maxContrast = contrast;
                        tertiary = color;
                    }
                }

                let quaternary = palette[0];
                const tertiaryLuminance = getLuminance(tertiary);
                maxContrast = -1;
                maxSaturation = -1;
                
                // Contrasting Color to Secondary
                for (const color of palette) {
                    if (
                        (color[0] === primary[0]) && 
                        (color[1] === primary[1]) && 
                        (color[2] === primary[2])
                    )
                        continue;

                    if (
                        (color[0] === secondary[0]) && 
                        (color[1] === secondary[1]) && 
                        (color[2] === secondary[2])
                    )
                        continue;

                    if (
                        (color[0] === tertiary[0]) && 
                        (color[1] === tertiary[1]) && 
                        (color[2] === tertiary[2])
                    )
                        continue;

                    const contrast = Math.abs(tertiaryLuminance - getLuminance(color));
                    if (contrast >= maxContrast) {
                        maxContrast = contrast;
                        quaternary = color;
                    }
                }

                resolve({
                    primary,
                    secondary,
                    tertiary,
                    quaternary
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

function getDarkerColor({ r, g, b }, factor = 0.4) {
    const color = new THREE.Color().setRGB(r / 255, g / 255, b / 255);
    const hsl = {};
    color.getHSL(hsl);
    color.setHSL(hsl.h, hsl.s, hsl.l * factor);
    return color;
}

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(300, 300);
renderer.setPixelRatio(2);
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.OrthographicCamera(-100, 100, 100, -100);
camera.position.set(-150, 150, 450);
camera.lookAt(0, 0, 0);
camera.zoom = 0.9;
camera.updateProjectionMatrix();

// Scene
const scene = new THREE.Scene();

// Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 3);
directionalLight.position.set(300, 300, 300);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.update();

// Image URL
const url1 = "https://cdn.shopify.com/s/files/1/0787/2420/2801/files/O_b33794e6-b2b6-45c6-8b82-bd06a49b32b0.jpg?v=1776744189";
const colors = await getColorsFromImage(url1);

// Material: Texture
const texture = await (new THREE.TextureLoader()).loadAsync(url1);
texture.colorSpace = THREE.SRGBColorSpace;
const textureMaterial = new THREE.MeshStandardMaterial({ map: texture });

// Material: Primary Color
const primaryMaterial = new THREE.MeshStandardMaterial();
const darkerPrimary = getDarkerColor({r: colors.primary[0], g: colors.primary[1], b: colors.primary[2]});
primaryMaterial.color.setRGB(darkerPrimary.r, darkerPrimary.g, darkerPrimary.b);

// Material: Secondary Color
const secondaryMaterial = new THREE.MeshStandardMaterial();
secondaryMaterial.color.setRGB(colors.secondary[0] / 255, colors.secondary[1] / 255, colors.secondary[2] / 255);

// Material: Tertiary Color
const tertiaryMaterial = new THREE.MeshStandardMaterial();
tertiaryMaterial.color.setRGB(colors.tertiary[0] / 255, colors.tertiary[1] / 255, colors.tertiary[2] / 255);

// Material: Quaternary Color
const quaternaryMaterial = new THREE.MeshStandardMaterial();
quaternaryMaterial.color.setRGB(colors.quaternary[0] / 255, colors.quaternary[1] / 255, colors.quaternary[2] / 255);

// Fonts
const fontLoader = new FontLoader();

const fontSerifURL = "./Newsreader_60pt-SemiBold.json";
const fontSerif = await fontLoader.loadAsync(fontSerifURL);

const fontSansSerifURL = "./DMSans-SemiBold.json";
const fontSansSerif = await fontLoader.loadAsync(fontSansSerifURL);

// Parameters
const textureAspect = texture.source.data.width / texture.source.data.height;
const bookInteriorH = 195;
const bookInteriorW = bookInteriorH * textureAspect;
const bookInteriorD = 30;
const bookCoverD = 3;
const bookH = 200;
const bookW = bookH * textureAspect;
const bookD = bookInteriorD + bookCoverD * 2;
const bookBorderL = 3;


function BookCover(isFront) {
    // Background
    const meshBackground = new THREE.Mesh(
        new RoundedBoxGeometry(bookW, bookH, bookCoverD, 100, 100),
        primaryMaterial
    );

    // Foreground
    const meshForeground = new THREE.Mesh(
        new THREE.BoxGeometry(bookW - (bookBorderL * 2), bookH - (bookBorderL * 2), 1),
        isFront ? textureMaterial : secondaryMaterial
    );

    meshForeground.position.set(0, 0, isFront ? bookCoverD / 2 : -bookCoverD / 2);

    // Group and Return
    const group = new THREE.Group();
    group.add(meshBackground);
    group.add(meshForeground);
    return group;
}


function BookSpine() {
    const meshBackground = new THREE.Mesh(
        new RoundedBoxGeometry(bookCoverD, bookH, bookD, 2, 100),
        primaryMaterial
    );

    const meshForeground = new THREE.Mesh(
        new THREE.BoxGeometry(0, bookH - (bookBorderL * 2), bookD - (bookBorderL * 2)),
        secondaryMaterial
    );

    meshForeground.position.set(-2, 0, 0);

    // Title
    const meshTitle = new THREE.Mesh(
        new TextGeometry('The Call of Cthulhu', {
            font: fontSansSerif,
            size: 6,
            depth: 0,
            curveSegments: 12
        }),
        tertiaryMaterial
    );

    meshTitle.position.set(-3, -bookH/2 + bookBorderL + 7, bookD/2 - 14);
    meshTitle.rotateY(THREE.MathUtils.degToRad(-90));
    meshTitle.rotateZ(THREE.MathUtils.degToRad(90));

    // Author
    const meshAuthor = new THREE.Mesh(
        new TextGeometry('By H.P. Lovecraft', {
            font: fontSansSerif,
            size: 4,
            depth: 0,
            curveSegments: 12
        }),
        tertiaryMaterial
    );

    meshAuthor.position.set(-3, -bookH/2 + bookBorderL + 7, bookD/2 - 7);
    meshAuthor.rotateY(THREE.MathUtils.degToRad(-90));
    meshAuthor.rotateZ(THREE.MathUtils.degToRad(90));

    // Stroke
    const meshStroke = new THREE.Mesh(
        new THREE.BoxGeometry(0, bookH - (bookBorderL * 2) - 12, 2),
        tertiaryMaterial
    );

    meshStroke.position.set(-3, 0, -bookD/2 + 8)

    const group = new THREE.Group();
    group.add(meshBackground, meshForeground, meshTitle, meshAuthor, meshStroke);
    return group;
}


function BookInterior() {
    const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(bookInteriorW, bookInteriorH, bookInteriorD, 2, 0.005), 
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
    );

    const meshBookmark = new THREE.Mesh(
        new RoundedBoxGeometry(bookInteriorW - 5, bookInteriorH + 5, 3, 8, 8), 
        tertiaryMaterial
    );

    const group = new THREE.Group();
    group.add(mesh, meshBookmark);

    return group;
}

const bookCoverBack = BookCover(false);
bookCoverBack.position.set(0, 0, 0);
scene.add(bookCoverBack);

const bookInterior = BookInterior();
bookInterior.position.set(-(bookW - bookInteriorW) / 2, 0, bookCoverBack.position.z + bookCoverD / 2 + bookInteriorD / 2);
scene.add(bookInterior);

const bookCoverFront = BookCover(true);
bookCoverFront.position.set(0, 0, bookInteriorD + (bookCoverD / 2) * 2);
scene.add(bookCoverFront);

const bookSpine = BookSpine();
bookSpine.position.set(-bookW / 2 + 0.000, 0, (bookCoverFront.position.z + bookCoverBack.position.z) / 2);
scene.add(bookSpine);

// let i = 0;
// for (const color of [colors.primary, colors.secondary, colors.tertiary, colors.quaternary]) {
//     const geometry = new THREE.BoxGeometry(20, 20, 1);
//     const material = new THREE.MeshStandardMaterial();
//     material.color.setRGB(color[0] / 255, color[1] / 255, color[2] / 255);

//     const mesh = new THREE.Mesh(geometry, material);
//     mesh.position.set(100, i * -30, 0);
//     scene.add(mesh);

//     i += 1;
// }

// Render
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();