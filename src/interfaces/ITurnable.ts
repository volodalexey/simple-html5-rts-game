import { type Vector } from '../utils/Vector'

export interface ITurnable {
  vector: Vector
  moveTurning: boolean
  turnSpeed: number
}
