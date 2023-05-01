import { Team } from '../common'
import { CannonBall } from '../projectiles/CannonBall'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IHeavyTankOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
>

export class HeavyTank extends Vehicle {
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures

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
      y: -6
    }
  }

  public radius = 13
  public speed = 15
  public sight = 10
  public cost = 1200
  public hitPoints = 50
  public turnSpeed = 4
  public Projectile = CannonBall
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false

  constructor (options: IHeavyTankOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? HeavyTank.blueTextures : HeavyTank.greenTextures
    })
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x40bf40
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()

    this.checkDrawVehicleBounds()
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
}
