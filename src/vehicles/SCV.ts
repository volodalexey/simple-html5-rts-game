import { ECommandName } from '../interfaces/ICommand'
import { EMessageCharacter } from '../components/StatusBar'
import { Team } from '../utils/helpers'
import { type BuildName, EItemName, EItemType } from '../interfaces/IItem'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'
import { logCash } from '../utils/logger'
import { type IGridPointData } from '../interfaces/IOrder'

export type ISCVOptions = Pick<
IVehicleOptions,
Exclude<keyof IVehicleOptions, 'textures'>
> & {
  initCenter?: boolean
}

export class SCV extends Vehicle {
  public itemName = EItemName.SCV
  public commands = [ECommandName.moveFollow, ECommandName.patrol, ECommandName.buildTurret, ECommandName.buildStarport]
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
    width: 20,
    height: 20,
    offset: {
      x: 5,
      y: 5
    }
  }

  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 12,
    strokeWidth: 2,
    strokeColor: 0xffff00,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 1,
      y: 1
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
      x: 5,
      y: -4
    }
  }

  public collisionRadius = 10
  public sightRadius = 6
  public speed = 15
  static cost = 40
  public hitPoints = 100
  public turnSpeed = 4
  public turnFactor = 10

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

  showCostMessage (cost: number): void {
    if (this.team === this.game.team) {
      this.game.showMessage({
        character: EMessageCharacter.system,
        message: `Warning! Insufficient Funds. Need ${cost} credits.`,
        selfRemove: true
      })
    }
  }

  showOccupiedMessage (): void {
    if (this.team === this.game.team) {
      this.game.audio.playSCVError()
    }
  }

  calcOccupied (toPoint: IGridPointData, name: BuildName): boolean {
    const { tileMap } = this.game
    tileMap.rebuildBuildableGrid()
    const { currentMapBuildableGrid } = tileMap
    const buildableGrid = this.game.getBuildableGrid(name)
    for (let y = buildableGrid.length - 1; y >= 0; y--) {
      for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
        if (currentMapBuildableGrid[Math.floor(toPoint.gridY) + y][Math.floor(toPoint.gridX) + x] === 1) {
          return true
        }
      }
    }
    return false
  }

  calcReadyToBuild (toPoint: IGridPointData, name: BuildName): boolean {
    let readyToBuild = false
    const buildableGrid = this.game.getBuildableGrid(name)
    const thisCollisionBounds = this.getGridXY({ center: true, floor: true })
    const thisGridInit = { gridX: Math.floor(toPoint.gridX) - 1, gridY: Math.floor(toPoint.gridY) - 1 }
    const triggerBuildableGrid = [
      [1, ...buildableGrid[0], 1],
      ...buildableGrid.map(row => [1, ...row, 1]),
      [1, ...buildableGrid[buildableGrid.length - 1], 1]
    ]
    const { mapGridWidth, mapGridHeight } = this.game.tileMap
    for (let y = 0; y < triggerBuildableGrid.length; y++) {
      for (let x = 0; x < triggerBuildableGrid[y].length; x++) {
        const trGridX = thisGridInit.gridX + x
        const trGridY = thisGridInit.gridY + y
        if (trGridX < 0 || trGridX >= mapGridWidth || trGridY < 0 || trGridY >= mapGridHeight) {
          continue
        } else if (trGridX === thisCollisionBounds.gridX && trGridY === thisCollisionBounds.gridY) {
          readyToBuild = true
          break
        }
      }
    }
    return readyToBuild
  }

  override processOrders (): boolean {
    if (super.processOrders()) {
      return true
    }
    switch (this.order.type) {
      case 'try-build': {
        const { toPoint } = this.order
        const isOccupied = this.calcOccupied(toPoint, this.order.name)
        if (isOccupied) {
          this.showOccupiedMessage()
          this.setOrder({ type: 'stand' })
          return true
        }

        const cost = this.game.getItemCost(this.order.name)
        if (this.game.cash[this.team] < cost) {
          this.showCostMessage(cost)
          this.setOrder({ type: 'stand' })
          return true
        }

        const isReadyToBuild = this.calcReadyToBuild(toPoint, this.order.name)
        if (isReadyToBuild) {
          // Subtract the cost from player cash
          this.game.cash[this.team] -= cost
          logCash(`(${this.game.team}) scv build (-${cost}) b=${this.game.cash.blue} g=${this.game.cash.green}`)
          this.setOrder({
            ...this.order,
            type: 'end-build',
            toPoint: {
              gridX: Math.floor(toPoint.gridX),
              gridY: Math.floor(toPoint.gridY)
            }
          })
        } else {
          const thisGrid = this.getGridXY()
          const distanceFromDestinationSquared = (Math.pow(toPoint.gridX - thisGrid.gridX, 2) + Math.pow(toPoint.gridY - thisGrid.gridY, 2))
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo({ type: EItemType.terrain, ...this.order.toPoint }, distanceFromDestination)

          if (!moving) {
            if (this.team === this.game.team) {
              this.game.audio.playSCVError()
            }
            this.setOrder({ type: 'stand' })
          }
        }
        return true
      }
      case 'end-build': {
        const building = this.game.createItem({
          name: this.order.name,
          team: this.team,
          initGridX: this.order.toPoint.gridX,
          initGridY: this.order.toPoint.gridY,
          teleport: true,
          uid: this.order.buildingUid
        })
        if (building != null) {
          this.game.tileMap.addItem(building)
          this.game.tileMap.rebuildPassableRequired = true
        }
        this.setOrder({ type: 'stand' })
        return true
      }
    }
    return false
  }
}
