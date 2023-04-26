import { type Container } from 'pixi.js'
import { type Team } from '../common'

export interface ISelectable {
  team: Team
  selected: boolean
  selectable: boolean
  drawSelectionOptions: {
    width: number
    height: number
    radius: number
    strokeWidth: number
    strokeColor: number
    offset: {
      x: number
      y: number
    }
  }

  selectedGraphics: Container
  setSelected: (selected: boolean) => void
  getSelectionPosition: (options: { center?: boolean }) => { x: number, y: number }
  getSelectionBounds: () => { top: number, right: number, bottom: number, left: number }
}
