import { SimData, Job } from '../types';
import { CONFIG, FURNITURE } from '../constants';
import { getAsset } from './assetLoader'; 

// 将游戏分钟转换为 tick 数 (1 游戏分钟 = 60 ticks)
export const minutes = (m: number) => m * 60;

// 计算特定职业的工位容量
export const getJobCapacity = (job: Job) => {
    let searchLabels: string[] = [];
    let searchCategories: string[] = ['work', 'work_group']; 

    // [修复] 此处必须与 Sim.ts 中的 checkSchedule 逻辑保持一致
    // 搜索的是实际可交互的家具名称 (椅子等)，而不是装饰性的桌子
    if (job.companyType === 'internet') {
        searchLabels = job.level >= 4 ? ['老板椅'] : ['码农工位', '控制台'];
    } else if (job.companyType === 'design') {
        searchLabels = ['画架'];
        searchCategories.push('paint'); 
    } else if (job.companyType === 'business') {
        searchLabels = job.level >= 4 ? ['老板椅'] : ['商务工位']; // 会议室椅子
    } else if (job.companyType === 'store') {
        searchLabels = ['服务台', '影院服务台', '售票处'];
        searchCategories.push('pay'); 
    } else if (job.companyType === 'restaurant') {
        if (job.title.includes('厨')) {
            searchLabels = ['后厨'];
        } else {
            searchLabels = ['餐厅前台', '雅座'];
            searchCategories.push('eat_out'); 
        }
    } else if(job.companyType === 'library'){
        searchLabels = ['管理员'];
    }
    else {
        return 0; // Unemployed
    }

    // 统计符合该职业需求的家具数量
    let capacity = FURNITURE.filter(f => 
        searchCategories.includes(f.utility) && 
        searchLabels.some(l => f.label.includes(l))
    ).length;

    // [特殊调整]
    // 1. 会议桌是多人使用的，需要增加容量倍率 (现在是搜索皮椅，如果皮椅是单个定义则不需要倍率，如果是成组则需要)
    // 根据 scene.ts，皮椅是 createRow 生成的，是单独的 entity，所以 capacity 统计是准确的
    
    // 2. 餐厅服务员/商店店员稍微放宽一点
    if (job.companyType === 'store' || job.companyType === 'restaurant') {
        capacity = Math.max(capacity, 2); 
        if (job.level < 3) capacity *= 2; 
    }
    
    // 3. 老板位通常唯一
    if (job.level === 4 && job.companyType !== 'restaurant') {
        return Math.max(1, capacity);
    }

    return Math.max(1, capacity);
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