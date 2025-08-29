function applyHardLightCanvas() {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img) return;

        const src = img.src;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const bg = new Image();
        const fg = new Image();
        bg.crossOrigin = "anonymous";
        fg.crossOrigin = "anonymous";
        bg.src = src;
        fg.src = src;

        bg.onload = () => {
            ctx.drawImage(bg, 0, 0); // 先绘制背景

            fg.onload = () => {
                ctx.globalCompositeOperation = "hard-light";
                ctx.drawImage(fg, 0, 0); // 再叠加前景

                const result = new Image();
                result.src = canvas.toDataURL();
                result.className = "hardlight-result";
                result.style.position = "absolute";
                result.style.top = "0";
                result.style.left = "0";
                result.style.width = "100%";
                result.style.height = "100%";
                result.style.zIndex = "1";


                cell.innerHTML = "";

                cell.appendChild(result);
            };
        };
    });
}


function applyLuminosityCanvas() {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img) return;

        const src = img.src;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.src = src;

        tempImg.onload = () => {
            ctx.drawImage(tempImg, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // 使用亮度公式转换为灰度值
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                data[i] = data[i + 1] = data[i + 2] = luminance; // 设置为灰度
            }

            ctx.putImageData(imageData, 0, 0);

            const result = new Image();
            result.src = canvas.toDataURL();
            result.className = "luminosity-result";
            result.style.position = "absolute";
            result.style.top = "0";
            result.style.left = "0";
            result.style.width = "100%";
            result.style.height = "100%";
            result.style.zIndex = "2";

            cell.innerHTML = "";
            cell.appendChild(result);
        };
    });
}

function toggleScrollMenu() {
    const menu = document.getElementById("scrollMenu");
    menu.style.display = menu.style.display === "none" || menu.style.display === "" ? "block" : "none";
}

function applyColorCanvas(colorName) {
    const colorMap = {
        red: { r: 200, g: 30, b: 30 },
        blue: { r: 30, g: 30, b: 200 },
        gold: { r: 220, g: 180, b: 60 },
        green: { r: 30, g: 100, b: 60 },
        purple: { r: 120, g: 30, b: 120 },
        crimson: { r: 220, g: 20, b: 60 },
        orange: { r: 255, g: 165, b: 0 },
        salmon: { r: 250, g: 128, b: 114 },
        teal: { r: 0, g: 128, b: 128 },
        navy: { r: 0, g: 0, b: 128 },
        indigo: { r: 75, g: 0, b: 130 },
        plum: { r: 142, g: 69, b: 133 },
        chocolate: { r: 210, g: 105, b: 30 },
        coral: { r: 255, g: 127, b: 80 },
        khaki: { r: 240, g: 230, b: 140 },
        lavender: { r: 230, g: 230, b: 250 },
        ivory: { r: 255, g: 255, b: 240 },
        slategray: { r: 112, g: 128, b: 144 },
        darkcyan: { r: 0, g: 139, b: 139 },
        lightpink: { r: 255, g: 182, b: 193 }
    };

    const tint = colorMap[colorName] || { r: 0, g: 0, b: 0 };
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        let originalSrc;

        // 如果已有缓存，则使用；否则缓存原图
        if (cell.dataset.original) {
            originalSrc = cell.dataset.original;
        } else {
            const img = cell.querySelector("img");
            if (!img) return;
            originalSrc = img.src;
            cell.dataset.original = img.src;
        }

        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.src = originalSrc;

        tempImg.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = tempImg.naturalWidth;
            canvas.height = tempImg.naturalHeight;

            ctx.drawImage(tempImg, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const mask = [];

            // 灰度处理 + 遮罩记录
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                data[i] = data[i + 1] = data[i + 2] = luminance;
                mask.push(luminance < 50);
            }

            // 根据遮罩染色
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                if (mask[pixelIndex]) {
                    data[i] = tint.r;
                    data[i + 1] = tint.g;
                    data[i + 2] = tint.b;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const result = new Image();
            result.src = canvas.toDataURL();
            result.className = "colorized-result";
            result.style.position = "absolute";
            result.style.top = "0";
            result.style.left = "0";
            result.style.width = "100%";
            result.style.height = "100%";
            result.style.zIndex = "3";

            cell.innerHTML = "";
            insertBaseLayer(cell);   // ✅ 插入底色层

            cell.appendChild(result);
        };
    });

    // 收起菜单
    const menu = document.getElementById("scrollMenu");
    if (menu) menu.style.display = "none";
}

function getRandomTint() {
    const hue = Math.floor(Math.random() * 360);
    const rgb = hslToRgb(hue / 360, 0.7, 0.6);
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
}
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // 灰色
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function applyColorRandomTint() {
    const tintColorNames = [
        'red', 'blue', 'gold', 'green', 'purple', 'crimson', 'orange', 'salmon',
        'teal', 'navy', 'indigo', 'plum', 'chocolate', 'coral', 'khaki',
        'lavender', 'ivory', 'slategray', 'darkcyan', 'lightpink'
    ];

    const randomIndex = Math.floor(Math.random() * tintColorNames.length);
    const randomColor = tintColorNames[randomIndex];
    applyColorCanvas(randomColor);
}

function applyColorCanvasWithRandomTint() {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const tint = getRandomTint(); // 🎨 每个 cell 独立颜色

        let originalSrc;

        if (cell.dataset.original) {
            originalSrc = cell.dataset.original;
        } else {
            const img = cell.querySelector("img");
            if (!img) return;
            originalSrc = img.src;
            cell.dataset.original = img.src;
        }

        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.src = originalSrc;

        tempImg.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = tempImg.naturalWidth;
            canvas.height = tempImg.naturalHeight;

            ctx.drawImage(tempImg, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const mask = [];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                data[i] = data[i + 1] = data[i + 2] = luminance;
                mask.push(luminance < 50);
            }

            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                if (mask[pixelIndex]) {
                    data[i] = tint.r;
                    data[i + 1] = tint.g;
                    data[i + 2] = tint.b;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const result = new Image();
            result.src = canvas.toDataURL();
            result.className = "colorized-result";
            result.style.position = "absolute";
            result.style.top = "0";
            result.style.left = "0";
            result.style.width = "100%";
            result.style.height = "100%";
            result.style.zIndex = "3";

            cell.innerHTML = "";
            cell.appendChild(result);
        };
    });
}

function applyTransparency() {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // 绘制图像到 canvas
        ctx.drawImage(img, 0, 0);

        // 获取像素数据并处理白色为透明
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // 设置 alpha 为 0
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // 替换原图为处理后的透明图像
        const transparentImg = new Image();
        transparentImg.src = canvas.toDataURL("image/png");
        transparentImg.style.width = "100%";
        transparentImg.style.height = "100%";
        transparentImg.style.objectFit = "contain";

        cell.innerHTML = "";
        cell.appendChild(transparentImg);
    });

    renderToCanvasAndRemoveWhite(); // 更新主 canvas 预览
}
