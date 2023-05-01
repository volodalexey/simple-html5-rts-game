import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'

export type IBaseOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
>

export interface IBaseTextures extends IBuildingTextures {
  constructingTextures: Texture[]
}

export class Base extends Building {
  static blueTextures: IBaseTextures
  static greenTextures: IBaseTextures
  static textures (team: Team): IBaseTextures {
    return team === Team.blue ? Base.blueTextures : Base.greenTextures
  }

  public drawSelectionOptions = {
    width: 44,
    height: 44,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
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
      x: 0,
      y: -4
    }
  }

  public sight = 4
  public hitPoints = 500
  public life = this.hitPoints
  public constructingAnimationSpeed = 0.1
  public constructingAnimation!: AnimatedSprite

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
      textures: Base.textures(options.team)
    })
    this.setupChild()
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.updateAnimation()

    this.checkDrawBuildingBounds()
  }

  setupChild (): void {
    const { constructingTextures } = Base.textures(this.team)
    const constructingAnimation = new AnimatedSprite(constructingTextures)
    constructingAnimation.animationSpeed = this.constructingAnimationSpeed
    this.spritesContainer.addChild(constructingAnimation)
    this.constructingAnimation = constructingAnimation
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IBaseTextures
    greenTextures: IBaseTextures
  }): void {
    Base.blueTextures = blueTextures
    Base.greenTextures = greenTextures
  }
}
