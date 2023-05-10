import { type LifeBar } from '../components/LifeBar'

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
  drawLifeBar: () => void
  isAlive: () => boolean
  isHealthy: () => boolean
  isDead: () => boolean
  subLife: (damage: number) => void
  updateLife: () => void
  updateAnimation: () => void
}
