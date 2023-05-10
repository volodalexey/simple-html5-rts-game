import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../utils/common'
import { type IOrder } from '../interfaces/IOrder'
import { type IAttackableBuildingTextures, type IAttackableBuildingOptions, AttackableBuilding } from './AttackableBuilding'
import { EItemName, type ProjectileName } from '../interfaces/IItem'
import { BuildingAnimation } from './Building'

export type IGroundTurretOptions = Pick<
IAttackableBuildingOptions,
Exclude<keyof IAttackableBuildingOptions, 'textures'>
> & {
  teleport?: boolean
}

export interface IGroundTurretTextures extends IAttackableBuildingTextures {
  teleportTextures: Texture[]
}

export enum GroundTurretAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  teleport = 'teleport',
}

export class GroundTurret extends AttackableBuilding {
  public itemName = EItemName.GroundTurret
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

  static collisionOptions = {
    width: 22,
    height: 19,
    offset: {
      x: 8,
      y: 11
    }
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

  public collisionRadius = 10
  public sightRadius = 11
  public attackRadius = 10
  static cost = 150
  public hitPoints = 200
  public life = this.hitPoints
  public teleportAnimationSpeed = 0.1
  public teleportAnimation!: AnimatedSprite
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false
  public turnSpeed = 4
  public projectile: ProjectileName = EItemName.CannonBall
  public order: IOrder = { type: 'stand' }

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
    this.collisionOptions = GroundTurret.collisionOptions
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.buildableGrid = GroundTurret.buildableGrid
    this.passableGrid = GroundTurret.passableGrid
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.drawReloadBar()
    this.updateReload()

    this.teleportAnimation.animationSpeed = this.teleportAnimationSpeed
    if (options.teleport === true) {
      this.switchAnimation(GroundTurretAnimation.teleport)
    } else {
      this.updateAnimation()
    }
  }

  override setup (options: IGroundTurretOptions): void {
    const textures = GroundTurret.textures(options.team)
    super.setup({
      ...options,
      textures
    })

    const teleportAnimation = new AnimatedSprite(textures.teleportTextures)
    this.spritesContainer.addChild(teleportAnimation)
    this.teleportAnimation = teleportAnimation
  }

  isTeleporting (): boolean {
    return this.currentAnimation === this.teleportAnimation
  }

  override updateAnimation (): void {
    if (this.isHealthy()) {
      if (this.isTeleporting()) {
        if (this.teleportAnimation.currentFrame === this.teleportAnimation.totalFrames - 1) {
          this.switchAnimation(GroundTurretAnimation.healthy)
        }
      } else {
        this.switchAnimation(GroundTurretAnimation.healthy)
      }
    } else if (this.isAlive()) {
      this.switchAnimation(GroundTurretAnimation.damaged)
    }
  }

  override switchAnimation <T>(animationName: T): void {
    let newAnimation
    switch (animationName) {
      case GroundTurretAnimation.teleport:
        newAnimation = this.teleportAnimation
        break
    }
    if (newAnimation == null) {
      if (animationName === GroundTurretAnimation.healthy) {
        super.switchAnimation(BuildingAnimation.healthy)
      } else {
        super.switchAnimation(BuildingAnimation.damaged)
      }
      return
    }
    if (newAnimation === this.currentAnimation || newAnimation == null) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }
}
