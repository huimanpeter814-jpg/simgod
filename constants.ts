import { Furniture } from './types';

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
    // 世界尺寸大幅扩大
    CANVAS_W: 2600,
    CANVAS_H: 2000,
    COLORS: {
        skin: ['#ffe0bd', '#ffcd94', '#eac086', '#a67b5b', '#4b3932'],
        hair: ['#000000', '#4a4a4a', '#8b4513', '#d2691e', '#e6c200', '#f4f4f4'],
        clothes: ['#e74c3c', '#e17055', '#fdcb6e', '#00b894', '#0984e3', '#6c5ce7', '#2d3436']
    }
};

export const PALETTES: any = {
    earlyMorning: { zone1: '#e3f2fd', zone2: '#dfe6e9', zone3: '#e0f7fa', wall: '#b0bec5', bg: '#121212', overlay: 'rgba(255, 200, 150, 0.15)' },
    noon: { zone1: '#ffffff', zone2: '#ecf0f1', zone3: '#f5f6fa', wall: '#bdc3c7', bg: '#121212', overlay: 'rgba(255, 255, 255, 0)' },
    afternoon: { zone1: '#fff3e0', zone2: '#f7f1e3', zone3: '#f1f2f6', wall: '#d1ccc0', bg: '#121212', overlay: 'rgba(255, 220, 180, 0.1)' },
    dusk: { zone1: '#ffe0b2', zone2: '#b2bec3', zone3: '#dcdde1', wall: '#a4b0be', bg: '#121212', overlay: 'rgba(253, 167, 223, 0.15)' },
    night: { zone1: '#37474f', zone2: '#2d3436', zone3: '#2f3640', wall: '#2c3e50', bg: '#000000', overlay: 'rgba(0, 0, 50, 0.3)' },
    lateNight: { zone1: '#212121', zone2: '#1e272e', zone3: '#1e272e', wall: '#000000', bg: '#000000', overlay: 'rgba(0, 0, 0, 0.5)' }
};

// --- Map Layout (2600 x 2000) ---
// West (0-800): Residential
// Center (800-1600): Commercial & Plaza
// East (1600-2600): Office Park
// South (0-2600, y>1400): Nature Park

export const ROOMS = [
    // --- Residential A (Top Left) ---
    { id: 'bedroom', x: 50, y: 50, w: 200, h: 180, label: '101 卧室', color: '#f5f6fa' },
    { id: 'living', x: 50, y: 230, w: 200, h: 200, label: '101 客厅', color: '#f5f6fa' },
    { id: 'bathroom', x: 250, y: 50, w: 100, h: 120, label: '101 卫', color: '#dff9fb' },
    { id: 'kitchen', x: 250, y: 170, w: 100, h: 120, label: '101 厨', color: '#ffeaa7' },

    // --- Residential B (Mid Left - Studio) ---
    { id: 'bedroom', x: 50, y: 550, w: 250, h: 250, label: '102 公寓', color: '#dfe6e9' },
    { id: 'bathroom', x: 300, y: 550, w: 80, h: 120, label: '102 卫', color: '#dff9fb' },

    // --- Residential C (Top Mid-Left - Luxury) ---
    { id: 'living', x: 450, y: 50, w: 300, h: 250, label: '豪宅 客厅', color: '#fff3e0' },
    { id: 'bedroom', x: 450, y: 300, w: 180, h: 200, label: '豪宅 主卧', color: '#ffe0b2' },
    { id: 'bathroom', x: 630, y: 300, w: 120, h: 200, label: '豪宅 卫浴', color: '#81ecec' },

    // --- Residential D (Street Side) ---
    { id: 'living', x: 450, y: 600, w: 200, h: 150, label: '103 客厅', color: '#f5f6fa' },
    { id: 'bedroom', x: 650, y: 600, w: 150, h: 150, label: '103 卧室', color: '#f5f6fa' },
    { id: 'kitchen', x: 450, y: 750, w: 150, h: 100, label: '103 厨', color: '#ffeaa7' },

    // --- Commercial Zone (Center) ---
    { id: 'street', x: 850, y: 0, w: 150, h: 1400, label: '中央大道', color: '#636e72' }, // Main vertical road

    { id: 'cinema', x: 1050, y: 50, w: 400, h: 300, label: '星光影城', color: '#2c3e50' },
    { id: 'restaurant', x: 1050, y: 400, w: 400, h: 250, label: '米其林餐厅', color: '#e17055' },
    { id: 'bookstore', x: 1050, y: 700, w: 250, h: 200, label: '24h 书店', color: '#fdcb6e' },
    { id: 'gym', x: 1300, y: 700, w: 250, h: 200, label: '铁馆健身', color: '#b2bec3' },

    { id: 'street', x: 0, y: 900, w: 2600, h: 120, label: '横贯公路', color: '#636e72' }, // Horizontal road

    // --- Office Zone (East) ---
    { id: 'office_design', x: 1650, y: 50, w: 350, h: 250, label: '创意设计', color: '#f5f6fa' },
    { id: 'office_business', x: 2050, y: 50, w: 350, h: 250, label: '环球商务', color: '#ecf0f1' },
    { id: 'office_internet', x: 1650, y: 350, w: 400, h: 400, label: '字节跳动', color: '#a29bfe' },

    // --- Park Zone (South) ---
    { id: 'park', x: 50, y: 1100, w: 2500, h: 800, label: '中央生态公园', color: '#badc58' },
];

