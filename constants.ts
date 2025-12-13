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
    // 世界尺寸大幅紧凑化
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

// --- Compact Map Layout (1400 x 1000) ---
// 左侧：住宅区
// 中间：商业街 (窄路)
// 右侧：办公区
// 底部：公园 (缩小)

// 支持 imagePath 属性，你可以填入相对于 public/assets/ 的路径
export const ROOMS = [
    // === 住宅区 (Left: 0 - 450) ===
    // Res A (101)
    { id: 'bedroom', x: 20, y: 20, w: 140, h: 120, label: '101 卧', color: '#f5f6fa', floorType: 'wood_dark', imagePath: '' },
    { id: 'living', x: 20, y: 140, w: 140, h: 140, label: '101 厅', color: '#f5f6fa', floorType: 'wood_light', imagePath: '' },
    { id: 'bathroom', x: 160, y: 20, w: 80, h: 100, label: '101 卫', color: '#dff9fb', floorType: 'tile_white', imagePath: '' },
    { id: 'kitchen', x: 160, y: 120, w: 80, h: 100, label: '101 厨', color: '#ffeaa7', floorType: 'tile_check', imagePath: '' },

    // Res B (102 Studio)
    { id: 'bedroom', x: 20, y: 300, w: 160, h: 160, label: '102 公寓', color: '#dfe6e9', floorType: 'wood_light', imagePath: '' },
    { id: 'bathroom', x: 180, y: 300, w: 60, h: 100, label: '102 卫', color: '#dff9fb', floorType: 'tile_blue', imagePath: '' },

    // Res C (Luxury)
    { id: 'living', x: 260, y: 20, w: 180, h: 160, label: '豪宅 厅', color: '#fff3e0', floorType: 'marble', imagePath: '' },
    { id: 'bedroom', x: 260, y: 180, w: 120, h: 120, label: '豪宅 卧', color: '#ffe0b2', floorType: 'carpet_luxury', imagePath: '' },
    { id: 'bathroom', x: 380, y: 180, w: 60, h: 120, label: '豪宅 卫', color: '#81ecec', floorType: 'tile_dark', imagePath: '' },

    // Res D (103)
    { id: 'living', x: 260, y: 320, w: 120, h: 120, label: '103 厅', color: '#f5f6fa', floorType: 'wood_light', imagePath: '' },
    { id: 'bedroom', x: 380, y: 320, w: 100, h: 100, label: '103 卧', color: '#f5f6fa', floorType: 'wood_dark', imagePath: '' },
    { id: 'kitchen', x: 260, y: 440, w: 100, h: 60, label: '103 厨', color: '#ffeaa7', floorType: 'tile_check', imagePath: '' },

    // === 街道 (Center Strip) ===
    { id: 'street', x: 490, y: 0, w: 80, h: 700, label: '中央大道', color: '#636e72', floorType: 'road', imagePath: '' },

    // === 商业区 (Center Right: 580 - 950) ===
    { id: 'cinema', x: 590, y: 20, w: 260, h: 200, label: '星光影城', color: '#2c3e50', floorType: 'carpet_red', imagePath: '' },
    { id: 'restaurant', x: 590, y: 240, w: 260, h: 180, label: '餐厅', color: '#e17055', floorType: 'wood_fancy', imagePath: '' },
    { id: 'bookstore', x: 590, y: 440, w: 160, h: 140, label: '书店', color: '#fdcb6e', floorType: 'wood_light', imagePath: '' },
    { id: 'gym', x: 760, y: 440, w: 160, h: 140, label: '健身房', color: '#b2bec3', floorType: 'concrete', imagePath: '' },

    // === 办公区 (Far Right: 960 - 1300) ===
    { id: 'office_design', x: 940, y: 20, w: 180, h: 160, label: '设计部', color: '#f5f6fa', floorType: 'carpet_office', imagePath: '' },
    { id: 'office_business', x: 1140, y: 20, w: 180, h: 160, label: '商务部', color: '#ecf0f1', floorType: 'marble', imagePath: '' },
    { id: 'office_internet', x: 940, y: 200, w: 380, h: 220, label: '字节跳动', color: '#a29bfe', floorType: 'tile_white', imagePath: '' },

    // === 公园 (Bottom: Full width) ===
    { id: 'park', x: 20, y: 600, w: 1300, h: 350, label: '中央公园', color: '#badc58', floorType: 'grass', imagePath: '' },
    // 横向马路
    { id: 'street', x: 0, y: 530, w: 1400, h: 60, label: '横贯路', color: '#636e72', floorType: 'road', imagePath: '' },
];

