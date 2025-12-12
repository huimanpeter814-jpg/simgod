import { PALETTES, HOLIDAYS, BUFFS } from '../constants';
import { LogEntry, GameTime } from '../types';
import { Sim } from './Sim';

// 导出 Sim 和辅助函数，供其他组件(如 GameCanvas)使用
export { Sim } from './Sim';
export { drawAvatarHead, minutes, getJobCapacity } from './simulationHelpers';

// Global simulation state container
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

    // 移回来的静态方法，供 Sim 类调用产生爱心粒子
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

    // === 存档系统 ===

    static saveGame() {
        // 深拷贝前先进行清洗，防止 JSON 循环引用 (Circular Reference)
        // 主要针对 sim.interactionTarget 可能指向另一个 Sim 的情况
        const safeSims = this.sims.map(sim => {
            // 使用 Object.assign 浅拷贝对象，避免直接修改原始 Sim 实例
            const s = Object.assign({}, sim);
            
            // 如果交互目标包含 ref (通常是指向另一个 Sim)，则清除该动作，避免 JSON.stringify 报错
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
            this.addLog(null, "游戏进度已保存", "sys");
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

            // 恢复基础数据
            // [新增兼容性处理] 旧存档可能没有 date/month/weekday，给默认值
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
            
            // 恢复 Sim 对象 (关键步骤：恢复类方法)
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim(sData.pos.x, sData.pos.y);
                Object.assign(sim, sData);
                if (sim.action === 'talking') {
                    sim.action = 'idle'; 
                    sim.interactionTarget = null;
                }
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

// Initialization and Loop
export function initGame() {
    // 尝试读取存档
    if (GameStore.loadGame()) {
        GameStore.addLog(null, "读取存档成功，欢迎回来！", "sys");
    } else {
        // 如果没有存档，则初始化新游戏
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
        // Notify on every minute change
        GameStore.notify();

        // Minute trigger for sims (update with dt=0 for event checks)
        GameStore.sims.forEach(s => s.update(0, true));

        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;

            // Hourly Triggers
            GameStore.sims.forEach(s => s.checkSpending());

            // Daily Trigger (00:00)
            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;
                GameStore.time.day++;
                
                // === 日期进位逻辑 ===
                GameStore.time.date++;
                GameStore.time.weekday++;
                if (GameStore.time.weekday > 7) GameStore.time.weekday = 1;
                if (GameStore.time.date > 30) {
                    GameStore.time.date = 1;
                    GameStore.time.month++;
                    if (GameStore.time.month > 12) GameStore.time.month = 1;
                }

                // === 每日重置 ===
                let dailyLog = `Day ${GameStore.time.day} | ${GameStore.time.month}月${GameStore.time.date}日 (周${['日','一','二','三','四','五','六'][GameStore.time.weekday % 7]})`;
                GameStore.addLog(null, dailyLog, 'sys');

                // 检查节日
                const holiday = HOLIDAYS.find(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
                if (holiday) {
                    GameStore.addLog(null, `🎉 今天是 ${holiday.name}！`, 'sys');
                }

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.calculateDailyBudget(); 

                    // 节日/周末 Buff
                    if (holiday) s.addBuff(BUFFS.holiday_joy);
                    else if (GameStore.time.weekday >= 6) s.addBuff(BUFFS.weekend_vibes);
                });
                
                // === 自动保存 ===
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