import { Container, Graphics } from 'pixi.js'
import { EItemName, EItemType, type IItem } from './interfaces/IItem'
import { type Game } from './Game'
import { generateUid } from './common'
import { type ECommandName } from './Command'
import { type IOrder } from './interfaces/IOrder'
import { logItemBounds } from './logger'

export interface IItemOptions {
  game: Game
  uid?: number
  initX: number
  initY: number
  commands?: ECommandName[]
  order?: IOrder
}

export class Item extends Container implements IItem {
  public game: Game
  public uid: number
  public sight = 0
  public type = EItemType.none
  public itemName = EItemName.None
  public commands: ECommandName[] = []
  public order: IOrder
  public collisionGraphics = new Graphics()
  public collisionOptions = {
    width: 0,
    height: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  constructor (options: IItemOptions) {
    super()
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.order = options.order ?? { type: 'stand' }
  }

  setup (_: IItemOptions): void {
    this.addChild(this.collisionGraphics)
  }

  getGridXY ({ floor = false, center = false } = {}): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    const collisionPosition = this.getCollisionPosition({ center })
    const ret = { gridX: collisionPosition.x / gridSize, gridY: collisionPosition.y / gridSize }
    if (floor) {
      ret.gridX = Math.floor(ret.gridX)
      ret.gridY = Math.floor(ret.gridY)
    }
    return ret
  }

  setPositionByXY ({ x, y, center = false }: { x: number, y: number, center?: boolean }): void {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const diffX = 0 - (colX + (center ? colWidth / 2 : 0))
    const diffY = 0 - (colY + (center ? colHeight / 2 : 0))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
  }

  handleUpdate (deltaMS: number): void {}

  drawCollision (): void {
    const { offset, width, height } = this.collisionOptions
    const { collisionGraphics } = this
    collisionGraphics.position.set(offset.x, offset.y)
    collisionGraphics.beginFill(0xffffff)
    collisionGraphics.drawRect(0, 0, width, height)
    collisionGraphics.endFill()
    collisionGraphics.alpha = logItemBounds.enabled ? 0.5 : 0
  }

  getCollisionPosition ({ center = false } = {}): { x: number, y: number } {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const ret = {
      x: this.x + colX,
      y: this.y + colY
    }
    if (center) {
      ret.x += (colWidth) / 2
      ret.y += (colHeight) / 2
    }
    return ret
  }

  getCollisionBounds (): { top: number, right: number, bottom: number, left: number } {
    const collisionPosition = this.getCollisionPosition()
    return {
      top: collisionPosition.y,
      right: collisionPosition.x + this.collisionGraphics.width,
      bottom: collisionPosition.y + this.collisionGraphics.height,
      left: collisionPosition.x
    }
  }

  getGridCollisionBounds (): { topGridY: number, rightGridX: number, bottomGridY: number, leftGridX: number } {
    const bounds = this.getCollisionBounds()
    const { gridSize } = this.game.tileMap
    const ret = {
      topGridY: bounds.top / gridSize,
      rightGridX: bounds.right / gridSize,
      bottomGridY: bounds.bottom / gridSize,
      leftGridX: bounds.left / gridSize
    }
    const retFloor = {
      topGridY: Math.floor(ret.topGridY),
      rightGridX: Math.floor(ret.rightGridX),
      bottomGridY: Math.floor(ret.bottomGridY),
      leftGridX: Math.floor(ret.leftGridX)
    }
    return {
      topGridY: retFloor.topGridY,
      leftGridX: retFloor.leftGridX,
      // if [y.00] === [y]
      // unit is directly on edges, return low grid value
      rightGridX: ret.rightGridX === retFloor.rightGridX && ret.leftGridX === ret.rightGridX - 1
        ? retFloor.leftGridX
        : retFloor.rightGridX,
      bottomGridY: ret.bottomGridY === retFloor.bottomGridY && ret.topGridY === ret.bottomGridY - 1
        ? retFloor.topGridY
        : retFloor.bottomGridY
    }
  }

  processOrders (): boolean {
    return false
  }

  removeAndDestroy (): void {
    this.removeFromParent()
  }
}
