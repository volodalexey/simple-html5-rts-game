import { Team } from '../common'
import { EItemName } from '../interfaces/IItem'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type ITransportOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class Transport extends Vehicle {
  public itemName = EItemName.Transport
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures
  static textures (team: Team): IVehicleTextures {
    return team === Team.blue ? Transport.blueTextures : Transport.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IVehicleTextures
    greenTextures: IVehicleTextures
  }): void {
    Transport.blueTextures = blueTextures
    Transport.greenTextures = greenTextures
  }

  public collisionOptions = {
    width: 30,
    height: 30,
    offset: {
      x: 0,
      y: 0
    }
  }

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
  static cost = 400
  public hitPoints = 100
  public turnSpeed = 2
  public turnFactor = 20

  constructor (options: ITransportOptions) {
    super({
      ...options,
      textures: Transport.textures(options.team)
    })
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x40bf40
    this.drawSelection()
    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: options.initCenter })
    this.drawLifeBar()
    this.updateLife()
    this.updateAnimation()
    if (options.teleport === true) {
      this.drawTeleport()
    }
  }
}
