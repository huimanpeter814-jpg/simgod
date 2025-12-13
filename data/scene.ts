import { Furniture } from '../types';

const PALETTE = {
    // 基础环境色 (低饱和，耐看)
    ground_concrete: '#e3e4e8', // 浅灰水泥地
    ground_asphalt: '#3d404b',  // 深蓝灰柏油路
    ground_grass_light: '#9bc5a2', // 清新草绿
    ground_grass_dark: '#7fb088',  // 深草绿
    ground_water: '#89ccd9',    // 通透水蓝
    ground_wood: '#dcc6aa',     // 温暖木地板
    
    // 建筑色 (带情绪倾向)
    build_glass: '#d4e4ed',     // 办公楼玻璃感
    build_brick: '#e8d3c5',     // 住宅暖砖
    build_dark: '#2c3e50',      // 商业区暗色调
    
    // 点缀色 (用于家具和道具)
    accent_red: '#e07b7b',      // 柔和红
    accent_blue: '#7dafd9',     // 灰蓝
    accent_yellow: '#ebd388',   // 奶酪黄
    accent_purple: '#bcaad6',   // 香芋紫
    accent_green: '#8ec7b6',    // 薄荷绿
    accent_dark: '#2d3436',     // 黑色/深灰物体
    accent_metal: '#b2bec3',    // 金属银
    accent_wood_dark: '#8e44ad',// 深色木/高级感
};

// 光影氛围配置 (Time of Day Moods)
export const PALETTES: any = {
    earlyMorning: { 
        zone1: '#f0f3f5', zone2: '#e6e9ed', zone3: '#dce0e6', 
        wall: '#8faab8', bg: '#2f3640', 
        overlay: 'rgba(163, 203, 255, 0.15)', 
        furniture_shadow: 'rgba(47, 53, 66, 0.2)' 
    },
    noon: { 
        zone1: '#ffffff', zone2: '#f7f9fa', zone3: '#eff1f3', 
        wall: '#95a5a6', bg: '#2f3640', 
        overlay: 'rgba(255, 250, 240, 0.05)', 
        furniture_shadow: 'rgba(47, 53, 66, 0.15)' 
    },
    afternoon: { 
        zone1: '#fffcf5', zone2: '#fbf7ed', zone3: '#f2ece4', 
        wall: '#a4b0be', bg: '#2f3640', 
        overlay: 'rgba(255, 218, 185, 0.12)', 
        furniture_shadow: 'rgba(47, 53, 66, 0.15)' 
    },
    dusk: { 
        zone1: '#fff2d9', zone2: '#ffeaa7', zone3: '#fab1a0', 
        wall: '#636e72', bg: '#2d3436', 
        overlay: 'rgba(108, 92, 231, 0.25)', 
        furniture_shadow: 'rgba(45, 52, 54, 0.3)' 
    },
    night: { 
        zone1: '#353b48', zone2: '#2f3640', zone3: '#2f3640', 
        wall: '#1e272e', bg: '#101010', 
        overlay: 'rgba(25, 42, 86, 0.45)', 
        furniture_shadow: 'rgba(0, 0, 0, 0.5)' 
    },
    lateNight: { 
        zone1: '#2f3640', zone2: '#2d3436', zone3: '#2d3436', 
        wall: '#000000', bg: '#000000', 
        overlay: 'rgba(0, 0, 0, 0.65)', 
        furniture_shadow: 'rgba(0, 0, 0, 0.6)' 
    }
};

// ==========================================
// 🗺️ 房间区域定义 (1400x1000)
// ==========================================
const ROAD_W = 80;

