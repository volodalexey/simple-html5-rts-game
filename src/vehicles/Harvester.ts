import { Team } from '../common'
import { BaseVehicle, type IBaseVehicleOptions, type IBaseVehicleTextures } from './BaseVehicle'

export type IHarvesterOptions = Pick<
IBaseVehicleOptions,
Exclude<keyof IBaseVehicleOptions, 'textures'>
>

export class Harvester extends BaseVehicle {
  static blueTextures: IBaseVehicleTextures
  static greenTextures: IBaseVehicleTextures

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 11,
    lineWidth: 1,
    lineColor: 0xffd700,
    strokeWidth: 1,
    strokeColor: 0xffff00,
    offset: {
      x: 11,
      y: 10
    }
  }

  public radius = 10
  public speed = 10
  public sight = 3
  public cost = 1600
  public hitPoints = 50
  public turnSpeed = 2

  constructor (options: IHarvesterOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? Harvester.blueTextures : Harvester.greenTextures
    })
    this.life = options.life ?? this.hitPoints
    this.drawSelection()
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IBaseVehicleTextures
    greenTextures: IBaseVehicleTextures
  }): void {
    Harvester.blueTextures = blueTextures
    Harvester.greenTextures = greenTextures
  }
}
