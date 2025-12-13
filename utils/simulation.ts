import { PALETTES, HOLIDAYS, BUFFS, JOBS } from '../constants';
import { LogEntry, GameTime, Job } from '../types';
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

    static subscribe(cb: () => void) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    static notify() {
        this.listeners.forEach(cb => cb());
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
            time: this.time,
            logs: this.logs,
            sims: safeSims
        };

        try {
            localStorage.setItem('pixel_life_save_v1', JSON.stringify(saveData));
            console.log("[System] Game Saved");
        } catch (e) {
            console.error("Save failed", e);
            this.addLog(null, "存档失败: 空间不足或错误", "bad");
        }
    }

    static loadGame(): boolean {
        try {
            const json = localStorage.getItem('pixel_life_save_v1');
            if (!json) return false;
            
            const data = JSON.parse(json);

            this.time = {
                day: data.time.day || 1,
                hour: data.time.hour || 8,
                minute: data.time.minute || 0,
                speed: data.time.speed || 0,
                weekday: data.time.weekday || 1,
                month: data.time.month || 1,
                date: data.time.date || 1
            };
            this.logs = data.logs || [];
            
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim(sData.pos.x, sData.pos.y);
                Object.assign(sim, sData);
                
                // [Auto-Fix] 检测职业数据是否过期
                // 检查 Job 对象是否有新的必须字段 (比如 companyType 在某些旧档可能缺失，或者 level 结构变了)
                const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
                
                // 如果当前职业ID不存在于新列表中，或者关键字段缺失，强制重置为无业游民
                if (!currentJobDefinition || (sim.job.level > 0 && !sim.job.startHour)) {
                    console.warn(`[SaveFix] Resetting job for ${sim.name} due to outdated data.`);
                    sim.job = JOBS.find(j => j.id === 'unemployed')!;
                    sim.workPerformance = 0;
                } else {
                    // 如果职业ID存在，更新职业数据结构为最新版 (覆盖旧数据的配置)
                    // 这样可以确保 startHour, salary 等数值是最新的配置
                    sim.job = { ...currentJobDefinition };
                }

                // 修复 dailyIncome 缺失的问题
                if (sim.dailyIncome === undefined) {
                    sim.dailyIncome = 0;
                }

                if (sim.action === 'talking') {
                    sim.action = 'idle'; 
                    sim.interactionTarget = null;
                }
                return sim;
            });
            
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed, save file might be corrupted", e);
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
    if (GameStore.loadGame()) {
        GameStore.addLog(null, "读取存档成功，欢迎回来！", "sys");
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
    if (GameStore.timeAccumulator >= 60) {
        GameStore.timeAccumulator = 0;
        GameStore.time.minute++;
        GameStore.notify();

        GameStore.sims.forEach(s => s.update(0, true));

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

                let dailyLog = `Day ${GameStore.time.day} | ${GameStore.time.month}月${GameStore.time.date}日`;
                GameStore.addLog(null, dailyLog, 'sys');

                const holiday = HOLIDAYS.find(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
                if (holiday) {
                    GameStore.addLog(null, `🎉 今天是 ${holiday.name}！`, 'sys');
                }

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.dailyIncome = 0; // [New] Reset daily income
                    s.calculateDailyBudget(); 

                    if (holiday) s.addBuff(BUFFS.holiday_joy);
                    else if (GameStore.time.weekday >= 6) s.addBuff(BUFFS.weekend_vibes);
                });
                
                GameStore.saveGame();
            }
        }
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
    updateTime();
    GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
}