import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, BUFFS, ITEMS, ASSET_CONFIG, FURNITURE, HOLIDAYS } from '../constants';
import { Vector2, Job, Buff, SimAppearance } from '../types';
import { GameStore } from './simulation';
import { minutes, getJobCapacity } from './simulationHelpers';
import { SocialLogic } from './logic/social';
import { DecisionLogic } from './logic/decision';

// [New] 定义各需求从 0 恢复到 100 所需的标准游戏分钟数
const RESTORE_TIMES: Record<string, number> = {
    bladder: 15,      // 上厕所很快
    hygiene: 25,      // 洗澡稍慢
    hunger: 45,       // 吃饭适中
    energy_sleep: 420,// 睡觉需要 7 小时
    energy_nap: 60,   // 小憩 1 小时
    fun: 90,          // 娱乐 1.5 小时
    social: 60,       // 社交 1 小时
    default: 60
};

export class Sim {
    // === 基础属性 ===
    id: string;
    pos: Vector2;
    prevPos: Vector2; 
    target: Vector2 | null = null;
    speed: number;
    gender: 'M' | 'F';
    name: string;
    
    // === 外观 ===
    skinColor: string;
    hairColor: string;
    clothesColor: string;
    appearance: SimAppearance;

    // === 性格与身份 ===
    mbti: string;
    zodiac: any;
    age: number;
    lifeGoal: string;
    orientation: string;
    faithfulness: number;

    // === 状态 ===
    needs: any;
    skills: any;
    relationships: any;
    buffs: Buff[];
    mood: number;
    
    // === 经济与职业 ===
    money: number;
    dailyBudget: number;
    workPerformance: number;
    job: Job;
    dailyExpense: number;
    dailyIncome: number; // [New]
    isSideHustle: boolean = false; // [New] 是否正在搞副业

    // === 内部系数 ===
    metabolism: any;
    skillModifiers: Record<string, number>;
    socialModifier: number;

    // === 行为控制 ===
    action: string;
    actionTimer: number;
    interactionTarget: any = null;
    bubble: { text: string | null; timer: number; type: string } = { text: null, timer: 0, type: 'normal' };

    constructor(x?: number, y?: number) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.pos = {
            x: x ?? (50 + Math.random() * (CONFIG.CANVAS_W - 100)),
            y: y ?? (50 + Math.random() * (CONFIG.CANVAS_H - 100))
        };
        this.prevPos = { ...this.pos }; 
        
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

        this.money = 1000 + Math.floor(Math.random() * 2000);

        // === 关键修复：先初始化这些属性，再调用 applyTraits ===
        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        // 现在可以安全调用了
        this.applyTraits();

        // === Smart Career Choice ===
        // Sim chooses career based on MBTI and Life Goal
        let preferredType = '';
        if (this.lifeGoal.includes('富翁') || this.mbti.includes('T')) preferredType = 'internet';
        else if (this.lifeGoal.includes('博学') || this.mbti.includes('N')) preferredType = 'design';
        else if (this.mbti.includes('E')) preferredType = 'business';
        else preferredType = Math.random() > 0.5 ? 'store' : 'restaurant';

        // Find available entry-level jobs (Level 1)
        const validJobs = JOBS.filter(j => {
            if (j.id === 'unemployed') return true;
            if (j.level !== 1) return false; // Start from bottom
            if (preferredType && j.companyType !== preferredType) return false;
            
            const capacity = getJobCapacity(j);
            const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
            return currentCount < capacity;
        });

        // Fallback to any level 1 job if preference full
        let finalJobChoice: Job | undefined = validJobs.length > 0 ? validJobs[Math.floor(Math.random() * validJobs.length)] : undefined;
        
        if (!finalJobChoice) {
             finalJobChoice = JOBS.find(j => j.id === 'unemployed');
        }

        // 安全兜底：防止 undefined
        if (!finalJobChoice) {
            finalJobChoice = { id: 'unemployed', title: '无业游民', level: 0, salary: 0, startHour: 0, endHour: 0, workDays: [] };
        }

