import { type EVectorDirection } from './Vector'
import { type BaseBuilding } from './buildings/BaseBuilding'
import { type BaseProjectile } from './projectiles/BaseProjectile'
import { type BaseVehicle } from './vehicles/BaseVehicle'

export enum Team {
  blue = 'blue',
  green = 'green'
}

export type BaseItem = BaseBuilding | BaseVehicle | BaseProjectile
export type BaseActiveItem = BaseBuilding | BaseVehicle

/**
 * Wrap value of direction so that it lies between 0 and directions-1
 */
export function wrapDirection ({ direction, directions }: { direction: number, directions: EVectorDirection }): EVectorDirection {
  if (direction < 0) {
    direction += directions
  }
  if (direction >= directions) {
    direction -= directions
  }
  return direction
}

/**
 * Finds the angle between two objects in terms of a direction (where 0 <= angle < directions)
 */
export function findAngle ({
  object, unit, directions
}: {
  object: { x: number, y: number }
  unit: { x: number, y: number }
  directions: EVectorDirection }): EVectorDirection {
  const dy = (object.y) - (unit.y)
  const dx = (object.x) - (unit.x)
  // Convert Arctan to value between (0 - directions)
  const angle = wrapDirection({
    direction: directions / 2 - (Math.atan2(dx, dy) * directions / (2 * Math.PI)),
    directions
  })
  return angle
}

/**
 * returns the smallest difference (value ranging between -directions/2 to +directions/2) between two angles (where 0 <= angle < directions)
 */
export function angleDiff ({ angle1, angle2, directions }: { angle1: number, angle2: number, directions: number }): number {
  if (angle1 >= directions / 2) {
    angle1 = angle1 - directions
  }
  if (angle2 >= directions / 2) {
    angle2 = angle2 - directions
  }

  let diff = angle2 - angle1

  if (diff < -directions / 2) {
    diff += directions
  }
  if (diff > directions / 2) {
    diff -= directions
  }

  return diff
}
