import { type ReloadBar } from '../components/ReloadBar'
import { type BaseActiveItem } from '../utils/helpers'
import { type ProjectileName } from './IItem'

export interface IAttackable {
  attackRadius: number
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
  projectile: ProjectileName
  canAttack: boolean
  canAttackLand: boolean
  canAttackAir: boolean
  isValidTarget: (item: BaseActiveItem) => boolean
  findTargetInRadius: (options?: { addSight?: number, radius?: number }) => void
}
