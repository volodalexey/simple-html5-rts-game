import { type IItemOptions, Item } from './Item'
import { LifeBar } from '../components/LifeBar'
import { type ILifeable } from '../interfaces/ILifeable'

export interface ILifeableItemOptions extends IItemOptions {
  life?: number
}

export class LifeableItem extends Item implements ILifeable {
  public life = 0
  public hitPoints = 0
  public lifeBar!: LifeBar
  public drawLifeBarOptions = {
    borderColor: 0,
    borderThickness: 0,
    borderAlpha: 0,
    width: 0,
    height: 0,
    fillColor: 0,
    emptyColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  constructor (options: ILifeableItemOptions) {
    super(options)
    if (options.life != null) {
      this.life = options.life
    }
  }

  setup (_: ILifeableItemOptions): void {
    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  drawLifeBar (): void {
    this.lifeBar.draw(this.drawLifeBarOptions)
    const { offset } = this.drawLifeBarOptions
    this.lifeBar.position.set(offset.x, offset.y)
  }

  isAlive (): boolean {
    return this.life > 0
  }

  isHealthy (): boolean {
    return this.life >= this.hitPoints * 0.4
  }

  isDead (): boolean {
    return !this.isAlive()
  }

  subLife (damage: number): void {
    this.life -= damage
    if (this.isDead()) {
      this.removeAndDestroy()
    } else {
      this.updateLife()
      this.updateAnimation()
    }
  }

  updateLife (): void {
    this.lifeBar.updateLife(this.life / this.hitPoints)
  }

  updateAnimation (): void {}
}
