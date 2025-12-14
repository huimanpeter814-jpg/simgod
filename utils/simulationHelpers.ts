import { SimData, Job } from '../types';
import { CONFIG, FURNITURE } from '../constants';
import { getAsset } from './assetLoader'; // [新功能] 引用资源加载器

// 将游戏分钟转换为 tick 数 (1 游戏分钟 = 60 ticks)
export const minutes = (m: number) => m * 60;

// 计算特定职业的工位容量
export const getJobCapacity = (job: Job) => {
    let searchLabels: string[] = [];
    
    // Level 1-3 share common desks, Level 4 gets executive desks (where available)
    if (job.companyType === 'internet') {
        searchLabels = job.level >= 4 ? ['CTO'] : ['开发'];
    } else if (job.companyType === 'design') {
        searchLabels = job.level >= 4 ? ['总监'] : ['设计'];
    } else if (job.companyType === 'business') {
        // Business L4 shares normal desks currently unless we add a specific manager desk
        searchLabels = ['商务', '经理']; 
    } else if (job.companyType === 'store') {
        // [修改] 增加 '售票' 关键词，让电影院员工能找到 ticket_booth
        searchLabels = ['前台', '管理', '售票', '柜台','服务台'];
    } else if (job.companyType === 'restaurant') {
        // [修改] 确保这些关键词匹配 scene.ts 里的 label
        // 后厨 -> 匹配 '后厨备菜台', '后厨灶台'
        // 前台/雅座 -> 匹配 '餐厅前台', '雅座'
        searchLabels = job.title.includes('厨') ? ['后厨', '灶台'] : ['餐厅前台', '雅座']; 
    }
    else {
        return 0; // Unemployed
    }

    // 统计符合该职业需求的家具数量
    // For waiters/store clerks, we might want higher capacity than just 1 counter
    // Simple heuristic: if it's a service job, allow more capacity than furniture count to simulate "standing"
    let capacity = FURNITURE.filter(f => 
        f.utility === 'work' && searchLabels.some(l => f.label.includes(l))
    ).length;

    if (job.companyType === 'store' || job.companyType === 'restaurant') {
        capacity += 2; // Allow some slack for service workers
    }
    
    // For level 4 (Bosses), strictly limit to 1 per unique furniture usually
    if (job.level === 4 && job.companyType !== 'restaurant') {
        return Math.max(1, capacity);
    }

    return Math.max(1, capacity * 2); // Assume 2 shifts or shared desks for lower levels
};

// 绘制头像 (支持图片绘制)
export function drawAvatarHead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sim: SimData) {
    let s = size;

    // 1. 尝试绘制脸部图片
    const faceImg = getAsset(sim.appearance.face);
    if (faceImg) {
        ctx.drawImage(faceImg, x - s, y - s, s * 2, s * 2);
    } else {
        // [回退] 默认绘制逻辑
        ctx.fillStyle = sim.skinColor;
        ctx.fillRect(x - s, y - s, s * 2, s * 2);

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(x - s / 2, y - 1, 2, 2);
        ctx.fillRect(x + s / 2 - 2, y - 1, 2, 2);
    }

    // 2. 尝试绘制发型图片
    const hairImg = getAsset(sim.appearance.hair);
    if (hairImg) {
        // 发型图片通常稍微大一点或位置调整，视图片素材而定
        // 假设素材是完整的头部发型覆盖
        ctx.drawImage(hairImg, x - s-(s*0.25), y - s - (s * 0.3), s * 2.5, s * 2.5);
    } else {
        // [回退] 默认绘制逻辑
        ctx.fillStyle = sim.hairColor;
        ctx.fillRect(x - s, y - s - 2, s * 2, s * 0.6);
        if (sim.gender === 'F') {
            ctx.fillRect(x - s - 2, y - s, s * 0.4, s * 2.5);
            ctx.fillRect(x + s - 2, y - s, s * 0.4, s * 2.5);
        } else {
            ctx.fillRect(x - s, y - s, s * 0.4, s);
            ctx.fillRect(x + s - 4, y - s, s * 0.4, s);
        }
    }
}