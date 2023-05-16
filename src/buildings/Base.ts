import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../utils/helpers'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { EItemName } from '../interfaces/IItem'
import { ECommandName } from '../interfaces/ICommand'
import { EMessageCharacter } from '../components/StatusBar'
import { type IGridPoint } from '../interfaces/IGridPoint'
import { logCash } from '../utils/logger'

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

  public sightRadius = 8
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
    constructingAnimation.loop = false
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
        // do nothing
      } else {
        this.switchAnimation(BaseAnimation.healthy)
      }
    } else if (this.isAlive()) {
      this.switchAnimation(BaseAnimation.damaged)
    }
  }

  calcAvailablePlaces (): IGridPoint[] {
    const { tileMap } = this.game
    tileMap.rebuildBuildableGrid()
    const { currentMapBuildableGrid, mapGridWidth, mapGridHeight } = tileMap
    const { buildableGrid } = this
    const availablePlaces: IGridPoint[] = []
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
    return availablePlaces
  }

  showOccupiedMessage (): void {
    if (this.team === this.game.team) {
      this.game.showMessage({
        character: EMessageCharacter.system,
        message: 'Warning! Cannot construct unit while landing bay is occupied.',
        selfRemove: true
      })
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

  override processOrders (): boolean {
    // damaged building cannot construct
    if (!this.isHealthy()) {
      this.setOrder({ type: 'stand' })
      return false
    }
    switch (this.order.type) {
      case 'try-construct-unit': {
        // First make sure there is some space near base
        const availablePlaces = this.calcAvailablePlaces()
        if (availablePlaces.length <= 0) {
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
        this.setOrder({ ...this.order, type: 'start-construct-unit' })
        this.switchAnimation(BaseAnimation.constructing)
        return true
      }
      case 'start-construct-unit': {
        if (this.isConstructing() &&
            this.constructingAnimation.currentFrame === this.constructingAnimation.totalFrames - 1) {
          const availablePlaces = this.calcAvailablePlaces()
          const availablePlace = availablePlaces[Math.floor(Math.random() * availablePlaces.length)]
          if (availablePlace == null) {
            this.showOccupiedMessage()
            this.switchAnimation(BaseAnimation.healthy)
            this.setOrder({ type: 'stand' })
            return true
          }
          const cost = this.game.getItemCost(this.order.name)
          if (this.game.cash[this.team] < cost) {
            this.showCostMessage(cost)
            this.switchAnimation(BaseAnimation.healthy)
            this.setOrder({ type: 'stand' })
            return true
          }
          // Subtract the cost from player cash
          this.game.cash[this.team] -= cost
          logCash(`(${this.team}) base construct (-${cost}) b=${this.game.cash.blue} g=${this.game.cash.green}`)
          this.setOrder({
            ...this.order,
            type: 'end-construct-unit',
            toPoint: {
              gridX: availablePlace.gridX + 0.5,
              gridY: availablePlace.gridY + 0.5
            }
          })
        }
        return true
      }
      case 'end-construct-unit': {
        this.switchAnimation(BaseAnimation.healthy)
        const item = this.game.createItem({
          name: this.order.name,
          team: this.team,
          initGridX: this.order.toPoint.gridX,
          initGridY: this.order.toPoint.gridY,
          initCenter: true,
          teleport: true,
          order: this.order.unitOrder,
          uid: this.order.unitUid
        })
        if (item != null) {
          this.game.tileMap.addItem(item)
        }
        this.setOrder({ type: 'stand' })
        return true
      }
    }
    return false
  }
}
