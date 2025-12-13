/// <reference types="vite/client" />
import { Furniture, Job } from './types';

// 1. 扫描文件 (支持 png, jpg, jpeg, webp)
const faceFiles = import.meta.glob('/public/assets/face/*.{png,jpg,jpeg,webp}', { eager: true });
const hairFiles = import.meta.glob('/public/assets/hair/*.{png,jpg,jpeg,webp}', { eager: true });
const clothesFiles = import.meta.glob('/public/assets/clothes/*.{png,jpg,jpeg,webp}', { eager: true });
const pantsFiles = import.meta.glob('/public/assets/pants/*.{png,jpg,jpeg,webp}', { eager: true });

// 2. 转换路径的辅助函数
function getPathsFromGlob(globResult: Record<string, unknown>): string[] {
    return Object.keys(globResult).map(path => path.replace(/^\/public/, ''));
}

export const ASSET_CONFIG = {
    face: getPathsFromGlob(faceFiles),
    hair: getPathsFromGlob(hairFiles),
    clothes: getPathsFromGlob(clothesFiles),
    pants: getPathsFromGlob(pantsFiles)
};

export const CONFIG = {
    CANVAS_W: 1400,
    CANVAS_H: 1000,
    COLORS: {
        skin: ['#f8d9c6', '#f3c7a6', '#e0b088', '#8d5524', '#c68642'],
        hair: ['#2f3640', '#636e72', '#dcdde1', '#e1b12c', '#c23616', '#40739e'],
        clothes: ['#e55039', '#f6b93b', '#82ccdd', '#78e08f', '#6a89cc', '#b8e994', '#fa983a']
    }
};

export const PALETTES: any = {
    earlyMorning: { zone1: '#f1f2f6', zone2: '#dfe4ea', zone3: '#ced6e0', wall: '#57606f', bg: '#2f3542', overlay: 'rgba(255, 165, 2, 0.1)', furniture_shadow: 'rgba(47, 53, 66, 0.2)' },
    noon: { zone1: '#ffffff', zone2: '#f1f2f6', zone3: '#dfe4ea', wall: '#747d8c', bg: '#2f3542', overlay: 'rgba(0,0,0,0)', furniture_shadow: 'rgba(47, 53, 66, 0.15)' },
    afternoon: { zone1: '#fffaf0', zone2: '#f7f1e3', zone3: '#dcdde1', wall: '#7f8fa6', bg: '#2f3542', overlay: 'rgba(255, 127, 80, 0.08)', furniture_shadow: 'rgba(47, 53, 66, 0.15)' },
    dusk: { zone1: '#ffeaa7', zone2: '#fab1a0', zone3: '#dfe6e9', wall: '#636e72', bg: '#2d3436', overlay: 'rgba(108, 92, 231, 0.15)', furniture_shadow: 'rgba(45, 52, 54, 0.25)' },
    night: { zone1: '#353b48', zone2: '#2f3640', zone3: '#2f3640', wall: '#1e272e', bg: '#000000', overlay: 'rgba(9, 132, 227, 0.25)', furniture_shadow: 'rgba(0, 0, 0, 0.4)' },
    lateNight: { zone1: '#2f3640', zone2: '#2d3436', zone3: '#2d3436', wall: '#000000', bg: '#000000', overlay: 'rgba(0, 0, 0, 0.5)', furniture_shadow: 'rgba(0, 0, 0, 0.5)' }
};

// ==========================================
// 🗺️ 终极密集地图 v4.0 (1400x1000)
// ==========================================

