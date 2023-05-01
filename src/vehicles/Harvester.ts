import { Team } from '../common'
import { Bullet } from '../projectiles/Bullet'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IHarvesterOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
>

export class Harvester extends Vehicle {
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 10,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -1,
      y: -2
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 20,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 1,
      y: -7
    }
  }

  public radius = 10
  public speed = 10
  public sight = 3
  public cost = 1600
  public hitPoints = 50
  public turnSpeed = 2
  public Projectile = Bullet

  constructor (options: IHarvesterOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? Harvester.blueTextures : Harvester.greenTextures
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
    Harvester.blueTextures = blueTextures
    Harvester.greenTextures = greenTextures
  }
}
