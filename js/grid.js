const MAX_CELL_HEIGHT = '15vh';
const imageMap = {}; // 缓存已加载的字符映射

window.layoutUtils = {
    isPortrait: () => window.innerHeight > window.innerWidth
};

window.setGridCols = function (defaultCols) {
    const isPortrait = layoutUtils.isPortrait();
    const cellCount = txtState.chunks[txtState.currentChunkIndex]?.length || CHUNK_SIZE;

    if (cellCount < 7) {
        window.gridConfig.cols = isPortrait
            ? Math.ceil(Math.sqrt(cellCount))
            : Math.min(cellCount, Math.ceil(window.innerWidth / 100));
    } else {
        const defaultRows = Math.ceil(cellCount / defaultCols);
        window.gridConfig.cols = isPortrait ? defaultRows : defaultCols;
    }
};

function getImageFilename(char, index) {
    return index === 0
        ? `${char}.jpg`
        : `${char}_${String(index).padStart(3, '0')}.jpg`;
}

function getImagePath(filename) {
    const baseName = filename.includes("_")
        ? filename.split("_")[0]
        : filename.replace(".jpg", "");
    return `./json/${baseName}/${filename}`;
}

async function findMatchingImages(char) {

    if (imageMap[char]) return imageMap[char];

    const allImages = [];

    // 加载单字 JSON
    try {
        const response = await fetch(`./json/${char}.json`);
        if (response.ok) {
            const indices = await response.json();
            const images = indices.map(index => getImageFilename(char, index));
            allImages.push(...images);
        }
    } catch (err) {
        console.warn(`❌ ${char}.json 加载失败`, err);
    }

    // 加载多字词 JSON（从 index.json 中筛选）
    try {
        const indexRes = await fetch(`./json/index.json`);
        if (indexRes.ok) {
            const allFilenames = await indexRes.json();
            const matchedFiles = allFilenames.filter(name => name.includes(char));

            for (const filename of matchedFiles) {
                const baseName = filename.replace(".json", "");
                try {
                    const res = await fetch(`./json/${filename}`);
                    if (!res.ok) continue;
                    const indices = await res.json();
                    const images = indices.map(index => getImageFilename(baseName, index));
                    allImages.push(...images);
                } catch (err) {
                    console.warn(`❌ 加载 ${filename} 失败`, err);
                }
            }
        }
    } catch (err) {
        console.warn("❌ index.json 加载失败", err);
    }

    imageMap[char] = allImages;
    return allImages.length ? allImages : null;
}

function showPopup(x, y, char, targetCell, imgList) {
    const popup = document.getElementById("popup");
    popup.innerHTML = "";
    if (!imgList || imgList.length === 0) return;

    imgList.forEach(filename => {
        const img = document.createElement("img");
        img.src = getImagePath(filename);

        img.style.width = MAX_CELL_HEIGHT;
        img.style.maxHeight = "20vh";
        img.style.height = "auto";
        img.style.objectFit = "contain";
        img.style.margin = "1vh";
        img.style.cursor = "pointer";

        img.onclick = () => {
            popup.style.display = "none";
            targetCell.innerHTML = "";

            const newImg = document.createElement("img");
            newImg.src = img.src;
            newImg.style.maxWidth = "100%";
            newImg.style.maxHeight = "100%";
            newImg.style.objectFit = "contain";

            newImg.onload = () => {
                const scaleX = targetCell.clientWidth / newImg.naturalWidth;
                const scaleY = targetCell.clientHeight / newImg.naturalHeight;
                const scale = Math.min(scaleX, scaleY);
                targetCell.dataset.scaleRatio = scale.toFixed(3);
                targetCell.dataset.locked = "true";
                renderToCanvasAndRemoveWhite(); // ✅ 重新渲染
            };

            newImg.onerror = () => {
                console.warn("❌ 替换图像加载失败");
            };

            targetCell.appendChild(newImg);
        };

        popup.appendChild(img);
    });

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.display = "block";
}


function generateGrid(cellCount) {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    grid.style.display = "grid";

    const isPortrait = layoutUtils.isPortrait();
    const useDynamic = cellCount < 7;

    let cols, rows;

    if (isPortrait) {
        const maxCols = Math.floor(window.innerWidth / 100);
        cols = cellCount < 7
            ? 1
            : Math.min(Math.ceil(cellCount / 8), maxCols);
        rows = Math.ceil(cellCount / cols);
    } else {
        cols = window.gridConfig?.cols && !useDynamic
            ? window.gridConfig.cols
            : Math.min(cellCount, Math.ceil(window.innerWidth / 100));
        rows = Math.ceil(cellCount / cols);
    }

    window.gridConfig.rows = rows;
    window.gridConfig.cols = cols;

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.style.maxHeight = `${window.innerHeight * 0.85}px`;
    grid.style.overflowY = "auto";

    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        grid.appendChild(cell);
    }

    return { rows, cols };
}

