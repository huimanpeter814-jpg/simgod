import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { FURNITURE } from '../../constants';
import { minutes } from '../simulationHelpers';

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

        // [新增] 无业游民的赚钱动力 (Side Hustle)
        // 存款越少，动力越大。性格也会影响。
        if (sim.job.id === 'unemployed') {
            let moneyDesire = 0;
            if (sim.money < 500) moneyDesire = 200; // 极度缺钱
            else if (sim.money < 2000) moneyDesire = 100; // 有点缺钱
            else if (sim.lifeGoal.includes('富翁')) moneyDesire = 80; // 想发财
            
            // 技能越高，越倾向于去做对应的事
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
        // 根据技能和设施选择赚钱方式
        // 优先级: 电脑(写代码/小说) > 钓鱼 > 园艺
        let options = [];

        // 1. Coding/Writing (Need PC)
        if (sim.skills.logic > 5 || sim.skills.creativity > 5) {
            let pcs = FURNITURE.filter(f => f.label.includes('电脑') && (!f.reserved || f.reserved === sim.id));
            if (pcs.length > 0) options.push({ type: 'pc', target: pcs[0] });
        }

        // 2. Fishing (Need Lake)
        let lake = FURNITURE.find(f => f.utility === 'fishing');
        if (lake) options.push({ type: 'lake', target: lake });

        // 3. Gardening (Need Flower)
        let flowers = FURNITURE.filter(f => f.utility === 'gardening');
        if (flowers.length > 0) options.push({ type: 'garden', target: flowers[Math.floor(Math.random() * flowers.length)] });

        if (options.length > 0) {
            // 随机选一个，或者根据技能选
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            // 重要: 标记这是一个赚钱的动作，后续在 Sim.ts 中处理
            sim.isSideHustle = true;
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findObject(sim: Sim, type: string) {
        let map: any = {
            energy: 'energy', hunger: 'hunger', bladder: 'bladder', hygiene: 'hygiene', fun: 'fun',
            cooking: 'cooking', gardening: 'gardening', fishing: 'fishing'
        };
        let utility = map[type] || type;

        let candidates = FURNITURE.filter(f => {
            if (f.utility === utility) return true;
            if (utility === 'fun' && ['fun', 'comfort', 'cinema_2d', 'cinema_3d', 'cinema_imax'].includes(f.utility)) return true;
            if (utility === 'hunger' && ['hunger', 'eat_out'].includes(f.utility)) return true;
            if (type.startsWith('skill_')) return false;
            return false;
        });

        if (candidates.length === 0) {
            candidates = FURNITURE.filter(f => f.utility === type);
        }

        if (candidates.length) {
            candidates = candidates.filter(f => !f.cost || f.cost <= sim.money);

            if (candidates.length) {
                let obj = candidates[Math.floor(Math.random() * candidates.length)];
                sim.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
                sim.interactionTarget = obj;
                return;
            }
        }
        DecisionLogic.wander(sim);
    },

    findHuman(sim: Sim) {
        let others = GameStore.sims.filter(s => s.id !== sim.id && s.action !== 'sleeping' && s.action !== 'working');
        // 简单的兼容性排序
        others.sort((a, b) => {
            let relA = (sim.relationships[a.id]?.friendship || 0);
            let relB = (sim.relationships[b.id]?.friendship || 0);
            return relB - relA;
        });

        if (others.length) {
            let partner = others[Math.floor(Math.random() * Math.min(others.length, 3))];
            
            // [优化] 计算一个围绕对方的随机位置，保持“社交距离”
            const angle = Math.random() * Math.PI * 2;
            const socialDistance = 40; // 40像素的距离，防止重叠
            
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
        let minX = 20, maxX = 880;
        if (Math.random() < 0.6) { minX = 220; maxX = 300; }

        sim.target = { x: minX + Math.random() * (maxX - minX), y: 50 + Math.random() * 600 };
        sim.action = 'wandering';
        sim.actionTimer = minutes(30);
    }
};