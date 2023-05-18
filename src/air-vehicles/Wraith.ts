import { Team } from '../utils/helpers'
import { EItemName, type ProjectileName } from '../interfaces/IItem'
import { type IAirVehicleOptions, type IAirVehicleTextures } from './AirVehicle'
import { AttackableAirVehicle } from './AttackableAirVehicle'

export type IWraithOptions = Pick<
IAirVehicleOptions,
Exclude<keyof IAirVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class Wraith extends AttackableAirVehicle {
  public itemName = EItemName.Wraith
  static blueTextures: IAirVehicleTextures
  static greenTextures: IAirVehicleTextures
  static shadowTextures: IAirVehicleTextures
  static textures (team: Team): { body: IAirVehicleTextures, shadow: IAirVehicleTextures } {
    return {
      body: team === Team.blue ? Wraith.blueTextures : Wraith.greenTextures,
      shadow: Wraith.shadowTextures
    }
  }

  static prepareTextures ({
    blueTextures,
    greenTextures,
    shadowTextures
  }: {
    blueTextures: IAirVehicleTextures
    greenTextures: IAirVehicleTextures
    shadowTextures: IAirVehicleTextures
  }): void {
    Wraith.blueTextures = blueTextures
    Wraith.greenTextures = greenTextures
    Wraith.shadowTextures = shadowTextures
  }

  public collisionOptions = {
    width: 24,
    height: 24,
    offset: {
      x: 3,
      y: 3
    }
  }

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 14,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -1,
      y: -1
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 24,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 3,
      y: -8
    }
  }

  public drawReloadBarOptions = {
    alpha: 1,
    width: 24,
    height: 2,
    fillColor: 0xc1a517,
    offset: {
      x: 3,
      y: -3
    }
  }

  public drawShadowOptions = {
    offset: {
      x: 0,
      y: 40
    }
  }

  public collisionRadius = 12
  public sightRadius = 12
  public attackRadius = 5
  public speed = 40
  static cost = 200
  public hitPoints = 50
  public turnSpeed = 4
  public turnFactor = 10
  public projectile: ProjectileName = EItemName.Laser
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = true

  constructor (options: IWraithOptions) {
    super({
      ...options,
      textures: Wraith.textures(options.team)
    })
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x40bf40
    this.setupShadow()
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
