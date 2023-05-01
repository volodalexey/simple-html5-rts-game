import { type BaseActiveItem } from '../common'
import { type Projectile } from '../projectiles/Projectile'

export interface IAttackable {
  radius: number
  Projectile: typeof Projectile
  canAttack: boolean
  canAttackLand: boolean
  canAttackAir: boolean
  isValidTarget: (item: BaseActiveItem) => boolean
  findTargetInSight: () => void
}
