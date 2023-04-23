import { type Vector } from '../Vector'

export interface IMoveable {
  vector: Vector
  speed: number
  turnSpeed: number
  hardCollision: boolean
  colliding: boolean
  lastMovementGridX: number
  lastMovementGridY: number
}
