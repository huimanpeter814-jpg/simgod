import { SimData, Job } from '../types';
import { CONFIG, FURNITURE } from '../constants';
import { getAsset } from './assetLoader'; // [新功能] 引用资源加载器

// 将游戏分钟转换为 tick 数 (1 游戏分钟 = 60 ticks)
export const minutes = (m: number) => m * 60;

// 计算特定职业的工位容量
export const getJobCapacity = (job: Job) => {
    let searchLabel = '';
    if (job.companyType === 'internet') searchLabel = job.level >= 4 ? 'CTO' : '开发';
    else if (job.companyType === 'design') searchLabel = job.level >= 4 ? '总监' : '设计';
    else if (job.companyType === 'business') searchLabel = job.level >= 3 ? '经理' : '商务';
    else if (job.companyType === 'store') searchLabel = '前台';
    else if (job.companyType === 'restaurant') searchLabel = job.title === '厨师' ? '后厨' : '前台';
    else return 0; // Unemployed

    // 统计符合该职业需求的家具数量
    return FURNITURE.filter(f => f.utility === 'work' && f.label.includes(searchLabel)).length;
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