import { type EVectorDirection } from './Vector'
import { type Building } from './buildings/Building'
import { type IItem } from './interfaces/IItem'
import { type ISelectable } from './interfaces/ISelectable'
import { type Projectile } from './projectiles/Projectile'
import { type Vehicle } from './vehicles/Vehicle'
import { type AirVehicle } from './air-vehicles/AirVehicle'

export enum Team {
  blue = 'blue',
  green = 'green'
}

export type BaseItem = Building | Vehicle | AirVehicle | Projectile
export type BaseMoveableItem = Vehicle | AirVehicle
export type BaseActiveItem = Building | Vehicle | AirVehicle
export type SelectableItem = ISelectable & IItem

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
  from, to, directions
}: {
  from: { x: number, y: number }
  to: { x: number, y: number }
  directions: EVectorDirection
}): EVectorDirection {
  const dy = (from.y) - (to.y)
  const dx = (from.x) - (to.x)
  // Convert Arctan to value between (0 - directions)
  const angle = wrapDirection({
    direction: directions / 2 - (Math.atan2(dx, dy) * directions / (2 * Math.PI)),
    directions
  })
  return angle
}

export function findAngleGrid ({
  from, to, directions
}: {
  from: { gridX: number, gridY: number }
  to: { gridX: number, gridY: number }
  directions: EVectorDirection
}): EVectorDirection {
  const dy = from.gridY - to.gridY
  const dx = from.gridX - to.gridX
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

interface IBound {
  top: number
  right: number
  bottom: number
  left: number
}

export function checkCollision (a: IBound, b: IBound, compareWith: 'a' | 'b' = 'a'): number {
  const rightmostLeft = Math.max(b.left, a.left)
  const leftmostRight = Math.min(b.right, a.right)

  if (leftmostRight <= rightmostLeft) {
    return 0
  }

  const bottommostTop = Math.max(b.top, a.top)
  const topmostBottom = Math.min(b.bottom, a.bottom)

  if (topmostBottom > bottommostTop) {
    const squareIntersection = (leftmostRight - rightmostLeft) * (topmostBottom - bottommostTop)
    const squareTarget = compareWith === 'a' ? (a.right - a.left) * (a.bottom - a.top) : (b.right - b.left) * (b.bottom - b.top)
    return squareIntersection / squareTarget
  }
  return 0
}

let uid = 1000

export function generateUid (): number {
  return ++uid
}

export function compareArrays<T> (arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
  arr1 = [...arr1].sort()
  // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
  arr2 = [...arr2].sort()

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}
