import { Team } from '../common'
import { EItemName, type ProjectileName } from '../interfaces/IItem'
import { type IAirVehicleOptions, type IAirVehicleTextures } from './AirVehicle'
import { AttackableAirVehicle } from './AttackableAirVehicle'

export type IChopperOptions = Pick<
IAirVehicleOptions,
Exclude<keyof IAirVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class Chopper extends AttackableAirVehicle {
  public itemName = EItemName.Chopper
  static blueTextures: IAirVehicleTextures
  static greenTextures: IAirVehicleTextures
  static shadowTextures: IAirVehicleTextures
  static textures (team: Team): { body: IAirVehicleTextures, shadow: IAirVehicleTextures } {
    return {
      body: team === Team.blue ? Chopper.blueTextures : Chopper.greenTextures,
      shadow: Chopper.shadowTextures
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
    Chopper.blueTextures = blueTextures
    Chopper.greenTextures = greenTextures
    Chopper.shadowTextures = shadowTextures
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
      y: -8
    }
  }

  public drawReloadBarOptions = {
    alpha: 1,
    width: 26,
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

  public radius = 18
  public speed = 25
  public sight = 6
  static cost = 900
  public hitPoints = 50
  public turnSpeed = 4
  public projectile: ProjectileName = EItemName.Rocket
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false

  constructor (options: IChopperOptions) {
    super({
      ...options,
      textures: Chopper.textures(options.team)
    })
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
