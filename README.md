# 🎮 PIXEL STATION — 像素游戏站

> 7款纯原生 HTML5 Canvas 像素游戏，零依赖、零构建，开箱即部署到 GitHub Pages。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Games](https://img.shields.io/badge/games-7-green.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![Tech](https://img.shields.io/badge/tech-HTML5%20Canvas-orange.svg)

## ✨ 特性

- 🎯 **7款完整游戏** — 从格斗争霸到经典益智，一应俱全
- 🚀 **零依赖** — 纯原生 HTML5 Canvas + Vanilla JS，无需任何框架
- 📦 **零构建** — 无需 npm/webpack/vite，克隆即可运行
- 🎨 **纯代码绘制** — 所有像素素材通过 Canvas API 程序生成，无外部图片
- 📱 **响应式设计** — 适配桌面和移动端浏览器
- 🏷️ **分类筛选** — 支持按经典/街机/多人筛选游戏
- ☁️ **一键部署** — 完美支持 GitHub Pages / Netlify / Vercel

## 🎲 游戏列表

| # | 游戏 | 目录 | 类型 | 玩法 |
|---|------|------|------|------|
| 1 | **MECHA BATTLE** — 像素风机甲对战 | `mechabattle/` | 双人格斗 | 双人同屏格斗，移动/攻击/防御/跳跃 |
| 2 | **DUNGEON PIXEL** — 像素地牢探险 | `dungeon/` | Roguelike | 随机地图，击败怪物，挑战BOSS |
| 3 | **STAR PIXEL** — 像素太空射击 | `spaceshooter/` | 弹幕射击 | 自动射击，炸弹清屏，5级武器升级 |
| 4 | **PIXEL PONG** — 像素乒乓对战 | `pong/` | 经典街机 | 经典乒乓，单人对AI或双人竞技 |
| 5 | **SNAKE** — 像素贪吃蛇 | `snake/` | 经典益智 | 控制方向吃食物，最高分自动保存 |
| 6 | **TETRIS** — 像素俄罗斯方块 | `tetris/` | 经典益智 | 7种方块，旋转/硬降，等级递增 |
| 7 | **BREAKOUT** — 像素打砖块 | `breakout/` | 经典街机 | 5行彩色砖块，3条生命 |

## 🎮 游戏操作

### MECHA BATTLE — 机甲对战
- **P1**：A/D 移动、W 跳跃、F 攻击、G 防御
- **P2**：←/→ 移动、↑ 跳跃、小键盘1 攻击、小键盘2 防御

### DUNGEON PIXEL — 地牢探险
- WASD / 方向键 — 移动
- 空格 — 攻击

### STAR PIXEL — 太空射击
- WASD / 方向键 — 移动
- 自动射击
- 空格 — 炸弹清屏

### PIXEL PONG — 乒乓对战
- **P1**：W 上 / S 下
- **P2**：I 上 / K 下
- 空格重开 | ESC 返回菜单

### SNAKE — 贪吃蛇
- WASD / 方向键 — 控制方向
- 空格暂停 | ESC 返回菜单
- 最高分自动保存到 localStorage

### TETRIS — 俄罗斯方块
- ←/→ 移动 | ↑ 旋转 | ↓ 加速
- 空格硬降 | ESC 返回菜单
- 7种方块、等级递增难度

### BREAKOUT — 打砖块
- ←/→ 控制挡板
- 空格发射球 | ESC 返回菜单
- 3条生命，5行彩色砖块

## 🚀 在线试玩

部署到 GitHub Pages 后，访问：

```
https://<你的用户名>.github.io/<仓库名>/
```

门户首页展示7款游戏卡片，支持分类筛选（全部/经典/街机/多人）。

## 📦 部署到 GitHub Pages（3步）

### 1. 创建仓库并推送代码

```bash
git init
git add .
git commit -m "PIXEL STATION - 7 Pixel Games"
git branch -M main
git remote add origin https://github.com/<你的用户名>/pixel-games.git
git push -u origin main
```

### 2. 开启 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`，文件夹选 `/ (root)`
4. 点击 **Save**

### 3. 等待部署完成

约 1-2 分钟后，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

> `.nojekyll` 文件已包含在仓库根目录，确保 GitHub Pages 正确渲染。

## 💻 本地运行

无需安装任何依赖，任选一种方式：

```bash
# 方式1：Python
python3 -m http.server 8080

# 方式2：Node.js
npx serve

# 方式3：直接打开
# 用浏览器直接打开 index.html（部分游戏功能可能受限）
```

浏览器访问 `http://localhost:8080/` 即可。

## 📁 项目结构

```
.
├── index.html              # 门户首页（7款游戏入口 + 分类筛选）
├── .nojekyll               # 禁用 GitHub Pages Jekyll 处理
├── README.md               # 本文件
├── LICENSE                 # MIT 协议
├── docs/                   # 设计文档（PRD + TECH）
├── mechabattle/            # 游戏1：机甲对战
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── constants.js
│       ├── mecha.js
│       ├── scenes.js
│       └── main.js
├── dungeon/                # 游戏2：地牢探险
├── spaceshooter/           # 游戏3：太空射击
├── pong/                   # 游戏4：乒乓对战
├── snake/                  # 游戏5：贪吃蛇
├── tetris/                 # 游戏6：俄罗斯方块
└── breakout/               # 游戏7：打砖块
```

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 Canvas 2D | 渲染引擎 |
| Vanilla JavaScript (ES6+) | 游戏逻辑 |
| Press Start 2P | 像素字体 |
| localStorage | 存档（贪吃蛇最高分） |

- 零框架、零构建、零外部图片
- 所有像素素材通过 Canvas API 程序绘制
- 适配 GitHub Pages / Netlify / Vercel / Cloudflare Pages

## 📚 设计文档

`docs/` 目录包含每个游戏的需求文档（PRD）和技术文档（TECH）：

- `PRD-像素风机甲对战游戏.md` / `TECH-像素风机甲对战游戏.md`
- `PRD-像素地牢探险.md` / `TECH-像素地牢探险.md`
- `PRD-像素太空射击.md` / `TECH-像素太空射击.md`

## 🤝 贡献

欢迎贡献代码或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 协议

本项目基于 [MIT License](LICENSE) 开源，可自由使用、修改、分发。

## 🙏 致谢

- 字体：[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38
- 灵感来源：经典街机游戏 & Retro Gaming
