import { Team } from '../common'
import { BaseVehicle, type IBaseVehicleOptions, type IBaseVehicleTextures } from './BaseVehicle'

export type ITransportOptions = Pick<
IBaseVehicleOptions,
Exclude<keyof IBaseVehicleOptions, 'textures'>
>

export class Transport extends BaseVehicle {
  static blueTextures: IBaseVehicleTextures
  static greenTextures: IBaseVehicleTextures

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 15,
    lineWidth: 1,
    lineColor: 0xffd700,
    strokeWidth: 1,
    strokeColor: 0xffff00,
    offset: {
      x: 15,
      y: 15
    }
  }

  public radius = 15
  public speed = 15
  public sight = 3
  public cost = 400
  public hitPoints = 100
  public turnSpeed = 2

  constructor (options: ITransportOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? Transport.blueTextures : Transport.greenTextures
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
    Transport.blueTextures = blueTextures
    Transport.greenTextures = greenTextures
  }
}
