import { Team } from '../common'
import { EItemName } from '../interfaces/IItem'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type ISCVOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class SCV extends Vehicle {
  public itemName = EItemName.SCV
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures
  static textures (team: Team): IVehicleTextures {
    return team === Team.blue ? SCV.blueTextures : SCV.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IVehicleTextures
    greenTextures: IVehicleTextures
  }): void {
    SCV.blueTextures = blueTextures
    SCV.greenTextures = greenTextures
  }

  public collisionOptions = {
    width: 18,
    height: 18,
    offset: {
      x: 6,
      y: 6
    }
  }

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 10,
    strokeWidth: 2,
    strokeColor: 0xffff00,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 3,
      y: 3
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 18,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 6,
      y: -2
    }
  }

  public radius = 15
  public speed = 15
  public sight = 3
  static cost = 400
  public hitPoints = 100
  public turnSpeed = 2

  constructor (options: ISCVOptions) {
    super({
      ...options,
      textures: SCV.textures(options.team)
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
