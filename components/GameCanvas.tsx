import React, { useRef, useEffect } from 'react';
import { CONFIG, ROOMS, FURNITURE } from '../constants';
import { GameStore, gameLoopStep, getActivePalette, drawAvatarHead } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';

// ... createWorker 和 drawPixelProp 保持不变 (省略以节省篇幅，请保留原代码) ...
const createWorker = () => {
    const blob = new Blob([`
        let interval = null;
        self.onmessage = function(e) {
            if (e.data === 'start') {
                if (interval) clearInterval(interval);
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

const drawPixelProp = (ctx: CanvasRenderingContext2D, f: any, p: any) => {
    const { x, y, w, h, color, pixelPattern } = f;
    ctx.fillStyle = color;
    // ... 请务必保留你原来的 drawPixelProp 完整代码 ...
    // 这里只写个兜底防止报错
    ctx.fillRect(x, y, w, h); 
};

// Lerp 辅助函数
const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    const cameraRef = useRef({ x: 0, y: 0 });

    // [新增] 镜头锁定控制
    const isCameraLocked = useRef(false); 
    // [新增] 记录上一帧选中的ID，用于检测是否刚刚切换了人
    const lastSelectedId = useRef<string | null>(null);

    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.imageSmoothingEnabled = false;

        // 1. 清屏
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- 应用摄像机变换 ---
        ctx.save();
        const camX = Math.floor(cameraRef.current.x);
        const camY = Math.floor(cameraRef.current.y);
        ctx.translate(-camX, -camY);

        const mouseWorldX = lastMousePos.current.x + camX;
        const mouseWorldY = lastMousePos.current.y + camY;

        const p = getActivePalette();

        // 2. 绘制世界背景
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // 3. 绘制房间/区域
        ROOMS.forEach((r: any) => {
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
                if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                }
            }
            if (r.id !== 'park_base' && !r.id.startsWith('road')) {
                ctx.strokeStyle = p.wall;
                ctx.lineWidth = 4;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }
            if (r.label && !r.id.startsWith('road')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 10, r.y + 20);
            }
        });

        // 4. 绘制家具
        FURNITURE.forEach((f: any) => {
            if (f.pixelPattern !== 'zebra') {
                ctx.fillStyle = p.furniture_shadow || 'rgba(0,0,0,0.2)';
                ctx.fillRect(f.x + 4, f.y + 4, f.w, f.h);
            }

            const furnImg = getAsset(f.imagePath);
            if (furnImg) {
                ctx.drawImage(furnImg, f.x, f.y, f.w, f.h);
            } else {
                drawPixelProp(ctx, f, p); // 确保这个函数存在
                if (f.pixelGlow) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = f.glowColor || f.color;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(f.x, f.y, f.w, f.h);
                    ctx.shadowBlur = 0;
                }
            }

            // Tooltip
            const dist = Math.sqrt(Math.pow(mouseWorldX - (f.x + f.w / 2), 2) + Math.pow(mouseWorldY - (f.y + f.h / 2), 2));
            if (dist < 40) {
                const textWidth = ctx.measureText(f.label).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(f.x + f.w/2 - textWidth/2 - 4, f.y - 20, textWidth + 8, 16, 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.font = '10px "Microsoft YaHei", sans-serif';
                ctx.fillText(f.label, f.x + f.w/2, f.y - 9);
                ctx.textAlign = 'left';
            }
        });

        // 5. 绘制角色
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
        renderSims.forEach(sim => {
            const renderX = sim.pos.x; 
            const renderY = sim.pos.y; 
            if (sim.action === 'working' && renderX < 0) return;

            ctx.save();
            ctx.translate(renderX, renderY);

            // 选中特效
            if (GameStore.selectedSimId === sim.id) {
                ctx.fillStyle = '#39ff14';
                ctx.beginPath();
                ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                const rippleScale = (Date.now() % 1000) / 1000;
                ctx.globalAlpha = (1 - rippleScale) * 0.6;
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 5, 10 + rippleScale * 15, 5 + rippleScale * 7, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                const floatY = -65 + Math.sin(Date.now() / 150) * 4;
                ctx.fillStyle = '#39ff14';
                ctx.beginPath();
                ctx.moveTo(0, floatY);
                ctx.lineTo(-10, floatY - 12);
                ctx.lineTo(10, floatY - 12);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); 
                ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); 
                ctx.fill();
            }

            // 绘制小人身体
            let w = 20, h = 42;
            ctx.fillStyle = '#455A64'; 
            ctx.fillRect(-w / 2, -h + 20, w, h / 2);
            ctx.fillStyle = sim.clothesColor;
            ctx.fillRect(-w / 2, -h + 12, w, h - 20);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(-w/2, -h + 12, 4, 10);
            ctx.fillRect(w/2 - 4, -h + 12, 4, 10);

            drawAvatarHead(ctx, 0, -h + 6, 13, sim);

            if (sim.action === 'phone') {
                ctx.fillStyle = '#ECEFF1'; ctx.fillRect(8, -22, 6, 9);
                ctx.fillStyle = '#81D4FA'; ctx.fillRect(9, -21, 4, 7);
            }

            // 气泡
            if (sim.bubble.timer > 0 && sim.bubble.text) {
                ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
                let width = ctx.measureText(sim.bubble.text).width + 12;
                // ... 气泡颜色逻辑保持不变，为省空间省略 ...
                // 建议保留你原来的气泡颜色代码
                let bg = '#fff', border='#2d3436', textC='#2d3436';
                 if (sim.bubble.type === 'love') { bg = '#fd79a8'; border = '#e84393'; textC = '#fff'; }
                else if (sim.bubble.type === 'ai') { bg = '#a29bfe'; border = '#6c5ce7'; textC = '#fff'; }
                else if (sim.bubble.type === 'act') { bg = '#55efc4'; border = '#00b894'; textC = '#000'; }
                else if (sim.bubble.type === 'bad') { bg = '#ff7675'; border = '#d63031'; textC = '#fff'; }
                else if (sim.bubble.type === 'money') { bg = '#ffeaa7'; border = '#fdcb6e'; textC = '#d35400'; }

                ctx.fillStyle = border;
                ctx.beginPath(); ctx.moveTo(0, -h - 5); ctx.lineTo(-4, -h - 15); ctx.lineTo(4, -h - 15); ctx.fill();
                ctx.fillStyle = bg; ctx.strokeStyle = border; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(-width / 2, -h - 38, width, 24, 4); ctx.fill(); ctx.stroke();
                ctx.fillStyle = textC; ctx.textAlign = 'center';
                ctx.fillText(sim.bubble.text, 0, -h - 22);
                ctx.textAlign = 'left';
            }
            ctx.restore();
        });

        // 粒子
        for (let i = GameStore.particles.length - 1; i >= 0; i--) {
            let p = GameStore.particles[i];
            p.y -= 0.6; p.life -= 0.015;
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

    // 🎨 渲染循环
    const renderLoop = (timestamp: number) => {
        // [新增逻辑] 自动判断是否需要锁定镜头
        // 如果当前选中的人跟上一帧不一样，说明用户刚点击了新人 -> 锁定
        if (GameStore.selectedSimId !== lastSelectedId.current) {
            lastSelectedId.current = GameStore.selectedSimId;
            if (GameStore.selectedSimId) {
                isCameraLocked.current = true;
            }
        }

        // [修复逻辑] 镜头跟随
        // 只有在 (有选中市民) && (镜头锁定中) && (没在拖拽) 时才跟随
        if (GameStore.selectedSimId && isCameraLocked.current && !isDragging.current) {
            const selectedSim = GameStore.sims.find(s => s.id === GameStore.selectedSimId);
            if (selectedSim) {
                const targetX = selectedSim.pos.x - window.innerWidth / 2;
                const targetY = selectedSim.pos.y - window.innerHeight / 2;
                // 平滑跟随
                cameraRef.current.x = lerp(cameraRef.current.x, targetX, 0.05);
                cameraRef.current.y = lerp(cameraRef.current.y, targetY, 0.05);
            }
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) draw(ctx);
        }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    useEffect(() => {
        const worker = createWorker();
        worker.onmessage = (e) => { if (e.data === 'tick') gameLoopStep(); };
        worker.postMessage('start');
        requestRef.current = requestAnimationFrame(renderLoop);
        return () => {
            worker.postMessage('stop'); worker.terminate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

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
                // [关键修复] 一旦开始拖拽，立刻解除镜头锁定，但不取消选中状态
                isCameraLocked.current = false; 
            }
            cameraRef.current.x -= e.movementX;
            cameraRef.current.y -= e.movementY;
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        isDragging.current = false;

        if (e.button === 0 && !hasDragged.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = mouseX + cameraRef.current.x;
            const worldY = mouseY + cameraRef.current.y;

            let hit: string | null = null;
            // 碰撞检测范围
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 40 && Math.abs(worldY - (s.pos.y - 20)) < 50) {
                    hit = s.id; break;
                }
            }
            
            if (hit) {
                // 如果点的是同一个人，说明用户想重新聚焦
                if (GameStore.selectedSimId === hit) {
                    isCameraLocked.current = true; // 手动重新锁定
                } else {
                    GameStore.selectedSimId = hit; // 切换新人，renderLoop 会自动处理锁定
                }
            } else {
                // 点了空地，取消选中（可选，如果不想要取消选中可以注释掉）
                 GameStore.selectedSimId = null; 
            }
            GameStore.notify();
        }
    };

    const handleMouseLeave = () => { isDragging.current = false; };

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
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default GameCanvas;