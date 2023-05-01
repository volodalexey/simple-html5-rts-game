import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { type IBuildable } from '../interfaces/IBuildable'

export type IOilDerrickOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
>

export interface IOilDerrickTextures extends IBuildingTextures {
  deployTextures: Texture[]
}

export class OilDerrick extends Building implements IBuildable {
  static blueTextures: IOilDerrickTextures
  static greenTextures: IOilDerrickTextures
  static textures (team: Team): IOilDerrickTextures {
    return team === Team.blue ? OilDerrick.blueTextures : OilDerrick.greenTextures
  }

  public drawSelectionOptions = {
    width: 40,
    height: 20,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -2,
      y: 5
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

  public sight = 3
  public cost = 5000
  public hitPoints = 300
  public life = this.hitPoints
  public deployAnimationSpeed = 0.1
  public deployAnimation!: AnimatedSprite

  public buildableGrid = [
    [1, 1]
  ]

  public passableGrid = [
    [1, 1]
  ]

  constructor (options: IOilDerrickOptions) {
    super({
      ...options,
      textures: OilDerrick.textures(options.team)
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
    const { deployTextures } = OilDerrick.textures(this.team)
    const deployAnimation = new AnimatedSprite(deployTextures)
    deployAnimation.animationSpeed = this.deployAnimationSpeed
    this.spritesContainer.addChild(deployAnimation)
    this.deployAnimation = deployAnimation
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IOilDerrickTextures
    greenTextures: IOilDerrickTextures
  }): void {
    OilDerrick.blueTextures = blueTextures
    OilDerrick.greenTextures = greenTextures
  }
}
