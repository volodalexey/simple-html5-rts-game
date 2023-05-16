import { Graphics, Sprite } from 'pixi.js'
import { Team, type SelectableItem, type BaseActiveItem } from './helpers'
import { type IGridPointData, type IOrder } from '../interfaces/IOrder'
import { type TileMap } from '../components/TileMap'
import { type BuildName, EItemName, type UnitName, type EItemType } from '../interfaces/IItem'
import { GroundTurret } from '../buildings/GroundTurret'
import { Starport } from '../buildings/Starport'
import { OilDerrick } from '../buildings/OilDerrick'
import { type IServerGridPointData, type IServerOrder } from '../common'

export class Order extends Graphics {
  public item!: SelectableItem
  public buildSprite?: Sprite
  static options = {
    dash: 16,
    gap: 8,
    lineWidth: 1
  }

  constructor ({ item }: { item: SelectableItem }) {
    super()
    this.item = item
  }

  getLineColor (type: IOrder['type']): number {
    switch (type) {
      case 'move': case 'follow':
        return 0x00ff00
      case 'attack': case 'move-and-attack':
        return 0xff0000
      case 'patrol':
        return 0xffff00
      case 'guard':
        return 0x0000ff
      case 'build': case 'deploy':
        return 0xff00ff
      default:
        return 0xffffff
    }
  }

  getDestinationColor (type: IOrder['type']): number {
    switch (type) {
      case 'move': case 'move-and-attack': case 'follow':
        return 0x00ff00
      case 'attack':
        return 0xff0000
      case 'patrol':
        return 0x00ffff
      case 'guard':
        return 0x0000ff
      case 'build': case 'deploy':
        return 0xff00ff
      default:
        return 0xffffff
    }
  }

  getFromRadius (type: IOrder['type']): number {
    switch (type) {
      case 'patrol':
        return 3
      default:
        return 0
    }
  }

  getDestinationRadius (type: IOrder['type']): number {
    switch (type) {
      case 'attack': case 'guard': case 'follow':
        return 15
      case 'build': case 'deploy':
        return 0
      default:
        return 3
    }
  }

  drawOrder ({ selectedItem, tileMap }: { selectedItem: SelectableItem, tileMap: TileMap }): void {
    const selectedItemPosition = selectedItem.getCollisionPosition({ center: true })
    let from: { x: number, y: number } | undefined
    let to: { x: number, y: number } | undefined
    switch (selectedItem.order.type) {
      case 'move': case 'move-and-attack': case 'build': case 'deploy': {
        from = selectedItemPosition
        to = { x: selectedItem.order.toPoint.gridX * tileMap.gridSize, y: selectedItem.order.toPoint.gridY * tileMap.gridSize }
        break
      }
      case 'attack': case 'follow': case 'guard': {
        const toTarget = selectedItem.order.to
        if (toTarget?.isAlive()) {
          const toGrid = toTarget.getCollisionPosition({ center: true })
          from = selectedItemPosition
          to = toGrid
        }
        break
      }
      case 'patrol': {
        from = { x: selectedItem.order.fromPoint.gridX * tileMap.gridSize, y: selectedItem.order.fromPoint.gridY * tileMap.gridSize }
        to = { x: selectedItem.order.toPoint.gridX * tileMap.gridSize, y: selectedItem.order.toPoint.gridY * tileMap.gridSize }
        break
      }
    }
    if (this.buildSprite != null) {
      this.buildSprite.visible = false
    }

    if (from == null || to == null) {
      this.clear()
      return
    }
    const { type } = selectedItem.order

    const { dash, gap, lineWidth } = Order.options
    this.clear()
    this.lineStyle({
      width: lineWidth,
      color: this.getLineColor(type)
    })
    this.drawCircle(from.x, from.y, this.getFromRadius(type))

    const len = Math.hypot(to.x - from.x, to.y - from.y)
    const norm = { x: (to.x - from.x) / len, y: (to.y - from.y) / len }
    this.moveTo(from.x, from.y).lineTo(from.x + dash * norm.x, from.y + dash * norm.y)
    let progress = dash + gap
    while (progress < len) {
      this.moveTo(from.x + progress * norm.x, from.y + progress * norm.y)
      progress += dash
      if (progress > len) {
        progress = len
        this.lineTo(from.x + progress * norm.x, from.y + progress * norm.y)
      } else {
        this.lineTo(from.x + progress * norm.x, from.y + progress * norm.y)
        progress += gap
      }
    }
    this.lineStyle({
      width: lineWidth,
      color: this.getDestinationColor(type)
    })
    this.drawCircle(to.x, to.y, this.getDestinationRadius(type))
    this.endFill()
    this.alpha = 0.5
    this.drawOrderSprite({ selectedItem, tileMap, to })
  }

