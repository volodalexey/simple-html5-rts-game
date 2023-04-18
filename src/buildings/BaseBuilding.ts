import { Container } from 'pixi.js'
import { type Team } from '../common'

export interface IBaseBuildingOptions {
  uid?: number
  initX?: number
  initY?: number
  team: Team
}

export class BaseBuilding extends Container {
  public buildableGrid = [
    [1, 1],
    [1, 1]
  ]

  public passableGrid = [
    [1, 1],
    [1, 1]
  ]

  public sight = 3
  public hitPoints = 500
  public cost = 5000
  public life = 100

  public uid?: number
  public team!: Team

  constructor (options: IBaseBuildingOptions) {
    super()
    this.uid = options.uid
    this.team = options.team
    if (options.initX != null) {
      this.position.x = options.initX
    }
    if (options.initY != null) {
      this.position.y = options.initY
    }
  }
}

export enum BaseAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  constructing = 'constructing',
}
