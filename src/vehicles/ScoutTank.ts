import { Team } from '../common'
import { BaseVehicle, type IBaseVehicleOptions, type IBaseVehicleTextures } from './BaseVehicle'

export type IScoutTankOptions = Pick<
IBaseVehicleOptions,
Exclude<keyof IBaseVehicleOptions, 'textures'>
>

export class ScoutTank extends BaseVehicle {
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

  constructor (options: IScoutTankOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? ScoutTank.blueTextures : ScoutTank.greenTextures
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
    ScoutTank.blueTextures = blueTextures
    ScoutTank.greenTextures = greenTextures
  }
}
