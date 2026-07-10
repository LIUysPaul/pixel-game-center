# 像素太空射击 — 技术架构文档

## 架构

```
Canvas 540x720
├── GameEngine (rAF循环 60fps)
│   ├── InputManager (键盘)
│   ├── SceneManager
│   │   ├── MenuScene
│   │   ├── PlayScene (核心)
│   │   │   ├── Player (移动/射击/炸弹)
│   │   │   ├── BulletManager (玩家弹+敌弹)
│   │   │   ├── EnemyManager (生成/AI/弹幕)
│   │   │   ├── ItemManager (道具掉落/拾取)
│   │   │   ├── ParticleManager (爆炸/尾焰)
│   │   │   └── StarField (滚动星空背景)
│   │   └── GameOverScene
```

## 文件结构

```
/workspace/spaceshooter/
├── index.html
├── style.css
└── js/
    ├── constants.js
    ├── entities.js    (Player/Enemy/Item)
    ├── managers.js    (Bullet/Enemy/Particle/Star)
    ├── scenes.js      (Menu/Play/GameOver)
    └── main.js        (Engine/Input/启动)
```

## 渲染策略
- 关闭抗锯齿，像素绘制
- 星空：3层视差滚动
- 弹幕：fillRect + glow(shadowBlur)
- 爆炸：粒子系统 + 扩散圆环
- 屏幕震动：ctx.translate偏移

## 碰撞检测
- 圆形碰撞：玩家(8px) vs 敌弹(4px)
- AABB：玩家弹 vs 敌机
- 距离检测：道具拾取
