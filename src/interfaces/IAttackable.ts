import { type BaseItem } from '../common'

export interface IAttackable {
  sight: number
  radius: number
  canAttack: boolean
  canAttackLand: boolean
  canAttackAir: boolean
  isValidTarget: (item: BaseItem) => boolean
  findTargetsInSight: () => void
}
