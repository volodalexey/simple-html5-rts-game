import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { generateUid, type Team } from '../common'
import { type ISelectable } from '../interfaces/ISelectable'
import { type ILifeable } from '../interfaces/ILifeable'
import { EItemName, EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'
import { type IOrder } from '../interfaces/IOrder'
import { LifeBar } from '../LifeBar'
import { logItemBounds } from '../logger'

export interface IBuildingTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
}

export interface IBuildingOptions {
  game: Game
  uid?: number
  initX: number
  initY: number
  team: Team
  textures: IBuildingTextures
  life?: number
  selectable?: boolean
  ordersable?: boolean
  orders?: IOrder
}

export class Building extends Container implements IItem, ISelectable, ILifeable {
  public collisionGraphics = new Graphics()
  public collisionOptions = {
    width: 0,
    height: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public selectedGraphics = new Graphics()
  public selected = false
  public selectable = true
  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 0,
    strokeWidth: 0,
    strokeColor: 0,
    strokeSecondColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public lifeBar!: LifeBar
  public drawLifeBarOptions = {
    borderColor: 0,
    borderThickness: 0,
    borderAlpha: 0,
    width: 0,
    height: 0,
    fillColor: 0,
    emptyColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public spritesContainer = new Container<AnimatedSprite>()

  public buildableGrid: number[][] = []
  public passableGrid: number[][] = []

  public orders: IOrder
  public hitPoints = 0
  public life = 0

  public sight = 0
  public radius = 0
  public cost = 0
  public game: Game
  public uid: number
  public type = EItemType.buildings
  public itemName = EItemName.None
  public ordersable = true
  public team: Team
  public healthyAnimation!: AnimatedSprite
  public damagedAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public healthyAnimationSpeed = 0.1
  public damagedAnimationSpeed = 0.1

  constructor (options: IBuildingOptions) {
    super()
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.team = options.team
    this.orders = options.orders ?? { type: 'stand' }
    if (options.life != null) {
      this.life = options.life
    }
    if (typeof options.selectable === 'boolean') {
      this.selectable = options.selectable
    }
    if (typeof options.ordersable === 'boolean') {
      this.ordersable = options.ordersable
    }
    this.setup(options)
  }

  setup ({
    textures: {
      healthyTextures,
      damagedTextures
    }
  }: IBuildingOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.spritesContainer)
    this.addChild(this.collisionGraphics)

    const { healthyAnimationSpeed, damagedAnimationSpeed } = this

    const healthyAnimation = new AnimatedSprite(healthyTextures)
    healthyAnimation.animationSpeed = healthyAnimationSpeed
    this.spritesContainer.addChild(healthyAnimation)
    this.healthyAnimation = healthyAnimation

    const damagedAnimation = new AnimatedSprite(damagedTextures)
    damagedAnimation.animationSpeed = damagedAnimationSpeed
    this.spritesContainer.addChild(damagedAnimation)
    this.damagedAnimation = damagedAnimation

    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  drawCollision (): void {
    const { offset, width, height } = this.collisionOptions
    const { collisionGraphics } = this
    collisionGraphics.position.set(offset.x, offset.y)
    collisionGraphics.beginFill(0xffffff)
    collisionGraphics.drawRect(0, 0, width, height)
    collisionGraphics.endFill()
    collisionGraphics.alpha = logItemBounds.enabled ? 0.5 : 0
  }

  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, strokeSecondColor, width, height } = this.drawSelectionOptions
    const { selectedGraphics } = this
    selectedGraphics.position.set(offset.x, offset.y)
    const halfWidth = width / 2
    const halfHeight = height / 2
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(0, 0, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(halfWidth, 0, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(width - strokeWidth, 0, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(width - strokeWidth, halfHeight, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(halfWidth, height - strokeWidth, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(0, height - strokeWidth, halfWidth, strokeWidth)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeColor)
    selectedGraphics.drawRect(0, halfHeight, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.beginFill(strokeSecondColor)
    selectedGraphics.drawRect(0, 0, strokeWidth, halfHeight)
    selectedGraphics.endFill()
    selectedGraphics.alpha = 0
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation <T extends BuildingAnimation>(animation: T): void {
    let newAnimation
    switch (animation) {
      case BuildingAnimation.healthy:
        newAnimation = this.healthyAnimation
        break
      case BuildingAnimation.damaged:
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

  updateAnimation (): void {
    if (this.isHealthy()) {
      this.switchAnimation(BuildingAnimation.healthy)
    } else if (this.isAlive()) {
      this.switchAnimation(BuildingAnimation.damaged)
    }
  }

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  getCollisionPosition ({ center = false } = {}): { x: number, y: number } {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const ret = {
      x: this.x + colX,
      y: this.y + colY
    }
    if (center) {
      ret.x += (colWidth) / 2
      ret.y += (colHeight) / 2
    }
    return ret
  }

  getCollisionBounds (): { top: number, right: number, bottom: number, left: number } {
    const collisionPosition = this.getCollisionPosition()
    return {
      top: collisionPosition.y,
      right: collisionPosition.x + this.collisionGraphics.width,
      bottom: collisionPosition.y + this.collisionGraphics.height,
      left: collisionPosition.x
    }
  }

  getGridCollisionBounds (): { topGridY: number, rightGridX: number, bottomGridY: number, leftGridX: number } {
    const bounds = this.getCollisionBounds()
    const { gridSize } = this.game.tileMap
    return {
      topGridY: Math.ceil(bounds.top / gridSize),
      rightGridX: Math.floor(bounds.right / gridSize),
      bottomGridY: Math.floor(bounds.bottom / gridSize),
      leftGridX: Math.ceil(bounds.left / gridSize)
    }
  }

  getGridXY ({ floor = false, center = false } = {}): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    const collisionPosition = this.getCollisionPosition({ center })
    const ret = { gridX: collisionPosition.x / gridSize, gridY: collisionPosition.y / gridSize }
    if (floor) {
      ret.gridX = Math.floor(ret.gridX)
      ret.gridY = Math.floor(ret.gridY)
    }
    return ret
  }

  setPositionByXY ({ x, y, center = false }: { x: number, y: number, center?: boolean }): void {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const diffX = 0 - (colX + (center ? colWidth / 2 : 0))
    const diffY = 0 - (colY + (center ? colHeight / 2 : 0))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
  }

  isAlive (): boolean {
    return this.life > 0
  }

  isHealthy (): boolean {
    return this.life >= this.hitPoints * 0.4
  }

  isDead (): boolean {
    return !this.isAlive()
  }

  subLife (damage: number): void {
    this.life -= damage
    if (this.life <= 0) {
      this.removeAndDestroy()
    } else {
      this.updateLife()
      this.updateAnimation()
    }
  }

  removeAndDestroy (): void {
    this.game.deselectItem(this)
    this.removeFromParent()
    this.game.tileMap.rebuildPassableRequired = true
  }

  drawLifeBar (): void {
    this.lifeBar.draw(this.drawLifeBarOptions)
    const { offset } = this.drawLifeBarOptions
    this.lifeBar.position.set(offset.x, offset.y)
  }

  updateLife (): void {
    this.lifeBar.updateLife(this.life / this.hitPoints)
  }

  processOrders (): boolean {
    return false
  }

  handleUpdate (deltaMS: number): void {
    this.processOrders()
    this.updateAnimation()
    this.calcZIndex()
  }

  calcZIndex (): void {
    this.zIndex = this.y + this.height
  }
}

export enum BuildingAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
}
