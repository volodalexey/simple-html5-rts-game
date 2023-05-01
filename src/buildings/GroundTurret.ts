import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { type IBuildable } from '../interfaces/IBuildable'
import { type IAttackable } from '../interfaces/IAttackable'

export type IGroundTurretOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
>

export interface IGroundTurretTextures extends IBuildingTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
  teleportTextures: Texture[]
}

export class GroundTurret extends Building implements IBuildable, IAttackable {
  static blueTextures: IGroundTurretTextures
  static greenTextures: IGroundTurretTextures
  static textures (team: Team): IGroundTurretTextures {
    return team === Team.blue ? GroundTurret.blueTextures : GroundTurret.greenTextures
  }

  public drawSelectionOptions = {
    width: 26,
    height: 23,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 6,
      y: 9
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 22,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 8,
      y: -4
    }
  }

  public sight = 10
  public cost = 1500
  public hitPoints = 200
  public life = this.hitPoints
  public teleportingAnimationSpeed = 0.1
  public teleportingAnimation!: AnimatedSprite

  public buildableGrid = [
    [1]
  ]

  public passableGrid = [
    [1]
  ]

  constructor (options: IGroundTurretOptions) {
    super({
      ...options,
      textures: GroundTurret.textures(options.team)
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
    const { teleportTextures } = GroundTurret.textures(this.team)
    const teleportingAnimation = new AnimatedSprite(teleportTextures)
    teleportingAnimation.animationSpeed = this.teleportingAnimationSpeed
    this.spritesContainer.addChild(teleportingAnimation)
    this.teleportingAnimation = teleportingAnimation
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IGroundTurretTextures
    greenTextures: IGroundTurretTextures
  }): void {
    GroundTurret.blueTextures = blueTextures
    GroundTurret.greenTextures = greenTextures
  }
}