        this.job = finalJobChoice;
        this.dailyExpense = 0;
        this.dailyIncome = 0; // [New] Init
        this.dailyBudget = 0;
        this.workPerformance = 0;

        this.buffs = [];
        this.mood = 80;

        this.action = 'idle';
        this.actionTimer = 0;

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

        const affordable = ITEMS.filter(item => item.cost <= this.dailyBudget && item.cost <= this.money);
        let bestItem: any = null;
        let maxScore = 0;

        affordable.forEach(item => {
            let score = 0;
            if (item.needs) {
                if (item.needs.hunger && this.needs.hunger < 60) score += item.needs.hunger * 2;
                if (item.needs.fun && this.needs.fun < 60) score += item.needs.fun * 2;
                if (item.needs.energy && this.needs.energy < 50 && item.needs.energy > 0) score += 20;
            }
            if (item.skill) {
                if (this.lifeGoal.includes('博学') || this.lifeGoal.includes('富翁')) score += 30;
                if (this.mbti.includes('N') && item.skill === 'logic') score += 20;
                if (this.zodiac.element === 'fire' && item.skill === 'athletics') score += 20;
            }
            if (item.trigger === 'rich_hungry' && this.money > 5000) score += 50;
            if (item.trigger === 'addicted' && this.mbti.includes('P') && this.needs.fun < 30) score += 100;
            if (item.trigger === 'love' && this.hasBuff('in_love')) score += 80;

            score += Math.random() * 20;

            if (score > 50 && score > maxScore) {
                maxScore = score;
                bestItem = item;
            }
        });

        if (bestItem) {
            if (['drink', 'book'].includes(bestItem.id)) {
                this.buyItem(bestItem);
            }
        }
        
