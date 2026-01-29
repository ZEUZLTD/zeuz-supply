"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, useGLTF, Text, OrbitControls, ContactShadows } from "@react-three/drei";
import React, { useRef, useLayoutEffect, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

// The Tunable Cell
const TunedCell = ({ params, bumpTexture }: {
    params: any,
    bumpTexture: THREE.Texture | null
}) => {
    const { scene } = useGLTF("/models/cell.glb");
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    const innerRef = useRef<THREE.Group>(null);
    const matRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

    useLayoutEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.name === 'mesh_0') {
                    const mat = new THREE.MeshPhysicalMaterial({
                        color: new THREE.Color('#5928ED'),
                        roughness: params.roughness,
                        metalness: params.metalness,
                        envMapIntensity: params.envMapIntensity,
                        reflectivity: params.reflectivity,
                        sheen: params.sheen,
                        sheenColor: new THREE.Color('#ffffff'),
                        sheenRoughness: 0.5,
                    });
                    mesh.material = mat;
                    matRef.current = mat;
                }
            }
        });
    }, [clonedScene, params.roughness, params.metalness, params.envMapIntensity, params.reflectivity, params.sheen]);

    useFrame((state, delta) => {
        if (innerRef.current && params.autoRotate) {
            innerRef.current.rotation.y += delta * 0.5;
        }
        if (matRef.current && bumpTexture) {
            if (matRef.current.bumpMap !== bumpTexture) {
                matRef.current.bumpMap = bumpTexture;
                matRef.current.needsUpdate = true;
            }
            matRef.current.bumpScale = params.bumpScale;
        }
    });

    return (
        <Float speed={params.autoRotate ? 2 : 0} rotationIntensity={0.05} floatIntensity={0.1}>
            <group ref={innerRef} scale={5}>
                <primitive object={clonedScene} />
            </group>
        </Float>
    );
};