export const FURNITURE: Furniture[] = [
    // === Res A (101) ===
    { id: 'bed_101', x: 30, y: 30, w: 60, h: 80, color: '#a29bfe', label: '大床', utility: 'energy', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'pc_101', x: 110, y: 30, w: 40, h: 30, color: '#0984e3', label: '电脑', utility: 'fun', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'sofa_101', x: 30, y: 160, w: 80, h: 40, color: '#fd79a8', label: '沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'tv_101', x: 40, y: 260, w: 60, h: 10, color: '#2d3436', label: '电视', utility: 'fun', dir: 'down', multiUser: true, gender: '', imagePath: '' },
    { id: 'toilet_101', x: 170, y: 30, w: 30, h: 30, color: '#dfe6e9', label: '马桶', utility: 'bladder', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'shower_101', x: 200, y: 30, w: 30, h: 30, color: '#81ecec', label: '淋浴', utility: 'hygiene', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'stove_101', x: 170, y: 130, w: 30, h: 30, color: '#ff7675', label: '灶台', utility: 'cooking', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'fridge_101', x: 200, y: 130, w: 30, h: 40, color: '#b2bec3', label: '冰箱', utility: 'hunger', dir: 'down', multiUser: true, gender: '', imagePath: '' },

    // === Res B (102) ===
    { id: 'bed_102', x: 30, y: 310, w: 60, h: 80, color: '#00b894', label: '单人床', utility: 'energy', dir: 'up', multiUser: false, gender: '', imagePath: '' },
    { id: 'desk_102', x: 110, y: 310, w: 50, h: 30, color: '#636e72', label: '书桌', utility: 'work', dir: 'up', multiUser: false, gender: '', imagePath: '' },
    { id: 'toilet_102', x: 190, y: 310, w: 30, h: 30, color: '#dfe6e9', label: '马桶', utility: 'bladder', dir: 'down', multiUser: false, gender: '', imagePath: '' },

    // === Res C (Luxury) ===
    { id: 'sofa_lux_1', x: 280, y: 40, w: 100, h: 50, color: '#fab1a0', label: '真皮沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'piano', x: 280, y: 120, w: 80, h: 50, color: '#2d3436', label: '钢琴', utility: 'fun', dir: 'up', multiUser: false, gender: '', imagePath: '' },
    { id: 'bed_lux', x: 270, y: 190, w: 80, h: 100, color: '#fd79a8', label: '豪华大床', utility: 'energy', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'bath_lux', x: 390, y: 190, w: 40, h: 60, color: '#81ecec', label: '浴缸', utility: 'hygiene', dir: 'up', multiUser: false, gender: '', imagePath: '' },

    // === Res D (103) ===
    { id: 'sofa_103', x: 270, y: 330, w: 80, h: 40, color: '#fab1a0', label: '沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'bed_103', x: 400, y: 330, w: 60, h: 80, color: '#a29bfe', label: '大床', utility: 'energy', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'stove_103', x: 270, y: 450, w: 30, h: 30, color: '#ff7675', label: '灶台', utility: 'cooking', dir: 'down', multiUser: false, gender: '', imagePath: '' },

    // === Cinema ===
    { id: 'screen', x: 620, y: 30, w: 200, h: 10, color: '#fff', label: '银幕', utility: 'none', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'c_seat_1', x: 620, y: 70, w: 200, h: 30, color: '#d63031', label: 'VIP座', utility: 'cinema_imax', dir: 'up', multiUser: true, cost: 30, gender: '', imagePath: '' },
    { id: 'c_seat_2', x: 620, y: 110, w: 200, h: 30, color: '#e17055', label: '情侣座', utility: 'cinema_3d', dir: 'up', multiUser: true, cost: 20, gender: '', imagePath: '' },
    { id: 'c_seat_3', x: 620, y: 150, w: 200, h: 30, color: '#0984e3', label: '普通座', utility: 'cinema_2d', dir: 'up', multiUser: true, cost: 10, gender: '', imagePath: '' },

    // === Restaurant ===
    { id: 'r_table_1', x: 610, y: 260, w: 60, h: 40, color: '#e17055', label: '雅座', utility: 'eat_out', dir: 'up', multiUser: true, cost: 80, gender: '', imagePath: '' },
    { id: 'r_table_2', x: 690, y: 260, w: 60, h: 40, color: '#e17055', label: '雅座', utility: 'eat_out', dir: 'up', multiUser: true, cost: 80, gender: '', imagePath: '' },
    { id: 'r_table_3', x: 630, y: 340, w: 80, h: 60, color: '#e17055', label: '圆桌', utility: 'eat_out', dir: 'up', multiUser: true, cost: 120, gender: '', imagePath: '' },
    { id: 'r_kitchen', x: 800, y: 260, w: 40, h: 140, color: '#b2bec3', label: '后厨', utility: 'work', dir: 'left', multiUser: true, gender: '', imagePath: '' },
    { id: 'r_counter', x: 770, y: 380, w: 20, h: 30, color: '#636e72', label: '前台', utility: 'work', dir: 'left', multiUser: false, gender: '', imagePath: '' },

    // === Store & Gym ===
    { id: 'book_shelf', x: 610, y: 460, w: 100, h: 20, color: '#fdcb6e', label: '书架', utility: 'buy_book', dir: 'down', multiUser: true, cost: 60, gender: '', imagePath: '' },
    { id: 'gym_run', x: 780, y: 460, w: 40, h: 60, color: '#b2bec3', label: '跑步机', utility: 'gym_run', dir: 'right', multiUser: false, gender: '', imagePath: '' },
    { id: 'gym_yoga', x: 840, y: 460, w: 40, h: 60, color: '#fab1a0', label: '瑜伽垫', utility: 'gym_yoga', dir: 'right', multiUser: false, gender: '', imagePath: '' },

    // === Offices ===
    // Design
    { id: 'd_desk_1', x: 960, y: 40, w: 50, h: 30, color: '#fab1a0', label: '设计桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'd_desk_2', x: 1030, y: 40, w: 50, h: 30, color: '#fab1a0', label: '设计桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'd_dir', x: 990, y: 100, w: 60, h: 40, color: '#e17055', label: '总监桌', utility: 'work', dir: 'left', multiUser: false, gender: '', imagePath: '' },

    // Business
    { id: 'b_desk_1', x: 1160, y: 40, w: 50, h: 30, color: '#ecf0f1', label: '商务桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'b_desk_2', x: 1230, y: 40, w: 50, h: 30, color: '#ecf0f1', label: '商务桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },

    // Internet
    { id: 'it_desk_1', x: 960, y: 220, w: 50, h: 30, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'it_desk_2', x: 1030, y: 220, w: 50, h: 30, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'it_desk_3', x: 1100, y: 220, w: 50, h: 30, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'it_desk_4', x: 960, y: 280, w: 50, h: 30, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'it_desk_5', x: 1030, y: 280, w: 50, h: 30, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '', imagePath: '' },
    { id: 'it_cto', x: 1200, y: 250, w: 70, h: 50, color: '#6c5ce7', label: 'CTO桌', utility: 'work', dir: 'left', multiUser: false, gender: '', imagePath: '' },

    // === Park ===
    { id: 'lake', x: 600, y: 640, w: 300, h: 150, color: '#74b9ff', label: '人工湖', utility: 'fishing', dir: 'down', multiUser: true, gender: '', imagePath: '' },
    { id: 'bench_p1', x: 400, y: 650, w: 50, h: 25, color: '#d35400', label: '长椅', utility: 'comfort', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'bench_p2', x: 950, y: 650, w: 50, h: 25, color: '#d35400', label: '长椅', utility: 'comfort', dir: 'up', multiUser: true, gender: '', imagePath: '' },
    { id: 'flower_1', x: 300, y: 620, w: 60, h: 60, color: '#fd79a8', label: '花坛', utility: 'gardening', dir: 'down', multiUser: true, gender: '', imagePath: '' },
    { id: 'flower_2', x: 1050, y: 700, w: 60, h: 60, color: '#fd79a8', label: '花坛', utility: 'gardening', dir: 'down', multiUser: true, gender: '', imagePath: '' },
];

export const ITEMS = [
    { id: 'drink', label: '快乐水', cost: 5, needs: { hunger: 5, fun: 5 }, trigger: 'street' },
    { id: 'book', label: '专业书籍', cost: 60, needs: { fun: 10 }, skill: 'logic', skillVal: 5, trigger: 'smart' },
    { id: 'cinema_2d', label: '2D电影票', cost: 10, needs: { fun: 40 }, trigger: 'bored' },
    { id: 'cinema_3d', label: '3D电影票', cost: 20, needs: { fun: 60 }, trigger: 'rich' },
    { id: 'cinema_imax', label: 'IMAX电影票', cost: 30, needs: { fun: 80 }, trigger: 'rich' },
    { id: 'gym_run', label: '跑步机', cost: 15, needs: { energy: -20 }, skill: 'athletics', skillVal: 5, trigger: 'active' },
    { id: 'gym_yoga', label: '瑜伽课', cost: 20, needs: { energy: -15 }, skill: 'athletics', skillVal: 8, trigger: 'active' },
    { id: 'food_cheap', label: '工作餐', cost: 50, needs: { hunger: 60 }, trigger: 'hungry' },
    { id: 'food_mid', label: '商务套餐', cost: 80, needs: { hunger: 80, fun: 10 }, trigger: 'rich_hungry' },
    { id: 'food_fancy', label: '豪华大餐', cost: 120, needs: { hunger: 100, fun: 20 }, trigger: 'rich_hungry' },
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