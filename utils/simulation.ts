import { PALETTES } from '../constants';
import { LogEntry, GameTime } from '../types';
import { Sim } from './Sim'; // 引入拆分出去的 Sim 类

// 导出 Sim 和辅助函数，供其他组件(如 GameCanvas)使用
export { Sim } from './Sim';
export { drawAvatarHead, minutes, getJobCapacity } from './simulationHelpers';

// Global simulation state container
export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    static time: GameTime = { day: 1, hour: 8, minute: 0, speed: 2 };
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
}

// Initialization and Loop
export function initGame() {
    // 初始生成两个市民
    GameStore.sims.push(new Sim(120, 120));
    GameStore.sims.push(new Sim(150, 150));
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

            // Daily Trigger & Reset Logic
            // 修复: 当时间 >= 24 时重置为 0 并增加天数
            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;
                GameStore.time.day++;
                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.calculateDailyBudget(); // New Budget for the day
                });
                GameStore.addLog(null, `新的一天开始了。`, 'sys');
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