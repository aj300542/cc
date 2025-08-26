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

async function findMatchingImages(char) {
    if (!imageMap[char]) {
        try {
            const response = await fetch(`./json/${char}.json`);
            if (!response.ok) throw new Error(`无法加载 ${char}.json`);
            const indices = await response.json();
            imageMap[char] = indices.map(index => getImageFilename(char, index));
        } catch (err) {
            console.warn(`❌ ${char} 的图像列表加载失败`, err);
            imageMap[char] = []; // 防止重复请求
        }
    }
    return imageMap[char]?.length ? imageMap[char] : null;
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

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        cell.innerHTML = "";

        const index = isPortrait
            ? Math.floor(i / cols) + (cols - 1 - (i % cols)) * rows
            : i;

        const char = text[index];
        const imgList = await findMatchingImages(char);

        if (imgList && imgList.length > 0) {
            const img = document.createElement("img");
            const randomIndex = Math.floor(Math.random() * imgList.length);
            img.src = `./json/${char}/${imgList[randomIndex]}`;
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

        cell.oncontextmenu = async (e) => {
            e.preventDefault();
            const imgList = await findMatchingImages(char);
            showPopup(e.pageX, e.pageY, char, cell, imgList);
        };
    }

    renderToCanvasAndRemoveWhite();
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
}

function showPopup(x, y, char, targetCell, imgList) {
    const popup = document.getElementById("popup");
    popup.innerHTML = "";
    if (!imgList) return;

    imgList.forEach(filename => {
        const img = document.createElement("img");
        img.src = `./json/${char}/${filename}`;
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
