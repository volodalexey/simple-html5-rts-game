import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { type Team } from '../common'
import { type ISelectable } from '../interfaces/ISelectable'
import { type ILifeable } from '../interfaces/ILifeable'
import { EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'

export interface IBaseBuildingTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
  constructingTextures: Texture[]
}

export interface IBaseBuildingOptions {
  game: Game
  uid?: number
  initX?: number
  initY?: number
  team: Team
  textures: IBaseBuildingTextures
  life?: number
  selectable?: boolean
}

export class BaseBuilding extends Container implements IItem, ISelectable, ILifeable {
  public selected = false
  public selectable = true
  public selectedGraphics = new Graphics()
  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 0,
    lineWidth: 0,
    lineColor: 0,
    strokeWidth: 0,
    strokeColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public spritesContainer = new Container<AnimatedSprite>()

  public buildableGrid: number[][] = []
  public passableGrid: number[][] = []

  public sight = 3
  public hitPoints = 0
  public life = 0
  public cost = 0

  public game: Game
  public uid?: number
  public type = EItemType.buildings
  public team!: Team
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
    if (options.initX != null) {
      this.position.x = options.initX
    }
    if (options.initY != null) {
      this.position.y = options.initY
    }
    if (options.life != null) {
      this.life = options.life
    }
    if (typeof options.selectable === 'boolean') {
      this.selectable = options.selectable
    }
    this.setup(options)

    this.switchAnimation(BaseAnimation.healthy)
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
  }

  drawSelection (): void {
    const { offset, lineWidth, lineColor, strokeWidth, strokeColor, width, height } = this.drawSelectionOptions
    this.selectedGraphics.lineStyle({
      width: lineWidth,
      color: lineColor
    })
    this.selectedGraphics.drawRect(offset.x, offset.y, width, height)
    this.selectedGraphics.endFill()
    this.selectedGraphics.lineStyle({
      width: strokeWidth,
      color: strokeColor
    })
    this.selectedGraphics.drawRect(offset.x - strokeWidth, offset.y - strokeWidth, width + strokeWidth * 2, height + strokeWidth * 2)
    this.selectedGraphics.endFill()
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

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  isAlive (): boolean {
    return true
  }

  getGridXY (): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    return { gridX: Math.floor(this.x / gridSize), gridY: Math.floor(this.y / gridSize) }
  }

  setPositionByGridXY ({ gridX, gridY }: { gridX: number, gridY: number }): void {
    const { gridSize } = this.game.tileMap
    this.position.set(gridX * gridSize, gridY * gridSize)
  }

  processOrders (): void {

  }
}

export enum BaseAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  constructing = 'constructing',
}
