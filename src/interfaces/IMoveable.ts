import { type Vector } from '../Vector'

export interface IMoveable {
  vector: Vector
  speed: number
  moveTurning: boolean
  turnSpeed: number
  hardCollision: boolean
  collisionCount: number
  colliding: boolean
  lastMovementGridX: number
  lastMovementGridY: number
}
