import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, ELE_COMP, FURNITURE, SOCIAL_TYPES, JOBS, BUFFS, ITEMS, ASSET_CONFIG } from '../constants';
import { Vector2, SimData, Job, Buff, SimAppearance } from '../types';
import { GameStore } from './simulation'; // 引用 Store
import { minutes, getJobCapacity } from './simulationHelpers'; // 引用工具

export class Sim {
    id: string;
    pos: Vector2;
    target: Vector2 | null = null;
    speed: number;
    gender: 'M' | 'F';
    name: string;
    skinColor: string;
    hairColor: string;
    clothesColor: string;
    appearance: SimAppearance;
    mbti: string;
    zodiac: any;
    age: number;
    lifeGoal: string;
    orientation: string;
    faithfulness: number;
    needs: any;
    skills: any;
    relationships: any;

    money: number;
    dailyBudget: number;
    workPerformance: number;
    job: Job;
    dailyExpense: number;

    buffs: Buff[];
    mood: number;

    metabolism: any;
    skillModifiers: Record<string, number>;
    socialModifier: number;

    action: string;
    actionTimer: number;
    interactionTarget: any = null;
    bubble: { text: string | null; timer: number; type: string } = { text: null, timer: 0, type: 'normal' };

    constructor(x?: number, y?: number) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.pos = {
            x: x ?? (50 + Math.random() * (CONFIG.CANVAS_W - 100)),
            y: y ?? (50 + Math.random() * (CONFIG.CANVAS_H - 100))
        };
        this.speed = (4.0 + Math.random() * 1.5) * 1.5;
        this.gender = Math.random() > 0.5 ? 'M' : 'F';
        this.name = this.generateName();
        this.skinColor = CONFIG.COLORS.skin[Math.floor(Math.random() * CONFIG.COLORS.skin.length)];
        this.hairColor = CONFIG.COLORS.hair[Math.floor(Math.random() * CONFIG.COLORS.hair.length)];
        this.clothesColor = CONFIG.COLORS.clothes[Math.floor(Math.random() * CONFIG.COLORS.clothes.length)];
        this.appearance = {
            face: ASSET_CONFIG.face.length > 0 ? ASSET_CONFIG.face[Math.floor(Math.random() * ASSET_CONFIG.face.length)] : '',
            hair: ASSET_CONFIG.hair.length > 0 ? ASSET_CONFIG.hair[Math.floor(Math.random() * ASSET_CONFIG.hair.length)] : '',
            clothes: ASSET_CONFIG.clothes.length > 0 ? ASSET_CONFIG.clothes[Math.floor(Math.random() * ASSET_CONFIG.clothes.length)] : '',
            pants: ASSET_CONFIG.pants.length > 0 ? ASSET_CONFIG.pants[Math.floor(Math.random() * ASSET_CONFIG.pants.length)] : '',
        };

