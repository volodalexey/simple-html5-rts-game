import { OilDerrick } from '../buildings/OilDerrick'
import { ECommandName } from '../interfaces/ICommand'
import { wrapDirection, Team, angleDiff } from '../utils/helpers'
import { EItemName, EItemType } from '../interfaces/IItem'
import { EVectorDirection } from '../utils/Vector'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'
import { type IGridPointData } from '../interfaces/IOrder'

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

  public collisionRadius = 10
  public sightRadius = 4
  public speed = 10
  static cost = 160
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

  showOccupiedMessage (): void {
    if (this.team === this.game.team) {
      this.game.audio.playHarvesterError()
    }
  }

  calcOccupied (toPoint: IGridPointData): boolean {
    const { tileMap } = this.game
    tileMap.rebuildBuildableGrid(this)
    tileMap.mergeBuildableGridIntoDeployable()
    const { currentMapDeployableGrid } = tileMap
    const { buildableGrid } = OilDerrick
    for (let y = buildableGrid.length - 1; y >= 0; y--) {
      for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
        if (currentMapDeployableGrid[Math.floor(toPoint.gridY) + y][Math.floor(toPoint.gridX) + x] === 1) {
          return true
        }
      }
    }
    return false
  }

  calcReachedTarget (toPoint: IGridPointData): boolean {
    const thisGrid = this.getGridXY({ center: true, floor: true })
    if (thisGrid.gridX === Math.floor(toPoint.gridX) && thisGrid.gridY === Math.floor(toPoint.gridY)) {
      return true
    }
    return false
  }

  updateTurn (): void {
    const { turnSpeedAdjustmentFactor } = this.game
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
  }

  override processOrders (): boolean {
    if (super.processOrders()) {
      return true
    }
    switch (this.order.type) {
      case 'try-deploy': {
        const { toPoint } = this.order
        const isOccupied = this.calcOccupied(toPoint)
        if (isOccupied) {
          // If oilfield has been used already, then cancel order
          this.showOccupiedMessage()
          this.setOrder({ type: 'stand' })
          return true
        }

        const isReachedTarget = this.calcReachedTarget(toPoint)
        if (isReachedTarget) {
          this.updateTurn()
          if (!this.moveTurning) {
            this.setOrder({
              ...this.order,
              type: 'end-deploy',
              toPoint: {
                gridX: Math.floor(toPoint.gridX),
                gridY: Math.floor(toPoint.gridY)
              }
            })
          }
        } else {
          const thisGrid = this.getGridXY({ center: true, floor: true })
          const distanceFromDestinationSquared = (Math.pow(Math.floor(toPoint.gridX) - thisGrid.gridX, 2) + Math.pow(Math.floor(toPoint.gridY) - thisGrid.gridY, 2))
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo({ type: EItemType.terrain, ...this.order.toPoint }, distanceFromDestination)

          if (!moving) {
            if (this.team === this.game.team) {
              this.game.audio.playHarvesterError()
            }
            this.setOrder({ type: 'stand' })
          }
        }
        return true
      }
      case 'end-deploy': {
        // Once it is pointing to the left, remove the harvester and oil field and deploy a harvester building
        this.removeAndDestroy()
        const oilDerrick = this.game.createItem({
          name: EItemName.OilDerrick,
          team: this.team,
          initGridX: this.order.toPoint.gridX,
          initGridY: this.order.toPoint.gridY,
          deploy: true,
          uid: this.order.buildingUid
        })
        if (oilDerrick != null) {
          this.game.tileMap.addItem(oilDerrick)
          this.game.tileMap.rebuildPassableRequired = true
        }
        return true
      }
    }
    return false
  }
}
