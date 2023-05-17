import { Team } from '../utils/helpers'
import { EItemName, type ProjectileName } from '../interfaces/IItem'
import { AttackableVehicle } from './AttackableVehicle'
import { type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IScoutTankOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class ScoutTank extends AttackableVehicle {
  public itemName = EItemName.ScoutTank
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures
  static textures (team: Team): IVehicleTextures {
    return team === Team.blue ? ScoutTank.blueTextures : ScoutTank.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IVehicleTextures
    greenTextures: IVehicleTextures
  }): void {
    ScoutTank.blueTextures = blueTextures
    ScoutTank.greenTextures = greenTextures
  }

  public collisionOptions = {
    width: 22,
    height: 22,
    offset: {
      x: 0,
      y: 0
    }
  }

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 11,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -2,
      y: -2
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
      x: 0,
      y: -9
    }
  }

  public drawReloadBarOptions = {
    alpha: 1,
    width: 22,
    height: 2,
    fillColor: 0xc1a517,
    offset: {
      x: 0,
      y: -4
    }
  }

  public collisionRadius = 11
  public sightRadius = 8
  public attackRadius = 4
  public speed = 20
  static cost = 60
  public hitPoints = 50
  public turnSpeed = 4
  public turnFactor = 10
  public projectile: ProjectileName = EItemName.Bullet
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = true

  constructor (options: IScoutTankOptions) {
    super({
      ...options,
      textures: ScoutTank.textures(options.team)
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
