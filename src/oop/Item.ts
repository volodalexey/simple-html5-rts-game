import { Container, Graphics } from 'pixi.js'
import { EItemName, EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'
import { type Team, generateUid, type BaseActiveItem } from '../utils/helpers'
import { type ECommandName } from '../interfaces/ICommand'
import { type IOrder } from '../interfaces/IOrder'
import { logItemBounds } from '../utils/logger'
import { type IGridPoint } from '../interfaces/IGridPoint'
import { type IBound } from '../interfaces/IBound'

export interface IItemOptions {
  game: Game
  uid?: number
  team: Team
  initX: number
  initY: number
  commands?: ECommandName[]
  order?: IOrder
}

export class Item extends Container implements IItem {
  public game: Game
  public uid: number
  public team: Team
  public sightRadius = 0
  public collisionRadius = 0
  public type = EItemType.none
  public itemName = EItemName.None
  public commands: ECommandName[] = []
  private _order: IOrder = { type: 'stand' }
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
    this.team = options.team
    this.game = options.game
    if (options.order != null) {
      this.setOrder(options.order)
    }
  }

  setup (_: IItemOptions): void {
    this.addChild(this.collisionGraphics)
  }

  get order (): IOrder {
    return this._order
  }

  playSound (order: IOrder): void {
    if (this.team === this.game.team) {
      if (['move', 'follow', 'guard', 'patrol'].includes(order.type)) {
        this.game.audio.playYes(this.itemName)
      } else if (['attack', 'move-and-attack'].includes(order.type)) {
        this.game.audio.playAttack(this.itemName)
      } else if (order.type === 'try-build') {
        this.game.audio.playYes(this.itemName)
      } else if (order.type === 'try-deploy') {
        this.game.audio.playYes(this.itemName)
      }
    }
  }

  setOrder (order: IOrder, playSound = false): void {
    if (playSound) {
      this.playSound(order)
    }
    if (typeof this.game.serializeOrders === 'function') {
      this.order.processed = true
      if (this.game.team === this.team) {
        this.game.processOrders({ items: [this as unknown as BaseActiveItem], order })
      }
      // skip order from another team, because this will be received from websocket
    } else {
      this._order = order
    }
  }

  setOrderImmediate (order: IOrder, playSound = false): void {
    if (playSound) {
      this.playSound(order)
    }
    this._order = order
  }

  getGridXY ({ floor = false, center = false } = {}): IGridPoint {
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
    const { width: colWidth, height: colHeight } = this.collisionOptions
    const { x: colX, y: colY } = this.collisionGraphics
    const diffX = 0 - (colX + (center ? colWidth / 2 : 0))
    const diffY = 0 - (colY + (center ? colHeight / 2 : 0))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: IGridPoint & { center?: boolean }): void {
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
    const { width: colWidth, height: colHeight } = this.collisionOptions
    const { x: colX, y: colY } = this.collisionGraphics
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

  getCollisionBounds (): IBound {
    const collisionPosition = this.getCollisionPosition()
    const { width: colWidth, height: colHeight } = this.collisionOptions
    return {
      top: collisionPosition.y,
      right: collisionPosition.x + colWidth,
      bottom: collisionPosition.y + colHeight,
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

  processOrder (): boolean {
    if (this.order.processed === true) {
      return true
    }
    return false
  }

  removeAndDestroy (): void {
    this.removeFromParent()
  }
}
