import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { FURNITURE } from '../../constants';
import { minutes } from '../simulationHelpers';
import { Furniture } from '../../types';

export const DecisionLogic = {
    decideAction(sim: Sim) {
        // 1. 检查紧急需求 (< 40)
        let critical = [
            { id: 'energy', val: sim.needs.energy },
            { id: 'hunger', val: sim.needs.hunger },
            { id: 'bladder', val: sim.needs.bladder },
            { id: 'hygiene', val: sim.needs.hygiene }
        ].filter(n => n.val < 40);

        if (critical.length > 0) {
            critical.sort((a, b) => a.val - b.val);
            DecisionLogic.findObject(sim, critical[0].id);
            return;
        }

        // 2. 计算各需求评分
        let scores = [
            { id: 'energy', score: (100 - sim.needs.energy) * 3.0, type: 'obj' },
            { id: 'hunger', score: (100 - sim.needs.hunger) * 2.5, type: 'obj' },
            { id: 'bladder', score: (100 - sim.needs.bladder) * 2.8, type: 'obj' },
            { id: 'hygiene', score: (100 - sim.needs.hygiene) * 1.5, type: 'obj' },
            { id: 'fun', score: (100 - sim.needs.fun) * 1.2, type: 'fun' },
            { id: 'social', score: (100 - sim.needs.social) * 1.5, type: 'social' }
        ];

        // [核心逻辑] 只有无业游民(自由职业)才会尝试赚钱 (Side Hustle)
        // 避免上班族在下班时间去抢电脑赚外快，上班族依靠薪水生活
        if (sim.job.id === 'unemployed') {
            let moneyDesire = 0;
            if (sim.money < 500) moneyDesire = 200; 
            else if (sim.money < 2000) moneyDesire = 100;
            else if (sim.lifeGoal.includes('富翁')) moneyDesire = 80;
            
            if (sim.skills.coding > 10) moneyDesire += sim.skills.coding;
            if (sim.skills.fishing > 10) moneyDesire += sim.skills.fishing;
            if (sim.skills.creativity > 10) moneyDesire += sim.skills.creativity;

            if (moneyDesire > 0) {
                scores.push({ id: 'side_hustle', score: moneyDesire, type: 'work' });
            }
        }

        // 技能练习加分
        for (let skillKey in sim.skills) {
            let talent = sim.skillModifiers[skillKey] || 1;
            let skillScore = (100 - sim.needs.fun) * 0.5 * talent;
            scores.push({ id: `skill_${skillKey}`, score: skillScore, type: 'obj' });
        }

        // 特殊活动加分
        if (sim.needs.fun < 50 && sim.money > 100) {
            scores.push({ id: 'cinema_imax', score: 90, type: 'obj' });
            scores.push({ id: 'gym_run', score: 60, type: 'obj' });
        }
        
        // 艺术爱好者加分 (去美术馆)
        if (sim.needs.fun < 70 && (sim.mbti.includes('N') || sim.skills.creativity > 20)) {
             scores.push({ id: 'art', score: 85, type: 'obj' });
        }
        
        // 孩子气或心情不好加分 (去游乐场)
        if (sim.needs.fun < 60 && (sim.mbti.includes('P') || sim.mood < 40)) {
            scores.push({ id: 'play', score: 80, type: 'obj' });
        }

        // 性格影响社交加分
        let socialNeed = scores.find(s => s.id === 'social');
        if (socialNeed) {
            if (sim.mbti.startsWith('E')) socialNeed.score *= 1.5;
            if (sim.mood < 30) socialNeed.score = 0;
        }

        // 3. 做出决策
        scores.sort((a, b) => b.score - a.score);
        let choice = scores[Math.floor(Math.random() * Math.min(scores.length, 3))];

        if (choice.score > 20) {
            if (choice.id === 'social') DecisionLogic.findHuman(sim);
            else if (choice.id === 'side_hustle') DecisionLogic.findSideHustle(sim);
            else DecisionLogic.findObject(sim, choice.id);
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findSideHustle(sim: Sim) {
        let options: { type: string; target: Furniture }[] = [];

        // 1. Coding/Writing (Need PC)
        if (sim.skills.logic > 5 || sim.skills.creativity > 5) {
            let pcs = FURNITURE.filter(f => f.label.includes('电脑') && (!f.reserved || f.reserved === sim.id));
            if (pcs.length > 0) options.push({ type: 'pc', target: pcs[0] });
        }

        // 2. Fishing (Need Lake)
        let lake = GameStore.furnitureIndex.get('fishing')?.[0]; // 使用索引
        if (lake) options.push({ type: 'lake', target: lake });

        // 3. Gardening (Need Flower)
        let flowers = GameStore.furnitureIndex.get('gardening') || []; // 使用索引
        if (flowers.length > 0) options.push({ type: 'garden', target: flowers[Math.floor(Math.random() * flowers.length)] });

        if (options.length > 0) {
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            sim.isSideHustle = true; // 标记为赚外快，InteractionRegistry 会据此发放收益
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findObject(sim: Sim, type: string) {
        let utility = type;

        const simpleMap: Record<string, string> = {
             hunger: 'hunger', bladder: 'bladder', hygiene: 'hygiene',
             cooking: 'cooking', gardening: 'gardening', fishing: 'fishing',
             art: 'art', play: 'play'
        };
        
        if (simpleMap[type]) utility = simpleMap[type];

        let candidates: Furniture[] = [];

        if (type === 'fun') {
            const funTypes = ['fun', 'cinema_2d', 'cinema_3d', 'cinema_imax', 'art', 'play', 'fishing'];
            if (sim.needs.energy < 70) funTypes.push('comfort');
            
            funTypes.forEach(t => {
                const list = GameStore.furnitureIndex.get(t);
                if (list) candidates = candidates.concat(list);
            });
        } else if (type === 'energy') {
             const beds = GameStore.furnitureIndex.get('energy') || [];
             candidates = candidates.concat(beds);
             if (sim.needs.energy < 30) {
                 const sofas = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(sofas);
             }
        } else if (type === 'hunger') {
            candidates = candidates.concat(GameStore.furnitureIndex.get('hunger') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('eat_out') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_drink') || []);
        } else {
            candidates = GameStore.furnitureIndex.get(utility) || [];
        }

        if (candidates.length) {
            candidates = candidates.filter((f: Furniture)=> {
                 if (f.cost && f.cost > sim.money) return false;
                 if (f.reserved && f.reserved !== sim.id) return false;
                 if (!f.multiUser) {
                     const isOccupied = GameStore.sims.some(s => s.id !== sim.id && s.interactionTarget?.id === f.id);
                     if (isOccupied) return false;
                 }
                 return true;
            });

            if (candidates.length) {
                candidates.sort((a: Furniture, b: Furniture) => {
                    const distA = Math.pow(a.x - sim.pos.x, 2) + Math.pow(a.y - sim.pos.y, 2);
                    const distB = Math.pow(b.x - sim.pos.x, 2) + Math.pow(b.y - sim.pos.y, 2);
                    return distA - distB;
                });

                let obj = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
                
                sim.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
                sim.interactionTarget = obj;
                return;
            }
        }
        DecisionLogic.wander(sim);
    },

    findHuman(sim: Sim) {
        let others = GameStore.sims.filter(s => s.id !== sim.id && s.action !== 'sleeping' && s.action !== 'working');
        others.sort((a, b) => {
            let relA = (sim.relationships[a.id]?.friendship || 0);
            let relB = (sim.relationships[b.id]?.friendship || 0);
            return relB - relA;
        });

        if (others.length) {
            let partner = others[Math.floor(Math.random() * Math.min(others.length, 3))];
            
            const angle = Math.random() * Math.PI * 2;
            const socialDistance = 40;
            
            sim.target = { 
                x: partner.pos.x + Math.cos(angle) * socialDistance, 
                y: partner.pos.y + Math.sin(angle) * socialDistance 
            };
            
            sim.interactionTarget = { type: 'human', ref: partner };
        } else {
            DecisionLogic.wander(sim);
        }
    },

    wander(sim: Sim) {
        let minX = 20, maxX = 1380;
        let minY = 50, maxY = 950;
        
        sim.target = { 
            x: minX + Math.random() * (maxX - minX), 
            y: minY + Math.random() * (maxY - minY) 
        };
        sim.action = 'wandering';
        sim.actionTimer = minutes(0);
    }
};