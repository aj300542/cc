(function () {
    const CHUNK_SIZE = 24;
    const CHAR_INTERVAL = 150;
    const SEGMENT_PAUSE = 6000;
    window.LINE_BREAK_INTERVAL = 8;


    window.gridConfig = window.gridConfig || {};
    window.gridConfig.cols = LINE_BREAK_INTERVAL;

    // ✅ 插入位置：常量之后，状态对象之前
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

    window.updateGrid = function () {
        const input = document.getElementById("textInput");
        const text = input?.value || "";
        const cellCount = text.length || CHUNK_SIZE;

        window.setGridCols(LINE_BREAK_INTERVAL);
        const { rows, cols } = generateGrid(cellCount);
        fillGridContent(text.padEnd(rows * cols, "　"));
    };


    // 📦 状态对象挂载到 window
    window.txtState = {
        chunks: [],
        currentChunkIndex: 0,
        charIndex: 0,
        typingTimer: null,
        demoInterrupted: false,

        reset() {
            this.demoInterrupted = true;
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
            this.currentChunkIndex = 0;
            this.charIndex = 0;
        }
    };

    // 📥 加载文本文件
    function loadSample() {
        fetch('js/sansha.txt')
            .then(response => response.text())
            .then(content => {
                const cleaned = content.replace(/\s+/g, '');
                txtState.chunks = splitTextIntoChunks(cleaned, CHUNK_SIZE);
                txtState.currentChunkIndex = 0;

                // ✨ 设置列数并更新网格
                window.setGridCols(LINE_BREAK_INTERVAL);
                window.updateGrid();

                startTypingChunk();
            })
            .catch(error => {
                console.error("无法加载 sansha.txt：", error);
            });
    }
    // 📥 加载用户上传的文本文件
    function loadTxtFile() {
        const input = document.getElementById('txtFileInput');
        const file = input?.files?.[0];

        if (!file) {
            console.warn("⚠️ 未选择文件");
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;
            console.log("✅ 文件已读取，长度：", content.length);

            const cleaned = content.replace(/\s+/g, '');
            if (!cleaned) {
                console.warn("⚠️ 文件内容为空或仅包含空格");
                return;
            }

            txtState.reset();
            txtState.chunks = splitTextIntoChunks(cleaned, CHUNK_SIZE);
            txtState.currentChunkIndex = 0;

            txtState.demoInterrupted = false; // ✅ 重新启用视觉效果

            window.setGridCols(LINE_BREAK_INTERVAL);
            window.updateGrid();

            startTypingChunk();
        };

        reader.onerror = function (e) {
            console.error("❌ 文件读取失败：", e);
        };

        reader.readAsText(file, 'UTF-8');
    }




    // ✂️ 分段逻辑
    function splitTextIntoChunks(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // ▶️ 打字流程
    async function startTypingChunk() {
        if (txtState.currentChunkIndex >= txtState.chunks.length) return;

        const input = document.getElementById("textInput");
        if (!input) return;

        input.value = "";
        txtState.charIndex = 0;
        const currentText = txtState.chunks[txtState.currentChunkIndex];

        async function typeNextChar() {
            if (txtState.charIndex < currentText.length) {
                input.value += currentText[txtState.charIndex];
                txtState.charIndex++;

                if (typeof window.updateGrid === "function") {
                    window.updateGrid();
                }

                txtState.typingTimer = setTimeout(typeNextChar, CHAR_INTERVAL);
            } else {
                // ✅ 等待图像加载完成
                await fillGridContent(input.value.padEnd(window.gridConfig.rows * window.gridConfig.cols, "　"));

                if (txtState.demoInterrupted) return;

                runBlendAndTransparencyEffects();
                txtState.currentChunkIndex++;
                setTimeout(() => startTypingChunk(), SEGMENT_PAUSE);
            }
        }

        typeNextChar();
    }


    // 🎨 混合与染色效果（钩子函数）
    function runBlendAndTransparencyEffects() {
        console.log("🎨 触发视觉处理");
        applyLuminosityCanvas();
        let delay = 100;
        applyLuminosityCanvas();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (!demoState.isInterrupted) {
                    applyLuminosityCanvas();
                    applyHardLightCanvas();

                }
            }, i * 200);
        }

        setTimeout(() => {
            if (!demoState.isInterrupted) {
                applyTransparency();
                applyColorCanvasWithRandomTint(); // 染色

                setTimeout(() => {
                    applyXuanTextureToCharacters(0.4, 512);

                    setTimeout(() => {
                        applyGrainToCharacters(0.2, 2); // 颗粒处理

                        setTimeout(() => {
                            applyEmbossEffect(); // 浮雕处理

                            setTimeout(() => {
                                apply3dffect(1, 1.5); // 光照浮雕
                            }, 100);
                        }, 100);
                    }, 100);
                }, 100);
            }
        }, 2500);

    }

    // 🔄 响应屏幕方向变化
    window.addEventListener("resize", () => {
        window.setGridCols(LINE_BREAK_INTERVAL);
        window.updateGrid();
    });

    // 🌐 暴露加载函数
    window.loadSample = loadSample
    window.loadTxtFile = loadTxtFile;

})();
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("txtFileInput");
    if (input) {
        input.addEventListener("change", loadTxtFile);
    }
});
