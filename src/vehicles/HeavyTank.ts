import { type EVectorDirection } from '../Vector'
import { Team } from '../common'
import { BaseVehicle, type IBaseVehicleTextures } from './Vehicle'

export interface IHeavyTankOptions {
  uid?: number
  initX?: number
  initY?: number
  team: Team
  direction?: EVectorDirection
}

export class HeavyTank extends BaseVehicle {
  static blueTextures: IBaseVehicleTextures
  static greenTextures: IBaseVehicleTextures

  constructor (options: IHeavyTankOptions) {
    super({
      ...options,
      textures: options.team === Team.blue ? HeavyTank.blueTextures : HeavyTank.greenTextures
    })
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
