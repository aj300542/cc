let lightTimer = null;
let lightAngle = 0;

function startDynamicLight() {
    const light = document.getElementById("dynamicLight");
    if (!light) return;

    clearInterval(lightTimer); // ✅ 清除旧定时器，避免叠加

    lightTimer = setInterval(() => {
        lightAngle += 2;
        const radius = 100;
        const x = 50 + radius * Math.cos(lightAngle * Math.PI / 180);
        const y = 50 + radius * Math.sin(lightAngle * Math.PI / 180);

        light.setAttribute("x", x.toFixed(2));
        light.setAttribute("y", y.toFixed(2));
    }, 50);
}

function applyEmbossEffect() {
    document.querySelectorAll(".cell img").forEach(img => {
        img.style.filter = "url(#embossFilter)";
    });

    startDynamicLight(); // ✅ 点击后自动启动光源动画
}
function applyXuanWithEmboss() {
    applyXuanTextureToCharacters(0.4, 512);
    setTimeout(() => applyEmbossEffect(), 100); // 延迟执行，确保图像插入完成
}

function applyXuanTextureToCharacters(blendRatio = 0.4, baseTextureSize = 512) {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img) return;

        const texture = new Image();
        texture.src = "js/old-gold2-bump.jpg";
        texture.crossOrigin = "anonymous";

        texture.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // ✅ 读取缩放比例（由 fillGridContent 中 img.onload 设置）
            const scaleRatio = parseFloat(cell.dataset.scaleRatio || "1");

            // ✅ 计算纹理缩放尺寸（保持颗粒视觉一致）
            const textureWidth = Math.round(baseTextureSize / scaleRatio);
            const textureHeight = Math.round(baseTextureSize / scaleRatio);

            // ✅ 创建纹理图像的 canvas
            const textureCanvas = document.createElement("canvas");
            const textureCtx = textureCanvas.getContext("2d");
            textureCanvas.width = canvas.width;
            textureCanvas.height = canvas.height;

            // ✅ 将纹理图像平铺缩放到字符图像大小
            textureCtx.fillStyle = ctx.createPattern(texture, "repeat");
            textureCtx.fillRect(0, 0, canvas.width, canvas.height);

            const textureData = textureCtx.getImageData(0, 0, canvas.width, canvas.height).data;

            // ✅ 叠加纹理到不透明区域
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha > 0) {
                    data[i] = data[i] * (1 - blendRatio) + (data[i] * textureData[i] / 255) * blendRatio;
                    data[i + 1] = data[i + 1] * (1 - blendRatio) + (data[i + 1] * textureData[i + 1] / 255) * blendRatio;
                    data[i + 2] = data[i + 2] * (1 - blendRatio) + (data[i + 2] * textureData[i + 2] / 255) * blendRatio;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const result = new Image();
            result.src = canvas.toDataURL();
            result.style.width = "100%";
            result.style.height = "100%";
            result.style.objectFit = "contain";
            result.style.zIndex = "1";

            cell.innerHTML = "";
            insertBaseLayer(cell);
            cell.appendChild(result);

        };
    });
}

function applyGrainWithEmboss() {
    applyGrainToCharacters(0.2, 4);
    setTimeout(() => applyEmbossEffect(), 100); // ✅ 延迟执行，确保图像插入完成
}

function applyGrainToCharacters(grainStrength = 0.2, grainPixelSize = 1) {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.warn("图像未加载完成，跳过该 cell");
            return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const scaleRatio = parseFloat(cell.dataset.scaleRatio || "1");
        const adjustedGrainSize = Math.max(1, Math.round(grainPixelSize / scaleRatio));

        for (let y = 0; y < canvas.height; y += adjustedGrainSize) {
            for (let x = 0; x < canvas.width; x += adjustedGrainSize) {
                const noise = (Math.random() - 0.5) * 255 * grainStrength;

                for (let dy = 0; dy < adjustedGrainSize; dy++) {
                    for (let dx = 0; dx < adjustedGrainSize; dx++) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px >= canvas.width || py >= canvas.height) continue;

                        const i = (py * canvas.width + px) * 4;
                        const alpha = data[i + 3];
                        if (alpha > 0) {
                            data[i] = Math.min(255, Math.max(0, data[i] + noise));
                            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
                        }
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const result = new Image();
        result.src = canvas.toDataURL();
        result.style.width = "100%";
        result.style.height = "100%";
        result.style.objectFit = "contain";
        result.style.zIndex = "1";

        cell.innerHTML = "";
        insertBaseLayer(cell);
        cell.appendChild(result);
    });
}


function apply3dWithLight() {
    apply3dffect(1, 1.5);
    setTimeout(() => {
        applyEmbossEffect(); // ✅ 扫描所有 .cell img
        startDynamicLight(); // ✅ 只启动一次动画
    }, 100);
}

function apply3dffect(baseOffset = 1, intensity = 1.5) {
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const img = cell.querySelector("img");
        if (!img) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // ✅ 读取缩放比例（由 fillGridContent 中 img.onload 设置）
        const scaleRatio = parseFloat(cell.dataset.scaleRatio || "1");

        // ✅ 计算视觉统一的浮雕偏移量（单位：像素）
        const offset = Math.max(1, Math.round(baseOffset / scaleRatio)) * 4; // 每像素4字节

        // ✅ 模拟浮雕：通过像素偏移计算亮度差
        for (let i = 0; i < data.length - offset; i += 4) {
            const r1 = data[i], g1 = data[i + 1], b1 = data[i + 2];
            const r2 = data[i + offset], g2 = data[i + 1 + offset], b2 = data[i + 2 + offset];

            const lum1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
            const lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
            const diff = lum1 - lum2;

            data[i] = Math.min(255, Math.max(0, r1 + diff * intensity));
            data[i + 1] = Math.min(255, Math.max(0, g1 + diff * intensity));
            data[i + 2] = Math.min(255, Math.max(0, b1 + diff * intensity));
        }

        ctx.putImageData(imageData, 0, 0);

        const result = new Image();
        result.src = canvas.toDataURL();
        result.style.width = "100%";
        result.style.height = "100%";
        result.style.objectFit = "contain";
        result.style.zIndex = "1";

        cell.innerHTML = "";
        insertBaseLayer(cell);
        cell.appendChild(result);
    });

    startDynamicLight(); // ✅ 光源动画仍可用于视觉演示
}