        // [New] Check for Resignation Logic (Daily Check)
        this.checkCareerSatisfaction();
    }
    
    checkCareerSatisfaction() {
        if (this.job.id === 'unemployed') return;
        
        // Factors to quit: Low Mood, High Stress, Mismatch Personality, Rich enough
        let quitScore = 0;
        if (this.mood < 30) quitScore += 20;
        if (this.hasBuff('stressed') || this.hasBuff('anxious')) quitScore += 30;
        if (this.money > 10000) quitScore += 10; // I'm rich, I don't need this!
        
        // Personality Mismatch
        if (this.job.companyType === 'internet' && this.mbti.includes('F')) quitScore += 10;
        if (this.job.companyType === 'business' && this.mbti.includes('I')) quitScore += 15;
        
        if (Math.random() * 100 < quitScore && quitScore > 50) {
            GameStore.addLog(this, `决定辞职... "这工作不适合我"`, 'sys');
            this.job = JOBS.find(j => j.id === 'unemployed')!;
            this.workPerformance = 0;
            this.say("我不干了! 💢", 'bad');
            this.addBuff(BUFFS.well_rested); // Relief
        }
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

        if (item.buff) this.addBuff(BUFFS[item.buff as keyof typeof BUFFS]);

        let logSuffix = "";
        if (item.rel) {
            const loverId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover) {
                    SocialLogic.updateRelationship(lover, this, 'romance', 10);
                    lover.needs.fun = Math.min(100, lover.needs.fun + 20);
                    logSuffix = ` (送给 ${lover.name})`;
                }
            }
        }

        this.say(`💸 ${item.label}`, 'act');
        GameStore.addLog(this, `购买了 ${item.label} -$${item.cost}${logSuffix}`, 'money');
    }

    update(dt: number, minuteChanged: boolean) {
        this.prevPos = { ...this.pos };
        const f = 0.0008 * dt;

        if (minuteChanged) {
            this.updateBuffs(1);
        }

        this.checkSchedule();
        this.updateMood();

        // 1. 自然衰减
        if (this.action !== 'sleeping') this.needs.energy -= BASE_DECAY.energy * this.metabolism.energy * f;
        if (this.action !== 'eating') this.needs.hunger -= BASE_DECAY.hunger * this.metabolism.hunger * f;
        if (this.action !== 'watching_movie') this.needs.fun -= BASE_DECAY.fun * this.metabolism.fun * f;
        this.needs.bladder -= BASE_DECAY.bladder * this.metabolism.bladder * f;
        this.needs.hygiene -= BASE_DECAY.hygiene * this.metabolism.hygiene * f;
        if (this.action !== 'talking' && this.action !== 'watching_movie') this.needs.social -= BASE_DECAY.social * this.metabolism.social * f;

        // 2. 行为恢复: 核心修复逻辑
        const getRate = (mins: number) => (100 / (mins * 60)) * dt;

        if (this.action === 'working') {
            this.needs.energy -= BASE_DECAY.energy * 0.5 * f;
            this.needs.fun -= BASE_DECAY.fun * 0.8 * f;
            // 缓慢恢复以免在工作中饿死
            const slowRefill = getRate(240); 
            if (this.needs.hunger < 30) this.needs.hunger += slowRefill;
            if (this.needs.bladder < 30) this.needs.bladder += slowRefill;
            if (this.needs.hygiene < 30) this.needs.hygiene += slowRefill;
            if (this.needs.social < 30) this.needs.social += slowRefill;
            
            if (this.interactionTarget) this.pos = { ...this.interactionTarget };
        }
        else if (this.action === 'sleeping') {
            let rate = getRate(RESTORE_TIMES.energy_sleep);
            if (this.hasBuff('well_rested')) rate *= 1.2;
            this.needs.energy += rate;
            if (this.needs.energy >= 100) this.finishAction();
        }
        else if (this.action === 'eating') {
            this.needs.hunger += getRate(RESTORE_TIMES.hunger);
            if (this.needs.hunger >= 100) this.finishAction();
        }
        else if (this.action === 'talking') {
            this.needs.social += getRate(RESTORE_TIMES.social);
        }
        else if (this.action === 'watching_movie') {
            this.needs.fun += getRate(120);
            this.needs.energy -= getRate(600);
            const loverId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover && lover.action === 'watching_movie') {
                    this.needs.social += getRate(60);
                }
            }
        }
        else if (this.action === 'phone') {
            this.needs.fun += getRate(180);
            this.needs.social += getRate(240);
        }
        else if (this.action === 'using' && this.interactionTarget) {
            const u = this.interactionTarget.utility;
            
            if (u === 'gym_run' || u === 'gym_yoga') {
               this.skills.athletics += 0.08 * f;
               this.needs.energy -= getRate(120);
               this.needs.hygiene -= getRate(240);
            }
            else if (u === 'gardening') {
                this.skills.gardening += 0.05 * f;
                this.needs.fun += getRate(180);
                this.needs.energy -= getRate(240);
            }
            else if (u === 'fishing') {
                this.skills.fishing += 0.05 * f;
                this.needs.fun += getRate(180);
            }
            else if (u === 'cooking') {
                this.skills.cooking += 0.05 * f;
            }
            else {
                let time = RESTORE_TIMES[u] || RESTORE_TIMES.default;
                
                if (u === 'energy' && (this.interactionTarget.label.includes('沙发') || this.interactionTarget.label.includes('长椅'))) {
                    time = RESTORE_TIMES.energy_nap;
                }

                if (this.needs[u] !== undefined) {
                    this.needs[u] += getRate(time);
                }
                
                if (time === RESTORE_TIMES.energy_nap) {
                     this.needs.comfort = 100;
                }
            }
        }

        // 3. 限制范围与结束检查
        for (let k in this.needs) this.needs[k] = Math.max(0, Math.min(100, this.needs[k]));

        if (this.action === 'using' && this.interactionTarget && ['bladder', 'hygiene', 'energy'].includes(this.interactionTarget.utility)) {
             if (this.needs[this.interactionTarget.utility] >= 100) this.finishAction();
        }

        if (this.actionTimer > 0) {
            this.actionTimer -= dt;
            if (this.actionTimer <= 0) this.finishAction();
        } else if (!this.target) {
            DecisionLogic.decideAction(this);
        }

        // 4. 移动逻辑
        if (this.target) {
            const dist = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2));
            if (dist < 8) {
                this.pos = this.target;
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
        if (this.bubble.timer > 0) this.bubble.timer -= dt;
    }

    checkSchedule() {
        if (this.job.id === 'unemployed') return;

        // [New] 检查是否是节日
        const isHoliday = HOLIDAYS.some(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
        
        // [New] 检查是否是工作日
        const isWorkDay = this.job.workDays.includes(GameStore.time.weekday);

        // 如果是节日或者不是工作日，则今天放假
        if (isHoliday || !isWorkDay) return;

        const currentHour = GameStore.time.hour;
        const isWorkTime = currentHour >= this.job.startHour && currentHour < this.job.endHour;

        if (isWorkTime && this.action !== 'working' && this.action !== 'commuting') {
            let deskSearchLabel = '工位';
            // Find desk logic ...
            let searchLabels: string[] = [];
            if (this.job.companyType === 'internet') {
                searchLabels = this.job.level >= 4 ? ['CTO'] : ['开发'];
            } else if (this.job.companyType === 'design') {
                searchLabels = this.job.level >= 4 ? ['总监'] : ['设计'];
            } else if (this.job.companyType === 'business') {
                searchLabels = ['商务', '经理'];
            } else if (this.job.companyType === 'store') {
                searchLabels = ['前台'];
            } else if (this.job.companyType === 'restaurant') {
                searchLabels = this.job.title.includes('厨') ? ['后厨'] : ['前台', '雅座']; // Waiters stand near tables or counter
            }

            const desk = FURNITURE.find(f =>
                searchLabels.some(l => f.label.includes(l)) &&
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
                const randomSpot = { x: 800 + Math.random()*100, y: 350 + Math.random()*100 };
                this.target = randomSpot;
                this.action = 'commuting';
            }
        } else if (!isWorkTime && (this.action === 'working' || this.action === 'commuting')) {
            this.action = 'idle';
            this.target = null;
            this.interactionTarget = null;
            this.money += this.job.salary;
            this.dailyIncome += this.job.salary; // [New] Add salary to daily income
            this.say(`下班! +$${this.job.salary}`, 'money');
            this.addBuff(BUFFS.stressed);

            // [Modified] Performance Logic
            let dailyPerf = 5; // Base lower
            
            // Skill Bonus
            if (this.job.companyType === 'internet' && this.skills.logic > 50) dailyPerf += 5;
            if (this.job.companyType === 'design' && this.skills.creativity > 50) dailyPerf += 5;
            if (this.job.companyType === 'business' && this.skills.logic > 30) dailyPerf += 3;
            
            if (this.mood > 80) dailyPerf += 3;
            if (this.hasBuff('well_rested')) dailyPerf += 3;
            if (this.needs.fun < 30) dailyPerf -= 5;
            
            this.workPerformance += dailyPerf;

            // Promotion Check (Slower threshold)
            if (this.workPerformance > 500 && this.job.level < 4) {
                this.promote();
                // Don't reset performance completely, keep some momentum
                this.workPerformance = 100;
            }
        }
    }

    promote() {
        const nextLevel = JOBS.find(j => j.companyType === this.job.companyType && j.level === this.job.level + 1);
        if (!nextLevel) return;

        const cap = getJobCapacity(nextLevel);
        const currentHolders = GameStore.sims.filter(s => s.job.id === nextLevel.id);
        
        if (currentHolders.length < cap) {
            // Smooth Promotion
            this.job = nextLevel;
            this.money += 1000;
            this.dailyIncome += 1000; // [New] Bonus
            GameStore.addLog(this, `升职了！现在是 ${nextLevel.title} (Lv.${nextLevel.level})`, 'sys');
            this.say("升职啦! 🚀", 'act');
            this.addBuff(BUFFS.promoted);
        } else {
            // PK Logic: Challenge existing holder
            // Find weakest holder (lowest performance or just random)
            const victim = currentHolders.sort((a, b) => a.workPerformance - b.workPerformance)[0];
            
            // Calculate PK Score
            // My Score: Performance + Skill + Mood
            let myScore = this.workPerformance + this.mood;
            if (this.job.companyType === 'internet') myScore += this.skills.logic * 2;
            else if (this.job.companyType === 'design') myScore += this.skills.creativity * 2;
            else myScore += this.skills.logic + this.skills.athletics; // General
            
            // Victim Score
            let vScore = victim.workPerformance + victim.mood;
            if (victim.job.companyType === 'internet') vScore += victim.skills.logic * 2;
            else if (victim.job.companyType === 'design') vScore += victim.skills.creativity * 2;
            else vScore += victim.skills.logic + victim.skills.athletics;

            if (myScore > vScore) {
                // Success: Swap jobs!
                const oldJob = this.job;
                this.job = nextLevel;
                victim.job = oldJob; // Victim gets demoted to my old position
                victim.workPerformance = 0; // Reset victim performance
                
                this.money += 1000;
                this.dailyIncome += 1000; // [New] Bonus
                this.addBuff(BUFFS.promoted);
                victim.addBuff(BUFFS.demoted);
                
                GameStore.addLog(this, `PK 成功！取代了 ${victim.name} 成为 ${nextLevel.title}`, 'sys');
                this.say("我赢了! 👑", 'act');
                victim.say("可恶... 😭", 'bad');
            } else {
                // Failed
                GameStore.addLog(this, `尝试晋升 ${nextLevel.title} 但 PK 失败了。`, 'sys');
                this.workPerformance -= 100; // Penalty
                this.say("还需要努力...", 'bad');
            }
        }
    }

    // === State Management ===
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

    // 代理方法
    getRelLabel(rel: any) {
        return SocialLogic.getRelLabel(rel);
    }

    getDialogue(typeId: string, target: Sim) {
        return SocialLogic.getDialogue(this, typeId, target);
    }

    triggerJealousy(actor: Sim, target: Sim) {
        SocialLogic.triggerJealousy(this, actor, target);
    }
    
    updateRelationship(target: Sim, type: string, delta: number) {
        SocialLogic.updateRelationship(this, target, type, delta);
    }

    startInteraction() {
        if (!this.interactionTarget) return;

        if (this.interactionTarget.type === 'human') {
            let partner = this.interactionTarget.ref;
            const dist = Math.sqrt(Math.pow(this.pos.x - partner.pos.x, 2) + Math.pow(this.pos.y - partner.pos.y, 2));
            if (dist > 80 || partner.action === 'sleeping' || partner.action === 'working') {
                this.reset();
                DecisionLogic.wander(this);
                return;
            }
            this.action = 'talking';
            this.actionTimer = minutes(40);
            if (partner.action !== 'talking') {
                partner.reset();
                partner.action = 'talking';
                partner.actionTimer = minutes(40);
            }
            SocialLogic.performSocial(this, partner);
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
            let durationMinutes = 30;

            if (obj.utility === 'buy_drink') {
                if (this.money >= 5) { this.money -= 5; this.needs.hunger += 5; this.needs.fun += 5; this.say("咕嘟咕嘟", 'act'); }
                durationMinutes = 5;
            }
            else if (obj.utility === 'buy_book') {
                if (this.money >= 60) { this.buyItem(ITEMS.find(i => i.id === 'book')); }
                durationMinutes = 15;
            }
            else if (obj.utility.startsWith('cinema_')) {
                verb = "看电影 🎬";
                this.action = "watching_movie";
                durationMinutes = 120;
                this.say(verb, 'act');
                this.addBuff(BUFFS.movie_fun);
            }
            else if (obj.utility === 'gym_run' || obj.utility === 'gym_yoga') durationMinutes = 60;
            else if (obj.utility === 'gardening') durationMinutes = 90;
            else if (obj.utility === 'fishing') durationMinutes = 120;
            else if (obj.utility === 'cooking') durationMinutes = 90;
            else if (obj.utility === 'work') {
                // If it's a side hustle (unemployed working on PC), change verb and logic
                if (this.isSideHustle) {
                     verb = "接单赚外快 💻";
                     durationMinutes = 180;
                } else {
                    verb = "工作 💻";
                    this.action = "working";
                    durationMinutes = 480; 
                }
            }
            else {
                let targetNeed = obj.utility;
                if (obj.utility === 'eat_out') targetNeed = 'hunger';
                
                let timePer100 = RESTORE_TIMES[targetNeed] || RESTORE_TIMES.default;
                if (targetNeed === 'energy' && (obj.label.includes('沙发') || obj.label.includes('长椅'))) {
                    timePer100 = RESTORE_TIMES.energy_nap;
                }

                if (targetNeed === 'energy') {
                    this.action = 'sleeping';
                    verb = "睡觉 💤";
                } else if (targetNeed === 'hunger' || obj.utility === 'eat_out') {
                    this.action = 'eating';
                    verb = "用餐 🍴";
                }

                if (this.needs[targetNeed] !== undefined) {
                    const missing = 100 - this.needs[targetNeed];
                    durationMinutes = (missing / 100) * timePer100 * 1.1; 
                    durationMinutes = Math.max(10, durationMinutes);
                }
                
                if (obj.label.includes('沙发')) verb = "葛优躺";
                if (obj.label.includes('马桶')) verb = "方便";
                if (obj.label.includes('淋浴')) verb = "洗澡";
                if (obj.label.includes('电脑') && !this.isSideHustle) verb = "上网 ⌨️";
            }

            this.actionTimer = minutes(durationMinutes);
            if (durationMinutes < 400 && Math.random() < 0.5) this.say(verb, 'act');
        }
    }

    reset() {
        this.target = null;
        this.interactionTarget = null;
        this.action = 'idle';
        this.actionTimer = 0;
        this.isSideHustle = false;
    }

    finishAction() {
        if (this.action === 'sleeping') {
            this.needs.energy = 100;
            this.addBuff(BUFFS.well_rested);
        }
        if (this.action === 'eating') this.needs.hunger = 100;
        
        // [New] Side Hustle Income Logic
        if (this.action === 'using' && this.interactionTarget) {
            let u = this.interactionTarget.utility;
            
            // 如果是无业游民且标记为副业
            if (this.isSideHustle) {
                let earned = 0;
                let skillUsed = '';
                
                if (this.interactionTarget.label.includes('电脑')) {
                    // Writing / Coding
                    skillUsed = this.skills.coding > this.skills.creativity ? 'coding' : 'writing';
                    let skillVal = this.skills.logic; // simplify to use logic as base
                    if (skillUsed === 'writing') skillVal = this.skills.creativity;
                    
                    earned = 50 + skillVal * 5; 
                    this.skills.logic += 0.5;
                    this.skills.creativity += 0.5;
                } else if (u === 'fishing') {
                    earned = 30 + this.skills.fishing * 8;
                    this.skills.fishing += 1;
                } else if (u === 'gardening') {
                    earned = 20 + this.skills.gardening * 6;
                    this.skills.gardening += 1;
                }
                
                if (earned > 0) {
                    earned = Math.floor(earned);
                    this.money += earned;
                    this.dailyIncome += earned; // [New] Add to daily income
                    GameStore.addLog(this, `通过副业赚了 $${earned}`, 'money');
                    this.say(`赚到了! +$${earned}`, 'money');
                    this.addBuff(BUFFS.side_hustle_win);
                }
            }

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