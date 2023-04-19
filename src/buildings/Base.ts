import { type Texture } from 'pixi.js'
import { Team } from '../common'
import { BaseBuilding, type IBaseBuildingTextures } from './BaseBuilding'

export interface IBaseOptions {
  uid?: number
  initX?: number
  initY?: number
  team: Team
}

export class Base extends BaseBuilding {
  static blueTextures: {
    healthyTextures: Texture[]
    damagedTextures: Texture[]
    constructingTextures: Texture[]
  }

  static greenTextures: {
    healthyTextures: Texture[]
    damagedTextures: Texture[]
    constructingTextures: Texture[]
  }

  public drawSelectionOptions = {
    width: 41,
    height: 41,
    radius: 0,
    lineWidth: 1,
    lineColor: 0xffd700,
    strokeWidth: 1,
    strokeColor: 0xffff00,
    offset: {
      x: 0,
      y: 19
    }
  }

  constructor (options: IBaseOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? Base.blueTextures : Base.greenTextures
    })

    this.drawSelection()
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IBaseBuildingTextures
    greenTextures: IBaseBuildingTextures
  }): void {
    Base.blueTextures = blueTextures
    Base.greenTextures = greenTextures
  }
}
