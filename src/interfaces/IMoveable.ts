import { type Vector } from '../Vector'

export interface IMoveable {
  velocity: Vector
  speed: number
  turnSpeed: number
  hardCollision: boolean
  colliding: boolean
  lastMovementGridX: number
  lastMovementGridY: number
}
