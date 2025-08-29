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
        if (!img || !img.complete || img.naturalWidth === 0) return;

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

            // ✅ 计算缩放比例（确保纹理密度一致）
            const scaleX = cell.clientWidth / img.naturalWidth;
            const scaleY = cell.clientHeight / img.naturalHeight;
            const scale = Math.min(scaleX, scaleY);

            const textureWidth = Math.round(baseTextureSize / scale);
            const textureHeight = Math.round(baseTextureSize / scale);

            // ✅ 创建纹理 canvas 并缩放绘制
            const textureCanvas = document.createElement("canvas");
            const textureCtx = textureCanvas.getContext("2d");
            textureCanvas.width = canvas.width;
            textureCanvas.height = canvas.height;

            for (let y = 0; y < canvas.height; y += textureHeight) {
                for (let x = 0; x < canvas.width; x += textureWidth) {
                    textureCtx.drawImage(texture, x, y, textureWidth, textureHeight);
                }
            }

            const textureData = textureCtx.getImageData(0, 0, canvas.width, canvas.height).data;

            // ✅ 混合纹理到字符图像
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

        texture.onerror = () => {
            console.warn("❌ 宣纸纹理加载失败，跳过该 cell");
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

        const scaleX = cell.clientWidth / img.naturalWidth;
        const scaleY = cell.clientHeight / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY);
        const adjustedGrainSize = Math.max(1, Math.round(grainPixelSize / scale));

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
        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // ✅ 计算缩放比例（cell 尺寸 / 原图尺寸）
        const scaleX = cell.clientWidth / img.naturalWidth;
        const scaleY = cell.clientHeight / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY);

        // ✅ 计算横向偏移像素（不乘以 4，直接用于坐标）
        const dx = Math.max(1, Math.round(baseOffset / scale));

        // ✅ 调试输出
        const char = cell.dataset.char || cell.textContent.trim();
        console.log(`🔍 ${char} scale=${scale.toFixed(2)}, dx=${dx}`);

        // ✅ 坐标式浮雕处理
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width - dx; x++) {
                const i = (y * canvas.width + x) * 4;
                const ni = (y * canvas.width + (x + dx)) * 4;

                const lum1 = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const lum2 = 0.299 * data[ni] + 0.587 * data[ni + 1] + 0.114 * data[ni + 2];
                const diff = lum1 - lum2;

                data[i] = Math.min(255, Math.max(0, data[i] + diff * intensity));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + diff * intensity));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + diff * intensity));
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

    startDynamicLight(); // ✅ 可选：动态光源增强立体感
}


function runRandomEffect() {
    // ✅ 移除中断判断，允许随时运行
    // if (!demoState || demoState.isInterrupted) return;

    // ✅ 可选：重置中断状态
    demoState.isInterrupted = false;

    applyLuminosityCanvas();

    let delay = 200;
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            if (!demoState.isInterrupted) {
                applyHardLightCanvas();
            }
        }, delay + i * 200);
    }

    setTimeout(() => {
        if (!demoState.isInterrupted) {
            applyTransparency();
            applyColorRandomTint();

            setTimeout(() => {
                applyXuanTextureToCharacters(0.4, 512);

                setTimeout(() => {
                    applyGrainToCharacters(0.2, 2);

                    setTimeout(() => {
                        applyEmbossEffect();

                        setTimeout(() => {
                            apply3dffect(1, 1.5);

                            setTimeout(() => {
                                applyEmbossEffect();// 光照浮雕
                            }, 100);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        }
    }, 2500);
}
