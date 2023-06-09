import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../utils/helpers'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { EItemName } from '../interfaces/IItem'
import { EMessageCharacter } from '../components/StatusBar'
import { ECommandName } from '../interfaces/ICommand'
import { logCash } from '../utils/logger'

export type IStarportOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
> & {
  teleport?: boolean
}

export enum StarportAnimation {
  open = 'open',
  close = 'close',
  teleport = 'teleport',
  healthy = 'healthy',
  damaged = 'damaged',
}

export interface IStarportTextures extends IBuildingTextures {
  teleportTextures: Texture[]
  closingTextures: Texture[]
  openingTextures: Texture[]
}

export class Starport extends Building {
  public commands = [ECommandName.constructScoutTank, ECommandName.constructHeavyTank, ECommandName.constructChopper, ECommandName.constructWraith]
  public itemName = EItemName.Starport
  static blueTextures: IStarportTextures
  static greenTextures: IStarportTextures
  static textures (team: Team): IStarportTextures {
    return team === Team.blue ? Starport.blueTextures : Starport.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IStarportTextures
    greenTextures: IStarportTextures
  }): void {
    Starport.blueTextures = blueTextures
    Starport.greenTextures = greenTextures
  }

  static collisionOptions = {
    width: 40,
    height: 55,
    offset: {
      x: 0,
      y: 4
    }
  }

  public drawSelectionOptions = {
    width: 42,
    height: 58,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: -1,
      y: 3
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 38,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 1,
      y: -4
    }
  }

  public sightRadius = 6
  static cost = 200
  public hitPoints = 300
  public life = this.hitPoints
  public teleportAnimationSpeed = 0.1
  public teleportAnimation!: AnimatedSprite
  public closingAnimationSpeed = 0.1
  public closingAnimation!: AnimatedSprite
  public openingAnimation!: AnimatedSprite

  static buildableGrid = [
    [1, 1],
    [1, 1],
    [1, 1]
  ]

  static passableGrid = [
    [1, 1],
    [0, 0],
    [0, 0]
  ]

  constructor (options: IStarportOptions) {
    super({
      ...options,
      textures: Starport.textures(options.team)
    })
    this.collisionOptions = Starport.collisionOptions
    if (Array.isArray(options.commands)) {
      this.commands = options.commands
    }
    this.buildableGrid = Starport.buildableGrid
    this.passableGrid = Starport.passableGrid
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()

    this.teleportAnimation.animationSpeed = this.teleportAnimationSpeed
    this.closingAnimation.animationSpeed = this.closingAnimationSpeed
    this.openingAnimation.animationSpeed = this.closingAnimationSpeed
    if (options.teleport === true) {
      this.switchAnimation(StarportAnimation.teleport)
    } else {
      this.updateAnimation()
    }
  }

  calcZIndex (): void {
    // allow ground items to be visible on top of starport when constructing
    this.zIndex = this.y + this.height * this.passableGrid.filter(row => row.some(i => i === 1)).length / this.passableGrid.length
  }

  override setup (options: IStarportOptions): void {
    const textures = Starport.textures(options.team)
    super.setup({
      ...options,
      textures
    })
    const { teleportTextures, closingTextures, openingTextures } = textures
    const teleportAnimation = new AnimatedSprite(teleportTextures)
    teleportAnimation.loop = false
    this.spritesContainer.addChild(teleportAnimation)
    this.teleportAnimation = teleportAnimation

    const closingAnimation = new AnimatedSprite(closingTextures)
    closingAnimation.loop = false
    this.spritesContainer.addChild(closingAnimation)
    this.closingAnimation = closingAnimation

    const openingAnimation = new AnimatedSprite(openingTextures)
    openingAnimation.loop = false
    this.spritesContainer.addChild(openingAnimation)
    this.openingAnimation = openingAnimation
  }

  isTeleporting (): boolean {
    return this.currentAnimation === this.teleportAnimation
  }

  isOpening (): boolean {
    return this.currentAnimation === this.openingAnimation
  }

  isClosing (): boolean {
    return this.currentAnimation === this.closingAnimation
  }

  isIdle (): boolean {
    return this.currentAnimation === this.healthyAnimation
  }

  override updateAnimation (): void {
    if (this.isHealthy()) {
      if (this.isTeleporting()) {
        if (this.teleportAnimation.currentFrame === this.teleportAnimation.totalFrames - 1) {
          this.switchAnimation(StarportAnimation.healthy)
        }
      } else if (this.isOpening()) {
        // do nothing
      } else if (this.isClosing() && this.closingAnimation.currentFrame === this.closingAnimation.totalFrames - 1) {
        this.switchAnimation(StarportAnimation.healthy)
      } else {
        this.switchAnimation(StarportAnimation.healthy)
      }
    } else if (this.isAlive()) {
      this.switchAnimation(StarportAnimation.damaged)
    }
  }

  override switchAnimation <T>(animationName: T): void {
    let newAnimation
    switch (animationName) {
      case StarportAnimation.teleport:
        newAnimation = this.teleportAnimation
        break
      case StarportAnimation.open:
        newAnimation = this.openingAnimation
        break
      case StarportAnimation.close:
        newAnimation = this.closingAnimation
        break
      case StarportAnimation.healthy:
        newAnimation = this.healthyAnimation
        break
      case StarportAnimation.damaged:
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

  calcUnitOnTop (): boolean {
    const thisBounds = this.getCollisionBounds()
    const { tileMap } = this.game
    let unitOnTop = false
    for (let i = tileMap.moveableItems.length - 1; i >= 0; i--) {
      const item = tileMap.moveableItems[i]
      const itemBounds = item.getCollisionBounds()
      if (itemBounds.left >= thisBounds.left && itemBounds.right <= thisBounds.right &&
        itemBounds.top >= thisBounds.top && itemBounds.bottom <= thisBounds.bottom) {
        unitOnTop = true
        break
      }
    }
    return unitOnTop
  }

  showOccupiedMessage (): void {
    if (this.team === this.game.team) {
      this.game.showMessage({
        character: EMessageCharacter.system,
        message: 'Warning! Cannot teleport unit while landing bay is occupied.',
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

  override processOrder (): boolean {
    // damaged building cannot construct
    if (!this.isHealthy()) {
      return false
    }
    if (this.order.processed === true) {
      return true
    }
    switch (this.order.type) {
      case 'try-construct-unit': {
        // First make sure there is no unit standing on top of the building
        const unitOnTop = this.calcUnitOnTop()
        if (unitOnTop) {
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
        this.switchAnimation(StarportAnimation.open)
        return true
      }
      case 'start-construct-unit': {
        if (this.isOpening() &&
            this.openingAnimation.currentFrame === this.openingAnimation.totalFrames - 1) {
          const unitOnTop = this.calcUnitOnTop()
          if (unitOnTop) {
            this.showOccupiedMessage()
            this.switchAnimation(StarportAnimation.close)
            this.setOrder({ type: 'stand' })
            return true
          }
          const cost = this.game.getItemCost(this.order.name)
          if (this.game.cash[this.team] < cost) {
            this.showCostMessage(cost)
            this.switchAnimation(StarportAnimation.close)
            this.setOrder({ type: 'stand' })
            return true
          }
          // Subtract the cost from player cash
          this.game.cash[this.team] -= cost
          logCash(`(${this.team}) starport construct (-${cost}) b=${this.game.cash.blue} g=${this.game.cash.green}`)
          const thisPosition = this.getGridXY({ center: true })
          // Position new unit above center of starport
          this.setOrder({
            ...this.order,
            type: 'end-construct-unit',
            toPoint: {
              gridX: thisPosition.gridX,
              gridY: thisPosition.gridY
            }
          })
        }
        return true
      }
      case 'end-construct-unit': {
        this.switchAnimation(StarportAnimation.close)
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
