import { vi } from 'vitest';

// Minimal stand-in for a Phaser Arcade sprite: body.x/y is the top-left corner,
// sprite.x/y is the center (origin 0.5), matching Phaser defaults.
export function createFakeSprite({ centerX = 100, bottom = 200, width = 20, height = 30, velocity = { x: 0, y: 0 }, blockedDown = false } = {}) {
  const body = {
    x: centerX - width / 2,
    y: bottom - height,
    width,
    height,
    velocity: { ...velocity },
    blocked: { down: blockedDown },
    allowGravity: true,
    prevFrame: { x: centerX - width / 2, y: bottom - height },
    setVelocityX: vi.fn((vx) => {
      body.velocity.x = vx;
      return body;
    }),
    setVelocityY: vi.fn((vy) => {
      body.velocity.y = vy;
      return body;
    }),
    setAllowGravity: vi.fn((allow) => {
      body.allowGravity = allow;
      return body;
    }),
    updateCenter: vi.fn(),
  };
  return {
    x: centerX,
    y: bottom - height / 2,
    flipX: false,
    body,
    setFlipX: vi.fn(function setFlipX(flip) {
      this.flipX = flip;
      return this;
    }),
  };
}

export const feetOf = (sprite) => sprite.body.y + sprite.body.height;
export const centerXOf = (sprite) => sprite.body.x + sprite.body.width / 2;
