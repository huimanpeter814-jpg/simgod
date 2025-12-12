import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, ROOMS, FURNITURE } from '../constants';
import { GameStore, gameLoopStep, getActivePalette, drawAvatarHead } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // Camera State
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Ensure pixel art look
        ctx.imageSmoothingEnabled = false;

        // 1. Clear Screen (UI Background)
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- Apply Camera Transform ---
        ctx.save();
        // 对摄像机坐标取整，避免像素抖动
        const camX = Math.floor(camera.x);
        const camY = Math.floor(camera.y);
        ctx.translate(-camX, -camY);

        // Calculate visible mouse pos for hover detection
        const mouseWorldX = lastMousePos.current.x + camX;
        const mouseWorldY = lastMousePos.current.y + camY;

        // Background & Palette
        const p = getActivePalette();

        // 2. Draw World Background
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // 3. Draw Rooms (Simple Fill OR Custom Image)
        ROOMS.forEach((r: any) => {
            // Wall Shadow (Outer)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(r.x + 4, r.y + 4, r.w, r.h);

            // [新增] 尝试绘制自定义地板图片
            // 类型强转，因为 constants.ts 是对象字面量可能未完全匹配接口
            const floorImg = getAsset((r as any).imagePath);
            if (floorImg) {
                // 平铺模式
                const ptrn = ctx.createPattern(floorImg, 'repeat');
                if (ptrn) {
                    ctx.fillStyle = ptrn;
                    // 需要平移 pattern 到房间原点，不然纹理会从 (0,0) 开始对齐
                    ctx.save();
                    ctx.translate(r.x, r.y);
                    ctx.fillRect(0, 0, r.w, r.h);
                    ctx.restore();
                } else {
                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h); // 拉伸模式备选
                }
            } else {
                // 回退到纯色
                ctx.fillStyle = r.color;
                ctx.fillRect(r.x, r.y, r.w, r.h);
            }

            // Walls
            if (r.id !== 'park' && r.id !== 'street' && r.id !== 'lake') {
                ctx.strokeStyle = p.wall;
                ctx.lineWidth = 4; // 稍微变细一点边框
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            // Room Label
            if (r.label && r.id !== 'street') {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.font = '12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 8, r.y + 20);
            }
        });

        // 4. Draw Furniture (Enhanced Pixel Style OR Custom Image)
        FURNITURE.forEach((f: any) => {
            const shadowColor = p.furniture_shadow || 'rgba(0,0,0,0.2)';

            // Cast Shadow
            ctx.fillStyle = shadowColor;
            ctx.fillRect(f.x + 4, f.y + 4, f.w, f.h);

            // [新增] 尝试绘制自定义家具图片
            const furnImg = getAsset(f.imagePath);
            if (furnImg) {
                ctx.drawImage(furnImg, f.x, f.y, f.w, f.h);
            } else {
                // === 原有的几何绘制逻辑 (回退) ===

                // Base Shape
                ctx.fillStyle = f.color;
                ctx.fillRect(f.x, f.y, f.w, f.h);

                // Simple Bevel Effect (Highlight Top, Shadow Bottom)
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(f.x, f.y, f.w, 3);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(f.x, f.y + f.h - 3, f.w, 3);

                // Specific Details (Minimal)
                if (f.label.includes('床')) {
                    // Pillow
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, 20);
                    // Blanket
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(f.x + 5, f.y + 30, f.w - 10, f.h - 35);
                }
                else if (f.label.includes('电脑')) {
                    ctx.fillStyle = '#000'; // Screen Off

                    // 修复：使用时间而非随机数来控制闪烁，避免高频频闪
                    // 呼吸灯效果：2秒周期，1.5秒亮，0.5秒灭
                    const time = Date.now() % 2000;
                    if (time < 1500) {
                        ctx.fillStyle = '#81ecec'; // Screen On
                    }

                    ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 15);
                }
                else if (f.id === 'lake') {
                    // Simple water effect
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(f.x + 10, f.y + 10, f.w - 20, f.h - 20);
                }
                else if (f.utility === 'gardening') {
                    // Flowers (Simple dots)
                    ctx.fillStyle = '#ff7675';
                    ctx.fillRect(f.x + f.w / 3, f.y + f.h / 3, 6, 6);
                    ctx.fillStyle = '#fdcb6e';
                    ctx.fillRect(f.x + f.w * 0.6, f.y + f.h * 0.6, 6, 6);
                }

                // Direction Indicator
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                const indSize = 4;
                if (f.dir === 'up') ctx.fillRect(f.x, f.y, f.w, indSize);
                if (f.dir === 'down') ctx.fillRect(f.x, f.y + f.h - indSize, f.w, indSize);
                if (f.dir === 'left') ctx.fillRect(f.x, f.y, indSize, f.h);
                if (f.dir === 'right') ctx.fillRect(f.x + f.w - indSize, f.y, indSize, f.h);
            }

            // [新功能] 家具名称显示
            // 只有当鼠标悬停或非常接近时才显示
            const dist = Math.sqrt(Math.pow(mouseWorldX - (f.x + f.w / 2), 2) + Math.pow(mouseWorldY - (f.y + f.h / 2), 2));
            if (dist < 50) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(f.x, f.y - 14, ctx.measureText(f.label).width + 6, 14);
                ctx.fillStyle = '#fff';
                ctx.font = '10px "Microsoft YaHei", sans-serif';
                ctx.fillText(f.label, f.x + 3, f.y - 3);
            }
        });

        // 5. Draw Sims
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
        renderSims.forEach(sim => {
            if (sim.action === 'working' && sim.pos.x < 0) return;

            ctx.save();
            ctx.translate(sim.pos.x, sim.pos.y);

            // Selection Marker
            if (GameStore.selectedSimId === sim.id) {
                ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
                ctx.beginPath();
                ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Arrow
                ctx.fillStyle = '#39ff14';
                const floatY = -55 + Math.sin(Date.now() / 200) * 3;
                ctx.beginPath();
                ctx.moveTo(0, floatY);
                ctx.lineTo(-5, floatY - 8);
                ctx.lineTo(5, floatY - 8);
                ctx.fill();
            } else {
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
            }

            let w = 20;
            let h = 42;

            // Pants
            const pantsImg = getAsset(sim.appearance.pants);
            if (pantsImg) {
                ctx.drawImage(pantsImg, -w / 2, -h + 20, w, h / 2);
            } else {
                ctx.fillStyle = '#555';
                ctx.fillRect(-w / 2, -h + 20, w, h / 2);
            }

            // Clothes
            const clothesImg = getAsset(sim.appearance.clothes);
            if (clothesImg) {
                ctx.drawImage(clothesImg, -w / 2, -h + 12, w, h / 2);
            } else {
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, -h + 12, w, h - 14);
            }

            // Head
            drawAvatarHead(ctx, 0, -h + 6, 13, sim);

            // Phone
            if (sim.action === 'phone') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(8, -22, 6, 9);
            }

            // Bubble
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
                ctx.fillRect(-width / 2, -h - 38, width, 24);
                ctx.strokeRect(-width / 2, -h - 38, width, 24);

                ctx.fillStyle = textC;
                ctx.textAlign = 'center';
                ctx.fillText(sim.bubble.text, 0, -h - 22);
            }
            ctx.restore();
        });

        // Particles
        for (let i = GameStore.particles.length - 1; i >= 0; i--) {
            let p = GameStore.particles[i];
            p.y -= 0.6;
            p.life -= 0.015;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.font = '14px serif';
            ctx.fillText('❤️', p.x, p.y);
            ctx.globalAlpha = 1.0;
            if (p.life <= 0) GameStore.particles.splice(i, 1);
        }

        // NO OVERLAY DRAWN HERE

        ctx.restore();
    };

    const animate = () => {
        gameLoopStep();
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) draw(ctx);
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [camera]);

    // Mouse Controls
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { // Middle click drag
            e.preventDefault();
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (e.button === 0) { // Left click select
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = mouseX + camera.x;
            const worldY = mouseY + camera.y;

            let hit: string | null = null;
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 30 && Math.abs(worldY - (s.pos.y - 20)) < 40) {
                    hit = s.id; break;
                }
            }
            GameStore.selectedSimId = hit;
            GameStore.notify();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Always track mouse for hover effects even if not dragging
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        if (isDragging.current) {
            // React synthetic events have movementX/Y
            const moveX = e.movementX;
            const moveY = e.movementY;
            setCamera(prev => ({ x: prev.x - moveX, y: prev.y - moveY }));
        }
    };

    const handleMouseUp = () => { isDragging.current = false; };

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="block bg-[#121212] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default GameCanvas;