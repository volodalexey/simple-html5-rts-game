import { Graphics } from 'pixi.js'
import { type Game } from '../Game'
import { type IBound, type IGridBound } from '../interfaces/IBound'

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

  getCameraBounds (): IBound {
    const { width, height } = this
    const { scale: { x: tmSX, y: tmSY }, pivot: { x: camX, y: camY } } = this.game.tileMap
    return {
      top: camY,
      right: camX + width / tmSX,
      bottom: camY + height / tmSY,
      left: camX
    }
  }

  getCameraGridBounds (): IGridBound {
    const { top, right, bottom, left } = this.getCameraBounds()
    const { gridSize } = this.game.tileMap
    return {
      topGridY: Math.floor(top / gridSize),
      bottomGridY: Math.floor(bottom / gridSize),
      leftGridX: Math.floor(left / gridSize),
      rightGridX: Math.floor(right / gridSize)
    }
  }
}