export default function MaterialTunerPage() {
    const [params, setParams] = useState({
        roughness: 0.4,
        metalness: 0.2,
        bumpScale: 0.05,
        bumpFreq: 12.0,
        envMapIntensity: 1.5,
        reflectivity: 0.5,
        sheen: 0.2,
        env: 'studio' as const,
        autoRotate: true
    });

    const [bumpTexture, setBumpTexture] = useState<THREE.Texture | null>(null);

    // Generate Wavy/Shrink-Wrap Noise Texture
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const imageData = ctx.createImageData(512, 512);
            const data = imageData.data;
            const freq = params.bumpFreq;

            for (let y = 0; y < 512; y++) {
                for (let x = 0; x < 512; x++) {
                    const nx = x / 512;
                    const ny = y / 512;
                    const i = (y * 512 + x) * 4;

                    // Sum of multiple layered waves for an "irregular" surface
                    let v = 0;
                    v += Math.sin(nx * freq * 8 + ny * 2);
                    v += Math.sin(ny * freq * 10 - nx * 3);
                    v += Math.sin((nx + ny) * freq * 5);
                    v += Math.sin(Math.sqrt(nx * nx + ny * ny) * freq * 6);

                    const val = (v + 4) / 8; // Normalize -4..4 to 0..1
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
        setBumpTexture(tex);
    }, [params.bumpFreq]);

    const updateParam = (key: keyof typeof params, val: any) => {
        setParams(prev => ({ ...prev, [key]: val }));
    };

    const codeSnippet = `// Apply to Mesh "Wavy Satin"
const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#5928ED'),
    roughness: ${params.roughness.toFixed(3)},
    metalness: ${params.metalness.toFixed(3)},
    envMapIntensity: ${params.envMapIntensity.toFixed(3)},
    reflectivity: ${params.reflectivity.toFixed(3)},
    sheen: ${params.sheen.toFixed(3)},
    bumpMap: wavyTexture,
    bumpScale: ${params.bumpScale.toFixed(4)},
});`;

    return (
        <div className="w-full h-screen bg-[#050505] text-zinc-300 font-sans flex overflow-hidden">
            {/* Control Sidebar */}
            <div className="w-80 border-r border-zinc-800 flex flex-col z-10 bg-zinc-950/80 backdrop-blur-xl shrink-0">
                <div className="p-8 border-b border-zinc-800">
                    <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase italic">Laboratory</h1>
                    <p className="text-[10px] font-mono mt-1 tracking-widest text-[var(--color-accent-brand)] opacity-80 uppercase">ZEUZ // SHRINK-WRAP TESTBED</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Lighting */}
                    <Section label="Environment & Lighting">
                        <select
                            value={params.env}
                            onChange={(e) => updateParam('env', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs font-mono focus:border-[var(--color-accent-brand)] focus:outline-none"
                        >
                            <option value="studio">Studio (Flat/Neutral)</option>
                            <option value="apartment">Apartment (High Contrast)</option>
                            <option value="city">City (Complex Gradients)</option>
                            <option value="park">Park (Soft Sky)</option>
                        </select>
                        <ControlSlider
                            label="Env Intensity"
                            value={params.envMapIntensity}
                            min={0} max={3} step={0.01}
                            onChange={(v) => updateParam('envMapIntensity', v)}
                        />
                    </Section>

                    {/* Surface Appearance */}
                    <Section label="Surface Appearance">
                        <ControlSlider
                            label="Roughness"
                            value={params.roughness}
                            min={0} max={1} step={0.01}
                            onChange={(v) => updateParam('roughness', v)}
                        />
                        <ControlSlider
                            label="Metalness"
                            value={params.metalness}
                            min={0} max={1} step={0.01}
                            onChange={(v) => updateParam('metalness', v)}
                        />
                        <ControlSlider
                            label="Sheen"
                            value={params.sheen}
                            min={0} max={1} step={0.01}
                            onChange={(v) => updateParam('sheen', v)}
                        />
                    </Section>

                    {/* Underlying Texture */}
                    <Section label="Surface Deformation (Waves)">
                        <ControlSlider
                            label="Wave Frequency"
                            value={params.bumpFreq}
                            min={0.1} max={100} step={0.1}
                            onChange={(v) => updateParam('bumpFreq', v)}
                        />
                        <ControlSlider
                            label="Bump Scale"
                            value={params.bumpScale}
                            min={0} max={1.0} step={0.001}
                            onChange={(v) => updateParam('bumpScale', v)}
                        />
                    </Section>

                    {/* Settings */}
                    <Section label="Settings">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={params.autoRotate}
                                onChange={(e) => updateParam('autoRotate', e.target.checked)}
                                className="w-4 h-4 accent-[var(--color-accent-brand)]"
                            />
                            <span className="text-xs font-mono uppercase tracking-tighter opacity-70 group-hover:opacity-100 italic">Auto-Rotate View</span>
                        </label>
                    </Section>
                </div>

                {/* Footer Readout */}
                <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                    <pre className="text-[9px] font-mono bg-black p-4 border border-zinc-800 text-[var(--color-accent-energy)] leading-loose rounded-md select-all overflow-x-auto">
                        {codeSnippet}
                    </pre>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 relative flex flex-col">
                <div className="absolute top-8 left-8 z-10 pointer-events-none">
                    <div className="flex flex-col border-l-2 border-[var(--color-accent-brand)] pl-4">
                        <span className="text-4xl font-black text-white tracking-widest uppercase italic leading-none">CELL_V1</span>
                        <span className="text-[10px] font-mono text-zinc-600 mt-2 uppercase tracking-[0.4em]">PROTOTYPE // MATERIALS [PBR_PHYSICAL]</span>
                    </div>
                </div>

                <div className="flex-1 bg-[radial-gradient(circle_at_center,_#151515_0%,_#050505_100%)]">
                    <Canvas shadows camera={{ position: [0, 0, 0.8], fov: 35 }} dpr={[1, 2]}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={2.0} castShadow />
                        <pointLight position={[-10, 5, -10]} intensity={1.0} color="#5928ED" />
                        <Environment preset={params.env} />

                        <TunedCell params={params} bumpTexture={bumpTexture} />

                        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="black" />
                        <OrbitControls makeDefault minDistance={0.1} maxDistance={15} />
                    </Canvas>
                </div>

                <div className="p-4 flex justify-between items-center text-[9px] font-mono text-zinc-600 bg-black/80 backdrop-blur-md uppercase tracking-[0.3em]">
                    <div>STATUS: EVALUATING_WRAP</div>
                    <div>SHRINK_WRAP_SIM_ACTIVE: TRUE</div>
                    <a href="/" className="text-zinc-500 hover:text-white underline underline-offset-4 decoration-[var(--color-accent-brand)]">Terminate Session</a>
                </div>
            </div>
        </div>
    );
}

const Section = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h3 className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em] border-b border-zinc-900 pb-2">{label}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const ControlSlider = ({ label, value, min, max, step, onChange }: {
    label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void
}) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-mono tracking-tighter uppercase px-1">
            <span className="opacity-60">{label}</span>
            <span className="text-[var(--color-accent-brand)] font-bold">{value.toFixed(label.includes('Scale') || label.includes('Freq') ? 4 : 2)}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-[2px] bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-brand)]"
        />
    </div>
);

useGLTF.preload("/models/cell.glb");
