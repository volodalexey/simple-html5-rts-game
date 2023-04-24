import { type Texture } from 'pixi.js'
import { Team } from '../common'
import { BaseBuilding, type IBaseBuildingOptions, type IBaseBuildingTextures } from './BaseBuilding'

export type IBaseOptions = Pick<
IBaseBuildingOptions,
Exclude<keyof IBaseBuildingOptions, 'textures'>
>

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
    width: 44,
    height: 44,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0xffffff,
    offset: {
      x: -2,
      y: 18
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 40,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 1,
      y: -4
    }
  }

  public hitPoints = 500
  public life = this.hitPoints

  public buildableGrid = [
    [1, 1],
    [1, 1]
  ]

  public passableGrid = [
    [1, 1],
    [1, 1]
  ]

  constructor (options: IBaseOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? Base.blueTextures : Base.greenTextures
    })
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.updateAnimation()

    this.checkDrawBuildingBounds()
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