export const FURNITURE: Furniture[] = [
    // === Residential A ===
    { id: 'bed_101', x: 60, y: 60, w: 80, h: 100, color: '#a29bfe', label: '大床', utility: 'energy', dir: 'up', multiUser: true, gender: '' },
    { id: 'pc_101', x: 180, y: 60, w: 40, h: 40, color: '#0984e3', label: '电脑', utility: 'fun', dir: 'down', multiUser: false, gender: '' },
    { id: 'sofa_101', x: 60, y: 250, w: 100, h: 50, color: '#fd79a8', label: '沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'tv_101', x: 80, y: 380, w: 60, h: 10, color: '#2d3436', label: '电视', utility: 'fun', dir: 'down', multiUser: true, gender: '' },
    { id: 'toilet_101', x: 260, y: 60, w: 40, h: 40, color: '#dfe6e9', label: '马桶', utility: 'bladder', dir: 'down', multiUser: false, gender: '' },
    { id: 'shower_101', x: 300, y: 60, w: 40, h: 40, color: '#81ecec', label: '淋浴', utility: 'hygiene', dir: 'down', multiUser: false, gender: '' },
    { id: 'stove_101', x: 260, y: 180, w: 40, h: 40, color: '#d63031', label: '灶台', utility: 'cooking', dir: 'down', multiUser: false, gender: '' },
    { id: 'fridge_101', x: 300, y: 180, w: 40, h: 50, color: '#b2bec3', label: '冰箱', utility: 'hunger', dir: 'down', multiUser: true, gender: '' },

    // === Residential B (Studio) ===
    { id: 'bed_102', x: 60, y: 560, w: 80, h: 100, color: '#00b894', label: '单人床', utility: 'energy', dir: 'up', multiUser: false, gender: '' },
    { id: 'desk_102', x: 200, y: 560, w: 60, h: 40, color: '#636e72', label: '书桌', utility: 'work', dir: 'up', multiUser: false, gender: '' },
    { id: 'toilet_102', x: 310, y: 560, w: 30, h: 30, color: '#dfe6e9', label: '马桶', utility: 'bladder', dir: 'down', multiUser: false, gender: '' },

    // === Residential C (Luxury) ===
    { id: 'sofa_lux_1', x: 480, y: 80, w: 120, h: 60, color: '#fab1a0', label: '真皮沙发', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'sofa_lux_2', x: 620, y: 80, w: 100, h: 60, color: '#fab1a0', label: '贵妃椅', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'piano', x: 480, y: 200, w: 100, h: 80, color: '#2d3436', label: '钢琴', utility: 'fun', dir: 'up', multiUser: false, gender: '' },
    { id: 'bed_lux', x: 480, y: 320, w: 100, h: 120, color: '#fd79a8', label: '豪华大床', utility: 'energy', dir: 'up', multiUser: true, gender: '' },
    { id: 'bath_lux', x: 650, y: 320, w: 80, h: 100, color: '#81ecec', label: '浴缸', utility: 'hygiene', dir: 'up', multiUser: false, gender: '' },

    // === Cinema ===
    { id: 'screen', x: 1100, y: 60, w: 300, h: 10, color: '#fff', label: '银幕', utility: 'none', dir: 'down', multiUser: false, gender: '' },
    { id: 'c_seat_1', x: 1100, y: 120, w: 280, h: 40, color: '#d63031', label: 'VIP座', utility: 'cinema_imax', dir: 'up', multiUser: true, cost: 30, gender: '' },
    { id: 'c_seat_2', x: 1100, y: 180, w: 300, h: 40, color: '#e17055', label: '情侣座', utility: 'cinema_3d', dir: 'up', multiUser: true, cost: 20, gender: '' },
    { id: 'c_seat_3', x: 1100, y: 240, w: 300, h: 40, color: '#0984e3', label: '普通座', utility: 'cinema_2d', dir: 'up', multiUser: true, cost: 10, gender: '' },

    // === Restaurant ===
    { id: 'r_table_1', x: 1080, y: 430, w: 80, h: 60, color: '#fab1a0', label: '雅座', utility: 'eat_out', dir: 'up', multiUser: true, cost: 80, gender: '' },
    { id: 'r_table_2', x: 1200, y: 430, w: 80, h: 60, color: '#fab1a0', label: '雅座', utility: 'eat_out', dir: 'up', multiUser: true, cost: 80, gender: '' },
    { id: 'r_table_3', x: 1080, y: 520, w: 120, h: 80, color: '#fdcb6e', label: '圆桌', utility: 'eat_out', dir: 'up', multiUser: true, cost: 120, gender: '' },
    { id: 'r_kitchen', x: 1350, y: 430, w: 80, h: 200, color: '#b2bec3', label: '后厨', utility: 'work', dir: 'left', multiUser: true, gender: '' },
    { id: 'r_counter', x: 1300, y: 550, w: 20, h: 60, color: '#636e72', label: '前台', utility: 'work', dir: 'left', multiUser: false, gender: '' },

    // === Offices ===
    // Design
    { id: 'd_desk_1', x: 1680, y: 80, w: 60, h: 40, color: '#fab1a0', label: '设计桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'd_desk_2', x: 1760, y: 80, w: 60, h: 40, color: '#fab1a0', label: '设计桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'd_desk_3', x: 1680, y: 150, w: 60, h: 40, color: '#fab1a0', label: '设计桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'd_dir', x: 1900, y: 100, w: 80, h: 60, color: '#e17055', label: '总监桌', utility: 'work', dir: 'left', multiUser: false, gender: '' },

    // Internet
    { id: 'it_desk_1', x: 1680, y: 380, w: 60, h: 40, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'it_desk_2', x: 1760, y: 380, w: 60, h: 40, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'it_desk_3', x: 1840, y: 380, w: 60, h: 40, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'it_desk_4', x: 1680, y: 450, w: 60, h: 40, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'it_desk_5', x: 1760, y: 450, w: 60, h: 40, color: '#a29bfe', label: '开发桌', utility: 'work', dir: 'down', multiUser: false, gender: '' },
    { id: 'it_cto', x: 1950, y: 400, w: 80, h: 60, color: '#6c5ce7', label: 'CTO桌', utility: 'work', dir: 'left', multiUser: false, gender: '' },

    // === Park ===
    { id: 'lake', x: 1000, y: 1200, w: 600, h: 300, color: '#74b9ff', label: '人工湖', utility: 'fishing', dir: 'down', multiUser: true, gender: '' },
    { id: 'bench_p1', x: 800, y: 1250, w: 60, h: 30, color: '#d35400', label: '长椅', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'bench_p2', x: 1700, y: 1250, w: 60, h: 30, color: '#d35400', label: '长椅', utility: 'comfort', dir: 'up', multiUser: true, gender: '' },
    { id: 'flower_1', x: 600, y: 1200, w: 100, h: 100, color: '#fd79a8', label: '花坛', utility: 'gardening', dir: 'down', multiUser: true, gender: '' },
    { id: 'flower_2', x: 1800, y: 1400, w: 100, h: 100, color: '#fd79a8', label: '花坛', utility: 'gardening', dir: 'down', multiUser: true, gender: '' },
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

export const JOBS = [
    { id: 'unemployed', title: '无业游民', level: 0, salary: 0, startHour: 0, endHour: 0 },

    // Internet Co
    { id: 'developer', title: '程序员', level: 2, salary: 500, startHour: 10, endHour: 19, companyType: 'internet' },
    { id: 'cto', title: '技术总监', level: 4, salary: 1500, startHour: 10, endHour: 17, companyType: 'internet' },

    // Design Co
    { id: 'designer', title: '设计师', level: 2, salary: 450, startHour: 9, endHour: 18, companyType: 'design' },
    { id: 'art_director', title: '艺术总监', level: 4, salary: 1200, startHour: 10, endHour: 16, companyType: 'design' },

    // Business Co
    { id: 'clerk_biz', title: '商务专员', level: 2, salary: 400, startHour: 9, endHour: 17, companyType: 'business' },
    { id: 'manager', title: '经理', level: 3, salary: 800, startHour: 9, endHour: 17, companyType: 'business' },

    // Services
    { id: 'clerk_book', title: '书店店员', level: 1, salary: 160, startHour: 9, endHour: 17, companyType: 'store' },
    { id: 'waiter', title: '服务员', level: 1, salary: 180, startHour: 11, endHour: 20, companyType: 'restaurant' },
    { id: 'cook', title: '厨师', level: 2, salary: 350, startHour: 10, endHour: 20, companyType: 'restaurant' },
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
    { id: 'argue', label: '争吵', val: -15, type: 'friendship', minVal: -100, maxVal: 100, logType: 'bad', id: 'argue' }
];

export const BASE_DECAY = {
    energy: 0.8,
    hunger: 1.0,
    fun: 0.8,
    social: 0.8,
    bladder: 0.8,
    hygiene: 0.5
};

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

export const ORIENTATIONS = [
    { type: 'hetero', label: '异性恋' },
    { type: 'homo', label: '同性恋' },
    { type: 'bi', label: '双性恋' }
];