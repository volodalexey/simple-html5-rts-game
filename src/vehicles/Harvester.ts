import { AUDIO } from '../audio'
import { OilDerrick } from '../buildings/OilDerrick'
import { ECommandName } from '../Command'
import { wrapDirection, Team, angleDiff } from '../common'
import { EItemName, EItemType } from '../interfaces/IItem'
import { EVectorDirection } from '../Vector'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

export type IHarvesterOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class Harvester extends Vehicle {
  public itemName = EItemName.Harvester
  public commands = [ECommandName.moveFollow, ECommandName.patrol, ECommandName.deploy]
  static blueTextures: IVehicleTextures
  static greenTextures: IVehicleTextures
  static textures (team: Team): IVehicleTextures {
    return team === Team.blue ? Harvester.blueTextures : Harvester.greenTextures
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

  public collisionOptions = {
    width: 20,
    height: 20,
    offset: {
      x: 1,
      y: 0
    }
  }

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
  static cost = 1600
  public hitPoints = 50
  public turnSpeed = 2
  public turnFactor = 20

  constructor (options: IHarvesterOptions) {
    super({
      ...options,
      textures: Harvester.textures(options.team)
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

  override processOrders (): boolean {
    if (super.processOrders()) {
      return true
    }
    switch (this.order.type) {
      case 'deploy': {
        const { tileMap, turnSpeedAdjustmentFactor } = this.game
        tileMap.rebuildBuildableGrid(this)
        tileMap.mergeBuildableGridIntoDeployable()
        const { currentMapDeployableGrid } = tileMap
        const { buildableGrid } = OilDerrick
        const { toPoint } = this.order
        for (let y = buildableGrid.length - 1; y >= 0; y--) {
          for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
            if (currentMapDeployableGrid[Math.floor(toPoint.gridY) + y][Math.floor(toPoint.gridX) + x] === 1) {
              // If oilfield has been used already, then cancel order
              AUDIO.play('harvester-error')
              this.order = { type: 'stand' }
              return true
            }
          }
        }
        const thisGrid = this.getGridXY({ center: true, floor: true })
        if (thisGrid.gridX === Math.floor(toPoint.gridX) && thisGrid.gridY === Math.floor(toPoint.gridY)) {
          // After reaching oil field, turn harvester to point towards left (direction 6)
          const difference = angleDiff({ angle1: this.vector.direction, angle2: EVectorDirection.left, directions: this.vector.directions })
          const turnAmount = this.turnSpeed * turnSpeedAdjustmentFactor
          if (Math.abs(difference) > turnAmount) {
            this.vector.setDirection({
              direction: wrapDirection({
                direction: this.vector.direction + turnAmount * Math.abs(difference) / difference,
                directions: this.vector.directions
              })
            })
            this.moveTurning = true
          } else {
            this.vector.setDirection({ direction: EVectorDirection.left })
            this.moveTurning = false
          }
          if (!this.moveTurning) {
            // Once it is pointing to the left, remove the harvester and oil field and deploy a harvester building
            this.removeAndDestroy()

            tileMap.addItem(new OilDerrick({
              game: this.game,
              initX: Math.floor(toPoint.gridX) * tileMap.gridSize,
              initY: Math.floor(toPoint.gridY) * tileMap.gridSize,
              team: this.team,
              deploy: true
            }))
          }
        } else {
          const distanceFromDestinationSquared = (Math.pow(toPoint.gridX - thisGrid.gridX, 2) + Math.pow(toPoint.gridY - thisGrid.gridY, 2))
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo({ type: EItemType.terrain, ...this.order.toPoint }, distanceFromDestination)

          // Pathfinding couldn't find a path so stop
          if (!moving) {
            this.order = { type: 'stand' }
          }
        }
        return true
      }
    }
    return false
  }
}
