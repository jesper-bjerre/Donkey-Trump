import { describe, expect, it } from 'vitest';
import { BarrelSystem } from '../../src/systems/BarrelSystem.js';
import { createBossController } from '../../src/controllers/BossController.js';
import fixtures from '../../src/levels/level.fixtures.json';
import { createFakeSprite } from '../helpers/fakeSprite.js';

const level = fixtures.levels[0];
const FRAME = 1000 / 60;
const GRAVITY = level.barrels.gravityY;

function makeSystem(overrides = {}) {
  const boss = createBossController(level);
  const created = [];
  const system = new BarrelSystem({
    level: { ...level, barrels: { ...level.barrels, ...overrides.barrels } },
    getSpawnPoint: () => boss.getBarrelSpawnPoint(),
    createBarrelSprite: () => {
      const sprite = createFakeSprite({ width: 18, height: 18 });
      sprite.rotation = 0;
      created.push(sprite);
      return sprite;
    },
    random: overrides.random ?? (() => 0.5),
  });
  return { system, boss, created };
}

// Mimics the Arcade step that runs before Scene.update.
function physicsStep(system, dtMs) {
  for (const barrel of system.active) {
    const body = barrel.sprite.body;
    if (body.allowGravity && barrel.mode !== 'dropping') body.velocity.y = Math.min(600, body.velocity.y + GRAVITY * (dtMs / 1000));
    body.x += body.velocity.x * (dtMs / 1000);
    body.y += body.velocity.y * (dtMs / 1000);
  }
}

function simulate(system, ms) {
  for (let t = 0; t < ms; t += FRAME) {
    physicsStep(system, FRAME);
    system.update(FRAME);
  }
}

describe('spawning', () => {
  it('spawns at the boss anchor with negative horizontal velocity', () => {
    const { system, boss } = makeSystem();
    const barrel = system.spawnBarrel(boss.getBarrelSpawnPoint());
    expect(barrel.sprite.body.velocity.x).toBeLessThan(0);
    expect(barrel.sprite.x).toBe(boss.getBarrelSpawnPoint().x);
  });

  it('uses the level speed range and spawn interval', () => {
    const { system } = makeSystem({ random: () => 1 });
    const barrel = system.spawnBarrel();
    expect(barrel.speed).toBe(level.barrels.speedMax);
    expect(system.config.spawnIntervalMs).toBe(level.barrels.spawnIntervalMs);
  });

  it('waits firstSpawnDelayMs, then spawns every spawnIntervalMs', () => {
    const { system } = makeSystem();
    system.update(level.barrels.firstSpawnDelayMs - 1);
    expect(system.active).toHaveLength(0);
    system.update(1);
    expect(system.active).toHaveLength(1);
    system.update(level.barrels.spawnIntervalMs - 1);
    expect(system.active).toHaveLength(1);
    system.update(1);
    expect(system.active).toHaveLength(2);
  });

  it('never exceeds maxActive', () => {
    const { system } = makeSystem();
    for (let i = 0; i < 20; i++) system.update(level.barrels.spawnIntervalMs);
    expect(system.active.length).toBeLessThanOrEqual(level.barrels.maxActive);
  });
});

describe('movement', () => {
  it('rotates in the direction of travel', () => {
    const { system } = makeSystem();
    const barrel = system.spawnBarrel();
    simulate(system, 200);
    expect(barrel.sprite.body.velocity.x).toBeLessThan(0);
    expect(barrel.sprite.rotation).toBeLessThan(0);
  });

  it('rolls down the boss girder, drops at its end and reverses on the girder below', () => {
    const { system } = makeSystem();
    const barrel = system.spawnBarrel();
    simulate(system, 300);
    expect(barrel.mode).toBe('rolling');
    let reversed = false;
    for (let i = 0; i < 1200 && !reversed; i++) {
      simulate(system, FRAME);
      reversed = barrel.mode === 'rolling' && barrel.direction === 1;
    }
    expect(reversed).toBe(true);
  });

  it('can take a ladder down when ladderDropChance allows it', () => {
    const { system } = makeSystem({ barrels: { route: { ladderDropChance: 1 } }, random: () => 0 });
    const barrel = system.spawnBarrel();
    let dropped = false;
    for (let i = 0; i < 1200 && !dropped; i++) {
      simulate(system, FRAME);
      dropped = barrel.mode === 'dropping';
    }
    expect(dropped).toBe(true);
  });
});

describe('cleanup', () => {
  it('recycles barrels that leave the left level boundary', () => {
    const { system } = makeSystem();
    const barrel = system.spawnBarrel({ x: 5, y: 560 });
    barrel.sprite.body.x = -40;
    system.update(FRAME);
    expect(system.active).not.toContain(barrel);
    expect(barrel.active).toBe(false);
    expect(system.pool).toContain(barrel);
  });

  it('reuses pooled sprites instead of creating new ones', () => {
    const { system, created } = makeSystem();
    const first = system.spawnBarrel();
    system.recycle(first);
    const second = system.spawnBarrel();
    expect(second).toBe(first);
    expect(created).toHaveLength(1);
    expect(second.damageEnabled).toBe(true);
  });

  it('reset clears active barrels and restarts the timer', () => {
    const { system } = makeSystem();
    system.spawnBarrel();
    system.update(5000);
    system.reset();
    expect(system.active).toHaveLength(0);
    expect(system.nextSpawnAt).toBe(level.barrels.firstSpawnDelayMs);
  });
});
