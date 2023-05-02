import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { type IBuildable } from '../interfaces/IBuildable'
import { CannonBall } from '../projectiles/CannonBall'
import { type IOrder } from '../interfaces/IOrder'
import { type IAttackableBuildingTextures, type IAttackableBuildingOptions, AttackableBuilding } from './AttackableBuilding'

export type IGroundTurretOptions = Pick<
IAttackableBuildingOptions,
Exclude<keyof IAttackableBuildingOptions, 'textures'>
>

export interface IGroundTurretTextures extends IAttackableBuildingTextures {
  teleportTextures: Texture[]
}

export enum GroundTurretAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  teleport = 'teleport',
}

export class GroundTurret extends AttackableBuilding implements IBuildable {
  static blueTextures: IGroundTurretTextures
  static greenTextures: IGroundTurretTextures
  static textures (team: Team): IGroundTurretTextures {
    return team === Team.blue ? GroundTurret.blueTextures : GroundTurret.greenTextures
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
      y: -2
    }
  }

  public drawReloadBarOptions = {
    alpha: 1,
    width: 22,
    height: 2,
    fillColor: 0xc1a517,
    offset: {
      x: 8,
      y: 3
    }
  }

  public sight = 10
  public cost = 1500
  public hitPoints = 200
  public life = this.hitPoints
  public teleportingAnimationSpeed = 0.1
  public teleportingAnimation!: AnimatedSprite

  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false
  public turnSpeed = 4
  public Projectile = CannonBall
  public orders: IOrder = { type: 'sentry' }

  static buildableGrid = [
    [1]
  ]

  static passableGrid = [
    [1]
  ]

  constructor (options: IGroundTurretOptions) {
    super({
      ...options,
      textures: GroundTurret.textures(options.team)
    })
    this.buildableGrid = GroundTurret.buildableGrid
    this.passableGrid = GroundTurret.passableGrid
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.drawReloadBar()
    this.updateReload()
    this.updateAnimation()

    this.checkDrawBuildingBounds()
  }

  setup (options: IGroundTurretOptions): void {
    const textures = GroundTurret.textures(options.team)
    super.setup({
      ...options,
      textures
    })

    const teleportingAnimation = new AnimatedSprite(textures.teleportTextures)
    teleportingAnimation.animationSpeed = this.teleportingAnimationSpeed
    this.spritesContainer.addChild(teleportingAnimation)
    this.teleportingAnimation = teleportingAnimation
  }
}
