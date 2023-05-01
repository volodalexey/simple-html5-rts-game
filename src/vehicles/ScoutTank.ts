import { Team } from '../common'
import { Bullet } from '../projectiles/Bullet'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IScoutTankOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
>

export class ScoutTank extends Vehicle {
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures

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
      y: -7
    }
  }

  public radius = 11
  public speed = 20
  public sight = 4
  public cost = 500
  public hitPoints = 50
  public turnSpeed = 4
  public Projectile = Bullet
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false

  constructor (options: IScoutTankOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? ScoutTank.blueTextures : ScoutTank.greenTextures
    })
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x40bf40
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.updateAnimation()

    this.checkDrawVehicleBounds()
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
}
