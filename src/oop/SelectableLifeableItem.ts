import { Graphics } from 'pixi.js'
import { type ILifeableItemOptions, LifeableItem } from './LifeableItem'
import { type Team } from '../utils/common'
import { type ISelectable } from '../interfaces/ISelectable'

export interface ISelectableLifeableItemOptions extends ILifeableItemOptions {
  team: Team
  selectable?: boolean
}

class SelectableLifeableItem extends LifeableItem implements ISelectable {
  public selectedGraphics = new Graphics()
  public selected = false
  public selectable = true
  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 0,
    strokeWidth: 0,
    strokeColor: 0,
    strokeSecondColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public team: Team

  constructor (options: ISelectableLifeableItemOptions) {
    super(options)
    this.team = options.team
    if (typeof options.selectable === 'boolean') {
      this.selectable = options.selectable
    }
  }

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  drawSelection (): void {}

  override removeAndDestroy (): void {
    super.removeAndDestroy()
    const isItemSelected = this.game.isItemSelected(this)
    this.game.deselectItem(this)
    if (isItemSelected) {
      this.game.sideBar.handleSelectedItems(this.game.selectedItems)
    }
  }
}

export class SelectableLifeableRoundItem extends SelectableLifeableItem {
  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, strokeSecondColor, radius } = this.drawSelectionOptions
    const { selectedGraphics } = this
    selectedGraphics.position.set(offset.x, offset.y)
    const segmentsCount = 8
    const segment = Math.PI * 2 / segmentsCount
    const cx = radius + strokeWidth
    const cy = radius + strokeWidth
    for (let i = 0; i < segmentsCount; i++) {
      selectedGraphics.beginFill(i % 2 === 0 ? strokeColor : strokeSecondColor)
      const angleStart = segment * i
      const angleEnd = segment * (i + 1)
      const radiusStroke = radius + strokeWidth
      selectedGraphics.moveTo(cx + radius * Math.cos(angleStart), cy + radius * Math.sin(angleStart))
      selectedGraphics.lineTo(cx + radiusStroke * Math.cos(angleStart), cy + radiusStroke * Math.sin(angleStart))
      selectedGraphics.arc(cx, cy, radiusStroke, angleStart, angleEnd)
      selectedGraphics.lineTo(cx + radius * Math.cos(angleEnd), cy + radius * Math.sin(angleEnd))
      selectedGraphics.arc(cx, cy, radius, angleEnd, angleStart, true)
      selectedGraphics.endFill()
    }
    selectedGraphics.alpha = 0
  }
}

export class SelectableLifeableSquareItem extends SelectableLifeableItem {
  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, strokeSecondColor, width, height } = this.drawSelectionOptions
    const { selectedGraphics } = this
    selectedGraphics.position.set(offset.x, offset.y)
    const halfWidth = width / 2
    const halfHeight = height / 2
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(0, 0, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(halfWidth, 0, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(width - strokeWidth, 0, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(width - strokeWidth, halfHeight, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(halfWidth, height - strokeWidth, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(0, height - strokeWidth, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(0, halfHeight, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(0, 0, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.alpha = 0
  }

  override removeAndDestroy (): void {
    super.removeAndDestroy()
    this.game.tileMap.rebuildPassableRequired = true
  }
}
