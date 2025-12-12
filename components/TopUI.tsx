import React, { useState, useEffect } from 'react';
import { GameStore } from '../utils/simulation';

const TopUI: React.FC = () => {
  const [time, setTime] = useState({ ...GameStore.time });
  const [pop, setPop] = useState(0);

  useEffect(() => {
    const unsub = GameStore.subscribe(() => {
        setTime({ ...GameStore.time });
        setPop(GameStore.sims.length);
    });
    return unsub;
  }, []);

  const setSpeed = (s: number) => {
    GameStore.time.speed = s;
    GameStore.notify(); 
  };

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-30 pointer-events-none">
      {/* Time & Speed Control */}
      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-6 pointer-events-auto shadow-lg">
        <div className="font-pixel text-xs text-warning drop-shadow-[0_0_5px_rgba(253,203,110,0.5)]">
          DAY {time.day} <span className="text-white ml-2">{String(time.hour).padStart(2,'0')}:{String(time.minute).padStart(2,'0')}</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex gap-1">
            {[
                { l: 'II', s: 0 }, { l: '▶', s: 1 }, { l: '▶▶', s: 50 }, { l: '>>>', s: 200 }
            ].map(btn => (
                <button 
                    key={btn.s}
                    onClick={() => setSpeed(btn.s)}
                    className={`
                        bg-transparent border-none cursor-pointer font-inter text-[10px] font-bold px-2 py-0.5 rounded transition-all
                        ${time.speed === btn.s ? 'bg-success text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}
                    `}
                >
                    {btn.l}
                </button>
            ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-xs text-gray-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Pop: {pop}
        </div>
        
      </div>
    </div>
  );
};

export default TopUI;