import { ECommandName } from '../Command'
import { EMessageCharacter } from '../StatusBar'
import { AUDIO } from '../audio'
import { Team } from '../common'
import { EItemName, EItemType } from '../interfaces/IItem'
import { Vehicle, type IVehicleOptions, type IVehicleTextures } from './Vehicle'

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

  public radius = 15
  public speed = 15
  public sight = 3
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

  override processOrders (): boolean {
    if (super.processOrders()) {
      return true
    }
    switch (this.order.type) {
      case 'build': {
        const cost = this.game.getItemCost(this.order.name)
        if (typeof cost !== 'number') {
          console.warn(`Unable to calc item (name=${this.order.name}) cost`)
          this.order = { type: 'stand' }
          return true
        }
        const { tileMap, cash, team: gameTeam } = this.game
        if (cash[this.team] < cost && this.team === gameTeam) {
          this.game.showMessage({
            character: EMessageCharacter.system,
            message: `Warning! Insufficient Funds. Need ${cost} credits.`,
            selfRemove: true
          })
          this.order = { type: 'stand' }
          return true
        }
        tileMap.rebuildBuildableGrid()
        const { currentMapBuildableGrid, mapGridWidth, mapGridHeight } = tileMap
        const buildableGrid = this.game.getBuildableGrid(this.order.name)
        if (buildableGrid == null) {
          console.warn(`Unable to detect buildable grid for name=${this.order.name}`)
          this.order = { type: 'stand' }
          return true
        }
        const { toPoint } = this.order
        for (let y = buildableGrid.length - 1; y >= 0; y--) {
          for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
            if (currentMapBuildableGrid[Math.floor(toPoint.gridY) + y][Math.floor(toPoint.gridX) + x] === 1) {
              if (this.team === this.game.team) {
                AUDIO.play('scv-error')
              }
              this.order = { type: 'stand' }
              return true
            }
          }
        }
        const thisCollisionBounds = this.getGridXY({ center: true, floor: true })
        const thisGridInit = { gridX: Math.floor(toPoint.gridX) - 1, gridY: Math.floor(toPoint.gridY) - 1 }
        const triggerBuildableGrid = [
          [1, ...buildableGrid[0], 1],
          ...buildableGrid.map(row => [1, ...row, 1]),
          [1, ...buildableGrid[buildableGrid.length - 1], 1]
        ]
        let readyToBuild = false
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

        if (readyToBuild) {
          const building = this.game.createItem({
            name: this.order.name,
            team: this.team,
            initGridX: Math.floor(toPoint.gridX),
            initGridY: Math.floor(toPoint.gridY),
            teleport: true
          })
          if (building != null) {
            cash[this.team] -= cost
            tileMap.addItem(building)
            tileMap.rebuildPassableRequired = true
          }
          this.order = { type: 'stand' }
        } else {
          const thisGrid = this.getGridXY()
          const distanceFromDestinationSquared = (Math.pow(toPoint.gridX - thisGrid.gridX, 2) + Math.pow(toPoint.gridY - thisGrid.gridY, 2))
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo({ type: EItemType.terrain, ...this.order.toPoint }, distanceFromDestination)

          if (!moving) {
            if (this.team === this.game.team) {
              AUDIO.play('scv-error')
            }
            this.order = { type: 'stand' }
          }
        }
        return true
      }
    }
    return false
  }
}