export const ROOMS = [
    // === 🏡 住宅区 (左上) ===
    { id: 'apt_hall', x: 20, y: 20, w: 340, h: 60, label: '公寓走廊', color: '#b2bec3' },
    { id: 'apt_101', x: 20, y: 80, w: 160, h: 160, label: '101 极客屋', color: '#dfe6e9' },
    { id: 'apt_102', x: 200, y: 80, w: 160, h: 160, label: '102 居家屋', color: '#dfe6e9' },
    { id: 'apt_103', x: 20, y: 260, w: 160, h: 160, label: '103 合租房', color: '#dfe6e9' },
    { id: 'apt_104', x: 200, y: 260, w: 160, h: 160, label: '104 仓库房', color: '#dfe6e9' },
    
    // === 🏰 豪宅 (左中) ===
    { id: 'villa_main', x: 20, y: 440, w: 220, h: 180, label: '豪宅主厅', color: '#fff3e0' },
    { id: 'villa_bed', x: 240, y: 440, w: 120, h: 180, label: '主卧', color: '#ffe0b2' },
    { id: 'villa_garden', x: 20, y: 620, w: 340, h: 80, label: '私人花园', color: '#55efc4' },

    // === 🌳 中央广场 (中) ===
    { id: 'plaza_main', x: 400, y: 150, w: 500, h: 400, label: '中央广场', color: '#ecf0f1' },
    { id: 'public_wc', x: 820, y: 450, w: 80, h: 100, label: '公厕', color: '#74b9ff' },

    // === 🏢 办公园区 (右上) ===
    { id: 'off_lobby', x: 940, y: 20, w: 440, h: 80, label: '写字楼大堂', color: '#b2bec3' },
    { id: 'off_tech', x: 940, y: 100, w: 440, h: 200, label: '互联网大厂', color: '#a29bfe' },
    { id: 'off_design', x: 940, y: 320, w: 200, h: 180, label: '设计工作室', color: '#ffcccc' },
    { id: 'off_biz', x: 1160, y: 320, w: 220, h: 180, label: '金融事务所', color: '#74b9ff' },

    // === 🏥 公共服务区 (右中) ===
    { id: 'hospital', x: 940, y: 520, w: 220, h: 200, label: '综合医院', color: '#81ecec' },
    { id: 'library', x: 1180, y: 520, w: 200, h: 200, label: '图书馆', color: '#f7f1e3' },

    // === 🍻 商业娱乐区 (底部通栏) ===
    { id: 'arcade', x: 20, y: 720, w: 200, h: 260, label: '电玩城', color: '#2d3436' },
    { id: 'gym', x: 240, y: 720, w: 200, h: 260, label: '健身中心', color: '#b2bec3' },
    { id: 'restaurant', x: 460, y: 720, w: 300, h: 260, label: '美食广场', color: '#e17055' },
    { id: 'cinema', x: 780, y: 720, w: 240, h: 260, label: '电影院', color: '#0984e3' },
    { id: 'museum', x: 1040, y: 740, w: 340, h: 240, label: '艺术馆', color: '#ffffff' },

    // === 🛣️ 道路 ===
    { id: 'road_v', x: 360, y: 0, w: 40, h: 700, label: '', color: '#353b48' },
    { id: 'road_v2', x: 900, y: 0, w: 40, h: 720, label: '', color: '#353b48' },
    { id: 'road_h', x: 0, y: 700, w: 1400, h: 20, label: '', color: '#353b48' },
];

