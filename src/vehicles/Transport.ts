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
    strokeWidth: 2,
    strokeColor: 0xffff00,
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
    width: 30,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 0,
      y: -7
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
    blueTextures: IBaseVehicleTextures
    greenTextures: IBaseVehicleTextures
  }): void {
    Transport.blueTextures = blueTextures
    Transport.greenTextures = greenTextures
  }
}
