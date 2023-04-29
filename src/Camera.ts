import { Graphics } from 'pixi.js'

export interface ICameraOptions {
  viewWidth: number
  viewHeight: number
  initY?: number
}

export class Camera extends Graphics {
  static options = {
    scrollEdge: 100
  }

  constructor (options: ICameraOptions) {
    super()

    this.draw(options)

    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  draw ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    this.clear()
    this.beginFill(0xffffff)
    this.drawRect(0, 0, viewWidth, viewHeight)
    this.endFill()
  }

  handleUpdate (deltaMS: number): void {

  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.draw({ viewWidth, viewHeight })
  }
}
