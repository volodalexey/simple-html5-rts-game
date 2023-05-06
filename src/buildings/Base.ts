import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { EItemName, type UnitName } from '../interfaces/IItem'
import { ECommandName } from '../Command'
import { type IOrder } from '../interfaces/IOrder'
import { EMessageCharacter } from '../StatusBar'

export type IBaseOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
>

export interface IBaseTextures extends IBuildingTextures {
  constructingTextures: Texture[]
}

export enum BaseAnimation {
  constructing = 'constructing',
  healthy = 'healthy',
  damaged = 'damaged',
}

export class Base extends Building {
  public itemName = EItemName.Base
  public commands = [ECommandName.constructSCV, ECommandName.constructHarvester]
  static blueTextures: IBaseTextures
  static greenTextures: IBaseTextures
  static textures (team: Team): IBaseTextures {
    return team === Team.blue ? Base.blueTextures : Base.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IBaseTextures
    greenTextures: IBaseTextures
  }): void {
    Base.blueTextures = blueTextures
    Base.greenTextures = greenTextures
  }

  public collisionOptions = {
    width: 40,
    height: 40,
    offset: {
      x: 0,
      y: 20
    }
  }

  public drawSelectionOptions = {
    width: 44,
    height: 44,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -2,
      y: 18
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 40,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 0,
      y: -2
    }
  }

  public sight = 4
  public hitPoints = 500
  public life = this.hitPoints
  public constructingAnimationSpeed = 0.1
  public constructingAnimation!: AnimatedSprite

  public buildableGrid = [
    [1, 1],
    [1, 1]
  ]

  public passableGrid = [
    [1, 1],
    [1, 1]
  ]

  public constructUnit?: {
    initGridX: number
    initGridY: number
    name: UnitName
    team: Team
    initCenter?: boolean
    order?: IOrder
    teleport?: boolean
  }

  constructor (options: IBaseOptions) {
    super({
      ...options,
      textures: Base.textures(options.team)
    })
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()

    this.constructingAnimation.animationSpeed = this.constructingAnimationSpeed
    this.updateAnimation()
  }

  override setup (options: IBaseOptions): void {
    const textures = Base.textures(options.team)
    super.setup({
      ...options,
      textures
    })
    const { constructingTextures } = textures
    const constructingAnimation = new AnimatedSprite(constructingTextures)
    this.spritesContainer.addChild(constructingAnimation)
    this.constructingAnimation = constructingAnimation
  }

  override switchAnimation <T>(animationName: T): void {
    let newAnimation
    switch (animationName) {
      case BaseAnimation.constructing:
        newAnimation = this.constructingAnimation
        break
      case BaseAnimation.healthy:
        newAnimation = this.healthyAnimation
        break
      case BaseAnimation.damaged:
        newAnimation = this.damagedAnimation
        break
    }
    if (newAnimation === this.currentAnimation || newAnimation == null) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }

  isConstructing (): boolean {
    return this.currentAnimation === this.constructingAnimation
  }

  override updateAnimation (): void {
    if (this.isHealthy()) {
      if (this.isConstructing()) {
        if (this.constructingAnimation.currentFrame === this.constructingAnimation.totalFrames - 1) {
          this.switchAnimation(BaseAnimation.healthy)
          if (this.constructUnit != null) {
            const item = this.game.createItem(this.constructUnit)
            if (item != null) {
              this.game.tileMap.addItem(item)
            }
          }
        }
      } else {
        this.switchAnimation(BaseAnimation.healthy)
      }
    } else if (this.isAlive()) {
      this.switchAnimation(BaseAnimation.damaged)
    }
  }

  override processOrders (): boolean {
    switch (this.order.type) {
      case 'construct-unit': {
        // damaged building cannot construct
        if (!this.isHealthy()) {
          return false
        }
        // First make sure there is some space near base
        const { tileMap, team: gameTeam, cash } = this.game
        tileMap.rebuildBuildableGrid()
        const { currentMapBuildableGrid, mapGridWidth, mapGridHeight } = tileMap
        const { buildableGrid } = this
        const availablePlaces: Array<{ gridX: number, gridY: number }> = []
        const thisGrid = this.getGridXY()
        // check only diagonal spaces outside of main buildable grid
        for (const gridY of [thisGrid.gridY - 1, thisGrid.gridY + buildableGrid.length]) {
          for (const gridX of [thisGrid.gridX - 1, thisGrid.gridX + buildableGrid[0].length]) {
            if (gridX < 0 || gridX >= mapGridWidth || gridY < 0 || gridY >= mapGridHeight) {
              continue
            } else if (currentMapBuildableGrid[gridY][gridX] === 0) {
              availablePlaces.push({ gridX, gridY })
            }
          }
        }
        if (availablePlaces.length <= 0) {
          this.game.showMessage({
            character: EMessageCharacter.system,
            message: 'Warning! Cannot teleport unit while landing bay is occupied.'
          })
          this.order = { type: 'stand' }
          return true
        }

        const cost = this.game.getItemCost(this.order.name)
        if (typeof cost === 'number') {
          if (cash[this.team] < cost) {
            if (this.team === gameTeam) {
              this.game.showMessage({
                character: EMessageCharacter.system,
                message: `Warning! Insufficient Funds. Need ${cost} credits.`
              })
            }
          } else {
            // Position new unit above center of starport
            const availablePlace = availablePlaces[Math.floor(Math.random() * availablePlaces.length)]
            // Teleport in unit and subtract the cost from player cash
            cash[this.team] -= cost
            this.constructUnit = {
              initGridX: availablePlace.gridX + 0.5,
              initGridY: availablePlace.gridY + 0.5,
              initCenter: true,
              team: this.team,
              name: this.order.name,
              order: this.order.unitOrder,
              teleport: true
            }
            this.switchAnimation(BaseAnimation.constructing)
          }
        } else {
          console.warn(`Unable to calc item (name=${this.order.name}) cost`)
        }
        this.order = { type: 'stand' }
      }
    }
    return false
  }
}
