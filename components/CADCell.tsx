"use client";

import { useGLTF, Float, ContactShadows } from "@react-three/drei";
import { useRef, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const CADCell = () => {
    const outerRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);

    // Load the GLB file
    const { scene } = useGLTF("/models/cell.glb");
    // Clone scene to prevent global mutation conflicts
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useLayoutEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;

                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // VERIFIED TARGET: Wrapper is 'mesh_0_2'
                if (mesh.name === 'mesh_0_2') {
                    // Clean Satin Material - No Decal, No Texture
                    const mat = new THREE.MeshStandardMaterial({
                        color: new THREE.Color('#5928ED'), // Brand Purple
                        roughness: 0.3,
                        metalness: 0.2, // Satin finish
                        envMapIntensity: 1.0,
                    });
                    mesh.material = mat;
                }
                // ELSE: Leave original material
            }
        });
    }, [clonedScene]);

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