export const ROOMS = [
    // === 🛣️ 基础设施层 ===
    { id: 'road_h_top', x: 0, y: 400, w: 2400, h: ROAD_W, label: '', color: PALETTE.ground_asphalt }, 
    { id: 'road_h_bot', x: 0, y: 1150, w: 2400, h: ROAD_W, label: '', color: PALETTE.ground_asphalt }, 
    { id: 'road_v_left', x: 500, y: 0, w: ROAD_W, h: 1800, label: '', color: PALETTE.ground_asphalt }, 
    { id: 'road_v_right', x: 1600, y: 0, w: ROAD_W, h: 1800, label: '', color: PALETTE.ground_asphalt },

    // === 🏙️ 北部：CBD ===
    { id: 'cbd_plaza_ground', x: 580, y: 50, w: 1020, h: 350, label: '', color: '#ecf0f1' },
    { id: 'office_tower_a', x: 100, y: 50, w: 400, h: 350, label: 'TECH TOWER', color: '#dae6eb' },
    { id: 'office_tower_b', x: 650, y: 50, w: 400, h: 350, label: 'FINANCE CENTER', color: '#ced6e0' },
    { id: 'design_studio', x: 1100, y: 50, w: 350, h: 250, label: 'Pixel Studio', color: '#ffeaa7' },
    
    // 豪华公寓
    { id: 'luxury_ground', x: 1480, y: 50, w: 700, h: 350, label: '', color: PALETTE.ground_wood },
    { id: 'luxury_apt_1', x: 1500, y: 50, w: 300, h: 350, label: 'Sky Apt I', color: '#fff5e6' },
    { id: 'luxury_apt_2', x: 1850, y: 50, w: 300, h: 350, label: 'Sky Apt II', color: '#fff5e6' },

    // === 🌳 中部：中央公园 ===
    { id: 'park_base', x: 580, y: 480, w: 1020, h: 670, label: '', color: PALETTE.ground_grass_dark },
    { id: 'park_lawn', x: 600, y: 500, w: 980, h: 630, label: 'Central Park', color: PALETTE.ground_grass_light },
    { id: 'park_lake_border', x: 840, y: 640, w: 520, h: 320, label: '', color: '#74b9ff' },
    { id: 'park_lake', x: 850, y: 650, w: 500, h: 300, label: 'Mirror Lake', color: PALETTE.ground_water },
    { id: 'park_plaza', x: 980, y: 950, w: 240, h: 120, label: '', color: '#ecf0f1' },

    // === 🏘️ 西部：居住区 ===
    { id: 'res_ground', x: 20, y: 480, w: 480, h: 1320, label: '', color: '#f5f6fa' },
    { id: 'res_block_a', x: 50, y: 500, w: 420, h: 280, label: 'Block A', color: PALETTE.build_brick },
    { id: 'res_block_b', x: 50, y: 820, w: 420, h: 280, label: 'Block B', color: PALETTE.build_brick },
    { id: 'res_block_c', x: 50, y: 1140, w: 420, h: 280, label: 'Youth Apt', color: '#dfe4ea' },
    { id: 'community_center', x: 50, y: 1460, w: 420, h: 300, label: 'Civic Center', color: '#a29bfe' },

    // === 🛍️ 南部：商业娱乐 ===
    { id: 'commercial_pave', x: 580, y: 1230, w: 1020, h: 570, label: '', color: '#dcdde1' },
    { id: 'mall_main', x: 600, y: 1250, w: 600, h: 500, label: 'WANDA PLAZA', color: '#f1c40f' },
    { id: 'entertainment_complex', x: 1230, y: 1250, w: 370, h: 500, label: 'CINEMA BOX', color: '#2d3436' },

    // === 🏥 东部：公共服务 ===
    { id: 'public_ground', x: 1680, y: 480, w: 720, h: 1320, label: '', color: '#f7f1e3' },
    { id: 'hospital_main', x: 1700, y: 500, w: 650, h: 300, label: 'General Hospital', color: '#81ecec' },
    { id: 'library_complex', x: 1700, y: 850, w: 650, h: 250, label: 'City Library', color: '#ffffff' },
    { id: 'gym_complex', x: 2000, y: 1250, w: 350, h: 500, label: 'OLYMPIC GYM', color: '#b2bec3' },
    { id: 'arcade_zone', x: 1680, y: 1250, w: 300, h: 240, label: 'CYBER ZONE', color: '#636e72' },
    { id: 'night_club', x: 1680, y: 1510, w: 300, h: 240, label: 'NEON CLUB', color: '#192a56' },
];

