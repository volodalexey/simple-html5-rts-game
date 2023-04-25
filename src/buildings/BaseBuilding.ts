import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { type Team } from '../common'
import { type ISelectable } from '../interfaces/ISelectable'
import { type ILifeable } from '../interfaces/ILifeable'
import { EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'
import { type IOrder } from '../interfaces/IOrder'
import { LifeBar } from '../LifeBar'
import { logBuildingBounds } from '../logger'

export interface IBaseBuildingTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
  constructingTextures: Texture[]
}

export interface IBaseBuildingOptions {
  game: Game
  uid?: number
  initX: number
  initY: number
  team: Team
  textures: IBaseBuildingTextures
  life?: number
  selectable?: boolean
  orders?: IOrder
}

export class BaseBuilding extends Container implements IItem, ISelectable, ILifeable {
  public selected = false
  public selectable = true
  public selectedGraphics = new Container()
  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 0,
    strokeWidth: 0,
    strokeColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

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

  public lifeBar!: LifeBar

  public spritesContainer = new Container<AnimatedSprite>()

  public buildableGrid: number[][] = []
  public passableGrid: number[][] = []

  public orders: IOrder
  public sight = 3
  public hitPoints = 0
  public life = 0
  public cost = 0

  public game: Game
  public uid?: number
  public type = EItemType.buildings
  public team: Team
  public healthyAnimation!: AnimatedSprite
  public damagedAnimation!: AnimatedSprite
  public constructingAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public healthyAnimationSpeed = 0.1
  public damagedAnimationSpeed = 0.1
  public constructingAnimationSpeed = 0.1

  constructor (options: IBaseBuildingOptions) {
    super()
    this.game = options.game
    this.uid = options.uid
    this.team = options.team
    this.orders = options.orders ?? { type: 'stand' }
    if (options.life != null) {
      this.life = options.life
    }
    if (typeof options.selectable === 'boolean') {
      this.selectable = options.selectable
    }
    this.setup(options)

    this.updateAnimation()
  }

  setup ({
    textures: {
      healthyTextures,
      damagedTextures,
      constructingTextures
    }
  }: IBaseBuildingOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.spritesContainer)

    const { healthyAnimationSpeed, damagedAnimationSpeed, constructingAnimationSpeed } = this

    const healthyAnimation = new AnimatedSprite(healthyTextures)
    healthyAnimation.animationSpeed = healthyAnimationSpeed
    this.spritesContainer.addChild(healthyAnimation)
    this.healthyAnimation = healthyAnimation

    const damagedAnimation = new AnimatedSprite(damagedTextures)
    damagedAnimation.animationSpeed = damagedAnimationSpeed
    this.spritesContainer.addChild(damagedAnimation)
    this.damagedAnimation = damagedAnimation

    const constructingAnimation = new AnimatedSprite(constructingTextures)
    constructingAnimation.animationSpeed = constructingAnimationSpeed
    this.spritesContainer.addChild(constructingAnimation)
    this.constructingAnimation = constructingAnimation

    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, width, height } = this.drawSelectionOptions
    this.selectedGraphics.position.set(offset.x, offset.y)
    const selection = new Graphics()
    this.selectedGraphics.addChild(selection)
    selection.beginFill(strokeColor)
    selection.drawRect(0, 0, width, height)
    selection.endFill()
    selection.beginHole()
    selection.drawRect(strokeWidth, strokeWidth, width - strokeWidth * 2, height - strokeWidth * 2)
    selection.endHole()
    this.selectedGraphics.alpha = 0
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation (animation: BaseAnimation): void {
    let newAnimation
    switch (animation) {
      case BaseAnimation.healthy:
        newAnimation = this.healthyAnimation
        break
      case BaseAnimation.damaged:
        newAnimation = this.damagedAnimation
        break
      case BaseAnimation.constructing:
        newAnimation = this.constructingAnimation
        break
    }
    if (newAnimation === this.currentAnimation) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }

  updateAnimation (): void {
    if (this.life > this.hitPoints * 0.4) {
      this.switchAnimation(BaseAnimation.healthy)
    } else if (this.life > 0) {
      this.switchAnimation(BaseAnimation.damaged)
    }
  }

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  getSelectionPosition ({ center = false } = {}): { x: number, y: number } {
    const sub = this.drawSelectionOptions.strokeWidth
    const ret = {
      x: this.x + this.selectedGraphics.x + sub,
      y: this.y + this.selectedGraphics.y + sub
    }
    if (center) {
      ret.x += (this.selectedGraphics.width - sub * 2) / 2
      ret.y += (this.selectedGraphics.height - sub * 2) / 2
    }
    return ret
  }

  getSelectionBounds (): { top: number, right: number, bottom: number, left: number } {
    const selectionPosition = this.getSelectionPosition()
    const sub = this.drawSelectionOptions.strokeWidth
    return {
      top: selectionPosition.y,
      right: selectionPosition.x + this.selectedGraphics.width - sub * 2,
      bottom: selectionPosition.y + this.selectedGraphics.height - sub * 2,
      left: selectionPosition.x
    }
  }

  getGridXY ({ floor = false, center = false } = {}): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    const selectionPosition = this.getSelectionPosition({ center })
    const ret = { gridX: selectionPosition.x / gridSize, gridY: selectionPosition.y / gridSize }
    if (floor) {
      ret.gridX = Math.floor(ret.gridX)
      ret.gridY = Math.floor(ret.gridY)
    }
    return ret
  }

  setPositionByXY ({ x, y, center = false }: { x: number, y: number, center?: boolean }): void {
    const sub = this.drawSelectionOptions.strokeWidth
    const diffX = 0 - (this.selectedGraphics.x + (center ? this.selectedGraphics.width / 2 : sub))
    const diffY = 0 - (this.selectedGraphics.y + (center ? this.selectedGraphics.height / 2 : sub))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
  }

  checkDrawBuildingBounds (): void {
    if (logBuildingBounds.enabled) {
      const selectionBounds = this.getSelectionBounds()
      const gr = new Graphics()
      gr.beginFill(0xffffff)
      gr.alpha = 0.5
      gr.drawRect(selectionBounds.left - this.x, selectionBounds.top - this.y, selectionBounds.right - selectionBounds.left, selectionBounds.bottom - selectionBounds.top)
      gr.endFill()
      this.addChild(gr)
    }
  }

  isAlive (): boolean {
    return this.life > 0
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
    this.game.tileMap.currentMapPassableGrid = []
  }

  drawLifeBar (): void {
    this.lifeBar.draw(this.drawLifeBarOptions)
    const { offset } = this.drawLifeBarOptions
    this.lifeBar.position.set(offset.x, offset.y)
  }

  updateLife (): void {
    this.lifeBar.updateLife(this.life / this.hitPoints)
  }

  processOrders (): void {

  }

  handleUpdate (deltaMS: number): void {
    this.processOrders()
  }
}

export enum BaseAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  constructing = 'constructing',
}