export const FURNITURE: Furniture[] = [
    // --- 🏡 101: 极客公寓 (单人) ---
    { id: 'bed_101', x: 30, y: 90, w: 50, h: 80, color: '#0984e3', label: '床', utility: 'energy', dir: 'up', multiUser: false, gender: '' },
    { id: 'pc_101', x: 100, y: 90, w: 60, h: 30, color: '#00cec9', label: '双屏电脑', utility: 'fun', dir: 'down', multiUser: false, gender: '' }, 
    { id: 'desk_101', x: 90, y: 90, w: 80, h: 40, color: '#2d3436', label: '桌子', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'game_console', x: 120, y: 140, w: 30, h: 30, color: '#ff7675', label: '游戏机', utility: 'play', dir: 'left', multiUser: false, gender: '' }, 

    // --- 🏡 102: 居家公寓 (双人) ---
    { id: 'bed_102', x: 210, y: 90, w: 60, h: 90, color: '#fd79a8', label: '大床', utility: 'energy', dir: 'up', multiUser: true, gender: '' },
    { id: 'kitchen_102', x: 300, y: 90, w: 50, h: 40, color: '#fab1a0', label: '灶台', utility: 'cooking', dir: 'down', multiUser: false, gender: '' },
    { id: 'fridge_102', x: 300, y: 140, w: 30, h: 40, color: '#b2bec3', label: '冰箱', utility: 'hunger', dir: 'left', multiUser: true, gender: '' },
    { id: 'tv_102', x: 220, y: 200, w: 60, h: 10, color: '#2d3436', label: '电视', utility: 'fun', dir: 'down', multiUser: true, gender: '' },
    { id: 'sofa_102', x: 220, y: 170, w: 60, h: 30, color: '#ffeaa7', label: '沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },

    // --- 🏡 103: 合租房 (双书桌) ---
    { id: 'bunk_bed_103', x: 30, y: 270, w: 50, h: 80, color: '#a29bfe', label: '双层床', utility: 'energy', dir: 'up', multiUser: true, gender: '' },
    { id: 'desk_103_a', x: 100, y: 270, w: 40, h: 30, color: '#636e72', label: '书桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'desk_103_b', x: 140, y: 270, w: 40, h: 30, color: '#636e72', label: '书桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },

    // --- 🏡 104: 仓库改建 ---
    { id: 'mat_104', x: 210, y: 270, w: 40, h: 70, color: '#dfe6e9', label: '地铺', utility: 'energy', dir: 'up', multiUser: false, gender: '' },
    { id: 'easel_104', x: 280, y: 280, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'art', dir: 'left', multiUser: false, gender: '' }, 

    // --- 🏰 豪宅 ---
    { id: 'villa_piano', x: 40, y: 460, w: 60, h: 80, color: '#2d3436', label: '三角钢琴', utility: 'play', dir: 'right', multiUser: false, gender: '' },
    { id: 'villa_sofa_l', x: 120, y: 480, w: 80, h: 30, color: '#e17055', label: '真皮沙发', utility: 'comfort', dir: 'down', multiUser: true, gender: '' },
    { id: 'villa_sofa_r', x: 120, y: 550, w: 80, h: 30, color: '#e17055', label: '真皮沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'villa_bed', x: 260, y: 460, w: 80, h: 100, color: '#fdcb6e', label: '国王床', utility: 'energy', dir: 'up', multiUser: true, gender: '' },
    { id: 'villa_bath', x: 300, y: 580, w: 50, h: 30, color: '#81ecec', label: '按摩浴缸', utility: 'hygiene', dir: 'up', multiUser: false, gender: '' },
    { id: 'garden_chair', x: 100, y: 640, w: 40, h: 40, color: '#fff', label: '花园椅', utility: 'comfort', dir: 'down', multiUser: true, gender: '' },

    // --- 🌳 广场 & 公共设施 ---
    { id: 'fountain', x: 600, y: 300, w: 100, h: 100, color: '#74b9ff', label: '喷泉', utility: 'play', dir: 'down', multiUser: true, gender: '' },
    { id: 'bench_sq_1', x: 500, y: 250, w: 20, h: 60, color: '#e17055', label: '长椅', utility: 'comfort', dir: 'right', multiUser: true, gender: '' },
    { id: 'bench_sq_2', x: 500, y: 350, w: 20, h: 60, color: '#e17055', label: '长椅', utility: 'comfort', dir: 'right', multiUser: true, gender: '' },
    { id: 'bench_sq_3', x: 780, y: 250, w: 20, h: 60, color: '#e17055', label: '长椅', utility: 'comfort', dir: 'left', multiUser: true, gender: '' },
    { id: 'vending_sq', x: 420, y: 160, w: 40, h: 30, color: '#ff7675', label: '售货机', utility: 'buy_drink', dir: 'down', multiUser: false, gender: '' },
    { id: 'wc_m', x: 830, y: 460, w: 20, h: 30, color: '#fff', label: '男厕', utility: 'bladder', dir: 'right', multiUser: false, gender: 'M' },
    { id: 'wc_f', x: 830, y: 500, w: 20, h: 30, color: '#fff', label: '女厕', utility: 'bladder', dir: 'right', multiUser: false, gender: 'F' },

    // --- 🏢 办公区 (密集阵列) ---
    // Tech Rows
    { id: 'tech_d1', x: 960, y: 120, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d2', x: 1010, y: 120, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d3', x: 1060, y: 120, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d4', x: 1110, y: 120, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d5', x: 960, y: 170, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d6', x: 1010, y: 170, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_d7', x: 1060, y: 170, w: 40, h: 30, color: '#a29bfe', label: '工位', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'tech_cto', x: 1300, y: 140, w: 60, h: 50, color: '#6c5ce7', label: 'CTO', utility: 'work', dir: 'left', multiUser: false, gender: '' },
    
    // Design & Biz
    { id: 'des_table_1', x: 960, y: 340, w: 60, h: 50, color: '#ff7675', label: '绘图台', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'des_table_2', x: 1040, y: 340, w: 60, h: 50, color: '#ff7675', label: '绘图台', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'biz_meet', x: 1180, y: 340, w: 80, h: 60, color: '#74b9ff', label: '会议桌', utility: 'work', dir: 'up', multiUser: true, gender: '' },
    { id: 'biz_boss', x: 1300, y: 400, w: 60, h: 40, color: '#0984e3', label: '经理', utility: 'work', dir: 'left', multiUser: false, gender: '' },

    // --- 🏥 医院 & 图书馆 ---
    { id: 'hosp_bed1', x: 960, y: 540, w: 40, h: 70, color: '#fff', label: '病床', utility: 'energy', dir: 'up', multiUser: false, gender: '' },
    { id: 'hosp_bed2', x: 1010, y: 540, w: 40, h: 70, color: '#fff', label: '病床', utility: 'energy', dir: 'up', multiUser: false, gender: '' },
    { id: 'med_cab', x: 1100, y: 540, w: 40, h: 80, color: '#00cec9', label: '药房', utility: 'hygiene', dir: 'left', multiUser: true, gender: '' }, // 注意：用 hygiene 代替 health 以免修改 Sim.ts
    { id: 'lib_shelf1', x: 1200, y: 540, w: 160, h: 20, color: '#fdcb6e', label: '书架', utility: 'buy_book', dir: 'down', multiUser: true, gender: '' },
    { id: 'lib_shelf2', x: 1200, y: 580, w: 160, h: 20, color: '#fdcb6e', label: '书架', utility: 'buy_book', dir: 'down', multiUser: true, gender: '' },
    { id: 'lib_desk', x: 1220, y: 640, w: 120, h: 40, color: '#dfe6e9', label: '自习桌', utility: 'work', dir: 'up', multiUser: true, gender: '' },

    // --- 🎮 娱乐区 (丰富互动) ---
    // Arcade
    { id: 'arcade_1', x: 40, y: 740, w: 30, h: 40, color: '#d63031', label: '街机', utility: 'play', dir: 'right', multiUser: false, gender: '' },
    { id: 'arcade_2', x: 40, y: 800, w: 30, h: 40, color: '#d63031', label: '街机', utility: 'play', dir: 'right', multiUser: false, gender: '' },
    { id: 'dance_machine', x: 100, y: 760, w: 60, h: 60, color: '#fd79a8', label: '跳舞机', utility: 'play', dir: 'down', multiUser: true, gender: '' },
    // Gym
    { id: 'treadmill_1', x: 260, y: 740, w: 30, h: 60, color: '#636e72', label: '跑步机', utility: 'gym_run', dir: 'right', multiUser: false, gender: '' },
    { id: 'treadmill_2', x: 300, y: 740, w: 30, h: 60, color: '#636e72', label: '跑步机', utility: 'gym_run', dir: 'right', multiUser: false, gender: '' },
    { id: 'yoga_mat', x: 260, y: 840, w: 80, h: 60, color: '#fab1a0', label: '瑜伽垫', utility: 'gym_yoga', dir: 'up', multiUser: true, gender: '' },
    // Restaurant
    { id: 'res_table_1', x: 480, y: 740, w: 60, h: 60, color: '#e17055', label: '餐桌', utility: 'eat_out', dir: 'up', multiUser: true, cost: 40, gender: '' },
    { id: 'res_table_2', x: 560, y: 740, w: 60, h: 60, color: '#e17055', label: '餐桌', utility: 'eat_out', dir: 'up', multiUser: true, cost: 40, gender: '' },
    { id: 'res_counter', x: 650, y: 850, w: 80, h: 20, color: '#636e72', label: '出餐口', utility: 'work', dir: 'up', multiUser: false, gender: '' },
    // Cinema
    { id: 'screen', x: 800, y: 730, w: 200, h: 10, color: '#fff', label: '巨幕', utility: 'none', dir: 'down', multiUser: false, gender: '' },
    { id: 'seats_1', x: 800, y: 770, w: 200, h: 40, color: '#d63031', label: '情侣座', utility: 'cinema_3d', dir: 'up', multiUser: true, cost: 20, gender: '' },
    { id: 'seats_2', x: 800, y: 830, w: 200, h: 60, color: '#0984e3', label: '普通座', utility: 'cinema_2d', dir: 'up', multiUser: true, cost: 10, gender: '' },
    // Museum (New!)
    { id: 'painting_1', x: 1060, y: 760, w: 60, h: 10, color: '#ff7675', label: '名画', utility: 'art', dir: 'down', multiUser: true, gender: '' },
    { id: 'sculpture', x: 1200, y: 820, w: 40, h: 40, color: '#b2bec3', label: '雕塑', utility: 'art', dir: 'down', multiUser: true, gender: '' },
    { id: 'painting_2', x: 1300, y: 760, w: 60, h: 10, color: '#ff7675', label: '名画', utility: 'art', dir: 'down', multiUser: true, gender: '' },
];

export const ITEMS = [
    { id: 'drink', label: '快乐水', cost: 5, needs: { hunger: 5, fun: 5 }, trigger: 'street' },
    { id: 'book', label: '技术书', cost: 60, needs: { fun: 10 }, skill: 'logic', skillVal: 5, trigger: 'smart' },
    { id: 'cinema_2d', label: '电影票', cost: 10, needs: { fun: 40 }, trigger: 'bored' },
    { id: 'cinema_3d', label: '3D票', cost: 20, needs: { fun: 60 }, trigger: 'rich' },
    { id: 'museum_ticket', label: '艺术展票', cost: 30, buff: 'art_inspired', needs: { fun: 50 }, trigger: 'smart' },
    { id: 'gym_pass', label: '健身卡', cost: 15, needs: { energy: -20 }, skill: 'athletics', skillVal: 5, trigger: 'active' },
    { id: 'medicine', label: '感冒药', cost: 40, buff: 'well_rested', trigger: 'sad' },
    { id: 'game_coin', label: '游戏币', cost: 5, needs: { fun: 20 }, trigger: 'bored' },
];

export const SKILLS = [
    { id: 'cooking', label: '厨艺' }, { id: 'athletics', label: '运动' }, { id: 'music', label: '音乐' },
    { id: 'dancing', label: '舞技' }, { id: 'logic', label: '逻辑' }, { id: 'creativity', label: '创造' },
    { id: 'gardening', label: '园艺' }, { id: 'fishing', label: '钓鱼' }
];

// 每个职业划分为4个等级
export const JOBS: Job[] = [
    { id: 'unemployed', title: '无业游民', level: 0, salary: 0, startHour: 0, endHour: 0, workDays: [] },

    // Internet Co
    { id: 'dev_intern', title: 'IT实习生', level: 1, salary: 300, startHour: 9, endHour: 18, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'developer', title: '程序员', level: 2, salary: 600, startHour: 10, endHour: 19, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'senior_dev', title: '高级开发', level: 3, salary: 1000, startHour: 10, endHour: 18, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'cto', title: '技术总监', level: 4, salary: 2000, startHour: 11, endHour: 17, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },

    // Design Co
    { id: 'design_intern', title: '设计助理', level: 1, salary: 250, startHour: 9, endHour: 18, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'designer', title: '设计师', level: 2, salary: 500, startHour: 10, endHour: 19, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'senior_designer', title: '资深设计', level: 3, salary: 800, startHour: 10, endHour: 18, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'art_director', title: '艺术总监', level: 4, salary: 1600, startHour: 11, endHour: 16, companyType: 'design', workDays: [1, 2, 3, 4] },

    // Business Co
    { id: 'biz_intern', title: '行政助理', level: 1, salary: 200, startHour: 8, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5] },
    { id: 'clerk_biz', title: '商务专员', level: 2, salary: 450, startHour: 9, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'biz_supervisor', title: '部门主管', level: 3, salary: 900, startHour: 9, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5] },
    { id: 'manager', title: '总经理', level: 4, salary: 1800, startHour: 10, endHour: 16, companyType: 'business', workDays: [1, 2, 3, 4, 5] },

    // Services (Store)
    { id: 'store_trainee', title: '理货员', level: 1, salary: 150, startHour: 8, endHour: 16, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'clerk_book', title: '书店店员', level: 2, salary: 250, startHour: 9, endHour: 17, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'store_supervisor', title: '店长助理', level: 3, salary: 400, startHour: 9, endHour: 18, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'store_manager', title: '书店店长', level: 4, salary: 600, startHour: 10, endHour: 17, companyType: 'store', workDays: [1, 2, 3, 4, 5] },

    // Services (Restaurant)
    { id: 'kitchen_helper', title: '洗碗工', level: 1, salary: 160, startHour: 10, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'waiter', title: '服务员', level: 2, salary: 280, startHour: 11, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'cook', title: '厨师', level: 3, salary: 500, startHour: 10, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'head_chef', title: '主厨', level: 4, salary: 800, startHour: 10, endHour: 19, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5] },
];

