import { type LifeBar } from '../LifeBar'

export interface ILifeable {
  life: number
  hitPoints: number
  lifeBar: LifeBar
  drawLifeBarOptions: {
    borderColor: number
    borderThickness: number
    borderAlpha: number
    width: number
    height: number
    fillColor: number
    emptyColor: number
    offset: {
      x: number
      y: number
    }
  }
  isAlive: () => boolean
  isHealthy: () => boolean
  isDead: () => boolean
  subLife: (damage: number) => void
}
