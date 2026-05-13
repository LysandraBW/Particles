import * as THREE from "three";
import * as BOX from "./constants.js";

export const DEBUG = false;

export const nCols = DEBUG ? 1 : 160;
export const nRows = DEBUG ? 1 : 80;

export const diameter = DEBUG ? 50 : 1;
export const radius = diameter / 2;

export const geometry = new THREE.CircleGeometry(radius);
export const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

const spacingX = BOX.w / (nCols + 1);
const spacingY = BOX.h / (nRows + 1);

export const getXPos = (cIdx) => -BOX.w/2 + spacingX * cIdx;
export const getYPos = (rIdx) => +BOX.h/2 - spacingY * rIdx;

export function initializeGrid() {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, nRows * nCols);    

    let i = 0;
    for (let rIdx = 1; rIdx <= nRows; rIdx++) {
        for (let cIdx = 1; cIdx <= nCols; cIdx++) {
            const posX = getXPos(cIdx);
            const posY = getYPos(rIdx);

            // Initialize Position
            const mat = new THREE.Matrix4();
            mat.setPosition(posX, posY, -50);
            instancedMesh.setMatrixAt(i, mat);

            // Initialize Color (Black)
            // We zero-out the scale, causing the
            // the calculated color to be black.
            instancedMesh.setColorAt(i, new THREE.Color(0, 0, 0));
            
            i += 1;
        }
    }

    instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.instanceMatrix.needsUpdate = true;

    return instancedMesh;
}