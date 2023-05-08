import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { EItemName, type UnitName } from '../interfaces/IItem'
import { EMessageCharacter } from '../StatusBar'
import { type IOrder } from '../interfaces/IOrder'
import { ECommandName } from '../Command'

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

  public sight = 3
  static cost = 2000
  public hitPoints = 300
  public life = this.hitPoints
  public teleportAnimationSpeed = 0.1
  public teleportAnimation!: AnimatedSprite
  public closingAnimationSpeed = 0.1
  public closingAnimation!: AnimatedSprite
  public openingAnimation!: AnimatedSprite
  public constructUnit?: {
    initX: number
    initY: number
    name: UnitName
    team: Team
    initCenter?: boolean
    order?: IOrder
    teleport?: boolean
    cost: number
  }

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

  override updateAnimation (): void {
    if (this.isHealthy()) {
      if (this.isTeleporting()) {
        if (this.teleportAnimation.currentFrame === this.teleportAnimation.totalFrames - 1) {
          this.switchAnimation(StarportAnimation.healthy)
        }
      } else if (this.isOpening()) {
        if (this.openingAnimation.currentFrame === this.openingAnimation.totalFrames - 1) {
          this.switchAnimation(StarportAnimation.close)
          if (this.constructUnit != null) {
            const item = this.game.createItem(this.constructUnit)
            if (item != null) {
              this.game.cash[this.team] -= this.constructUnit.cost
              this.game.tileMap.addItem(item)
            }
          }
        }
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

  override processOrders (): boolean {
    switch (this.order.type) {
      case 'construct-unit': {
        // damaged building cannot construct
        if (!this.isHealthy()) {
          return false
        }
        // First make sure there is no unit standing on top of the building
        const thisBounds = this.getCollisionBounds()
        const { tileMap, team: gameTeam, cash } = this.game
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

        const cost = this.game.getItemCost(this.order.name)
        if (typeof cost === 'number') {
          if (unitOnTop) {
            if (this.team === gameTeam) {
              this.game.showMessage({
                character: EMessageCharacter.system,
                message: 'Warning! Cannot teleport unit while landing bay is occupied.',
                selfRemove: true
              })
            }
          } else if (cash[this.team] < cost) {
            if (this.team === gameTeam) {
              this.game.showMessage({
                character: EMessageCharacter.system,
                message: `Warning! Insufficient Funds. Need ${cost} credits.`,
                selfRemove: true
              })
            }
          } else {
            // Position new unit above center of starport
            const thisPosition = this.getCollisionPosition({ center: true })
            // Teleport in unit and subtract the cost from player cash
            this.constructUnit = {
              initX: thisPosition.x,
              initY: thisPosition.y,
              initCenter: true,
              team: this.team,
              name: this.order.name,
              order: this.order.unitOrder,
              teleport: true,
              cost
            }
            this.switchAnimation(StarportAnimation.open)
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
