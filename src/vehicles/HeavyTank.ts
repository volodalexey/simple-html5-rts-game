import { Team } from '../common'
import { BaseVehicle, type IBaseVehicleOptions, type IBaseVehicleTextures } from './BaseVehicle'

export type IHeavyTankOptions = Pick<
IBaseVehicleOptions,
Exclude<keyof IBaseVehicleOptions, 'textures'>
>

export class HeavyTank extends BaseVehicle {
  static blueTextures: IBaseVehicleTextures
  static greenTextures: IBaseVehicleTextures

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 13,
    lineWidth: 1,
    lineColor: 0xffd700,
    strokeWidth: 1,
    strokeColor: 0xffff00,
    offset: {
      x: 15,
      y: 15
    }
  }

  public radius = 13
  public speed = 15
  public sight = 5
  public cost = 1200
  public hitPoints = 50
  public turnSpeed = 4

  constructor (options: IHeavyTankOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? HeavyTank.blueTextures : HeavyTank.greenTextures
    })

    this.drawSelection()
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IBaseVehicleTextures
    greenTextures: IBaseVehicleTextures
  }): void {
    HeavyTank.blueTextures = blueTextures
    HeavyTank.greenTextures = greenTextures
  }
}
