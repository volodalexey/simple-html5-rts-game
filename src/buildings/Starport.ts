import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { type IBuildable } from '../interfaces/IBuildable'

export type IStarportOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
>

export interface IStarportTextures extends IBuildingTextures {
  teleportTextures: Texture[]
  closingTextures: Texture[]
}

export class Starport extends Building implements IBuildable {
  static blueTextures: IStarportTextures
  static greenTextures: IStarportTextures
  static textures (team: Team): IStarportTextures {
    return team === Team.blue ? Starport.blueTextures : Starport.greenTextures
  }

  public drawSelectionOptions = {
    width: 42,
    height: 58,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -1,
      y: 3
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 38,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 1,
      y: -4
    }
  }

  public sight = 3
  public cost = 2000
  public hitPoints = 300
  public life = this.hitPoints
  public teleportingAnimationSpeed = 0.1
  public teleportingAnimation!: AnimatedSprite
  public closingAnimationSpeed = 0.1
  public closingAnimation!: AnimatedSprite

  public buildableGrid = [
    [1, 1],
    [1, 1],
    [1, 1]
  ]

  public passableGrid = [
    [1, 1],
    [0, 0],
    [0, 0]
  ]

  constructor (options: IStarportOptions) {
    super({
      ...options,
      textures: Starport.textures(options.team)
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
    const { teleportTextures, closingTextures } = Starport.textures(this.team)
    const teleportingAnimation = new AnimatedSprite(teleportTextures)
    teleportingAnimation.animationSpeed = this.teleportingAnimationSpeed
    this.spritesContainer.addChild(teleportingAnimation)
    this.teleportingAnimation = teleportingAnimation

    const closingAnimation = new AnimatedSprite(closingTextures)
    closingAnimation.animationSpeed = this.closingAnimationSpeed
    this.spritesContainer.addChild(closingAnimation)
    this.closingAnimation = closingAnimation
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IStarportTextures
    greenTextures: IStarportTextures
  }): void {
    Starport.blueTextures = blueTextures
    Starport.greenTextures = greenTextures
  }
}
