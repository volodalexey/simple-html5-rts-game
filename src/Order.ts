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
      default:
        return 0xffffff
    }
  }

  getDestinationRadius (type: IOrder['type']): number {
    switch (type) {
      case 'attack':
        return 15
      default:
        return 3
    }
  }

  drawOrderLine ({ selectedItem, tileMap }: { selectedItem: SelectableItem, tileMap: TileMap }): void {
    const selectedItemPosition = selectedItem.getSelectionPosition({ center: true })
    let from: { x: number, y: number } | undefined
    let to: { x: number, y: number } | undefined
    switch (selectedItem.orders.type) {
      case 'move': {
        from = selectedItemPosition
        to = { x: selectedItem.orders.to.gridX * tileMap.gridSize, y: selectedItem.orders.to.gridY * tileMap.gridSize }
        break
      }
      case 'attack': {
        const toTarget = selectedItem.orders.toUid != null ? tileMap.getItemByUid(selectedItem.orders.toUid) : selectedItem.orders.to
        if (toTarget != null) {
          const toGrid = toTarget.getSelectionPosition({ center: true })
          from = selectedItemPosition
          to = toGrid
        }
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
    this.drawCircle(to.x, to.y, this.getDestinationRadius(type))
    this.endFill()
    this.alpha = 0.5
  }
}
