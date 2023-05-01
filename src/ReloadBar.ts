import { Container, Graphics } from 'pixi.js'
import { type IAttackable } from './interfaces/IAttackable'

type IReloadBarOptions = IAttackable['drawReloadBarOptions']

export class ReloadBar extends Container {
  public fillBar!: Graphics
  public maxWidth!: number

  constructor (options: IReloadBarOptions) {
    super()
    this.setup()
  }

  setup (): void {
    const fillBar = new Graphics()
    this.addChild(fillBar)
    this.fillBar = fillBar
  }

  draw ({ fillColor, width, height, alpha }: IReloadBarOptions): void {
    this.maxWidth = width
    const { fillBar } = this
    fillBar.beginFill(fillColor)
    fillBar.drawRect(0, 0, width, height)
    fillBar.endFill()
    fillBar.alpha = alpha
  }

  updateReload (reloadPercent: number): void {
    this.fillBar.width = this.maxWidth * reloadPercent
  }
}
