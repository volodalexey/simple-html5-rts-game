import { Team } from '../common'
import { EItemName, type ProjectileName } from '../interfaces/IItem'
import { AttackableVehicle } from './AttackableVehicle'
import { type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IHeavyTankOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class HeavyTank extends AttackableVehicle {
  public itemName = EItemName.HeavyTank
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures
  static textures (team: Team): IVehicleTextures {
    return team === Team.blue ? HeavyTank.blueTextures : HeavyTank.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IVehicleTextures
    greenTextures: IVehicleTextures
  }): void {
    HeavyTank.blueTextures = blueTextures
    HeavyTank.greenTextures = greenTextures
  }

  public collisionOptions = {
    width: 26,
    height: 26,
    offset: {
      x: 3,
      y: 3
    }
  }

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 13,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 1,
      y: 1
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 26,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 3,
      y: -7
    }
  }

  public drawReloadBarOptions = {
    alpha: 1,
    width: 26,
    height: 2,
    fillColor: 0xc1a517,
    offset: {
      x: 3,
      y: -2
    }
  }

  public collisionRadius = 13
  public sightRadius = 10
  public attackRadius = 9
  public speed = 15
  static cost = 120
  public hitPoints = 50
  public turnSpeed = 4
  public turnFactor = 10
  public projectile: ProjectileName = EItemName.CannonBall
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false

  constructor (options: IHeavyTankOptions) {
    super({
      ...options,
      textures: HeavyTank.textures(options.team)
    })
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x40bf40
    this.drawSelection()
    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: options.initCenter })
    this.drawLifeBar()
    this.updateLife()
    this.drawReloadBar()
    this.updateReload()
    this.updateAnimation()
    if (options.teleport === true) {
      this.drawTeleport()
    }
  }
}
