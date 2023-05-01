import { type ReloadBar } from '../ReloadBar'
import { type BaseActiveItem } from '../common'
import { type Projectile } from '../projectiles/Projectile'

export interface IAttackable {
  radius: number
  reloadTimeLeft: number
  drawReloadBarOptions: {
    alpha: number
    width: number
    height: number
    fillColor: number
    offset: {
      x: number
      y: number
    }
  }
  reloadBar: ReloadBar
  Projectile: typeof Projectile
  canAttack: boolean
  canAttackLand: boolean
  canAttackAir: boolean
  isValidTarget: (item: BaseActiveItem) => boolean
  findTargetInSight: () => void
}
