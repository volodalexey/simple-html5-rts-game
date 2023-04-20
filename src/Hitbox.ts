import { Graphics, Text } from 'pixi.js'
import { logHitboxes } from './logger'

interface IHitboxOptions {
  initX: number
  initY: number
  initGridX: number
  initGridY: number
  initWidth: number
  initHeight: number
}

export class Hitbox extends Graphics {
  public initGridX!: number
  public initGridY!: number
  constructor ({ initX, initY, initGridX, initGridY, initWidth, initHeight }: IHitboxOptions) {
    super()
    this.initGridX = initGridX
    this.initGridY = initGridY
    this.beginFill(0xff0000)
    this.drawRect(0, 0, initWidth, initHeight)
    this.endFill()
    this.alpha = logHitboxes.enabled ? 0.5 : 0
    this.position.set(initX, initY)
    if (initGridX != null && initGridY != null) {
      this.addChild(new Text(`x=${initGridX}\ny=${initGridY}`, {
        fontSize: 8,
        fill: 0xffff00,
        align: 'center'
      }))
    }
  }

  getRectBounds (): {
    top: number
    right: number
    bottom: number
    left: number
  } {
    return {
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height,
      left: this.x
    }
  }
}
