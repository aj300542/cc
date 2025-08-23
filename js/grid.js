let imageMap = {};
const MAX_CELL_HEIGHT = '15vh';

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
async function loadImageMap() {
    try {
        const response = await fetch('./image_map.json');
        if (!response.ok) throw new Error("加载失败");
        imageMap = await response.json();
        updateGrid();
    } catch (err) {
        console.error("❌ 无法加载 image_map.json:", err);
    }
}

function findMatchingImages(char) {
    const matches = [];
    for (const key in imageMap) {
        if (key.includes(char)) {
            matches.push(...imageMap[key]);
        }
    }
    return matches.length > 0 ? matches : null;
}

function generateGrid(cellCount) {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    grid.style.display = "grid";

    const isPortrait = layoutUtils.isPortrait();
    const useDynamic = cellCount < 7;


    let cols, rows;

    if (isPortrait) {
        // 🧠 动态竖排逻辑：短句一列，长句自动分列但不超过屏幕宽度
        const maxCols = Math.floor(window.innerWidth / 100); // 每列约 100px
        cols = cellCount < 7
            ? 1
            : Math.min(Math.ceil(cellCount / 8), maxCols); // 每列约 4 字
        rows = Math.ceil(cellCount / cols);
    } else {
        // 横屏逻辑保持不变
        cols = window.gridConfig?.cols && !useDynamic
            ? window.gridConfig.cols
            : Math.min(cellCount, Math.ceil(window.innerWidth / 100));
        rows = Math.ceil(cellCount / cols);
    }

    // ✅ 正确位置：在 rows 和 cols 计算之后再赋值
    window.gridConfig.rows = rows;
    window.gridConfig.cols = cols;

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        grid.appendChild(cell);
    }
    // ✅ 限制最大高度，避免撑爆页面
    grid.style.maxHeight = `${window.innerHeight * 0.85}px`;
    grid.style.overflowY = "auto";
    return { rows, cols };
}



function fillGridContent(text) {
    const cells = document.querySelectorAll(".cell");
    const isPortrait = layoutUtils.isPortrait();
    const rows = window.gridConfig.rows;
    const cols = window.gridConfig.cols;


    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        cell.innerHTML = "";

        const index = isPortrait
            ? Math.floor(i / cols) + (cols - 1 - (i % cols)) * rows  // ✅ 右起竖排
            : i;  // 横屏仍然行优先


        const char = text[index];
        const imgList = findMatchingImages(char);

        if (imgList && imgList.length > 0) {
            const img = document.createElement("img");
            const randomIndex = Math.floor(Math.random() * imgList.length);
            img.src = `./word/edit/${imgList[randomIndex]}`;
            img.style.mixBlendMode = "normal";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.objectFit = "contain";
            cell.appendChild(img);
        } else if (char) {
            const span = document.createElement("span");
            span.textContent = char;
            span.style.fontSize = "clamp(3vh, 6vw, 8vh)";
            span.style.display = "flex";
            span.style.alignItems = "center";
            span.style.justifyContent = "center";
            span.style.width = "100%";
            span.style.height = "100%";
            cell.appendChild(span);
        }

        cell.oncontextmenu = (e) => {
            e.preventDefault();
            showPopup(e.pageX, e.pageY, char, cell);
        };
    }

    renderToCanvasAndRemoveWhite();
}

function getGridSize(cellCount) {
    const isPortrait = layoutUtils.isPortrait();
    const cols = isPortrait ? Math.ceil(Math.sqrt(cellCount)) : Math.min(cellCount, Math.ceil(window.innerWidth / 100));
    const rows = Math.ceil(cellCount / cols);
    return { rows, cols };
}

function updateGrid() {
    const text = document.getElementById("textInput").value || "";
    const cellCount = text.length;
    const { rows, cols } = generateGrid(cellCount);
    fillGridContent(text.padEnd(rows * cols, "　"), rows, cols);
}
function showPopup(x, y, char, targetCell) {
    const popup = document.getElementById("popup");
    popup.innerHTML = "";
    const imgList = findMatchingImages(char);
    if (!imgList) return;

    imgList.forEach(filename => {
        const img = document.createElement("img");
        img.src = `./word/edit/${filename}`;
        img.style.width = MAX_CELL_HEIGHT;
        img.style.maxHeight = "20vh";
        img.style.height = "auto";
        img.style.objectFit = "contain";
        img.style.margin = "1vh";
        img.style.cursor = "pointer";
        img.onclick = () => {
            targetCell.innerHTML = "";
            const newImg = document.createElement("img");
            newImg.src = img.src;
            newImg.style.maxWidth = "100%";
            newImg.style.maxHeight = "100%";
            newImg.style.objectFit = "contain";
            targetCell.appendChild(newImg);
            popup.style.display = "none";
            renderToCanvasAndRemoveWhite();
        };
        popup.appendChild(img);
    });
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.display = "block";
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
        window.setGridCols(LINE_BREAK_INTERVAL); // 🧩 同步列数
    }
    if (typeof window.updateGrid === "function") {
        window.updateGrid(); // 🔄 重新渲染
    }
});
window.onload = () => {
    loadImageMap();
    document.getElementById("textInput").addEventListener("input", updateGrid);
};
