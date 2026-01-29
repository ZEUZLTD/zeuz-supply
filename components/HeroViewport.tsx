"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, useGLTF } from "@react-three/drei";
import { useRef, useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useUIStore } from "@/lib/store";

const GLBCell = () => {
    const outerRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);

    const activeSection = useUIStore((state) => state.activeSection);
    const themeColor = useUIStore((state) => state.themeColor);

    const targetColor = useRef(new THREE.Color(themeColor));

    // Load the GLB file & Clone
    const { scene } = useGLTF("/models/cell.glb");
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Update Target Color based on Store
    useEffect(() => {
        if (activeSection === 'POWER') {
            targetColor.current.set("#FF3300"); // Red
        } else if (activeSection === 'ENERGY') {
            targetColor.current.set("#00FF99"); // Green
        } else if (activeSection === 'PROTOTYPE') {
            targetColor.current.set("#333333"); // Lighter Grey per request
        } else {
            // Handle valid colors only
            targetColor.current.set(themeColor === 'RAINBOW' ? '#FF0000' : themeColor);
        }
    }, [activeSection, themeColor]);

    const targetMeshRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

    // Initial Material Setup & Cache Reference
    useLayoutEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // TARGET: Wrapper is 'mesh_0'
                if (mesh.name === 'mesh_0') {
                    // Tuned "Shrink-Wrap" Material
                    const baseMat = new THREE.MeshPhysicalMaterial({
                        color: targetColor.current.clone(),
                        roughness: 0.1,
                        metalness: 0.4,
                        envMapIntensity: 1.5,
                        reflectivity: 0.5,
                        sheen: 0.05,
                        sheenColor: new THREE.Color('#ffffff'),
                        sheenRoughness: 0.5,
                    });
                    mesh.material = baseMat;
                    // Cache the material reference for the animation loop
                    targetMeshRef.current = baseMat;
                }
                // ELSE: Leave original materials
            }
        });
    }, [clonedScene]);

    // Generate Wavy/Shrink-Wrap Noise Texture (Async to avoid blocking main thread)
    const [wavyTexture, setWavyTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        // Defer generation to next tick/idle
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

    // Animation Loop
    useFrame((state, delta) => {
        if (outerRef.current && innerRef.current) {
            const scrollY = window.scrollY;

            // 1. SCROLL = TUMBLE (Outer Group Rotation X)
            const targetRotationX = scrollY * 0.002;

            // 2. MOUSE X = AXIAL SPIN (Inner Group Rotation Y)
            const mouseSpin = state.mouse.x * (Math.PI * 2);

            // Apply Rotations
            // Apply Rotations
            // Fix 3: Violent Spin. Clamp delta to prevent huge jumps on tab return.
            const dt = Math.min(delta, 0.1);

            outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, targetRotationX, dt * 0.8);
            innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, mouseSpin, dt * 4);

            // COLOR / TEXTURE LOGIC
            const isRainbow = activeSection !== 'POWER' && activeSection !== 'ENERGY' && activeSection !== 'PROTOTYPE' && themeColor === 'RAINBOW';

            // COLOR LERPING (Dynamic Branding)
            if (isRainbow) {
                const hue = (Date.now() / 333) % 360; // Perfectly synced with ThemeManager at 3x speed
                targetColor.current.setHSL(hue / 360, 1, 0.5);
            }

            if (targetMeshRef.current) {
                // Ensure metallic look
                if (targetMeshRef.current.metalness !== 0.4) {
                    targetMeshRef.current.metalness = 0.4;
                    targetMeshRef.current.roughness = 0.1;
                }

                // Ensure texture is applied as soon as it exists
                if (wavyTexture && targetMeshRef.current.bumpMap !== wavyTexture) {
                    targetMeshRef.current.bumpMap = wavyTexture;
                    targetMeshRef.current.bumpScale = 0.1; // Tuned Bump Scale
                    targetMeshRef.current.needsUpdate = true;
                }

                // Always restore solid color lerping (stripes removed)
                if (targetMeshRef.current.map !== null) {
                    targetMeshRef.current.map = null;
                    targetMeshRef.current.needsUpdate = true;
                }
                targetMeshRef.current.color.lerp(targetColor.current, delta * 1.5);
            }
        }
    });

    // Fix 6: Fade In
    const [opacity, setOpacity] = useState(0);
    useFrame((state, delta) => {
        // Fade In
        if (opacity < 1) {
            setOpacity(prev => Math.min(1, prev + delta * 2));
        }

        if (targetMeshRef.current) {
            targetMeshRef.current.transparent = true;
            targetMeshRef.current.opacity = opacity;
        }
    });

    // Fix 2: Resize Jump. Use window width pixel driven logic for stable mobile sizing.
    const { size } = useThree();
    const isMobile = size.width < 768; // Standard mobile breakpoint

    // Scale Logic - Lock to width to prevent address bar jump
    // On mobile, width is constant (screen width), while height changes with address bar.
    // If we rely on viewport (R3F units), it changes with aspect ratio.
    const baseScale = isMobile ? (size.width * 0.25) : 100; // Heuristic based on pixels
    const finalScale = isMobile ? 70 : 113; // Fixed scales for stability


    const FakeShadow = () => {
        // Static shadow texture - generated once, low perf cost
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
        // Fix for Mobile Address Bar Resize Jump
        // When address bar hides, height increases -> Aspect decreases.
        // Default behavior (fixed VFOV) causes object to appear larger (Zoom In).
        // We want to lock Horizontal FOV on mobile so width relative to screen width is constant.

        const isMobile = size.width < 768;

        if (isMobile && camera instanceof THREE.PerspectiveCamera) {
            // Reference: What we want "35 deg" to look like at a standard aspect ratio (e.g. 9/16)
            // This ensures consistent initial size, and adapts as aspect changes.
            const BASE_ASPECT = 9 / 16;
            const BASE_FOV = 35;

            // tan(hFOV/2) = tan(vFOV/2) * aspect
            const tanBase = Math.tan((BASE_FOV * Math.PI) / 360);
            const targetTanH = tanBase * BASE_ASPECT;

            const currentAspect = size.width / size.height;

            // Recalculate vFOV to maintain targetTanH
            // tan(vFOV/2) = targetTanH / currentAspect
            const newTanV = targetTanH / currentAspect;
            const newFOV = (Math.atan(newTanV) * 360) / Math.PI;

            camera.fov = newFOV;
            camera.updateProjectionMatrix();
        } else if (camera instanceof THREE.PerspectiveCamera && camera.fov !== 35) {
            // Reset for desktop if needed
            camera.fov = 35;
            camera.updateProjectionMatrix();
        }
    }, [camera, size]);

    return null;
}

// Preload
useGLTF.preload("/models/cell.glb");

export const HeroViewport = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] -z-10 bg-[var(--color-background)]">
            <Canvas
                shadows
                dpr={[1, 1.5]} // Cap DPR to 1.5 for performance
                camera={{ position: [0, 0, 7], fov: 35 }}
                gl={{ antialias: true }}
                eventSource={typeof document !== 'undefined' ? document.body : undefined}
                eventPrefix="page"
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
