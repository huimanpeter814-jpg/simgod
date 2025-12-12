// 这是一个新的工具文件，用于管理图片资源的加载和缓存
// 防止在每一帧渲染时重复创建 Image 对象

const imageCache: Record<string, HTMLImageElement> = {};

// 基础路径，根据你的 public 目录结构调整
const BASE_PATH = '/assets/';

export const loadImages = (sources: string[]) => {
    sources.forEach(src => {
        if (!imageCache[src]) {
            const img = new Image();
            img.src = `${BASE_PATH}${src}`;
            img.onload = () => {
                console.log(`Loaded asset: ${src}`);
            };
            img.onerror = () => {
                console.warn(`Failed to load asset: ${src}`);
                // 可以在这里标记为失败，后续渲染时跳过
            };
            imageCache[src] = img;
        }
    });
};

export const getAsset = (path: string | undefined): HTMLImageElement | null => {
    if (!path) return null;
    const img = imageCache[path];
    return (img && img.complete && img.naturalWidth > 0) ? img : null;
};