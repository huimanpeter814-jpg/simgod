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
        
        // [New] 艺术爱好者加分 (去美术馆)
        if (sim.needs.fun < 70 && (sim.mbti.includes('N') || sim.skills.creativity > 20)) {
             scores.push({ id: 'art', score: 85, type: 'obj' });
        }
        
        // [New] 孩子气或心情不好加分 (去游乐场)
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
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            sim.isSideHustle = true;
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findObject(sim: Sim, type: string) {
        // [Updated] Utility Map
        // 将抽象需求映射到具体的家具 utility
        let map: any = {
            energy: 'energy', hunger: 'hunger', bladder: 'bladder', hygiene: 'hygiene', fun: 'fun',
            cooking: 'cooking', gardening: 'gardening', fishing: 'fishing',
            art: 'art', play: 'play' // [New] Direct mapping
        };
        let utility = map[type] || type;

        // 1. 优先查找符合 utility 的家具
        let candidates = FURNITURE.filter(f => {
            if (f.utility === utility) return true;
            
            // [Complex Logic] Fun can be satisfied by many things
            if (utility === 'fun') {
                const funTypes = ['fun', 'cinema_2d', 'cinema_3d', 'cinema_imax', 'art', 'play', 'fishing'];
                // 只有当舒适度也算一种娱乐时才加上 comfort (比如葛优躺)
                if (sim.needs.energy < 70) funTypes.push('comfort'); 
                return funTypes.includes(f.utility);
            }
            
            // Hunger can be satisfied by fridge or restaurant
            if (utility === 'hunger') {
                return ['hunger', 'eat_out', 'buy_drink'].includes(f.utility);
            }
            
            return false;
        });

        // 2. 如果没找到，尝试按 ID 查找 (fallback)
        if (candidates.length === 0) {
            candidates = FURNITURE.filter(f => f.utility === type);
        }

        if (candidates.length) {
            // 过滤买不起的
            candidates = candidates.filter(f => !f.cost || f.cost <= sim.money);

            // 过滤被占用的 (单人设施)
            candidates = candidates.filter(f => {
                if (f.multiUser) return true;
                // 检查是否有人正在前往或使用该设施
                const isOccupied = GameStore.sims.some(s => s.id !== sim.id && s.interactionTarget?.id === f.id);
                return !isOccupied;
            });
            
            // 过滤私有设施 (Reserved)
            candidates = candidates.filter(f => !f.reserved || f.reserved === sim.id);

            if (candidates.length) {
                // 优先选择最近的
                candidates.sort((a, b) => {
                    const distA = Math.pow(a.x - sim.pos.x, 2) + Math.pow(a.y - sim.pos.y, 2);
                    const distB = Math.pow(b.x - sim.pos.x, 2) + Math.pow(b.y - sim.pos.y, 2);
                    return distA - distB;
                });

                // 取最近的3个里随机一个，避免死板
                let obj = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
                
                // 计算站位点 (家具中心)
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
        // [Updated] 扩大闲逛范围以覆盖新地图区域
        let minX = 20, maxX = 1380;
        let minY = 50, maxY = 950;
        
        sim.target = { 
            x: minX + Math.random() * (maxX - minX), 
            y: minY + Math.random() * (maxY - minY) 
        };
        sim.action = 'wandering';
        sim.actionTimer = minutes(30);
    }
};