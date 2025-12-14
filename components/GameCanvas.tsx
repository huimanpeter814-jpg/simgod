import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, ROOMS, FURNITURE } from '../constants';
import { GameStore, gameLoopStep, getActivePalette, drawAvatarHead } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';

// ==========================================
// 🕒 后台保活核心：Worker Timer
// ==========================================
// 创建一个 Web Worker 来充当稳定的节拍器
// 浏览器的主线程 setTimeout/setInterval 在后台会被降频( throttled )，但 Worker 不会
const createWorker = () => {
    const blob = new Blob([`
        let interval = null;
        self.onmessage = function(e) {
            if (e.data === 'start') {
                if (interval) clearInterval(interval);
                // 30 TPS (Ticks Per Second)
                interval = setInterval(() => {
                    self.postMessage('tick');
                }, 1000 / 30);
            } else if (e.data === 'stop') {
                if (interval) clearInterval(interval);
            }
        };
    `], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
};

// ==========================================
// 🎨 像素艺术渲染核心 (程序化生成)
// ==========================================
const drawPixelProp = (ctx: CanvasRenderingContext2D, f: any, p: any) => {
    const { x, y, w, h, color, pixelPattern } = f;
    
    // 基础颜色处理
    ctx.fillStyle = color;

    // --- 🌳 自然景观 (树木/灌木) ---
    if (pixelPattern === 'tree_pixel') {
        // 树干 (深棕色)
        ctx.fillStyle = '#6D4C41';
        const trunkW = w * 0.3;
        ctx.fillRect(x + (w - trunkW) / 2, y + h * 0.6, trunkW, h * 0.4);
        
        // 树冠 (三层乐高堆叠)
        // 底层 (深色阴影)
        ctx.fillStyle = '#1B5E20'; 
        ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
        // 中层 (主色)
        ctx.fillStyle = '#2E7D32'; 
        ctx.fillRect(x + 2, y + h * 0.15, w - 4, h * 0.4);
        // 顶层 (高光)
        ctx.fillStyle = '#4CAF50'; 
        ctx.fillRect(x + 6, y, w - 12, h * 0.3);
        return;
    }
    
    if (pixelPattern === 'bush') {
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(x, y + h*0.2, w, h*0.8);
        ctx.fillStyle = '#4CAF50'; // 高光顶
        ctx.fillRect(x + 4, y, w - 8, h*0.4);
        // 点缀浆果
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + 6, y + 10, 4, 4);
        ctx.fillRect(x + w - 10, y + 15, 4, 4);
        return;
    }

    // --- 🛋️ 家具类 ---
    if (pixelPattern && pixelPattern.startsWith('bed')) {
        // 床头板
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x, y, w, 6);
        // 床垫 (白)
        ctx.fillStyle = '#ECEFF1';
        ctx.fillRect(x, y + 6, w, h - 6);
        // 枕头 (区分单双人)
        ctx.fillStyle = '#FFFFFF';
        if (pixelPattern === 'bed_king' || pixelPattern === 'bed_bunk') {
            ctx.fillRect(x + 6, y + 10, w / 2 - 10, 14); // 左枕头
            ctx.fillRect(x + w / 2 + 4, y + 10, w / 2 - 10, 14); // 右枕头
        } else {
            ctx.fillRect(x + w/2 - 10, y + 10, 20, 14);
        }
        // 被子 (使用家具主色)
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 30, w - 4, h - 32);
        // 被子折痕阴影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + 2, y + 30, w - 4, 4);
        return;
    }

    if (pixelPattern === 'sofa_pixel' || pixelPattern === 'sofa_lazy' || pixelPattern === 'sofa_vip') {
        // 沙发底座
        ctx.fillStyle = color;
        ctx.fillRect(x, y + h/2, w, h/2); // 底座
        ctx.fillRect(x, y, w, h); // 靠背
        // 扶手 (深色一点)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y + 10, 6, h - 10); // 左扶手
        ctx.fillRect(x + w - 6, y + 10, 6, h - 10); // 右扶手
        // 坐垫高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 6, y + h/2, w - 12, h/2 - 2);
        return;
    }

    // --- 💻 办公/科技类 ---
    if (pixelPattern === 'desk_pixel' || pixelPattern === 'desk_simple') {
        // 桌腿
        ctx.fillStyle = '#455A64';
        ctx.fillRect(x + 2, y, 4, h);
        ctx.fillRect(x + w - 6, y, 4, h);
        // 桌面
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h * 0.8);
        // 侧边阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y + h * 0.8, w, 4);
        return;
    }
    
    if (pixelPattern === 'pc_pixel' || pixelPattern === 'console') {
        // 底座
        ctx.fillStyle = '#37474F';
        ctx.fillRect(x + w/2 - 6, y + h - 4, 12, 4);
        // 屏幕边框
        ctx.fillStyle = '#263238';
        ctx.fillRect(x, y, w, h - 6);
        // 屏幕内容 (呼吸灯效果)
        const time = Date.now() % 2000;
        ctx.fillStyle = time < 1000 ? '#00BCD4' : '#0097A7';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 10);
        return;
    }

    if (pixelPattern === 'server') {
        ctx.fillStyle = '#212121';
        ctx.fillRect(x, y, w, h);
        // 闪烁的灯
        for(let i=0; i<4; i++) {
             ctx.fillStyle = Math.random() > 0.5 ? '#00E676' : '#212121';
             ctx.fillRect(x + w - 8, y + 5 + i*8, 4, 4);
        }
        // 通风口线条
        ctx.fillStyle = '#424242';
        for(let i=0; i<h; i+=4) {
            ctx.fillRect(x + 4, y + i, w - 16, 2);
        }
        return;
    }

    // --- 🏙️ 城市设施 ---
    if (pixelPattern === 'vending') {
        // 机身
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        // 顶部灯箱
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);
        // 玻璃窗
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(x + 4, y + 12, w * 0.6, h * 0.5);
        // 饮料罐 (像素点)
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + 6, y + 16, 4, 6);
        ctx.fillStyle = '#FFD740';
        ctx.fillRect(x + 12, y + 16, 4, 6);
        // 按钮区
        ctx.fillStyle = '#263238';
        ctx.fillRect(x + w * 0.7, y + 12, w * 0.2, h * 0.3);
        // 取货口
        ctx.fillStyle = '#212121';
        ctx.fillRect(x + 4, y + h - 10, w - 8, 8);
        return;
    }

    if (pixelPattern === 'bench_park') {
        // 木条纹理
        ctx.fillStyle = '#A1887F';
        for (let i = 0; i < h; i += 6) {
            ctx.fillRect(x, y + i, w, 4);
        }
        // 扶手
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x, y - 2, 4, h + 4);
        ctx.fillRect(x + w - 4, y - 2, 4, h + 4);
        return;
    }

    // --- 🛍️ 商店货架 ---
    if (pixelPattern && pixelPattern.startsWith('shelf')) {
        // 柜体
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x, y, w, h);
        // 层板阴影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + h/3, w, 2);
        ctx.fillRect(x, y + h*2/3, w, 2);
        
        // 商品 (随机色块模拟)
        const colors = pixelPattern === 'shelf_veg' ? ['#66BB6A', '#9CCC65'] : 
                       pixelPattern === 'shelf_meat' ? ['#EF5350', '#EC407A'] : 
                       ['#FFCA28', '#42A5F5', '#AB47BC'];
                       
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.fillStyle = colors[(r+c)%colors.length];
                const itemW = w/4 - 2;
                ctx.fillRect(x + 1 + c * (w/4), y + 2 + r * (h/3), itemW, h/3 - 4);
            }
        }
        return;
    }
    
    // --- 🚦 交通标识 ---
    if (pixelPattern === 'zebra') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
        return;
    }

    // --- 🎲 通用乐高风格回退 (Enhanced Box) ---
    // 1. 主体
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    
    // 2. 顶部高光 (模拟立体感)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, 4); // 顶边
    ctx.fillRect(x, y, 4, h); // 左边
    
    // 3. 底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + h - 4, w, 4); // 底边
    ctx.fillRect(x + w - 4, y, 4, h); // 右边

    // 4. 内部细节 (如果是桌子或柜子)
    if (f.label.includes('柜') || f.label.includes('桌')) {
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    }
};


