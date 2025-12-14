import { PALETTES, HOLIDAYS, BUFFS, JOBS, FURNITURE } from '../constants';
import { LogEntry, GameTime, Job, Furniture } from '../types';
import { Sim } from './Sim';

export { Sim } from './Sim';
export { drawAvatarHead, minutes, getJobCapacity } from './simulationHelpers';

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    static time: GameTime = { day: 1, hour: 8, minute: 0, speed: 2, weekday: 1, month: 1, date: 1 };
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    // [优化] 家具索引 Map，用于 O(1) 查找
    static furnitureIndex: Map<string, Furniture[]> = new Map();

    static subscribe(cb: () => void) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    static notify() {
        this.listeners.forEach(cb => cb());
    }

    // [关键] 初始化家具索引
    static initIndex() {
        this.furnitureIndex.clear();
        FURNITURE.forEach(f => {
            if (!this.furnitureIndex.has(f.utility)) {
                this.furnitureIndex.set(f.utility, []);
            }
            this.furnitureIndex.get(f.utility)!.push(f);
        });
        console.log(`[System] Furniture Index Built. Categories: ${this.furnitureIndex.size}`);
    }

    static spawnHeart(x: number, y: number) {
        this.particles.push({ x, y, life: 1.0 });
    }

    static addLog(sim: Sim | null, text: string, type: any, isAI = false) {
        const timeStr = `Day ${this.time.day} ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        let category: 'sys' | 'chat' | 'rel' = 'chat';
        if (type === 'sys' || type === 'money') category = 'sys';
        else if (type === 'rel_event' || type === 'jealous') category = 'rel';
        else if (type === 'love' && (text.includes('表白') || text.includes('分手'))) category = 'rel';

        const entry: LogEntry = {
            id: Math.random(),
            time: timeStr,
            text: text,
            type: type,
            category: category,
            isAI: isAI,
            simName: sim ? sim.name : '系统'
        };
        this.logs.unshift(entry);
        if (this.logs.length > 200) this.logs.pop();
        this.notify();
    }

    static saveGame() {
        const safeSims = this.sims.map(sim => {
            const s = Object.assign({}, sim);
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null;
                s.action = 'idle';
                s.target = null;
                s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

        const saveData = {
            version: 2.0, 
            time: this.time,
            logs: this.logs,
            sims: safeSims
        };

        try {
            localStorage.setItem('pixel_life_save_v1', JSON.stringify(saveData));
        } catch (e) {
            console.error("Save failed", e);
        }
    }

    static loadGame(): boolean {
        try {
            const json = localStorage.getItem('pixel_life_save_v1');
            if (!json) return false;
            
            const data = JSON.parse(json);

            if (!data.version && data.sims.length > 0) {
                console.warn("[System] Save file is too old. Resetting.");
                return false;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim(sData.pos.x, sData.pos.y);
                Object.assign(sim, sData);
                
                sim.interactionTarget = null;
                sim.target = null;
                if (sim.action !== 'sleeping') {
                    sim.action = 'idle';
                }
                
                const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
                if (currentJobDefinition) {
                    sim.job = { ...currentJobDefinition };
                } else {
                    sim.job = JOBS.find(j => j.id === 'unemployed')!;
                }

                if (sim.dailyIncome === undefined) sim.dailyIncome = 0;

                return sim;
            });
            
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed", e);
            return false;
        }
    }

    static clearSave() {
        if (confirm('确定要删除存档并重置世界吗？\n这将清除当前进度并刷新页面。')) {
            localStorage.removeItem('pixel_life_save_v1');
            location.reload();
        }
    }
}

export function initGame() {
    GameStore.initIndex();

    if (GameStore.loadGame()) {
        GameStore.addLog(null, "存档读取成功 (已重置当前动作以防冲突)", "sys");
    } else {
        GameStore.sims.push(new Sim(120, 120));
        GameStore.sims.push(new Sim(150, 150));
        GameStore.addLog(null, "新世界已生成。", "sys");
    }
    GameStore.notify();
}

export function updateTime() {
    if (GameStore.time.speed === 0) return;

    GameStore.timeAccumulator += GameStore.time.speed;
    
    // 当累积到 1 分钟时
    if (GameStore.timeAccumulator >= 60) {
        GameStore.timeAccumulator = 0;
        GameStore.time.minute++;

        // 这里的 true 表示分钟改变了，通知 Sim 更新 Buff 等
        GameStore.sims.forEach(s => s.update(0, true));

        // [修复] 先处理进位逻辑，再通知 UI，防止 UI 显示 "60" 分
        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;

            GameStore.sims.forEach(s => s.checkSpending());

            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;
                GameStore.time.day++;
                
                GameStore.time.date++;
                GameStore.time.weekday++;
                if (GameStore.time.weekday > 7) GameStore.time.weekday = 1;
                if (GameStore.time.date > 30) {
                    GameStore.time.date = 1;
                    GameStore.time.month++;
                    if (GameStore.time.month > 12) GameStore.time.month = 1;
                }

                // 每日结算
                let dailyLog = `Day ${GameStore.time.day} | ${GameStore.time.month}月${GameStore.time.date}日`;
                GameStore.addLog(null, dailyLog, 'sys');

                const holiday = HOLIDAYS.find(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
                if (holiday) {
                    GameStore.addLog(null, `🎉 今天是 ${holiday.name}！`, 'sys');
                }

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.dailyIncome = 0; 
                    s.calculateDailyBudget(); 

                    if (holiday) s.addBuff(BUFFS.holiday_joy);
                    else if (GameStore.time.weekday >= 6) s.addBuff(BUFFS.weekend_vibes);
                });
                
                GameStore.saveGame();
            }
        }
        
        // [修复] 所有的状态变更（包括进位）完成后，再通知 UI 渲染
        GameStore.notify();
    }
}

export function getActivePalette() {
    const h = GameStore.time.hour;
    if (h >= 5 && h < 9) return PALETTES.earlyMorning;
    if (h >= 9 && h < 15) return PALETTES.noon;
    if (h >= 15 && h < 18) return PALETTES.afternoon;
    if (h >= 18 && h < 21) return PALETTES.dusk;
    if (h >= 21 || h < 0) return PALETTES.night;
    return PALETTES.lateNight;
}

export function gameLoopStep() {
    try {
        updateTime();
        GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
    } catch (error) {
        console.error("Game Loop Error:", error);
        GameStore.time.speed = 0; 
        GameStore.notify();
    }
}