const createRow = (baseId: string, startX: number, startY: number, count: number, gapX: number, gapY: number, props: any) => {
    return Array.from({ length: count }).map((_, i) => ({
        ...props,
        id: `${baseId}_${i}`,
        x: startX + i * gapX,
        y: startY + i * gapY,
    }));
};

const createGrid = (baseId: string, startX: number, startY: number, cols: number, rows: number, gapX: number, gapY: number, props: any) => {
    let items: Furniture[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            items.push({
                ...props,
                id: `${baseId}_${r}_${c}`,
                x: startX + c * gapX,
                y: startY + r * gapY
            });
        }
    }
    return items;
};

// ==========================================
// 🪑 极繁主义家具与装饰 (Maximalist Decor)
// ==========================================
export const FURNITURE: Furniture[] = [
    // -----------------------------------------------------
    // 🌳 城市街道设施 (Street Clutter) - [修复版]
    // -----------------------------------------------------
    // 梧桐行道树 (修复：Y坐标调整到道路中心)
    // road_h_top (y: 400-480) -> tree y: 420
    ...createRow('tree_rd_top', 20, 420, 24, 100, 0, { w: 40, h: 40, color: '#2d3436', label: 'Tree', utility: 'none', dir: 'down', multiUser: false }),
    // road_h_bot (y: 1150-1230) -> tree y: 1170
    ...createRow('tree_rd_bot', 20, 1170, 24, 100, 0, { w: 40, h: 40, color: '#2d3436', label: 'Tree', utility: 'none', dir: 'up', multiUser: false }),
    
    // 路灯 (修复：X坐标调整到道路中心)
    // road_v_left (x: 500-580) -> light x: 535
    ...createRow('light_v_l', 535, 20, 18, 0, 100, { w: 10, h: 10, color: '#f1c40f', label: 'Lamp', utility: 'none', dir: 'left', multiUser: false }),
    // road_v_right (x: 1600-1680) -> light x: 1635
    ...createRow('light_v_r', 1635, 20, 18, 0, 100, { w: 10, h: 10, color: '#f1c40f', label: 'Lamp', utility: 'none', dir: 'right', multiUser: false }),

    // 自动贩卖机群 (修复：移出马路中央，放置在人行道/广场边缘 y:370)
    { id: 'vending_h1', x: 400, y: 370, w: 40, h: 20, color: '#e74c3c', label: 'Cola', utility: 'buy_drink', dir: 'down' },
    { id: 'vending_h2', x: 450, y: 370, w: 40, h: 20, color: '#3498db', label: 'Water', utility: 'buy_drink', dir: 'down' },
    { id: 'vending_h3', x: 1200, y: 370, w: 40, h: 20, color: '#f39c12', label: 'Snack', utility: 'buy_drink', dir: 'down' },
    
    // 公交车站 (保持现状，位于路边)
    { id: 'bus_stop_1', x: 800, y: 380, w: 120, h: 20, color: '#bdc3c7', label: 'Bus Stop', utility: 'waiting', dir: 'down' },
    { id: 'bus_stop_2', x: 1800, y: 1120, w: 120, h: 20, color: '#bdc3c7', label: 'Bus Stop', utility: 'waiting', dir: 'up' },

    // -----------------------------------------------------
    // 🏢 北部 CBD (Tech & Finance) - 拥挤的办公感
    // -----------------------------------------------------
    // Tech Tower: 密集的工位 + 服务器
    ...createGrid('tech_desk', 120, 80, 6, 4, 60, 60, { w: 40, h: 25, color: '#34495e', label: 'Code', utility: 'work', dir: 'down' }),
    ...createRow('tech_chair', 125, 110, 6, 60, 0, { w: 20, h: 20, color: '#95a5a6', label: 'Chair', utility: 'sit', dir: 'up' }), // 椅子
    // 服务器机房 (闪烁的灯)
    ...createRow('server_rack', 420, 60, 5, 0, 40, { w: 60, h: 30, color: '#2c3e50', label: 'Server', utility: 'none', dir: 'left' }),
    // 饮水休闲角
    { id: 'water_cooler', x: 450, y: 300, w: 20, h: 20, color: '#00cec9', label: 'Water', utility: 'drink' },
    { id: 'office_sofa', x: 400, y: 330, w: 80, h: 30, color: '#7f8c8d', label: 'Rest', utility: 'comfort' },

    // Finance Center: 大会议桌 + 独立办公室
    { id: 'conf_table', x: 750, y: 150, w: 160, h: 80, color: '#ecf0f1', label: 'Meeting', utility: 'work_group', dir: 'down', multiUser: true }, // 大白桌
    ...createRow('conf_chair_t', 760, 130, 4, 40, 0, { w: 20, h: 20, color: '#2d3436', label: 'Chair', utility: 'sit' }),
    ...createRow('conf_chair_b', 760, 240, 4, 40, 0, { w: 20, h: 20, color: '#2d3436', label: 'Chair', utility: 'sit' }),
    // 老板桌 (巨大)
    { id: 'boss_desk', x: 800, y: 320, w: 120, h: 50, color: '#636e72', label: 'CEO', utility: 'work' },
    { id: 'file_cabinet', x: 950, y: 100, w: 40, h: 200, color: '#b2bec3', label: 'Files', utility: 'none' },

    // Pixel Studio: 凌乱的艺术感
    ...createGrid('art_easel', 1120, 80, 3, 3, 80, 80, { w: 40, h: 50, color: PALETTE.accent_red, label: 'Canvas', utility: 'paint' }),
    { id: 'messy_rug', x: 1250, y: 150, w: 100, h: 100, color: '#fab1a0', label: 'Rug', utility: 'none' }, // 地毯
    { id: 'coffee_machine', x: 1400, y: 250, w: 30, h: 30, color: '#d63031', label: 'Coffee', utility: 'drink' },
    { id: 'bean_bag', x: 1350, y: 100, w: 40, h: 40, color: '#fd79a8', label: 'BeanBag', utility: 'comfort' },

    // -----------------------------------------------------
    // 🏠 豪华公寓 - 充满生活细节
    // -----------------------------------------------------
    // Apt 1
    { id: 'lux_kitchen_island', x: 1600, y: 150, w: 120, h: 40, color: '#fff', label: 'Kitchen', utility: 'cook' },
    { id: 'lux_dining_table', x: 1600, y: 220, w: 80, h: 80, color: '#b2bec3', label: 'Dining', utility: 'eat' },
    { id: 'lux_piano', x: 1720, y: 300, w: 60, h: 40, color: '#000', label: 'Piano', utility: 'music' },
    // Apt 2
    { id: 'lux_bed_king', x: 1900, y: 80, w: 100, h: 110, color: PALETTE.accent_yellow, label: 'King Bed', utility: 'energy', multiUser: true },
    { id: 'lux_tv_unit', x: 1900, y: 300, w: 120, h: 20, color: '#2d3436', label: 'OLED TV', utility: 'watch_tv' },
    { id: 'lux_plant', x: 2100, y: 350, w: 30, h: 30, color: '#00b894', label: 'Plant', utility: 'none' },

    // -----------------------------------------------------
    // 🌳 中央公园 - 极其热闹
    // -----------------------------------------------------
    // 湖中鸭子船
    { id: 'duck_boat_1', x: 900, y: 700, w: 40, h: 30, color: '#ffeaa7', label: 'DuckBoat', utility: 'play' },
    { id: 'duck_boat_2', x: 1000, y: 750, w: 40, h: 30, color: '#ffeaa7', label: 'DuckBoat', utility: 'play' },
    
    // 环湖长椅 (加密)
    ...createRow('park_bench_t', 600, 620, 8, 80, 0, { w: 40, h: 15, color: '#e17055', label: 'Bench', utility: 'comfort' }),
    
    // 野餐区 (各色地垫)
    { id: 'picnic_a', x: 700, y: 900, w: 80, h: 80, color: '#ff7675', label: 'Picnic', utility: 'eat' },
    { id: 'picnic_b', x: 800, y: 1000, w: 80, h: 80, color: '#74b9ff', label: 'Picnic', utility: 'eat' },
    
    // 广场小摊贩
    { id: 'food_cart_1', x: 950, y: 900, w: 50, h: 30, color: '#d35400', label: 'HotDog', utility: 'buy_food' },
    { id: 'food_cart_2', x: 1150, y: 900, w: 50, h: 30, color: '#fdcb6e', label: 'IceCream', utility: 'buy_food' },
    
    // 森林迷宫区
    ...createGrid('forest_dense', 600, 1050, 4, 3, 50, 50, { w: 30, h: 30, color: '#00b894', label: 'Bush', utility: 'none' }),

    // -----------------------------------------------------
    // 🏘️ 居住区 - 高密度胶囊生活
    // -----------------------------------------------------
    // Block A: 宿舍风格
    ...createGrid('dorm_bed', 60, 520, 4, 3, 100, 80, { w: 50, h: 70, color: '#0984e3', label: 'Bunk', utility: 'energy' }),
    ...createGrid('dorm_desk', 120, 520, 4, 3, 100, 80, { w: 30, h: 30, color: '#b2bec3', label: 'Desk', utility: 'work' }),
    
    // Block B: 家庭风格 (带厨房)
    ...createGrid('apt_kitchen', 60, 840, 2, 2, 200, 120, { w: 100, h: 30, color: '#636e72', label: 'Kitchen', utility: 'cook' }),
    ...createGrid('apt_table', 80, 890, 2, 2, 200, 120, { w: 60, h: 60, color: '#fdcb6e', label: 'Table', utility: 'eat' }),
    
    // Youth Apt: 乱七八糟
    ...createGrid('lazy_sofa', 60, 1160, 4, 2, 90, 60, { w: 50, h: 40, color: '#6c5ce7', label: 'Sofa', utility: 'comfort' }),
    { id: 'gaming_tv', x: 250, y: 1200, w: 150, h: 10, color: '#000', label: 'TV Wall', utility: 'watch_tv' },
    
    // 社区中心
    ...createGrid('mahjong', 80, 1500, 3, 2, 110, 100, { w: 70, h: 70, color: '#27ae60', label: 'Mahjong', utility: 'play', multiUser: true }),
    { id: 'pingpong', x: 350, y: 1550, w: 90, h: 50, color: '#0984e3', label: 'PingPong', utility: 'play' },

    // -----------------------------------------------------
    // 🛍️ 商业街 - 琳琅满目
    // -----------------------------------------------------
    // Wanda Plaza
    // 1. 化妆品柜台 (方块阵列)
    ...createGrid('cosmetic_cnt', 620, 1270, 4, 2, 60, 50, { w: 40, h: 30, color: '#fd79a8', label: 'Beauty', utility: 'buy_item' }),
    // 2. 服装区 (细长衣架)
    ...createGrid('clothes_rack', 900, 1270, 3, 3, 80, 60, { w: 60, h: 10, color: '#e17055', label: 'Fashion', utility: 'buy_item' }),
    // 3. 收银台
    { id: 'cashier_mall', x: 800, y: 1500, w: 120, h: 40, color: '#2d3436', label: 'Checkout', utility: 'pay' },
    // 4. 超市货架 (密集)
    ...createGrid('market_shelf', 620, 1600, 5, 3, 80, 40, { w: 60, h: 20, color: '#ffeaa7', label: 'Food', utility: 'buy_item' }),

    // Cinema Box
    // 修复：售票亭放入建筑内部 (建筑y:1250, booth y:1260)
    { id: 'ticket_booth', x: 1250, y: 1260, w: 80, h: 40, color: '#d63031', label: 'Tickets', utility: 'pay' },
    { id: 'popcorn_machine', x: 1350, y: 1230, w: 40, h: 40, color: '#f1c40f', label: 'Popcorn', utility: 'buy_food' },
    // 影厅 (更多的座位)
    { id: 'screen_imax', x: 1280, y: 1350, w: 300, h: 10, color: '#fff', label: 'IMAX', utility: 'none' },
    ...createGrid('seat_imax', 1280, 1400, 6, 5, 45, 40, { w: 30, h: 30, color: '#c0392b', label: 'Seat', utility: 'cinema_3d' }),

    // -----------------------------------------------------
    // 🏥 公共服务区 - 专业设施
    // -----------------------------------------------------
    // 医院
    { id: 'reception_med', x: 1720, y: 520, w: 120, h: 40, color: '#fff', label: 'Reception', utility: 'none' },
    ...createGrid('med_bed_scan', 1900, 550, 3, 2, 100, 100, { w: 60, h: 90, color: '#74b9ff', label: 'Scan Bed', utility: 'energy' }),
    { id: 'mri_machine', x: 2200, y: 600, w: 80, h: 80, color: '#b2bec3', label: 'CT Scan', utility: 'med_check' },
    
    // 图书馆
    ...createGrid('book_row_a', 1720, 900, 8, 1, 60, 0, { w: 40, h: 100, color: '#e67e22', label: 'History', utility: 'buy_book' }),
    ...createGrid('read_desk', 1720, 1050, 4, 1, 120, 0, { w: 100, h: 40, color: '#d35400', label: 'Study', utility: 'work' }),

    // -----------------------------------------------------
    // 🏋️‍♀️ 健身与夜生活
    // -----------------------------------------------------
    // 健身房
    // 跑步机 (细长黑)
    ...createRow('treadmill', 2020, 1270, 5, 60, 0, { w: 40, h: 80, color: '#2d3436', label: 'Run', utility: 'run', dir: 'up' }),
    // 举重区
    ...createGrid('weights', 2050, 1500, 3, 2, 60, 60, { w: 40, h: 40, color: '#636e72', label: 'Dumbbell', utility: 'lift' }),
    
    // 电玩城
    ...createGrid('arcade_machine', 1700, 1270, 5, 3, 50, 60, { w: 40, h: 50, color: '#a29bfe', label: 'Game', utility: 'play' }),
    { id: 'crane_game', x: 1900, y: 1350, w: 60, h: 60, color: '#fd79a8', label: 'UFO Catcher', utility: 'play' },

    // 夜店
    { id: 'bar_counter_long', x: 1680, y: 1530, w: 20, h: 200, color: '#e84393', label: 'Bar', utility: 'buy_drink' }, // 竖长吧台
    ...createRow('bar_stool', 1710, 1540, 6, 0, 30, { w: 15, h: 15, color: '#fff', label: 'Stool', utility: 'sit' }),
    { id: 'dj_stage', x: 1850, y: 1520, w: 120, h: 50, color: '#6c5ce7', label: 'DJ Deck', utility: 'music' },
    { id: 'speaker_l', x: 1800, y: 1520, w: 40, h: 60, color: '#000', label: 'Bass', utility: 'none' },
    { id: 'speaker_r', x: 1980, y: 1520, w: 40, h: 60, color: '#000', label: 'Bass', utility: 'none' },
];