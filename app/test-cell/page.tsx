"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
// import { RealisticCell } from "@/components/RealisticCell";
import { CADCell } from "@/components/CADCell"; // UNCOMMENT TO TEST GLB
import { Suspense } from "react";

export default function TestCellPage() {
    return (
        <main className="min-h-[300vh] bg-[var(--color-background)] relative">
            <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
                {/* Reference Text for Alignment */}
                <h1 className="w-full max-w-[95vw] grid grid-cols-2 -translate-x-[2vw] text-[25vw] font-bold text-zinc-800 leading-none opacity-50">
                    <div className="flex justify-end items-center tracking-tighter">
                        <span>Z</span>
                        <span className="pr-[0.3vw]">E</span>
                    </div>
                    <div className="flex justify-start items-center tracking-tighter">
                        <span className="pl-[0.3vw]">U</span>
                        <span>Z</span>
                    </div>
                </h1>
            </div>

            <div className="fixed inset-0 z-20">
                <Canvas shadows camera={{ position: [0, 0, 7], fov: 35 }} gl={{ antialias: true }}>
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 10, 10]} intensity={15} castShadow />
                    <pointLight position={[-10, -10, -5]} intensity={5} color="#333" />

                    <Suspense fallback={null}>
                        {/* <RealisticCell /> */}
                        <CADCell />
                        <Environment preset="studio" />
                    </Suspense>

                    {/* OrbitControls disabled to test pure Mouse Roll interaction */}
                    {/* <OrbitControls enableZoom={false} /> */}
                </Canvas>
            </div>

            <div className="fixed bottom-10 left-10 z-50 text-white font-mono-spec">
                <p>SCROLL TO ROTATE</p>
                <p>DRAG TO INSPECT</p>
            </div>
        </main>
    );
}
