import { Container, Graphics } from 'pixi.js'
import { type ILifeable } from '../interfaces/ILifeable'

type ILifeBarOptions = ILifeable['drawLifeBarOptions']

export class LifeBar extends Container {
  public borderBox!: Graphics
  public bars!: Container
  public fillBar!: Graphics
  public emptyBar!: Graphics
  public borderThickness!: ILifeBarOptions['borderThickness']

  constructor (options: ILifeBarOptions) {
    super()
    this.borderThickness = options.borderThickness
    this.setup()
  }

  setup (): void {
    this.borderBox = new Graphics()
    this.addChild(this.borderBox)

    const bars = new Container()
    this.addChild(bars)
    this.bars = bars

    this.emptyBar = new Graphics()
    bars.addChild(this.emptyBar)

    const fillBar = new Graphics()
    bars.addChild(fillBar)
    this.fillBar = fillBar
  }

  draw ({ borderColor, borderAlpha, fillColor, emptyColor, width, height, borderThickness }: ILifeBarOptions): void {
    const {
      borderBox, fillBar, emptyBar
    } = this
    borderBox.beginFill(borderColor)
    borderBox.drawRect(0, 0, width, height)
    borderBox.endFill()
    borderBox.alpha = borderAlpha

    this.bars.position.set(borderThickness, borderThickness)

    emptyBar.beginFill(emptyColor)
    emptyBar.drawRect(0, 0, width - 2 * borderThickness, height - 2 * borderThickness)
    emptyBar.endFill()

    fillBar.beginFill(fillColor)
    fillBar.drawRect(0, 0, width - 2 * borderThickness, height - 2 * borderThickness)
    fillBar.endFill()
  }

  updateLife (lifePercent: number): void {
    this.fillBar.width = (this.emptyBar.width - this.borderThickness) * lifePercent
  }
}
