import { Graphics } from 'pixi.js'
import { type SelectableItem } from './common'
import { type IOrder } from './interfaces/IOrder'
import { type TileMap } from './TileMap'

export class Order extends Graphics {
  public item!: SelectableItem
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
      case 'move':
        return 0x00ff00
      case 'attack':
        return 0xff0000
      case 'patrol':
        return 0xffff00
      case 'guard':
        return 0x0000ff
      case 'deploy':
        return 0xff00ff
      default:
        return 0xffffff
    }
  }

  getDestinationColor (type: IOrder['type']): number {
    switch (type) {
      case 'move':
        return 0x00ff00
      case 'attack':
        return 0xff0000
      case 'patrol':
        return 0x00ffff
      case 'guard':
        return 0x0000ff
      case 'deploy':
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
      case 'attack': case 'guard':
        return 15
      default:
        return 3
    }
  }

  drawOrderLine ({ selectedItem, tileMap }: { selectedItem: SelectableItem, tileMap: TileMap }): void {
    const selectedItemPosition = selectedItem.getCollisionPosition({ center: true })
    let from: { x: number, y: number } | undefined
    let to: { x: number, y: number } | undefined
    switch (selectedItem.orders.type) {
      case 'move': {
        from = selectedItemPosition
        to = { x: selectedItem.orders.toPoint.gridX * tileMap.gridSize, y: selectedItem.orders.toPoint.gridY * tileMap.gridSize }
        break
      }
      case 'attack': case 'guard': {
        const toTarget = selectedItem.orders.toUid != null ? tileMap.getItemByUid(selectedItem.orders.toUid) : selectedItem.orders.to
        if (toTarget != null) {
          const toGrid = toTarget.getCollisionPosition({ center: true })
          from = selectedItemPosition
          to = toGrid
        }
        break
      }
      case 'patrol': {
        from = { x: selectedItem.orders.fromPoint.gridX * tileMap.gridSize, y: selectedItem.orders.fromPoint.gridY * tileMap.gridSize }
        to = { x: selectedItem.orders.toPoint.gridX * tileMap.gridSize, y: selectedItem.orders.toPoint.gridY * tileMap.gridSize }
        break
      }
      case 'deploy': {
        from = selectedItemPosition
        to = { x: selectedItem.orders.toPoint.gridX * tileMap.gridSize, y: selectedItem.orders.toPoint.gridY * tileMap.gridSize }
        break
      }
    }

    if (from == null || to == null) {
      this.clear()
      return
    }
    const { type } = selectedItem.orders

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
  }
}
