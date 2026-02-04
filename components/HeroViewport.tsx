"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, useGLTF } from "@react-three/drei";
import { useRef, useEffect, useState, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { useUIStore } from "@/lib/store";

const GLBCell = () => {
    // Force fresh load with version query
    const { scene } = useGLTF("/models/cell.glb?v=materials_v2");
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Refs
    const outerRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);
    const wrapMeshRef = useRef<THREE.MeshStandardMaterial | null>(null);

    const activeSection = useUIStore((state) => state.activeSection);
    const themeColor = useUIStore((state) => state.themeColor);
    const targetColor = useRef(new THREE.Color(themeColor === 'RAINBOW' ? '#FF0000' : themeColor));

    // Update Target Color
    useEffect(() => {
        let color = themeColor;
        if (activeSection === 'POWER') color = "#FF3300";
        else if (activeSection === 'ENERGY') color = "#00FF99";
        else if (activeSection === 'PROTOTYPE') color = "#333333";
        else if (themeColor === 'RAINBOW') color = "#FF0000";
        targetColor.current.set(color);
    }, [activeSection, themeColor]);

    // Generate Grain Texture for Wrap
    const [grainTexture, setGrainTexture] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        const generateTexture = () => {
            if (typeof document === 'undefined') return;
            // OPTIMIZATION: Reduced from 512x512 to 128x128 (16x faster generation)
            // This prevents main thread locking on mobile devices (TBT regression fix)
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimization hint
            if (!ctx) return;
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 50;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
            }
            ctx.putImageData(imageData, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 4);
            setGrainTexture(tex);
        };
        // Defer slightly longer to allow initial frame to settle
        requestAnimationFrame(() => setTimeout(generateTexture, 200));
    }, []);

    // Apply Materials
    useLayoutEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                if (mesh.material) {
                    if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
                    else (mesh.material as THREE.Material).dispose();
                }

                // 1. WRAP (Dynamic, Semi-Satin Plastic/Metal)
                if (mesh.name === 'Wrap-1') {
                    const mat = new THREE.MeshStandardMaterial({
                        color: targetColor.current.clone(),
                        roughness: 0.2,
                        metalness: 0.6,
                        envMapIntensity: 1.5,
                        bumpScale: 0.002
                    });
                    mesh.material = mat;
                    wrapMeshRef.current = mat;
                }
                // 2. TERMINALS (Matte Grey Metal)
                else if (mesh.name === 'Terminals-1') {
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: "#808080",
                        roughness: 0.6,
                        metalness: 1.0,
                        envMapIntensity: 1.0,
                    });
                }
                // 3. TAB (Polished Chrome)
                else if (mesh.name === 'The_Tab-1') {
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: "#FFFFFF",
                        roughness: 0.05,
                        metalness: 1.0,
                        envMapIntensity: 2.0,
                    });
                }
                // 4. ISOLATOR (White Satin/Paper Plastic)
                else if (mesh.name === 'Isolator-1') {
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: "#FFFFFF",
                        roughness: 0.6,
                        metalness: 0.0,
                        envMapIntensity: 0.8,
                    });
                }
                else {
                    mesh.material = new THREE.MeshStandardMaterial({ color: "gray" });
                }
            }
        });
    }, [clonedScene]);

    // Animation Loop
    useFrame((state, delta) => {
        if (outerRef.current && innerRef.current) {
            const scrollY = window.scrollY;
            const targetRotationX = scrollY * 0.002;
            const mouseSpin = state.mouse.x * (Math.PI * 2);
            const dt = Math.min(delta, 0.1);

            outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, targetRotationX, dt * 0.8);
            innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, mouseSpin, dt * 4);
        }

        if (wrapMeshRef.current) {
            // Apply Rainbow Logic
            const isRainbow = activeSection !== 'POWER' && activeSection !== 'ENERGY' && activeSection !== 'PROTOTYPE' && themeColor === 'RAINBOW';
            if (isRainbow) {
                const hue = (Date.now() / 333) % 360;
                targetColor.current.setHSL(hue / 360, 1, 0.5);
            }

            // Apply Grain to Wrap
            if (grainTexture && wrapMeshRef.current.roughnessMap !== grainTexture) {
                wrapMeshRef.current.roughnessMap = grainTexture;
                wrapMeshRef.current.bumpMap = grainTexture;
                wrapMeshRef.current.needsUpdate = true;
            }

            // Lerp Color
            wrapMeshRef.current.color.lerp(targetColor.current, delta * 1.5);
        }
    });

    // Fade In logic
    const [opacity, setOpacity] = useState(0);
    useFrame((state, delta) => {
        if (opacity < 1) setOpacity(prev => Math.min(1, prev + delta * 2));
    });

    const { size } = useThree();
    const isMobile = size.width < 768;
    const finalScale = isMobile ? 70 : 113;

    return (
        <>
            <CameraAdjuster />
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group ref={outerRef} scale={finalScale}>
                    <group position={[0, -0.035, 0]}>
                        <group ref={innerRef}>
                            <primitive object={clonedScene} />
                        </group>
                    </group>
                </group>
            </Float>
            <FakeShadow />
        </>
    )
}

const CameraAdjuster = () => {
    const { camera, size } = useThree();
    useLayoutEffect(() => {
        const isMobile = size.width < 768;
        if (isMobile && camera instanceof THREE.PerspectiveCamera) {
            const BASE_ASPECT = 9 / 16;
            const BASE_FOV = 35;
            const tanBase = Math.tan((BASE_FOV * Math.PI) / 360);
            const targetTanH = tanBase * BASE_ASPECT;
            const currentAspect = size.width / size.height;
            const newTanV = targetTanH / currentAspect;
            const newFOV = (Math.atan(newTanV) * 360) / Math.PI;
            camera.fov = newFOV;
            camera.updateProjectionMatrix();
        } else if (camera instanceof THREE.PerspectiveCamera && camera.fov !== 35) {
            camera.fov = 35;
            camera.updateProjectionMatrix();
        }
    }, [camera, size]);
    return null;
}

const FakeShadow = () => {
    const texture = useMemo(() => {
        if (typeof document === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(canvas);
    }, []);
    if (!texture) return null;
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial map={texture} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
    );
};

useGLTF.preload("/models/cell.glb?v=materials_v2");

export const HeroViewport = ({ onReady }: { onReady?: () => void }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] -z-10 bg-[var(--color-background)]">
            <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 7], fov: 35 }}
                gl={{ antialias: true }}
                eventSource={typeof document !== 'undefined' ? document.body : undefined}
                eventPrefix="page"
                onCreated={() => { if (onReady) onReady(); }}
            >
                <ambientLight intensity={1} />
                <pointLight position={[10, 10, 10]} intensity={15} castShadow />
                <pointLight position={[0, 0, -5]} intensity={20} color="#333" />
                <GLBCell />
                <Environment preset="studio" />
            </Canvas>
        </div>
    )
}
