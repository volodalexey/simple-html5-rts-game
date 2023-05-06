import { type Graphics } from 'pixi.js'
import { type ISelectableLifeableItemOptions, SelectableLifeableRoundItem } from './SelectableLifeableItem'

export interface ITeleportableSelectableLifeableRoundItemOptions extends ISelectableLifeableItemOptions {
  teleport?: boolean
}

export class TeleportableSelectableLifeableRoundItem extends SelectableLifeableRoundItem {
  public teleportGraphics?: Graphics

  override handleUpdate (deltaMS: number): void {
    super.handleUpdate(deltaMS)
    if (this.teleportGraphics != null) {
      if (this.teleportGraphics.alpha > 0) {
        this.teleportGraphics.alpha -= 0.01
      } else {
        this.teleportGraphics.alpha = 0
        this.teleportGraphics.removeFromParent()
        this.teleportGraphics = undefined
      }
    }
  }

  drawTeleport (): void {
    const { offset, strokeWidth, radius } = this.drawSelectionOptions
    const { teleportGraphics } = this
    if (teleportGraphics != null) {
      teleportGraphics.position.set(offset.x, offset.y)
      const cx = radius + strokeWidth
      const cy = radius + strokeWidth
      teleportGraphics.beginFill(0xffffff)
      teleportGraphics.drawCircle(cx, cy, radius + strokeWidth)
      teleportGraphics.endFill()
    }
  }
}
