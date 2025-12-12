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
            else DecisionLogic.findObject(sim, choice.id);
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
        // 简单的兼容性排序，这里需要简单计算，避免循环依赖过于复杂，直接从 SocialLogic 复制简单逻辑或简化
        // 为了简化，这里我们仅根据关系值排序
        others.sort((a, b) => {
            let relA = (sim.relationships[a.id]?.friendship || 0);
            let relB = (sim.relationships[b.id]?.friendship || 0);
            return relB - relA;
        });

        if (others.length) {
            let partner = others[Math.floor(Math.random() * Math.min(others.length, 3))];
            sim.target = { x: partner.pos.x, y: partner.pos.y };
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