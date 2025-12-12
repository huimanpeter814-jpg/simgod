import React, { useState, useEffect } from 'react';
import Roster from './Roster';
import LogPanel from './LogPanel';
import Inspector from './Inspector';
import { GameStore, Sim } from '../../utils/simulation';

// Full Screen Overlay managing HUD elements
const GameOverlay: React.FC = () => {
    const [sims, setSims] = useState<Sim[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        // Initial fetch
        setSims([...GameStore.sims]);
        setSelectedId(GameStore.selectedSimId);

        const unsub = GameStore.subscribe(() => {
            setSims([...GameStore.sims]);
            setSelectedId(GameStore.selectedSimId);
        });
        return unsub;
    }, []);

    const handleSpawn = () => {
        GameStore.sims.push(new Sim(450, 350));
        GameStore.notify();
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

            {/* Left Strip: Roster (Widened for names) */}
            <div className="absolute left-4 top-20 bottom-24 w-[80px] pointer-events-auto flex flex-col gap-2">
                <Roster sims={sims} selectedId={selectedId} />
            </div>

            {/* Right Panel: Inspector (Floating) */}
            {selectedId && (
                <div className="absolute right-4 top-20 bottom-4 pointer-events-none flex flex-col justify-start">
                    <Inspector selectedId={selectedId} sims={sims} />
                </div>
            )}

            {/* Floating Log Panel (Self-managed positioning) */}
            <LogPanel />

            {/* Bottom Right: Spawn Button with Text */}
            <div className="absolute right-6 bottom-6 pointer-events-auto">
                <button
                    onClick={handleSpawn}
                    className="group flex items-center gap-2 bg-success text-[#121212] px-6 py-3 rounded-full shadow-[0_4px_0_#008c70] border-2 border-transparent hover:border-white/50 active:translate-y-1 active:shadow-none transition-all"
                    title="Spawn Citizen"
                >
                    <span className="text-xl font-black leading-none group-hover:rotate-90 transition-transform">+</span>
                    <span className="font-inter text-xs tracking-wider">New</span>
                </button>
            </div>
        </div>
    );
};

export default GameOverlay;