        this.mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
        this.zodiac = ZODIACS[Math.floor(Math.random() * ZODIACS.length)];
        this.age = 20 + Math.floor(Math.random() * 10);
        this.lifeGoal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)];

        const r = Math.random();
        this.orientation = r < 0.7 ? 'hetero' : (r < 0.85 ? 'homo' : 'bi');

        let baseFaith = this.mbti.includes('J') ? 70 : 40;
        this.faithfulness = Math.min(100, Math.max(0, baseFaith + (Math.random() * 40 - 20)));

        const randNeed = () => 60 + Math.floor(Math.random() * 40);
        this.needs = { hunger: randNeed(), energy: randNeed(), fun: randNeed(), social: randNeed(), bladder: randNeed(), hygiene: randNeed() };
        this.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        this.relationships = {};

        this.money = 2000 + Math.floor(Math.random() * 3000);

        const validJobs = JOBS.filter(j => {
            if (j.id === 'unemployed') return true;
            const capacity = getJobCapacity(j);
            const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
            return currentCount < capacity;
        });

        if (validJobs.length > 0) {
            this.job = validJobs[Math.floor(Math.random() * validJobs.length)];
        } else {
            this.job = JOBS.find(j => j.id === 'unemployed')!;
        }

        if (this.lifeGoal === '成为百万富翁' && Math.random() > 0.5) {
            const devJob = JOBS.find(j => j.id === 'developer');
            if (devJob) {
                const cap = getJobCapacity(devJob);
                const count = GameStore.sims.filter(s => s.job.id === 'developer').length;
                if (count < cap) this.job = devJob;
            }
        }

        this.dailyExpense = 0;
        this.dailyBudget = 0;
        this.workPerformance = 0;

        this.buffs = [];
        this.mood = 80;

        this.action = 'idle';
        this.actionTimer = 0;

        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        this.applyTraits();
        this.calculateDailyBudget();

        GameStore.addLog(this, `搬进了社区。职位: ${this.job.title}`, 'sys');
    }

    generateName() { return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)]; }

    applyTraits() {
        if (this.mbti.includes('E')) { this.metabolism.social = 1.5; this.socialModifier *= 1.1; }
        else { this.metabolism.social = 0.7; }
        if (this.mbti.includes('N')) { this.skillModifiers.logic = 1.3; this.skillModifiers.creativity = 1.3; this.skillModifiers.music = 1.2; }
        else { this.skillModifiers.cooking = 1.3; this.skillModifiers.athletics = 1.3; this.skillModifiers.gardening = 1.3; }
        if (this.mbti.includes('F')) { this.socialModifier *= 1.3; this.skillModifiers.dancing = 1.2; }
        else { this.socialModifier *= 0.8; this.skillModifiers.logic *= 1.2; }
        if (this.mbti.includes('J')) { this.metabolism.hygiene = 0.8; this.metabolism.energy = 0.9; }
        else { this.metabolism.fun = 1.4; this.skillModifiers.creativity *= 1.1; }

        const el = this.zodiac.element;
        if (el === 'fire') { this.skillModifiers.athletics *= 1.2; this.metabolism.energy *= 0.9; }
        else if (el === 'earth') { this.skillModifiers.gardening *= 1.2; this.skillModifiers.cooking *= 1.2; this.metabolism.hunger *= 0.8; }
        else if (el === 'air') { this.skillModifiers.logic *= 1.1; this.skillModifiers.music *= 1.2; this.metabolism.social *= 1.2; }
        else if (el === 'water') { this.skillModifiers.creativity *= 1.3; this.skillModifiers.dancing *= 1.1; }
    }

    calculateDailyBudget() {
        let safetyPercent = 0.2;
        const isEarth = this.zodiac.element === 'earth';
        const isFire = this.zodiac.element === 'fire';
        const isJ = this.mbti.includes('J');

        if (isEarth || isJ) safetyPercent = 0.4;
        if (isFire || !isJ) safetyPercent = 0.1;

        const safetyMargin = this.money * safetyPercent;
        let disposable = Math.max(0, this.money - safetyMargin);

        let propensity = 0.2;
        if (this.hasBuff('rich_feel')) propensity = 0.5;
        if (this.hasBuff('stressed')) propensity = 0.4;

        this.dailyBudget = Math.floor(disposable * propensity);
    }

    checkSpending() {
        if (this.money < 100) {
            if (!this.hasBuff('broke') && !this.hasBuff('anxious')) {
                this.addBuff(BUFFS.broke);
                this.addBuff(BUFFS.anxious);
            }
            return;
        }

        // 修复：只进行简单的预算判断或自动购买非实体服务
        // 实体物品（书、饮料）需要去商店购买，不在这里自动触发
    }

    buyItem(item: any) {
        this.money -= item.cost;
        this.dailyExpense += item.cost;
        this.dailyBudget -= item.cost;

        if (item.needs) {
            for (let k in item.needs) {
                if (this.needs[k] !== undefined) this.needs[k] = Math.min(100, this.needs[k] + item.needs[k]);
            }
        }

        if (item.skill) {
            let val = item.skillVal || 5;
            this.skills[item.skill] = Math.min(100, this.skills[item.skill] + val);
            this.say("📚 涨知识", 'act');
        }

        if (item.buff) this.addBuff(BUFFS[item.buff]);

        let logSuffix = "";
        if (item.rel) {
            const loverId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover) {
                    lover.updateRelationship(this, 'romance', 10);
                    lover.needs.fun = Math.min(100, lover.needs.fun + 20);
                    logSuffix = ` (送给 ${lover.name})`;
                }
            }
        }

        this.say(`💸 ${item.label}`, 'act');
        GameStore.addLog(this, `购买了 ${item.label} -$${item.cost}${logSuffix}`, 'money');
    }

    update(dt: number, minuteChanged: boolean) {
        const f = 0.0008 * dt;

        if (minuteChanged) {
            this.updateBuffs(1);
        }

        this.checkSchedule();
        this.updateMood();

        if (this.action !== 'sleeping') this.needs.energy -= BASE_DECAY.energy * this.metabolism.energy * f;
        if (this.action !== 'eating') this.needs.hunger -= BASE_DECAY.hunger * this.metabolism.hunger * f;
        if (this.action !== 'watching_movie') this.needs.fun -= BASE_DECAY.fun * this.metabolism.fun * f;
        this.needs.bladder -= BASE_DECAY.bladder * this.metabolism.bladder * f;
        this.needs.hygiene -= BASE_DECAY.hygiene * this.metabolism.hygiene * f;
        if (this.action !== 'talking' && this.action !== 'watching_movie') this.needs.social -= BASE_DECAY.social * this.metabolism.social * f;

        const restoreRate = 2.5 * f;
        if (this.action === 'working') {
            this.needs.energy -= BASE_DECAY.energy * 0.5 * f;
            this.needs.fun -= BASE_DECAY.fun * 0.8 * f;

            const autoRefillRate = restoreRate * 2;
            if (this.needs.hunger < 30) this.needs.hunger += autoRefillRate;
            if (this.needs.bladder < 30) this.needs.bladder += autoRefillRate;
            if (this.needs.hygiene < 30) this.needs.hygiene += autoRefillRate;
            if (this.needs.social < 30) this.needs.social += autoRefillRate;

            if (this.interactionTarget) this.pos = { ...this.interactionTarget };
        }
        else if (this.action === 'sleeping') {
            let rate = (100 / minutes(480)) * dt;
            if (this.hasBuff('well_rested')) rate *= 1.2;
            this.needs.energy += rate;

            if (this.needs.energy >= 100) {
                this.finishAction();
            }
        }
        else if (this.action === 'eating') this.needs.hunger += restoreRate * 5;
        else if (this.action === 'talking') this.needs.social += restoreRate;
        else if (this.action === 'watching_movie') {
            this.needs.fun += restoreRate * 3;
            this.needs.energy -= restoreRate * 0.1;
            const loverId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover && lover.action === 'watching_movie') {
                    this.needs.social += restoreRate * 2;
                }
            }
        }
        else if (this.action === 'phone') {
            this.needs.fun += restoreRate * 0.8;
            this.needs.social += restoreRate * 0.1;
        }
        else if (this.action === 'using' && this.interactionTarget) {
            const u = this.interactionTarget.utility;
            let rate = restoreRate;

            if (u === 'gym_run' || u === 'gym_yoga') {
                this.skills.athletics += 0.08 * f;
                this.needs.energy -= rate * 2;
                this.needs.hygiene -= rate * 0.5;
            }
            else if (u === 'gardening') {
                this.skills.gardening += 0.05 * f;
                this.needs.fun += rate;
                this.needs.energy -= rate;
            }
            else if (u === 'fishing') {
                this.skills.fishing += 0.05 * f;
                this.needs.fun += rate * 0.8;
            }
            else if (u === 'cooking') {
                this.skills.cooking += 0.05 * f;
            }
            else {
                if (u === 'bladder' || u === 'hygiene') rate *= 6.0;
                if (this.needs[u] !== undefined) this.needs[u] += rate;

                if (u && u.startsWith('skill_')) {
                    let skill = u.replace('skill_', '');
                    let modifier = this.skillModifiers[skill] || 1.0;
                    if (this.mood > 90) modifier *= 1.2;
                    this.skills[skill] = Math.min(100, this.skills[skill] + 0.05 * f * modifier);
                    this.needs.fun += rate * 0.5;
                    this.needs.energy -= rate * 0.2;
                }

                if (this.interactionTarget.label.includes('沙发') || this.interactionTarget.label.includes('长椅')) {
                    this.needs.energy += restoreRate * 0.5;
                    this.needs.comfort = 100;
                    if (this.actionTimer > minutes(30) && Math.random() < 0.005) {
                        this.say("📱...", 'normal');
                        this.action = 'phone';
                    }
                }
            }
        }

        for (let k in this.needs) this.needs[k] = Math.max(0, Math.min(100, this.needs[k]));

        if (this.action === 'using' && this.interactionTarget && ['bladder', 'hygiene'].includes(this.interactionTarget.utility)) {
            if (this.needs[this.interactionTarget.utility] >= 100) this.finishAction();
        }

        if (this.actionTimer > 0) {
            this.actionTimer -= dt;
            if (this.actionTimer <= 0) this.finishAction();
        } else if (!this.target) {
            this.decideAction();
        }

        if (this.target) {
            const dist = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2));

            // 判断停止距离：如果是与人交互，则保留一定距离（如40），避免重合
            let stopThreshold = 8;
            let isHumanInteraction = this.interactionTarget && this.interactionTarget.type === 'human';

            if (isHumanInteraction) {
                stopThreshold = 40; // 社交距离
            }

            if (dist < stopThreshold) {
                // 如果是物品/家具交互，通常需要精确到达位置（吸附）
                // 如果是人际交互，不需要重合，保留位置即可
                if (!isHumanInteraction) {
                    this.pos = this.target;
                }

                this.target = null;
                this.startInteraction();
            } else {
                const dx = this.target.x - this.pos.x;
                const dy = this.target.y - this.pos.y;
                const angle = Math.atan2(dy, dx);

                let speedMod = 1.0;
                if (this.mood > 90) speedMod = 1.3;
                if (this.mood < 30) speedMod = 0.7;

                let nextX = this.pos.x + Math.cos(angle) * this.speed * speedMod * (dt * 0.1);
                let nextY = this.pos.y + Math.sin(angle) * this.speed * speedMod * (dt * 0.1);
                nextX = Math.max(10, Math.min(CONFIG.CANVAS_W - 10, nextX));
                nextY = Math.max(10, Math.min(CONFIG.CANVAS_H - 10, nextY));
                this.pos.x = nextX;
                this.pos.y = nextY;
                this.action = 'moving';
            }
        }

        // --- 修复：气泡计时器使用帧数递减，而不是游戏时间 dt ---
        if (this.bubble.timer > 0) this.bubble.timer -= 1;
    }

    checkSchedule() {
        if (this.job.id !== 'unemployed') {
            const currentHour = GameStore.time.hour;
            const isWorkTime = currentHour >= this.job.startHour && currentHour < this.job.endHour;

            if (isWorkTime && this.action !== 'working' && this.action !== 'commuting') {
                let deskSearchLabel = '工位';
                if (this.job.companyType === 'internet') {
                    deskSearchLabel = this.job.level >= 4 ? 'CTO' : '开发';
                } else if (this.job.companyType === 'design') {
                    deskSearchLabel = this.job.level >= 4 ? '总监' : '设计';
                } else if (this.job.companyType === 'business') {
                    deskSearchLabel = this.job.level >= 3 ? '经理' : '商务';
                } else if (this.job.companyType === 'store') {
                    deskSearchLabel = '前台';
                } else if (this.job.companyType === 'restaurant') {
                    deskSearchLabel = this.job.title === '厨师' ? '后厨' : '前台';
                }

                const desk = FURNITURE.find(f =>
                    f.label.includes(deskSearchLabel) &&
                    f.utility === 'work' &&
                    (!f.reserved || f.reserved === this.id) &&
                    !GameStore.sims.some(s => s.id !== this.id && s.interactionTarget?.id === f.id)
                );

                if (desk) {
                    this.target = { x: desk.x + desk.w / 2, y: desk.y + desk.h / 2 };
                    this.interactionTarget = desk;
                    this.action = 'commuting';
                    this.say("去上班 💼", 'act');
                } else {
                    this.target = { x: 800, y: 350 };
                    this.action = 'commuting';
                }
            } else if (!isWorkTime && (this.action === 'working' || this.action === 'commuting')) {
                this.action = 'idle';
                this.target = null;
                this.interactionTarget = null;
                this.money += this.job.salary;
                this.say(`下班! +$${this.job.salary}`, 'money');
                this.addBuff(BUFFS.stressed);

                let dailyPerf = 10;
                if (this.mood > 80) dailyPerf += 5;
                if (this.hasBuff('well_rested')) dailyPerf += 5;
                if (this.needs.fun < 30) dailyPerf -= 5;
                this.workPerformance += dailyPerf;

                if (this.workPerformance > 300 && this.job.level < 5) {
                    this.promote();
                    this.workPerformance = 0;
                }
            }
        }
    }

    promote() {
        const nextLevel = JOBS.find(j => j.companyType === this.job.companyType && j.level === this.job.level + 1);
        if (nextLevel) {
            const cap = getJobCapacity(nextLevel);
            const currentCount = GameStore.sims.filter(s => s.job.id === nextLevel.id).length;

            if (currentCount < cap) {
                this.job = nextLevel;
                this.money += 500;
                GameStore.addLog(this, `升职了！现在是 ${nextLevel.title}`, 'sys');
                this.say("升职啦! 🚀", 'act');
            }
        }
    }

    updateBuffs(minutesPassed: number) {
        this.buffs.forEach(b => {
            b.duration -= minutesPassed;
        });
        this.buffs = this.buffs.filter(b => b.duration > 0);
    }

    addBuff(buffDef: any) {
        if (this.hasBuff(buffDef.id)) {
            const b = this.buffs.find(b => b.id === buffDef.id);
            if (b) b.duration = buffDef.duration;
        } else {
            this.buffs.push({ ...buffDef, source: 'system' });
        }
    }

    hasBuff(id: string) { return this.buffs.some(b => b.id === id); }

    updateMood() {
        let total = 0;
        let count = 0;
        for (let k in this.needs) { total += this.needs[k]; count++; }
        let base = total / count;
        this.buffs.forEach(b => {
            if (b.type === 'good') base += 15;
            if (b.type === 'bad') base -= 15;
        });
        this.mood = Math.max(0, Math.min(100, base));
    }

    decideAction() {
        let critical = [
            { id: 'energy', val: this.needs.energy },
            { id: 'hunger', val: this.needs.hunger },
            { id: 'bladder', val: this.needs.bladder },
            { id: 'hygiene', val: this.needs.hygiene }
        ].filter(n => n.val < 40);

        if (critical.length > 0) {
            critical.sort((a, b) => a.val - b.val);
            this.findObject(critical[0].id);
            return;
        }

        let scores = [
            { id: 'energy', score: (100 - this.needs.energy) * 3.0, type: 'obj' },
            { id: 'hunger', score: (100 - this.needs.hunger) * 2.5, type: 'obj' },
            { id: 'bladder', score: (100 - this.needs.bladder) * 2.8, type: 'obj' },
            { id: 'hygiene', score: (100 - this.needs.hygiene) * 1.5, type: 'obj' },
            { id: 'fun', score: (100 - this.needs.fun) * 1.2, type: 'fun' },
            { id: 'social', score: (100 - this.needs.social) * 1.5, type: 'social' }
        ];

        for (let skillKey in this.skills) {
            let talent = this.skillModifiers[skillKey] || 1;
            let skillScore = (100 - this.needs.fun) * 0.5 * talent;
            scores.push({ id: `skill_${skillKey}`, score: skillScore, type: 'obj' });
        }

        if (this.needs.fun < 50 && this.money > 100) {
            scores.push({ id: 'cinema_imax', score: 90, type: 'obj' });
            scores.push({ id: 'gym_run', score: 60, type: 'obj' });
        }

        let socialNeed = scores.find(s => s.id === 'social');
        if (socialNeed) {
            if (this.mbti.startsWith('E')) socialNeed.score *= 1.5;
            if (this.mood < 30) socialNeed.score = 0;
        }

        scores.sort((a, b) => b.score - a.score);
        let choice = scores[Math.floor(Math.random() * Math.min(scores.length, 3))];

        if (choice.score > 20) {
            if (choice.id === 'social') this.findHuman();
            else this.findObject(choice.id);
        } else {
            this.wander();
        }
    }

    findObject(type: string) {
        let map: any = {
            energy: 'energy', hunger: 'hunger', bladder: 'bladder', hygiene: 'hygiene', fun: 'fun',
            cooking: 'cooking', gardening: 'gardening', fishing: 'fishing'
        };
        let utility = map[type] || type;

        let candidates = FURNITURE.filter(f => {
            if (f.utility === utility) return true;
            if (utility === 'fun') {
                // 修复：当需求是娱乐时，也将买书(buy_book)作为一种选择，这样市民会去书架
                return ['fun', 'comfort', 'cinema_2d', 'cinema_3d', 'cinema_imax', 'buy_book'].includes(f.utility);
            }
            if (utility === 'hunger') {
                // 修复：当需求是饥饿时，将买饮料(buy_drink)作为选择，这样市民会去街道
                return ['hunger', 'eat_out', 'buy_drink'].includes(f.utility);
            }
            if (type.startsWith('skill_')) return false;
            return false;
        });

        if (candidates.length === 0) {
            candidates = FURNITURE.filter(f => f.utility === type);
        }

        if (candidates.length) {
            candidates = candidates.filter(f => !f.cost || f.cost <= this.money);

            if (candidates.length) {
                let obj = candidates[Math.floor(Math.random() * candidates.length)];
                this.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
                this.interactionTarget = obj;
                return;
            }
        }
        this.wander();
    }

    findHuman() {
        let others = GameStore.sims.filter(s => s.id !== this.id && s.action !== 'sleeping' && s.action !== 'working');
        others.sort((a, b) => {
            let relA = (this.relationships[a.id]?.friendship || 0) + this.getCompatibility(a) * 5;
            let relB = (this.relationships[b.id]?.friendship || 0) + this.getCompatibility(b) * 5;
            return relB - relA;
        });

        if (others.length) {
            let partner = others[Math.floor(Math.random() * Math.min(others.length, 3))];
            this.target = { x: partner.pos.x, y: partner.pos.y };
            this.interactionTarget = { type: 'human', ref: partner };
        } else {
            this.wander();
        }
    }

    wander() {
        let minX = 20, maxX = 880;
        if (Math.random() < 0.6) { minX = 220; maxX = 300; }

        this.target = { x: minX + Math.random() * (maxX - minX), y: 50 + Math.random() * 600 };
        this.action = 'wandering';
        this.actionTimer = minutes(30);
    }

    startInteraction() {
        if (!this.interactionTarget) return;

        if (this.interactionTarget.type === 'human') {
            let partner = this.interactionTarget.ref;
            const dist = Math.sqrt(Math.pow(this.pos.x - partner.pos.x, 2) + Math.pow(this.pos.y - partner.pos.y, 2));
            if (dist > 80 || partner.action === 'sleeping' || partner.action === 'working') {
                this.reset();
                this.wander();
                return;
            }
            this.action = 'talking';
            this.actionTimer = minutes(40);
            if (partner.action !== 'talking') {
                partner.reset();
                partner.action = 'talking';
                partner.actionTimer = minutes(40);
            }
            this.performSocial(partner);
        } else {
            let obj = this.interactionTarget;

            if (obj.cost && obj.cost > this.money) {
                this.say("太贵了...", 'bad');
                this.reset();
                return;
            }

            if (obj.cost) {
                this.money -= obj.cost;
                this.dailyExpense += obj.cost;
                this.dailyBudget -= obj.cost;
                GameStore.addLog(this, `消费: ${obj.label} -$${obj.cost}`, 'money');
            }

            this.action = 'using';
            let verb = "使用";
            let duration = minutes(30);

            if (obj.utility === 'buy_drink') {
                if (this.money >= 5) { this.money -= 5; this.needs.hunger += 5; this.needs.fun += 5; this.say("咕嘟咕嘟", 'act'); }
                duration = minutes(5);
            }
            else if (obj.utility === 'buy_book') {
                if (this.money >= 60) { this.buyItem(ITEMS.find(i => i.id === 'book')); }
                duration = minutes(15);
            }
            else if (obj.utility.startsWith('cinema_')) {
                verb = "看电影 🎬";
                this.action = "watching_movie";
                duration = minutes(120);
                this.say(verb, 'act');
                this.addBuff(BUFFS.movie_fun);
            }
            else if (obj.utility === 'gym_run') {
                verb = "跑步 🏃"; duration = minutes(60);
            }
            else if (obj.utility === 'gym_yoga') {
                verb = "瑜伽 🧘"; duration = minutes(60);
            }
            else if (obj.utility === 'eat_out') {
                verb = "用餐 🍴";
                this.action = "eating";
                duration = minutes(60);
                this.addBuff(BUFFS.good_meal);
            }
            else if (obj.utility === 'gardening') { verb = "修剪花草 🌻"; duration = minutes(90); }
            else if (obj.utility === 'fishing') { verb = "钓鱼 🎣"; duration = minutes(120); }
            else if (obj.utility === 'energy') {
                verb = "睡觉 💤";
                this.action = "sleeping";
                duration = minutes(600);
            }
            else if (obj.utility === 'hunger') { verb = "做饭 🍳"; this.action = "eating"; duration = minutes(60); }
            else if (obj.utility === 'cooking') { verb = "练习厨艺 🍲"; duration = minutes(90); }
            else if (obj.utility === 'work') {
                verb = "工作 💻";
                this.action = "working";
                duration = 9999;
            }
            else {
                if (obj.label.includes('沙发')) { verb = "葛优躺"; duration = minutes(60); }
                if (obj.label.includes('马桶')) { verb = "方便"; duration = minutes(10); }
                if (obj.label.includes('淋浴')) { verb = "洗澡"; duration = minutes(20); }
                if (obj.label.includes('电脑')) { verb = "上网 ⌨️"; duration = minutes(90); }
                if (obj.label.includes('音响')) { verb = "听歌 🎵"; duration = minutes(45); }
            }

            this.actionTimer = duration;
            if (duration < 900 && Math.random() < 0.5) this.say(verb, 'act');
        }
    }

    reset() {
        this.target = null;
        this.interactionTarget = null;
        this.action = 'idle';
        this.actionTimer = 0;
    }

    getCompatibility(partner: Sim) {
        let score = 0;
        for (let i = 0; i < 4; i++) if (this.mbti[i] === partner.mbti[i]) score++;
        if (this.zodiac.element === partner.zodiac.element) score += 2;
        else if (ELE_COMP[this.zodiac.element].includes(partner.zodiac.element)) score += 1;
        else score -= 1;
        return Math.max(0, score);
    }

    checkSexualOrientation(partner: Sim) {
        if (this.orientation === 'bi') return true;
        if (this.orientation === 'hetero') return this.gender !== partner.gender;
        if (this.orientation === 'homo') return this.gender === partner.gender;
        return false;
    }

    hasOtherPartner(partner: Sim) {
        for (let id in this.relationships) {
            if (id !== partner.id && this.relationships[id].romance > 80 && this.relationships[id].isLover) return true;
        }
        return false;
    }

    triggerJealousy(actor: Sim, target: Sim) {
        let sensitivity = 60;
        if (this.mbti.includes('F')) sensitivity -= 10;
        if (this.zodiac.element === 'water' || this.zodiac.element === 'fire') sensitivity -= 10;

        let relActor = this.relationships[actor.id]?.romance || 0;
        let relTarget = this.relationships[target.id]?.romance || 0;

        if (relActor > sensitivity || relTarget > sensitivity) {
            this.say("💢 吃醋!", 'bad');
            let oldLabelA = this.getRelLabel(this.relationships[actor.id] || {});
            let oldLabelT = this.getRelLabel(this.relationships[target.id] || {});

            const impact = -40 * this.socialModifier;

            this.updateRelationship(actor, 'friendship', impact);
            this.updateRelationship(actor, 'romance', impact);
            this.updateRelationship(target, 'friendship', impact);
            this.updateRelationship(target, 'romance', impact);

            this.checkRelChange(actor, oldLabelA);
            this.checkRelChange(target, oldLabelT);

            GameStore.addLog(this, `目睹 ${actor.name} 和 ${target.name} 亲热，吃醋了！`, 'jealous');
        }
    }

    getRelLabel(rel: any) {
        let r = rel.romance || 0;
        let isLover = rel.isLover;
        if (isLover) return '恋人';
        if (r > 80) return '爱慕';
        if (r > 60) return '喜欢';
        if (r > 40) return '暧昧';
        if (r > 20) return '好感';
        if (r > 10) return '心动';
        if (r >= 0) return '无感';
        if (r > -30) return '嫌弃';
        if (r > -60) return '反感';
        return '厌恶';
    }

    getFriendLabel(val: number) {
        if (val > 80) return '挚友';
        if (val > 50) return '好友';
        if (val > 30) return '朋友';
        if (val > 10) return '熟人';
        if (val >= -10) return '陌生人';
        if (val >= -30) return '不顺眼';
        if (val >= -50) return '摩擦';
        if (val >= -80) return '矛盾';
        if (val >= -100) return '死对头';
        return '仇人';
    }

    checkRelChange(partner: Sim, oldLabel: string) {
        let newLabel = this.getRelLabel(this.relationships[partner.id] || {});
        if (oldLabel !== newLabel && (newLabel === '恋人' || newLabel === '爱慕' || newLabel === '死对头')) {
            GameStore.addLog(this, `与 ${partner.name} 的关系变成了 ${newLabel}`, 'rel_event');
        }
    }

    performSocial(partner: Sim) {
        const comp = this.getCompatibility(partner);
        if (!this.relationships[partner.id]) this.relationships[partner.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };
        if (!partner.relationships[this.id]) partner.relationships[this.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };

        let rel = this.relationships[partner.id];
        let oldLabel = this.getRelLabel(rel);

        let availableActions = SOCIAL_TYPES.filter(type => {
            if (type.type === 'friendship') {
                return rel.friendship >= type.minVal && rel.friendship <= type.maxVal;
            } else if (type.type === 'romance') {
                let romantic = rel.romance >= type.minVal && rel.romance <= type.maxVal;
                if (type.special === 'confess') return !rel.isLover && rel.romance >= 40;
                if (type.special === 'breakup') return rel.isLover && rel.romance < -60;
                if (type.special === 'pickup') return !rel.hasRomance && rel.romance < 20;
                if (!rel.hasRomance && type.special !== 'pickup') return false;
                return romantic;
            }
            return false;
        });

        let canBeRomantic = this.checkSexualOrientation(partner);
        if (canBeRomantic && this.faithfulness > 70 && this.hasOtherPartner(partner)) {
            canBeRomantic = false;
        }
        else if (canBeRomantic && this.faithfulness < 40 && this.hasOtherPartner(partner)) {
            if (Math.random() > 0.4) canBeRomantic = false;
        }

        if (!canBeRomantic) {
            availableActions = availableActions.filter(t => t.type !== 'romance');
        }

        if (availableActions.length === 0) availableActions = [SOCIAL_TYPES[0]];

        let romanceActions = availableActions.filter(t => t.type === 'romance');
        let finalType;

        let romanticProb = 0.4;
        if (this.mbti.includes('F')) romanticProb += 0.2;
        if (this.faithfulness < 40) romanticProb += 0.2;
        if (this.hasBuff('in_love')) romanticProb += 0.3;

        if (romanceActions.length > 0 && Math.random() < romanticProb) {
            finalType = romanceActions[Math.floor(Math.random() * romanceActions.length)];
        } else {
            finalType = availableActions[Math.floor(Math.random() * availableActions.length)];
        }

        let success = true;
        if (finalType.type === 'romance') {
            if (partner.faithfulness > 70 && partner.hasOtherPartner(this)) success = false;
            if (finalType.minVal > partner.relationships[this.id].romance + 15) success = false;
            if (finalType.special === 'breakup') success = true;
        }

        if (success) {
            if (finalType.special === 'confess') {
                if (partner.relationships[this.id].romance > 40) {
                    rel.isLover = true;
                    partner.relationships[this.id].isLover = true;
                    GameStore.addLog(this, `向 ${partner.name} 表白成功！两人成为了恋人 ❤️`, 'rel_event');
                    GameStore.spawnHeart(this.pos.x, this.pos.y);
                    this.addBuff(BUFFS.in_love);
                    partner.addBuff(BUFFS.in_love);
                } else {
                    success = false;
                    GameStore.addLog(this, `向 ${partner.name} 表白被拒绝了...`, 'rel_event');
                    this.updateRelationship(partner, 'romance', -10);
                }
            } else if (finalType.special === 'breakup') {
                rel.isLover = false;
                partner.relationships[this.id].isLover = false;
                GameStore.addLog(this, `和 ${partner.name} 分手了... 💔`, 'rel_event');
                this.addBuff(BUFFS.heartbroken);
                partner.addBuff(BUFFS.heartbroken);
            } else {
                let val = finalType.val;
                val += comp * 1.5;

                if (finalType.type === 'romance') {
                    rel.hasRomance = true;
                    partner.relationships[this.id].hasRomance = true;
                }

                if (finalType.id === 'argue' && rel.romance > 60) {
                    this.updateRelationship(partner, 'romance', -15);
                    partner.updateRelationship(this, 'romance', -15);
                }

                this.updateRelationship(partner, finalType.type, val * this.socialModifier);
                partner.updateRelationship(this, finalType.type, val * partner.socialModifier);

                if (finalType.logType === 'love') {
                    GameStore.spawnHeart(this.pos.x, this.pos.y);
                    GameStore.sims.forEach(sim => {
                        if (sim.id !== this.id && sim.id !== partner.id) {
                            const dist = Math.sqrt(Math.pow(this.pos.x - sim.pos.x, 2) + Math.pow(this.pos.y - sim.pos.y, 2));
                            if (dist < 150) sim.triggerJealousy(this, partner);
                        }
                    });
                }

                let text = this.getDefaultDialogue(finalType.id);
                this.say(text, finalType.logType === 'love' ? 'love' : (finalType.logType === 'bad' ? 'bad' : 'normal'));
                setTimeout(() => partner.say(finalType.id === 'argue' ? "哼！" : "...", 'normal'), 800);
                let sign = val > 0 ? '+' : '';
                let labelStr = finalType.type === 'romance' ? '浪漫' : '友谊';
                if (finalType.special !== 'confess' && finalType.special !== 'breakup') {
                    GameStore.addLog(this, `与 ${partner.name} ${finalType.label} (${labelStr} ${sign}${Math.floor(val)})`, finalType.logType);
                }
            }
        } else {
            this.say("...", 'bad');
            setTimeout(() => partner.say("不要...", 'bad'), 800);
            this.updateRelationship(partner, finalType.type, -5);
            GameStore.addLog(this, `想对 ${partner.name} ${finalType.label} 但被拒绝了。`, 'bad');
        }

        this.checkRelChange(partner, oldLabel);
    }

    getDefaultDialogue(typeId: string) {
        if (typeId === 'chat') return "最近好吗？";
        if (typeId === 'joke') return "哈哈哈哈！";
        if (typeId === 'argue') return "你走开！";
        if (typeId === 'gossip') return "你听说了吗？";
        if (typeId === 'flirt') return "你真迷人~";
        if (typeId === 'kiss') return "Mua!";
        if (typeId === 'pickup') return "嗨，认识一下？";
        if (typeId === 'deep_talk') return "你的梦想是？";
        if (typeId === 'hug') return "抱抱~";
        if (typeId === 'propose') return "嫁给我吧！";
        if (typeId === 'greet') return "你好！";
        return "~";
    }

    updateRelationship(target: Sim, type: string, delta: number) {
        if (!this.relationships[target.id]) this.relationships[target.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };
        let rel = this.relationships[target.id];
        if (type === 'friendship') {
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + delta));
        } else if (type === 'romance') {
            rel.romance = Math.max(-100, Math.min(100, rel.romance + delta));
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + delta * 0.3));
        }
    }

    finishAction() {
        if (this.action === 'sleeping') {
            this.needs.energy = 100;
            this.addBuff(BUFFS.well_rested);
        }
        if (this.action === 'eating') this.needs.hunger = 100;
        if (this.action === 'using' && this.interactionTarget) {
            let u = this.interactionTarget.utility;
            if (!u.startsWith('buy_') && this.needs[u] !== undefined && this.needs[u] > 90) this.needs[u] = 100;
        }
        if (this.action === 'talking') this.needs.social = 100;
        this.reset();
    }

    say(text: string, type: string = 'normal') {
        this.bubble.text = text;
        this.bubble.timer = 150;
        this.bubble.type = type;
    }
}