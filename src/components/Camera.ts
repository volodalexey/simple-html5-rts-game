import { Graphics } from 'pixi.js'
import { type Game } from '../Game'

export interface ICameraOptions {
  game: Game
  viewWidth: number
  viewHeight: number
  initY?: number
}

export class Camera extends Graphics {
  public game !: Game
  static options = {
    scrollEdge: 100
  }

  constructor (options: ICameraOptions) {
    super()
    this.game = options.game
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
    const { gridSize, background: { width: bgWidth, height: bgHeight } } = this.game.tileMap
    const maxWidth = bgWidth + gridSize * 2
    const maxHeight = bgHeight + gridSize * 2
    this.draw({
      viewWidth: viewWidth > maxWidth ? maxWidth : viewWidth,
      viewHeight: viewHeight > maxHeight ? maxHeight : viewHeight
    })
  }
}
