import { type Graphics } from 'pixi.js'
import { type Team } from '../common'

export interface ISelectable {
  team: Team
  selected: boolean
  selectable: boolean
  drawSelectionOptions: {
    width: number
    height: number
    radius: number
    lineWidth: number
    lineColor: number
    strokeWidth: number
    strokeColor: number
    offset: {
      x: number
      y: number
    }
  }

  selectedGraphics: Graphics

  setSelected: (selected: boolean) => void
}