export const BUFFS = {
    well_rested: { id: 'well_rested', label: '精力充沛', type: 'good' as const, duration: 180 },
    stressed: { id: 'stressed', label: '工作过劳', type: 'bad' as const, duration: 120 },
    in_love: { id: 'in_love', label: '坠入爱河', type: 'good' as const, duration: 300 },
    heartbroken: { id: 'heartbroken', label: '心碎', type: 'bad' as const, duration: 400 },
    broke: { id: 'broke', label: '贫穷焦虑', type: 'bad' as const, duration: 120 },
    rich_feel: { id: 'rich_feel', label: '挥金如土', type: 'good' as const, duration: 120 },
    gamer_joy: { id: 'gamer_joy', label: '游戏人生', type: 'good' as const, duration: 90 },
    anxious: { id: 'anxious', label: '焦虑', type: 'bad' as const, duration: 60 },
    movie_fun: { id: 'movie_fun', label: '精彩电影', type: 'good' as const, duration: 120 },
    good_meal: { id: 'good_meal', label: '美味佳肴', type: 'good' as const, duration: 120 },
    holiday_joy: { id: 'holiday_joy', label: '节日快乐', type: 'good' as const, duration: 240 },
    weekend_vibes: { id: 'weekend_vibes', label: '周末愉快', type: 'good' as const, duration: 200 },
    side_hustle_win: { id: 'side_hustle_win', label: '赚外快', type: 'good' as const, duration: 90 },
    promoted: { id: 'promoted', label: '升职之喜', type: 'good' as const, duration: 240 },
    demoted: { id: 'demoted', label: '被降职', type: 'bad' as const, duration: 240 },
    fired: { id: 'fired', label: '被解雇', type: 'bad' as const, duration: 300 },
    art_inspired: { id: 'art_inspired', label: '艺术灵感', type: 'good' as const, duration: 150 }, // New
    playful: { id: 'playful', label: '童心未泯', type: 'good' as const, duration: 90 }, // New
};