  drawOrderSprite ({ selectedItem, tileMap, to }: { selectedItem: SelectableItem, tileMap: TileMap, to: { x: number, y: number } }): void {
    let texture
    let offset = { x: 0, y: 0 }
    if (selectedItem.order.type === 'build') {
      if (selectedItem.order.name === EItemName.GroundTurret) {
        texture = selectedItem.team === Team.blue
          ? GroundTurret.blueTextures.downRightTextures[0]
          : GroundTurret.greenTextures.downRightTextures[0]
        offset = GroundTurret.collisionOptions.offset
      } else if (selectedItem.order.name === EItemName.Starport) {
        texture = selectedItem.team === Team.blue
          ? Starport.blueTextures.healthyTextures[0]
          : Starport.greenTextures.healthyTextures[0]
        offset = Starport.collisionOptions.offset
      }
    } else if (selectedItem.order.type === 'deploy') {
      texture = selectedItem.team === Team.blue
        ? OilDerrick.blueTextures.healthyTextures[0]
        : OilDerrick.greenTextures.healthyTextures[0]
      offset = OilDerrick.collisionOptions.offset
    }
    if (texture == null) {
      return
    }
    if (this.buildSprite == null) {
      this.buildSprite = new Sprite()
      this.addChild(this.buildSprite)
    }
    this.buildSprite.texture = texture
    this.buildSprite.position.set(
      Math.floor(to.x / tileMap.gridSize) * tileMap.gridSize - offset.x,
      Math.floor(to.y / tileMap.gridSize) * tileMap.gridSize - offset.y
    )
    this.buildSprite.visible = true
  }
}

export function castToServerOrder (order: IOrder): IServerOrder {
  switch (order.type) {
    case 'move': case 'patrol': case 'stand': case 'hunt': case 'deploy':
      return order
    case 'move-and-attack':
      return { type: order.type, toPoint: order.toPoint, nextOrder: order.nextOrder != null ? castToServerOrder(order.nextOrder) : undefined }
    case 'attack': case 'guard': case 'follow':
      return { type: order.type, toUid: order.to.uid, nextOrder: order.nextOrder != null ? castToServerOrder(order.nextOrder) : undefined }
    case 'fire':
      return { type: order.type, toUid: order.to.uid }
    case 'build':
      return { type: order.type, name: order.name as string, toPoint: order.toPoint }
    case 'construct-unit':
      return { type: order.type, name: order.name as string, unitOrder: order.unitOrder != null ? castToServerOrder(order.unitOrder) : undefined, unitUid: order.unitUid }
  }
}

function castToClientGridPointData (point: IServerGridPointData): IGridPointData {
  return { gridX: point.gridX, gridY: point.gridY, type: point.type as EItemType }
}

export function castToClientOrder (order: IServerOrder, find: (uid: number) => BaseActiveItem): IOrder {
  switch (order.type) {
    case 'move': case 'deploy':
      return { type: order.type, toPoint: castToClientGridPointData(order.toPoint) }
    case 'patrol':
      return { type: order.type, fromPoint: castToClientGridPointData(order.fromPoint), toPoint: castToClientGridPointData(order.toPoint) }
    case 'stand': case 'hunt':
      return order
    case 'move-and-attack':
      return { type: order.type, toPoint: castToClientGridPointData(order.toPoint), nextOrder: order.nextOrder != null ? castToClientOrder(order.nextOrder, find) : undefined }
    case 'attack': case 'guard': case 'follow':
      return { type: order.type, to: find(order.toUid), nextOrder: order.nextOrder != null ? castToClientOrder(order.nextOrder, find) : undefined }
    case 'fire':
      return { type: order.type, to: find(order.toUid) }
    case 'build':
      return { type: order.type, name: order.name as BuildName, toPoint: castToClientGridPointData(order.toPoint) }
    case 'construct-unit':
      return { type: order.type, name: order.name as UnitName, unitOrder: order.unitOrder != null ? castToClientOrder(order.unitOrder, find) : undefined, unitUid: order.unitUid }
  }
}