const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // Camera State
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const draw = (ctx: CanvasRenderingContext2D, alpha: number) => {
        // 关闭平滑处理以保持像素锐利
        ctx.imageSmoothingEnabled = false;

        // 1. 清屏 (UI背景)
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- 应用摄像机变换 ---
        ctx.save();
        const camX = Math.floor(camera.x);
        const camY = Math.floor(camera.y);
        ctx.translate(-camX, -camY);

        const mouseWorldX = lastMousePos.current.x + camX;
        const mouseWorldY = lastMousePos.current.y + camY;

        const p = getActivePalette();

        // 2. 绘制世界背景
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // 3. 绘制房间/区域 (地板)
        ROOMS.forEach((r: any) => {
            // 外部阴影
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(r.x + 6, r.y + 6, r.w, r.h);

            const floorImg = getAsset((r as any).imagePath);
            if (floorImg) {
                const ptrn = ctx.createPattern(floorImg, 'repeat');
                if (ptrn) {
                    ctx.fillStyle = ptrn;
                    ctx.save();
                    ctx.translate(r.x, r.y);
                    ctx.fillRect(0, 0, r.w, r.h);
                    ctx.restore();
                } else {
                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h);
                }
            } else {
                ctx.fillStyle = r.color;
                ctx.fillRect(r.x, r.y, r.w, r.h);
                
                // 增加地板纹理细节 (如果是网格/地砖)
                if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                }
            }

            // 墙壁边框
            if (r.id !== 'park_base' && !r.id.startsWith('road')) {
                ctx.strokeStyle = p.wall;
                ctx.lineWidth = 4;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            // 区域标签
            if (r.label && !r.id.startsWith('road')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 10, r.y + 20);
            }
        });

        // 4. 绘制家具 (程序化像素艺术)
        FURNITURE.forEach((f: any) => {
            const shadowColor = p.furniture_shadow || 'rgba(0,0,0,0.2)';

            // 统一投射阴影 (让物体看起来悬浮或立体)
            if (f.pixelPattern !== 'zebra') { // 斑马线不需要阴影
                ctx.fillStyle = shadowColor;
                ctx.fillRect(f.x + 4, f.y + 4, f.w, f.h);
            }

            const furnImg = getAsset(f.imagePath);
            if (furnImg) {
                ctx.drawImage(furnImg, f.x, f.y, f.w, f.h);
            } else {
                //调用新的像素绘制函数
                drawPixelProp(ctx, f, p);
                
                // 像素发光效果 (Glow)
                if (f.pixelGlow) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = f.glowColor || f.color;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(f.x, f.y, f.w, f.h);
                    ctx.shadowBlur = 0; // 重置
                }
            }

            // 交互提示 (鼠标悬停)
            const dist = Math.sqrt(Math.pow(mouseWorldX - (f.x + f.w / 2), 2) + Math.pow(mouseWorldY - (f.y + f.h / 2), 2));
            if (dist < 40) {
                // Tooltip 背景
                const textWidth = ctx.measureText(f.label).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(f.x + f.w/2 - textWidth/2 - 4, f.y - 20, textWidth + 8, 16, 2);
                ctx.fill();
                ctx.stroke();
                
                // Tooltip 文字
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.font = '10px "Microsoft YaHei", sans-serif';
                ctx.fillText(f.label, f.x + f.w/2, f.y - 9);
                ctx.textAlign = 'left'; // 还原对齐
            }
        });

        // 5. 绘制角色 (Sims)
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
        renderSims.forEach(sim => {
            // 在后台模式下，简化插值逻辑，直接绘制当前位置，避免状态不一致
            // 如果需要极致平滑，可以在 Sim 类中记录 lastTickTime，但这对于像素风 30FPS 来说不是必须的
            const renderX = sim.pos.x; 
            const renderY = sim.pos.y; 

            if (sim.action === 'working' && renderX < 0) return;

            ctx.save();
            ctx.translate(renderX, renderY);

            // 选中标记
            if (GameStore.selectedSimId === sim.id) {
                // 旋转的光环
                ctx.save();
                ctx.rotate(Date.now() / 500);
                ctx.strokeStyle = '#39ff14';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 5, 15, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // 箭头
                ctx.fillStyle = '#39ff14';
                const floatY = -60 + Math.sin(Date.now() / 200) * 3;
                ctx.beginPath();
                ctx.moveTo(0, floatY);
                ctx.lineTo(-6, floatY - 8);
                ctx.lineTo(6, floatY - 8);
                ctx.fill();
            } else {
                // 脚底阴影
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); 
                ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); 
                ctx.fill();
            }

            let w = 20;
            let h = 42;

            // 角色身体 (改进版)
            // 裤子
            ctx.fillStyle = '#455A64'; 
            if (sim.appearance.pants) {
               // 如果有贴图逻辑放这里，这里用颜色回退
            }
            ctx.fillRect(-w / 2, -h + 20, w, h / 2);
            
            // 衣服
            ctx.fillStyle = sim.clothesColor;
            ctx.fillRect(-w / 2, -h + 12, w, h - 20);
            
            // 袖子 (增加立体感)
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(-w/2, -h + 12, 4, 10); // 左臂
            ctx.fillRect(w/2 - 4, -h + 12, 4, 10); // 右臂

            // 头部
            drawAvatarHead(ctx, 0, -h + 6, 13, sim);

            // 手机/道具
            if (sim.action === 'phone') {
                ctx.fillStyle = '#ECEFF1';
                ctx.fillRect(8, -22, 6, 9);
                ctx.fillStyle = '#81D4FA'; // 亮屏
                ctx.fillRect(9, -21, 4, 7);
            }

            // 气泡逻辑 (保持不变)
            if (sim.bubble.timer > 0 && sim.bubble.text) {
                ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
                let width = ctx.measureText(sim.bubble.text).width + 12;
                let bg = '#fff';
                let border = '#2d3436';
                let textC = '#2d3436';

                if (sim.bubble.type === 'love') { bg = '#fd79a8'; border = '#e84393'; textC = '#fff'; }
                else if (sim.bubble.type === 'ai') { bg = '#a29bfe'; border = '#6c5ce7'; textC = '#fff'; }
                else if (sim.bubble.type === 'act') { bg = '#55efc4'; border = '#00b894'; textC = '#000'; }
                else if (sim.bubble.type === 'bad') { bg = '#ff7675'; border = '#d63031'; textC = '#fff'; }
                else if (sim.bubble.type === 'money') { bg = '#ffeaa7'; border = '#fdcb6e'; textC = '#d35400'; }

                ctx.fillStyle = border;
                ctx.beginPath();
                ctx.moveTo(0, -h - 5);
                ctx.lineTo(-4, -h - 15);
                ctx.lineTo(4, -h - 15);
                ctx.fill();

                ctx.fillStyle = bg;
                ctx.strokeStyle = border;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-width / 2, -h - 38, width, 24, 4);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = textC;
                ctx.textAlign = 'center';
                ctx.fillText(sim.bubble.text, 0, -h - 22);
                ctx.textAlign = 'left'; // 还原
            }
            ctx.restore();
        });

        // 粒子系统 (爱心/表情)
        for (let i = GameStore.particles.length - 1; i >= 0; i--) {
            let p = GameStore.particles[i];
            p.y -= 0.6;
            p.life -= 0.015;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('❤️', p.x, p.y);
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'left';
            if (p.life <= 0) GameStore.particles.splice(i, 1);
        }

        ctx.restore();
    };

    // 🎨 渲染循环 (Draw Loop) - 使用 RAF
    const renderLoop = (timestamp: number) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) draw(ctx, 1);
        }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    useEffect(() => {
        // 1. 启动 Worker 逻辑循环 (后台保活)
        const worker = createWorker();
        worker.onmessage = (e) => {
            if (e.data === 'tick') {
                // 执行游戏逻辑更新 (30次/秒)
                gameLoopStep();
            }
        };
        worker.postMessage('start');

        // 2. 启动渲染循环 (前台绘制)
        requestRef.current = requestAnimationFrame(renderLoop);

        return () => {
            // 清理
            worker.postMessage('stop');
            worker.terminate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [camera]); // Camera change triggers redraw, but logic loop is persistent

    // 鼠标控制逻辑 (支持拖拽和平移)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { 
            isDragging.current = true;
            hasDragged.current = false;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    
        if (isDragging.current) {
            if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
                hasDragged.current = true;
            }
            const moveX = e.movementX;
            const moveY = e.movementY;
            setCamera(prev => ({ x: prev.x - moveX, y: prev.y - moveY }));
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        isDragging.current = false;

        // 只有未发生拖拽的点击才视为选中
        if (e.button === 0 && !hasDragged.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = mouseX + camera.x;
            const worldY = mouseY + camera.y;

            let hit: string | null = null;
            // 简单的点击碰撞检测
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 30 && Math.abs(worldY - (s.pos.y - 20)) < 40) {
                    hit = s.id; break;
                }
            }
            GameStore.selectedSimId = hit;
            GameStore.notify(); // 通知React组件更新UI (如果有侧边栏的话)
        }
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="block bg-[#121212] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
        />
    );
};

export default GameCanvas;