// 节日配置 (Month, Day)
export const HOLIDAYS = [
    { month: 1, day: 1, name: "新年" },
    { month: 2, day: 14, name: "情人节" },
    { month: 5, day: 1, name: "劳动节" },
    { month: 10, day: 1, name: "国庆节" },
    { month: 12, day: 25, name: "圣诞节" },
];

export const LIFE_GOALS = ['成为百万富翁', '博学多才', '交际花', '寻找真爱', '平平淡淡'];

export const MBTI_TYPES = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

export const SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
export const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超'];

export const ELE_COMP: Record<string, string[]> = {
    fire: ['air', 'fire'],
    earth: ['water', 'earth'],
    air: ['fire', 'air'],
    water: ['earth', 'water']
};

export const ZODIACS = [
    { name: '白羊座', element: 'fire', icon: '♈' }, { name: '金牛座', element: 'earth', icon: '♉' },
    { name: '双子座', element: 'air', icon: '♊' }, { name: '巨蟹座', element: 'water', icon: '♋' },
    { name: '狮子座', element: 'fire', icon: '♌' }, { name: '处女座', element: 'earth', icon: '♍' },
    { name: '天秤座', element: 'air', icon: '♎' }, { name: '天蝎座', element: 'water', icon: '♏' },
    { name: '射手座', element: 'fire', icon: '♐' }, { name: '摩羯座', element: 'earth', icon: '♑' },
    { name: '水瓶座', element: 'air', icon: '♒' }, { name: '双鱼座', element: 'water', icon: '♓' }
];