async function fillGridContent(text) {
    const cells = document.querySelectorAll(".cell");
    const isPortrait = layoutUtils.isPortrait();
    const rows = window.gridConfig.rows;
    const cols = window.gridConfig.cols;

    const loadPromises = [];

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        cell.innerHTML = "";

        const index = isPortrait
            ? Math.floor(i / cols) + (cols - 1 - (i % cols)) * rows
            : i;

        const char = text[index];
        if (!char) continue;

        const imgList = await findMatchingImages(char);

        if (imgList && imgList.length > 0) {
            const img = document.createElement("img");
            const randomIndex = Math.floor(Math.random() * imgList.length);
            img.src = getImagePath(imgList[randomIndex]);
            img.style.mixBlendMode = "normal";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.objectFit = "contain";

            // ✅ 清空并锁定 cell，确保只加载一个图像
            cell.innerHTML = "";
            cell.dataset.locked = "false";

            const loadPromise = new Promise(resolve => {
                img.onload = () => {
                    const scaleX = cell.clientWidth / img.naturalWidth;
                    const scaleY = cell.clientHeight / img.naturalHeight;
                    const scale = Math.min(scaleX, scaleY);
                    cell.dataset.scaleRatio = scale.toFixed(3);
                    cell.dataset.locked = "true"; // ✅ 图像加载完成后锁定
                    resolve();
                };
                img.onerror = () => {
                    cell.innerHTML = "";
                    const fallback = document.createElement("span");
                    fallback.textContent = char;
                    fallback.style.fontSize = "clamp(3vh, 6vw, 8vh)";
                    fallback.style.display = "flex";
                    fallback.style.alignItems = "center";
                    fallback.style.justifyContent = "center";
                    fallback.style.width = "100%";
                    fallback.style.height = "100%";
                    cell.appendChild(fallback);
                    cell.dataset.locked = "true";
                    resolve();
                };
            });

            loadPromises.push(loadPromise);
            cell.appendChild(img);
        } else {
            // ✅ 无图像时使用文字 fallback
            const span = document.createElement("span");
            span.textContent = char;
            span.style.fontSize = "clamp(3vh, 6vw, 8vh)";
            span.style.display = "flex";
            span.style.alignItems = "center";
            span.style.justifyContent = "center";
            span.style.width = "100%";
            span.style.height = "100%";
            cell.appendChild(span);
            cell.dataset.locked = "true";
        }

        // ✅ 右键仅触发 popup，不修改 cell 内容
        cell.oncontextmenu = async (e) => {
            e.preventDefault();
            const imgList = await findMatchingImages(char);
            showPopup(e.pageX, e.pageY, char, cell, imgList);
        };
    }

    await Promise.all(loadPromises); // ✅ 等待所有图像加载完成
    renderToCanvasAndRemoveWhite();  // ✅ 触发后期处理
}


function getGridSize(cellCount) {
    const isPortrait = layoutUtils.isPortrait();
    const cols = isPortrait
        ? Math.ceil(Math.sqrt(cellCount))
        : Math.min(cellCount, Math.ceil(window.innerWidth / 100));
    const rows = Math.ceil(cellCount / cols);
    return { rows, cols };
}

async function updateGrid() {
    const text = document.getElementById("textInput").value || "";
    const cellCount = text.length;
    const { rows, cols } = generateGrid(cellCount);
    await fillGridContent(text.padEnd(rows * cols, "　"), rows, cols);
    // ✅ 重新应用底色，确保新生成的 cell 同步
    setBaseColor(currentBaseColor);
}

document.addEventListener("click", () => {
    const popup = document.getElementById("popup");
    if (popup) popup.style.display = "none";
});

function renderToCanvasAndRemoveWhite() {
    // 留空，未来可添加 canvas 渲染逻辑
}

window.addEventListener("resize", () => {
    if (typeof window.setGridCols === "function") {
        window.setGridCols(LINE_BREAK_INTERVAL);
    }
    if (typeof window.updateGrid === "function") {
        updateGrid();
    }
});

window.onload = () => {
    document.getElementById("textInput").addEventListener("input", updateGrid);
    updateGrid(); // 初始渲染
};
// ✅ 添加屏幕方向变化监听
window.addEventListener("orientationchange", () => {
    updateGrid();
    setBaseColor(currentBaseColor);
});
