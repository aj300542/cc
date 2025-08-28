// 📦 状态管理对象
const demoState = {
    isInterrupted: false,
    hasStarted: false, // ✅ 新增字段
    timers: {
        demo: null,
        typing: null
    },
    indices: {
        line: 0,
        char: 0
    },
    reset() {
        this.isInterrupted = true;
        this.hasStarted = false;
        clearTimeout(this.timers.demo);
        clearTimeout(this.timers.typing);
        this.timers.demo = null;
        this.timers.typing = null;
        this.indices.line = 0;
        this.indices.char = 0;
    }
};


// 📜 诗句数据
let poemLines = [];

// 📥 异步加载 poem.json
fetch('js/poem.json')
    .then(response => response.json())
    .then(data => {
        poemLines = data.map(item => item.line);
        document.getElementById("startDemoBtn").disabled = false; // 启用按钮
    })
    .catch(error => {
        console.error("无法加载 poem.json：", error);
    });

// 🎛️ 初始化按钮绑定
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startDemoBtn");
    const stopBtn = document.getElementById("stopDemoBtn");

    if (startBtn) startBtn.addEventListener("click", handleStartPauseToggle);
    if (stopBtn) stopBtn.addEventListener("click", handleStopDemo);
});
document.addEventListener("keydown", (event) => {
    // 忽略输入框中的空格，避免打断输入
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) return;

    if (event.code === "Space") {
        event.preventDefault(); // 阻止页面滚动
        handleStartPauseToggle();
    }
});

// ▶️ 播放 / 暂停 / ▶️ 控制器
function handleStartPauseToggle() {
    const btn = document.getElementById("startDemoBtn");
    if (!btn) return;

    if (poemLines.length === 0) {
        alert("诗句尚未加载，请稍候再试");
        return;
    }

    // ✅ 首次启动
    if (!demoState.hasStarted) {
        demoState.reset(); // 清空状态
        demoState.isInterrupted = false;
        demoState.hasStarted = true;
        runPoemDemo();
        btn.innerText = "⏸️";
        console.log("▶️⏸️");
        return;
    }

    // ✅ 正在演示 → 暂停
    if (!demoState.isInterrupted) {
        demoState.isInterrupted = true;
        clearTimeout(demoState.timers.demo);
        clearTimeout(demoState.timers.typing);
        btn.innerText = "▶️";
        console.log("演示已暂停");
        return;
    }

    // ✅ 暂停中 → ▶️
    if (demoState.isInterrupted && demoState.indices.line < poemLines.length) {
        demoState.isInterrupted = false;
        runPoemDemo();
        btn.innerText = "⏸️";
        console.log("▶️演示");
        return;
    }
}

// ⏹ 停止并重置演示
// ⏹ 停止并重置演示
function handleStopDemo() {
    // ⏹ 标记状态为中断 + 未启动，防止 runPoemDemo 继续执行
    demoState.isInterrupted = true;
    demoState.hasStarted = false;

    // ⏹ 清除定时器
    clearTimeout(demoState.timers.demo);
    clearTimeout(demoState.timers.typing);
    demoState.timers.demo = null;
    demoState.timers.typing = null;

    // ⏹ 重置索引
    demoState.indices.line = 0;
    demoState.indices.char = 0;

    // ⏹ 中断 txt.js 的输入流程（如有）
    if (window.txtState && typeof window.txtState.reset === "function") {
        window.txtState.reset();
    }

    // 🧹 清空输入框
    const input = document.getElementById("textInput");
    if (input) input.value = "";

    // 🧹 清空网格内容
    const grid = document.getElementById("grid");
    if (grid) grid.innerHTML = "";

    // 🧹 清空诗句展示
    const poemDisplay = document.getElementById("poemDisplay");
    if (poemDisplay) poemDisplay.innerText = "";

    // 🔄 恢复按钮状态
    const btn = document.getElementById("startDemoBtn");
    if (btn) btn.innerText = "▶️";

    // 🧹 清空动画队列（如有）
    if (window.animationQueue) {
        window.animationQueue = [];
    }

    // ✅ 日志输出
    console.log("✅ 演示已中断，状态已重置");
}



// 🔁 主演示流程
function runPoemDemo() {
    if (demoState.indices.line >= poemLines.length) {
        clearTimeout(demoState.timers.demo);
        const btn = document.getElementById("startDemoBtn");
        if (btn) btn.innerText = "▶️";
        console.log("演示已完成");
        return;
    }

    const line = poemLines[demoState.indices.line];
    const input = document.getElementById("textInput");
    if (!input) return;

    input.value = "";
    demoState.indices.char = 0;
    const charInterval = 300;

    function typeNextChar() {
        if (demoState.isInterrupted) {
            console.log("演示已中断");
            return;
        }

        if (demoState.indices.char < line.length) {
            input.value += line[demoState.indices.char];
            updateGrid(); // ✅ 你的网格更新函数
            demoState.indices.char++;
            demoState.timers.typing = setTimeout(typeNextChar, charInterval);
        } else {
            // 🎨 混合模式处理
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


            demoState.indices.line++;
            demoState.timers.demo = setTimeout(runPoemDemo, 5000);
        }
    }

    typeNextChar();
}
