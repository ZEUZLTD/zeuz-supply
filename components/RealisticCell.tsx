"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export const RealisticCell = () => {
    const groupRef = useRef<THREE.Group>(null);

    // Check if texture loads, otherwise fallback color
    // note: texture map needs to be rotated or UVs adjusted usually
    const texture = useTexture("/textures/battery_wrap.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.rotation = Math.PI / 2; // Rotate if needed for cylinder mapping

    // Scroll Logic
    useFrame((state, delta) => {
        if (groupRef.current) {
            const scrollY = window.scrollY;
            // Rotate based on scroll
            groupRef.current.rotation.x = scrollY * 0.002;

            // Base Tilt
            groupRef.current.rotation.z = -0.1;
            groupRef.current.rotation.y += delta * 0.1;
        }
    });

    // 21700 Dimensions: 21mm diameter, 70mm height. Ratio approx 1 : 3.33
    // Our scale assumes diameter ~ 1 unit? 
    // Current Cylinder args: [1.05, 1.05, 6.9, 64] -> Diameter ~2.1, Height 6.9. Ratio ~3.28. Close.

    // GEOMETRY
    const radius = 1.05;
    const height = 6.9;
    const capHeight = 0.15;
    const buttonHeight = 0.15;
    const buttonRadius = 0.4;

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <group ref={groupRef} scale={1.13}> {/* Matching Desktop Scale */}

                {/* 1. BODY (The Wrap) */}
                <mesh rotation={[0, 0, 0]}>
                    {/* Slightly shorter to reveal caps? Or full length? Usually wraps fold over edges. */}
                    {/* We'll make it main height minus caps */}
                    <cylinderGeometry args={[radius, radius, height - (capHeight * 2), 64]} />
                    <meshStandardMaterial
                        map={texture}
                        color="#ffffff" // Tint if needed, white preserves texture
                        metalness={0.1}
                        roughness={0.4}
                    />
                </mesh>

                {/* 2. TOP CAP (Positive) - Metal Ring */}
                <mesh position={[0, height / 2 - capHeight / 2, 0]}>
                    <cylinderGeometry args={[radius * 0.95, radius, capHeight, 64]} />
                    <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* 3. POSITIVE BUTTON */}
                <mesh position={[0, height / 2 + buttonHeight / 2, 0]}>
                    <cylinderGeometry args={[buttonRadius, buttonRadius, buttonHeight, 32]} />
                    <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* 4. BOTTOM CAP (Negative) - Flat Metal Disc */}
                <mesh position={[0, -height / 2 + capHeight / 2, 0]}>
                    <cylinderGeometry args={[radius, radius * 0.95, capHeight, 64]} />
                    <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* 5. INSULATOR RING (White washer around button) */}
                <mesh position={[0, height / 2 + 0.01, 0]}>
                    <torusGeometry args={[buttonRadius + 0.1, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>

            </group>
        </Float>
    );
}
