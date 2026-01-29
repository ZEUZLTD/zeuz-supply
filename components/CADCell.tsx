"use client";

import { useGLTF, Float, ContactShadows } from "@react-three/drei";
import { useRef, useLayoutEffect, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const CADCell = () => {
    const outerRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);

    // Load the GLB file
    const { scene } = useGLTF("/models/cell.glb");
    // Clone scene to prevent global mutation conflicts
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    const targetMeshRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

    useLayoutEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;

                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // VERIFIED TARGET: Wrapper is 'mesh_0'
                if (mesh.name === 'mesh_0') {
                    // Tuned "Shrink-Wrap" Material
                    const mat = new THREE.MeshPhysicalMaterial({
                        color: new THREE.Color('#5928ED'), // Brand Purple
                        roughness: 0.1,
                        metalness: 0.4,
                        envMapIntensity: 1.5,
                        reflectivity: 0.5,
                        sheen: 0.05,
                        sheenColor: new THREE.Color('#ffffff'),
                        sheenRoughness: 0.5,
                    });
                    mesh.material = mat;
                    targetMeshRef.current = mat;
                }
            }
        });
    }, [clonedScene]);

    // Generate Wavy/Shrink-Wrap Noise Texture
    const [wavyTexture, setWavyTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const generateTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const imageData = ctx.createImageData(512, 512);
                const data = imageData.data;
                const freq = 6.0; // Tuned Frequency

                for (let y = 0; y < 512; y++) {
                    for (let x = 0; x < 512; x++) {
                        const nx = x / 512;
                        const ny = y / 512;
                        const i = (y * 512 + x) * 4;

                        let v = 0;
                        v += Math.sin(nx * freq * 8 + ny * 2);
                        v += Math.sin(ny * freq * 10 - nx * 3);
                        v += Math.sin((nx + ny) * freq * 5);
                        v += Math.sin(Math.sqrt(nx * nx + ny * ny) * freq * 6);

                        const val = (v + 4) / 8;
                        const color = val * 255;

                        data[i] = color;
                        data[i + 1] = color;
                        data[i + 2] = color;
                        data[i + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 4); // Stretch waves along the cylinder
            setWavyTexture(tex);
        };

        const timer = setTimeout(generateTexture, 100);
        return () => clearTimeout(timer);
    }, []);

    useFrame((state, delta) => {
        if (outerRef.current && innerRef.current) {
            const scrollY = window.scrollY;

            // 1. SCROLL = TUMBLE (Outer Group Rotation X)
            const targetRotationX = scrollY * 0.002;

            // 2. MOUSE X = AXIAL SPIN (Inner Group Rotation Y)
            const mouseSpin = state.mouse.x * (Math.PI * 2);

            // Apply Rotations
            outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, targetRotationX, delta * 0.8);
            innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, mouseSpin, delta * 4);

            // Apply Texture/Bump
            if (targetMeshRef.current && wavyTexture && targetMeshRef.current.bumpMap !== wavyTexture) {
                targetMeshRef.current.bumpMap = wavyTexture;
                targetMeshRef.current.bumpScale = 0.1; // Tuned Bump Scale
                targetMeshRef.current.needsUpdate = true;
            }
        }
    });

    return (
        <>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group ref={outerRef} scale={100}>
                    {/* Centering Offset handled here to keep pivot point correct */}
                    <group position={[0, -0.035, 0]}>
                        {/* Inner Group for Axial Spin */}
                        <group ref={innerRef}>
                            <primitive object={clonedScene} />
                        </group>
                    </group>
                </group>
            </Float>
            <ContactShadows opacity={0.6} scale={10} blur={2} far={4} resolution={256} color="#000000" />
        </>
    );
}

useGLTF.preload("/models/cell.glb");
