class DungeonGenerator {
  constructor() {
    this.width = GAME.DUNGEON_W;
    this.height = GAME.DUNGEON_H;
    this.rooms = [];
    this.tiles = [];
  }

  generate(level) {
    this.rooms = [];
    this.tiles = Array(this.height).fill(null).map(() => Array(this.width).fill(TILE.WALL));

    const roomCount = 5 + Math.floor(Math.random() * 4);
    const minSize = 4;
    const maxSize = 8;

    // Generate rooms with simple random placement + separation
    let attempts = 0;
    while (this.rooms.length < roomCount && attempts < 200) {
      attempts++;
      const w = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const h = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const x = 2 + Math.floor(Math.random() * (this.width - w - 4));
      const y = 2 + Math.floor(Math.random() * (this.height - h - 4));

      const newRoom = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };

      if (this.rooms.some(r => this.roomsOverlap(r, newRoom, 1))) continue;
      this.rooms.push(newRoom);
    }

    if (this.rooms.length < 3) return this.generate(level);

    // Sort rooms by distance from first room
    const first = this.rooms[0];
    this.rooms.sort((a, b) => {
      const da = Math.hypot(a.cx - first.cx, a.cy - first.cy);
      const db = Math.hypot(b.cx - first.cx, b.cy - first.cy);
      return da - db;
    });

    // Carve rooms
    for (const r of this.rooms) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          this.tiles[y][x] = TILE.FLOOR;
        }
      }
    }

    // Connect rooms with corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const a = this.rooms[i];
      const b = this.rooms[i + 1];
      this.carveCorridor(a.cx, a.cy, b.cx, b.cy);
    }

    // Room types
    this.rooms[0].type = 'start';
    this.rooms[this.rooms.length - 1].type = 'boss';

    // Find a middle room for stairs
    const stairsRoom = this.rooms[Math.floor(this.rooms.length / 2)];
    stairsRoom.type = 'stairs';
    this.tiles[stairsRoom.cy][stairsRoom.cx] = TILE.STAIRS;

    // Place doors at room entrances (where corridor meets room)
    this.placeDoors();

    // Spawn enemies and items
    this.spawnEntities(level);

    return {
      tiles: this.tiles,
      rooms: this.rooms,
      startX: this.rooms[0].cx * GAME.TILE + GAME.TILE / 2,
      startY: this.rooms[0].cy * GAME.TILE + GAME.TILE / 2
    };
  }

  roomsOverlap(a, b, padding) {
    return !(a.x + a.w + padding < b.x || b.x + b.w + padding < a.x ||
             a.y + a.h + padding < b.y || b.y + b.h + padding < a.y);
  }

  carveCorridor(x1, y1, x2, y2) {
    // L-shaped corridor
    let x = x1;
    let y = y1;
    while (x !== x2) {
      this.tiles[y][x] = TILE.FLOOR;
      if (y + 1 < this.height) this.tiles[y + 1][x] = TILE.FLOOR;
      x += x2 > x1 ? 1 : -1;
    }
    while (y !== y2) {
      this.tiles[y][x] = TILE.FLOOR;
      if (x + 1 < this.width) this.tiles[y][x + 1] = TILE.FLOOR;
      y += y2 > y1 ? 1 : -1;
    }
    this.tiles[y2][x2] = TILE.FLOOR;
  }

  placeDoors() {
    for (const r of this.rooms) {
      if (r.type === 'start') continue;
      // Check perimeter for corridor connections
      for (let x = r.x; x < r.x + r.w; x++) {
        if (this.tiles[r.y - 1]?.[x] === TILE.FLOOR && this.isCorridor(x, r.y - 1)) {
          this.tiles[r.y][x] = TILE.DOOR;
        }
        if (this.tiles[r.y + r.h]?.[x] === TILE.FLOOR && this.isCorridor(x, r.y + r.h)) {
          this.tiles[r.y + r.h - 1][x] = TILE.DOOR;
        }
      }
      for (let y = r.y; y < r.y + r.h; y++) {
        if (this.tiles[y]?.[r.x - 1] === TILE.FLOOR && this.isCorridor(r.x - 1, y)) {
          this.tiles[y][r.x] = TILE.DOOR;
        }
        if (this.tiles[y]?.[r.x + r.w] === TILE.FLOOR && this.isCorridor(r.x + r.w, y)) {
          this.tiles[y][r.x + r.w - 1] = TILE.DOOR;
        }
      }
    }
  }

  isCorridor(x, y) {
    // Check if this floor tile is not inside any room and within bounds
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return !this.rooms.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  }

  spawnEntities(level) {
    for (const r of this.rooms) {
      if (r.type === 'start') continue;

      const enemyCount = r.type === 'boss' ? 1 : 1 + Math.floor(Math.random() * 3) + Math.floor(level / 2);
      r.enemies = [];
      r.items = [];

      if (r.type === 'boss') {
        r.enemies.push({ type: 'boss', x: r.cx, y: r.cy });
      } else {
        for (let i = 0; i < enemyCount; i++) {
          const ex = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
          const ey = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
          const types = ['slime', 'slime', 'skeleton', 'bat'];
          if (level >= 3) types.push('skeleton', 'skeleton');
          if (level >= 5) types.push('bat', 'bat');
          r.enemies.push({ type: types[Math.floor(Math.random() * types.length)], x: ex, y: ey });
        }
      }

      // Items
      if (Math.random() < 0.5 || r.type === 'boss') {
        const ix = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
        const iy = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
        const itemTypes = ['potion', 'gem'];
        if (Math.random() < 0.2) itemTypes.push('chest');
        r.items.push({ type: itemTypes[Math.floor(Math.random() * itemTypes.length)], x: ix, y: iy });
      }
    }
  }
}
