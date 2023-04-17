import { type Container } from 'pixi.js'
import { type TileMap } from './TileMap'

export interface ICameraOptions {
  tileMap: TileMap
}

export class Camera {
  public tileMap!: TileMap
  public watchObject?: Container

  static options = {
    scrollEdge: 100
  }

  constructor (options: ICameraOptions) {
    this.tileMap = options.tileMap
  }

  watch (watchObject: Container): void {
    this.watchObject = watchObject
  }

  handleUpdate (deltaMS: number): void {
    if (this.watchObject == null) {
      return
    }
    const { pivot, viewWidth, viewHeight, background: { width, height } } = this.tileMap
    const { scrollEdge } = Camera.options
    const calcWidth = viewWidth > width ? width : viewWidth
    const calcHeight = viewHeight > height ? height : viewHeight
    const centerX = this.watchObject.x + this.watchObject.width / 2
    const centerY = this.watchObject.y + this.watchObject.height / 2
    if (centerX > pivot.x + calcWidth - scrollEdge) {
      pivot.x = centerX - calcWidth + scrollEdge
    } else if (centerX < pivot.x + scrollEdge) {
      pivot.x = centerX - scrollEdge
    }
    if (pivot.x < 0) {
      pivot.x = 0
    } else if (pivot.x > this.tileMap.maxXPivot) {
      pivot.x = this.tileMap.maxXPivot
    }

    if (centerY > pivot.y + calcHeight - scrollEdge) {
      pivot.y = centerY - calcHeight + scrollEdge
    } else if (centerY < pivot.y + scrollEdge) {
      pivot.y = centerY - scrollEdge
    }
    if (pivot.y < 0) {
      pivot.y = 0
    } else if (pivot.y > this.tileMap.maxYPivot) {
      pivot.y = this.tileMap.maxYPivot
    }
  }
}
