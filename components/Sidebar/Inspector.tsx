import React, { useRef, useEffect } from 'react';
import { GameStore, Sim, drawAvatarHead } from '../../utils/simulation';
import { SKILLS, ORIENTATIONS } from '../../constants';
import { SimData } from '../../types';

interface InspectorProps {
    selectedId: string | null;
    sims: Sim[];
}

const InspectorFace: React.FC<{ sim: SimData }> = ({ sim }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 64, 64);
                drawAvatarHead(ctx, 32, 40, 20, sim);
            }
        }
    }, [sim]);
    return <canvas ref={canvasRef} width={64} height={64} />;
};

const SkillBar: React.FC<{ val: number }> = ({ val }) => {
    // 5-block style
    const level = Math.floor(val / 20); // 0 to 5
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border border-black/20 ${i <= level ? 'bg-accent' : 'bg-white/10'}`}
                />
            ))}
        </div>
    );
};

// Bi-directional Bar Component
// Center is 0. Left is -100, Right is +100.
const RelBar: React.FC<{ val: number, type: 'friend' | 'romance' }> = ({ val, type }) => {
    // Width represents distance from center (0 to 50%)
    const widthPercent = Math.min(50, (Math.abs(val) / 100) * 50);
    const isPositive = val >= 0;

    // Position: If positive, start at 50%. If negative, start at 50% - width.
    const leftPercent = isPositive ? 50 : 50 - widthPercent;

    let color = isPositive ? (type === 'friend' ? 'bg-success' : 'bg-love') : 'bg-danger';

    return (
        <div className="flex items-center gap-2 text-[9px] text-gray-500 w-full">
            <span className="w-3 text-center">{type === 'friend' ? '友' : '爱'}</span>
            <div className="flex-1 h-2 bg-black/40 rounded-full relative overflow-hidden border border-white/5">
                {/* Center Marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10"></div>

                {/* Bar */}
                <div
                    className={`absolute top-0 bottom-0 ${color} transition-all duration-300`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                ></div>
            </div>
            <span className={`w-6 text-right font-mono ${val < 0 ? 'text-danger' : 'text-gray-400'}`}>{Math.floor(val)}</span>
        </div>
    );
};

// Status Translation Map
const STATUS_MAP: Record<string, string> = {
    idle: '发呆',
    moving: '移动中',
    wandering: '闲逛',
    working: '打工',
    sleeping: '睡觉',
    eating: '进食',
    talking: '聊天',
    using: '忙碌',
    watching_movie: '看电影',
    phone: '玩手机'
};

const Inspector: React.FC<InspectorProps> = ({ selectedId, sims }) => {
    const sim = sims.find(s => s.id === selectedId);
    if (!sim) return null;

    let moodColor = '#b2bec3';
    if (sim.mood > 80) moodColor = '#00b894';
    if (sim.mood < 40) moodColor = '#ff7675';

    const genderIcon = sim.gender === 'M' ? '♂' : '♀';
    const genderColor = sim.gender === 'M' ? 'text-blue-400' : 'text-pink-400';

    const statusText = STATUS_MAP[sim.action] || sim.action;
    // Prefer bubble text if it's an action description and recent
    const displayStatus = (sim.bubble.type === 'act' && sim.bubble.text && sim.bubble.timer > 0)
        ? sim.bubble.text
        : statusText;

    return (
        <div className="w-[340px] max-h-[calc(100vh-160px)] flex flex-col bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto animate-[fadeIn_0.2s_ease-out] text-[#e0e0e0]">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-white/10 shrink-0 bg-white/5">
                <div className="w-16 h-16 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                    <InspectorFace sim={sim} />
                    <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-[#121212]" style={{ background: moodColor }}></div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold truncate tracking-tight flex items-center gap-2">
                            {sim.name}
                            <span className={`text-sm font-bold ${genderColor}`}>{genderIcon}</span>
                        </h2>
                        <button
                            onClick={() => { GameStore.selectedSimId = null; GameStore.notify(); }}
                            className="text-white/30 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent/20 text-accent font-bold border border-accent/20">{sim.mbti}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">{sim.zodiac.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">{sim.age}岁</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">{ORIENTATIONS.find(o => o.type === sim.orientation)?.label}</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">

                {/* Action Status */}
                <div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">当前状态</div>
                    <div className="bg-black/30 rounded px-3 py-2 flex items-center justify-between border border-white/5 shadow-inner">
                        <span className="text-sm text-act font-bold flex items-center gap-2">
                            {displayStatus}
                        </span>
                        <span className="text-xs text-gray-400">Mood: {Math.floor(sim.mood)}</span>
                    </div>
                </div>

                {/* Economy (NEW) */}
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">财务状况</div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400">总资产</div>
                            <div className="text-lg font-bold text-warning">${sim.money}</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400">职业</div>
                            <div className="text-xs font-bold text-gray-200">{sim.job.title} <span className="text-[9px] opacity-50">Lv.{sim.job.level}</span></div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400">今日预算</div>
                            <div className="text-sm font-bold text-gray-300">${sim.dailyBudget}</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400">今日消费</div>
                            <div className="text-sm font-bold text-danger">-${sim.dailyExpense}</div>
                        </div>
                    </div>
                </div>

                {/* Needs */}
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">基本需求</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                            { l: '饥饿', v: sim.needs.hunger, c: '#e17055' },
                            { l: '精力', v: sim.needs.energy, c: '#6c5ce7' },
                            { l: '社交', v: sim.needs.social, c: '#00b894' },
                            { l: '娱乐', v: sim.needs.fun, c: '#fdcb6e' },
                            { l: '卫生', v: sim.needs.hygiene, c: '#74b9ff' },
                            { l: '如厕', v: sim.needs.bladder, c: '#fab1a0' },
                        ].map(s => (
                            <div key={s.l}>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                    <span>{s.l}</span>
                                </div>
                                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full transition-all duration-500" style={{ width: `${s.v}%`, background: s.c }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Buffs */}
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">状态 (Buffs)</div>
                    {sim.buffs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {sim.buffs.map(b => (
                                <span key={b.id} className={`text-[10px] px-2 py-1 rounded border ${b.type === 'good' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                                    {b.label}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-[10px] text-gray-600 italic">无特殊状态</span>
                    )}
                </div>

                {/* Skills - 5 Blocks Style */}
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">技能等级</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(sim.skills).map(([key, val]) => {
                            if ((val as number) < 5) return null; // Hide very low skills
                            const label = SKILLS.find(s => s.id === key)?.label || key;
                            return (
                                <div key={key} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/5">
                                    <span className="text-[10px] text-gray-300">{label}</span>
                                    <SkillBar val={val as number} />
                                </div>
                            );
                        })}
                        {Object.values(sim.skills).every(v => (v as number) < 5) && <span className="text-[10px] text-gray-600 italic col-span-2">暂无技能</span>}
                    </div>
                </div>

                {/* Relationships - Split Center Bars */}
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">人际关系</div>
                    <div className="flex flex-col gap-2">
                        {Object.keys(sim.relationships).map(targetId => {
                            const targetSim = sims.find(s => s.id === targetId);
                            if (!targetSim) return null;
                            const rel = sim.relationships[targetId];
                            return (
                                <div key={targetId} className="bg-white/5 p-2 rounded border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ background: targetSim.skinColor }}></div>
                                            <span className="text-[11px] font-bold text-gray-200">{targetSim.name}</span>
                                        </div>
                                        <span className={`text-[9px] px-1.5 rounded ${rel.isLover ? 'bg-love/20 text-love' : 'bg-black/30 text-gray-400'}`}>
                                            {sim.getRelLabel(rel)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <RelBar val={rel.friendship} type="friend" />
                                        {(rel.hasRomance || rel.romance !== 0) && (
                                            <RelBar val={rel.romance} type="romance" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(sim.relationships).length === 0 && <span className="text-[11px] text-gray-600 italic text-center py-2">还未认识任何人...</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Inspector;