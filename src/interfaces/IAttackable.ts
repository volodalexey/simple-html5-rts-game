import { type ReloadBar } from '../ReloadBar'
import { type BaseActiveItem } from '../common'
import { type ProjectileName } from './IItem'

export interface IAttackable {
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
  findTargetInSight: () => void
}
