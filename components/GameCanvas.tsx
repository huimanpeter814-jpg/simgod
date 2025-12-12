import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, ROOMS, FURNITURE } from '../constants';
import { GameStore, gameLoopStep, getActivePalette, drawAvatarHead } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // [New] Camera State
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Ensure pixel art look
        ctx.imageSmoothingEnabled = false;

        // Clear Screen
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- Apply Camera Transform ---
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Background & Palette
        const p = getActivePalette();
        // Draw World Background (The entire map size)
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // Rooms (Floors & Walls)
        ROOMS.forEach((r: any) => {
            // Floor
            ctx.fillStyle = p[r.type || 'zone1'] || p.zone1;
            ctx.fillRect(r.x, r.y, r.w, r.h);

            // Wall borders
            ctx.strokeStyle = p.wall;
            ctx.lineWidth = 4;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Room Label (Subtle pixel text)
            ctx.fillStyle = p.text || 'rgba(0,0,0,0.2)';
            ctx.font = '14px "Microsoft YaHei", sans-serif'; // Bigger font for bigger map
            ctx.fillText(r.label, r.x + 10, r.y + 25);
        });

        // Furniture (Enhanced Pixel Style)
        FURNITURE.forEach((f: any) => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(f.x + 3, f.y + 3, f.w, f.h);

            // Base
            ctx.fillStyle = f.color;
            ctx.fillRect(f.x, f.y, f.w, f.h);

            // Pixel Outline/Highlight effect
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(f.x, f.y, f.w, 4); // Top highlight
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(f.x, f.y + f.h - 4, f.w, 4); // Bottom shadow

            // Detail drawing based on type
            if (f.label.includes('床')) {
                // Pillow & Blanket
                ctx.fillStyle = '#fff';
                ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, 20); // Pillow
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(f.x + 5, f.y + 30, f.w - 10, f.h - 35); // Blanket
            }
            else if (f.label.includes('桌') || f.label.includes('台')) {
                // Legs
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(f.x + 2, f.y + 2, 4, 4);
                ctx.fillRect(f.x + f.w - 6, f.y + 2, 4, 4);
                ctx.fillRect(f.x + 2, f.y + f.h - 6, 4, 4);
                ctx.fillRect(f.x + f.w - 6, f.y + f.h - 6, 4, 4);
            }
            else if (f.label.includes('电脑')) {
                ctx.fillStyle = '#000';
                ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 15); // Screen off
                if (Math.random() > 0.5) { // Flicker
                    ctx.fillStyle = '#81ecec';
                    ctx.fillRect(f.x + 7, f.y + 7, f.w - 14, f.h - 19); // Screen On
                }
            }
            else if (f.label.includes('书架')) {
                // Books
                const colors = ['#e17055', '#0984e3', '#00b894', '#fdcb6e'];
                for (let i = 0; i < f.w / 8; i++) {
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.fillRect(f.x + 4 + i * 8, f.y + 5, 6, f.h - 10);
                }
            }

            // Direction Indicator (Subtle)
            ctx.fillStyle = p.furniture_dark || 'rgba(0,0,0,0.3)';
            if (f.dir === 'up') ctx.fillRect(f.x, f.y, f.w, 4);
            if (f.dir === 'down') ctx.fillRect(f.x, f.y + f.h - 4, f.w, 4);
            if (f.dir === 'left') ctx.fillRect(f.x, f.y, 4, f.h);
            if (f.dir === 'right') ctx.fillRect(f.x + f.w - 4, f.y, 4, f.h);

            // Label
            if (GameStore.time.hour > 8 && GameStore.time.hour < 20) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(f.label, f.x + f.w / 2, f.y + f.h / 2 + 3);
            }
        });

        // Sims
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
        renderSims.forEach(sim => {
            // Skip rendering if working (hidden inside desk ideally, but here just hidden)
            if (sim.action === 'working' && sim.pos.x < 0) return;

            ctx.save();
            ctx.translate(sim.pos.x, sim.pos.y);

            // Selection Marker
            if (GameStore.selectedSimId === sim.id) {
                ctx.beginPath();
                ctx.ellipse(0, 5, 16, 8, 0, 0, Math.PI * 2); // Bigger selection circle
                ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
                ctx.fill();

                // Floating Arrow
                ctx.fillStyle = '#39ff14';
                const floatY = -60 + Math.sin(Date.now() / 200) * 3; // Higher arrow
                ctx.beginPath();
                ctx.moveTo(0, floatY);
                ctx.lineTo(-6, floatY - 10);
                ctx.lineTo(6, floatY - 10);
                ctx.fill();
            }

            // Bigger Sims Visualization (Scale 1.5x approx)
            let w = 20;
            let h = 42;

            // [新功能] 绘制裤子
            const pantsImg = getAsset(sim.appearance.pants);
            if (pantsImg) {
                ctx.drawImage(pantsImg, -w / 2, -h + 20, w, h / 2);
            }

            // [新功能] 绘制上衣
            const clothesImg = getAsset(sim.appearance.clothes);
            if (clothesImg) {
                ctx.drawImage(clothesImg, -w / 2, -h + 12, w, h / 2);
            } else {
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, -h + 12, w, h - 14);
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

            // Phone
            if (sim.action === 'phone') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(6, -24, 5, 8);
            }

            // Head
            drawAvatarHead(ctx, 0, -h + 6, 13, sim);

            // Bubble
            if (sim.bubble.timer > 0 && sim.bubble.text) {
                ctx.font = '10px "Microsoft YaHei", sans-serif';
                let width = ctx.measureText(sim.bubble.text).width + 8;
                let bg = '#fff';
                let border = '#000';
                let textC = '#000';

                if (sim.bubble.type === 'love') { bg = '#ffe6ef'; border = '#fd79a8'; textC = '#e84393'; }
                else if (sim.bubble.type === 'ai') { bg = '#f0f0ff'; border = '#a29bfe'; textC = '#6c5ce7'; }
                else if (sim.bubble.type === 'act') { bg = '#e6fffa'; border = '#55efc4'; textC = '#00b894'; }
                else if (sim.bubble.type === 'bad') { bg = '#fff0f0'; border = '#ff7675'; textC = '#d63031'; }
                else if (sim.bubble.type === 'money') { bg = '#fff3e0'; border = '#fdcb6e'; textC = '#e17055'; }

                // Bubble Tail
                ctx.fillStyle = border;
                ctx.beginPath();
                ctx.moveTo(0, -h - 5);
                ctx.lineTo(-4, -h - 15);
                ctx.lineTo(4, -h - 15);
                ctx.fill();

                // Bubble Body
                ctx.fillStyle = bg;
                ctx.strokeStyle = border;
                ctx.lineWidth = 1;
                ctx.fillRect(-width / 2, -h - 35, width, 20);
                ctx.strokeRect(-width / 2, -h - 35, width, 20);

                ctx.fillStyle = textC;
                ctx.textAlign = 'center';
                ctx.fillText(sim.bubble.text, 0, -h - 21);
            }
            ctx.restore();
        });

        // Particles
        for (let i = GameStore.particles.length - 1; i >= 0; i--) {
            let p = GameStore.particles[i];
            p.y -= 0.5;
            p.life -= 0.01;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.font = '12px serif';
            ctx.fillText('❤️', p.x, p.y);
            ctx.globalAlpha = 1.0;
            if (p.life <= 0) GameStore.particles.splice(i, 1);
        }

        // Restore Camera Transform
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
    }, [camera]); // Re-bind if camera changes, though loop handles it.

    // Mouse Event Handlers for Camera Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        // Middle Click (1) for Dragging
        if (e.button === 1) {
            e.preventDefault(); // Prevent default scroll/autoscroll
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Left Click (0) for Selection
        if (e.button === 0) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            // Calculate mouse position relative to canvas
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert Screen Coords to World Coords by ADDING camera offset
            const worldX = mouseX + camera.x;
            const worldY = mouseY + camera.y;

            let hit: string | null = null;
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 30 && Math.abs(worldY - s.pos.y) < 60) {
                    hit = s.id; break;
                }
            }
            GameStore.selectedSimId = hit;
            GameStore.notify();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;

            // Update camera position (inverted drag)
            setCamera(prev => ({
                x: prev.x - dx,
                y: prev.y - dy
            }));

            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <canvas
            ref={canvasRef}
            // Use window size or container size for viewport
            width={window.innerWidth}
            height={window.innerHeight}
            className="block bg-[#121212] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        // Removed onContextMenu preventing default right click behavior since we don't use right click anymore
        />
    );
};

export default GameCanvas;