export const SOCIAL_TYPES = [
    { id: 'greet', label: '打招呼', val: 3, type: 'friendship', minVal: -100, maxVal: 100, logType: 'chat' },
    { id: 'chat', label: '闲聊', val: 5, type: 'friendship', minVal: 10, maxVal: 100, logType: 'chat' },
    { id: 'joke', label: '讲笑话', val: 12, type: 'friendship', minVal: 30, maxVal: 100, logType: 'chat' },
    { id: 'gossip', label: '聊八卦', val: 8, type: 'friendship', minVal: 50, maxVal: 100, logType: 'chat' },
    { id: 'pickup', label: '搭讪', val: 5, type: 'romance', minVal: 0, maxVal: 20, logType: 'love', special: 'pickup' },
    { id: 'deep_talk', label: '深入', val: 8, type: 'romance', minVal: 20, maxVal: 100, logType: 'love', special: 'deep_talk' },
    { id: 'flirt', label: '调情', val: 10, type: 'romance', minVal: 30, maxVal: 100, logType: 'love' },
    { id: 'hug', label: '拥抱', val: 15, type: 'romance', minVal: 50, maxVal: 100, logType: 'love', special: 'hug' },
    { id: 'kiss', label: '亲吻', val: 20, type: 'romance', minVal: 70, maxVal: 100, logType: 'love', special: 'kiss' },
    { id: 'confess', label: '表白', val: 30, type: 'romance', minVal: 40, maxVal: 100, logType: 'love', special: 'confess' },
    { id: 'propose', label: '求婚', val: 50, type: 'romance', minVal: 90, maxVal: 100, logType: 'love', special: 'propose' },
    { id: 'breakup', label: '分手', val: -50, type: 'romance', minVal: -100, maxVal: -60, logType: 'bad', special: 'breakup' },
    { id: 'argue', label: '争吵', val: -15, type: 'friendship', minVal: -100, maxVal: 100, logType: 'bad' }
];

export const BASE_DECAY = {
    energy: 0.8,
    hunger: 1.0,
    fun: 0.8,
    social: 0.8,
    bladder: 0.8,
    hygiene: 0.5
};

export const ORIENTATIONS = [
    { type: 'hetero', label: '异性恋' },
    { type: 'homo', label: '同性恋' },
    { type: 'bi', label: '双性恋' }
];