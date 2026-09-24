// Arcade bodies re-sync from their sprite in preUpdate and push their own movement
// back to the sprite in postUpdate (as position - prevFrame). Corrections made in
// Scene.update must therefore shift sprite, body and prevFrame together, or they are
// either lost or applied twice.

export function getBodyBounds(body) {
  return { left: body.x, right: body.x + body.width, top: body.y, bottom: body.y + body.height };
}

export function getBodyCenterX(body) {
  return body.x + body.width / 2;
}

export function shiftBody(sprite, dx, dy) {
  if (dx === 0 && dy === 0) return;
  const body = sprite.body;
  sprite.x += dx;
  sprite.y += dy;
  body.x += dx;
  body.y += dy;
  if (body.prevFrame) {
    body.prevFrame.x += dx;
    body.prevFrame.y += dy;
  }
  body.updateCenter?.();
}

export function placeBodyBottom(sprite, bottom) {
  shiftBody(sprite, 0, bottom - (sprite.body.y + sprite.body.height));
}

export function placeBodyCenterX(sprite, centerX) {
  shiftBody(sprite, centerX - getBodyCenterX(sprite.body), 0);
}
