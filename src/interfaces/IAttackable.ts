import { type BaseActiveItem } from '../common'
import { type BaseProjectile } from '../projectiles/BaseProjectile'

export interface IAttackable {
  sight: number
  radius: number
  Projectile: typeof BaseProjectile
  canAttack: boolean
  canAttackLand: boolean
  canAttackAir: boolean
  isValidTarget: (item: BaseActiveItem) => boolean
  findTargetInSight: () => void
}
