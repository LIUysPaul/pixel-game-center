# PIXEL STATION — 像素游戏站

7款纯原生 HTML5 Canvas 像素游戏，零依赖、零构建，开箱即部署到 GitHub Pages。

## 在线试玩

部署到 GitHub Pages 后，访问：

```
https://<你的用户名>.github.io/<仓库名>/
```

门户首页展示7款游戏卡片，支持分类筛选（经典/街机/多人）。

## 游戏列表

| # | 游戏 | 目录 | 类型 |
|---|------|------|------|
| 1 | MECHA BATTLE — 像素风机甲对战 | `mechabattle/` | 双人格斗 |
| 2 | DUNGEON PIXEL — 像素地牢探险 | `dungeon/` | Roguelike |
| 3 | STAR PIXEL — 像素太空射击 | `spaceshooter/` | 弹幕射击 |
| 4 | PIXEL PONG — 像素乒乓对战 | `pong/` | 经典街机 |
| 5 | SNAKE — 像素贪吃蛇 | `snake/` | 经典益智 |
| 6 | TETRIS — 像素俄罗斯方块 | `tetris/` | 经典益智 |
| 7 | BREAKOUT — 像素打砖块 | `breakout/` | 经典街机 |

---

## 部署到 GitHub Pages（3 步）

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

> `.nojekyll` 文件已包含在仓库根目录。

---

## 本地运行

```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/
```

---

## 项目结构

```
.
├── index.html              # 门户首页（7款游戏入口 + 分类筛选）
├── .nojekyll               # 禁用 GitHub Pages Jekyll 处理
├── README.md               # 本文件
├── docs/                   # 设计文档
├── mechabattle/            # 游戏1：机甲对战
├── dungeon/                # 游戏2：地牢探险
├── spaceshooter/           # 游戏3：太空射击
├── pong/                   # 游戏4：乒乓对战
├── snake/                  # 游戏5：贪吃蛇
├── tetris/                 # 游戏6：俄罗斯方块
└── breakout/               # 游戏7：打砖块
```

## 游戏操作

### MECHA BATTLE — 机甲对战
- P1：A/D 移动、W 跳跃、F 攻击、G 防御
- P2：←/→ 移动、↑ 跳跃、小键盘1 攻击、小键盘2 防御

### DUNGEON PIXEL — 地牢探险
- WASD / 方向键 — 移动
- 空格 — 攻击

### STAR PIXEL — 太空射击
- WASD / 方向键 — 移动
- 自动射击
- 空格 — 炸弹清屏

### PIXEL PONG — 乒乓对战
- P1：W 上 / S 下
- P2：I 上 / K 下
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

## 技术栈

- HTML5 Canvas 2D + Vanilla JavaScript（ES6+）
- 零框架、零构建、零外部图片
- 所有像素素材通过 Canvas API 程序绘制
- 字体：Press Start 2P
- 适配 GitHub Pages / Netlify / Vercel
