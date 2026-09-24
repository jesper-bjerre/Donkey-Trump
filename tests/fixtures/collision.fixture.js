export const player = { left: 100, right: 116, top: 170, bottom: 200 };
export const overlappingBarrel = { active: true, damageEnabled: true, bounds: { left: 108, right: 126, top: 182, bottom: 200 } };
export const distantBarrel = { active: true, damageEnabled: true, bounds: { left: 300, right: 318, top: 182, bottom: 200 } };
export const inactiveBarrel = { ...overlappingBarrel, active: false };
export const harmlessBarrel = { ...overlappingBarrel, damageEnabled: false };
export const grazingBarrel = { active: true, damageEnabled: true, bounds: { left: 114, right: 132, top: 182, bottom: 200 } };
export const barrelUnderFeet = () => ({ active: true, damageEnabled: true, jumpAwarded: false, bounds: { left: 100, right: 118, top: 182, bottom: 200 } });
export const jumpingPlayer = { left: 100, right: 116, top: 140, bottom: 170 };
