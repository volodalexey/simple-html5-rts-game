import { AnimatedSprite, Container, type Texture } from 'pixi.js'
import { EItemType } from '../interfaces/IItem'
import { LifeBar } from '../LifeBar'
import { type ECommandName } from '../Command'
import { type ISelectableLifeableItemOptions, SelectableLifeableSquareItem } from '../SelectableLifeableItem'

export interface IBuildingTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
}

export interface IBuildingOptions extends ISelectableLifeableItemOptions {
  textures: IBuildingTextures
}

export class Building extends SelectableLifeableSquareItem {
  public commands: ECommandName[] = []
  public spritesContainer = new Container<AnimatedSprite>()
  public buildableGrid: number[][] = []
  public passableGrid: number[][] = []

  public type = EItemType.buildings
  public radius = 0
  public cost = 0
  public healthyAnimation!: AnimatedSprite
  public damagedAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public healthyAnimationSpeed = 0.1
  public damagedAnimationSpeed = 0.1

  constructor (options: IBuildingOptions) {
    super(options)
    this.setup(options)
  }

  override setup (options: IBuildingOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.spritesContainer)
    this.addChild(this.collisionGraphics)
    const {
      textures: {
        healthyTextures,
        damagedTextures
      }
    } = options

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

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  updateAnimation (): void {
    if (this.isHealthy()) {
      this.switchAnimation(BuildingAnimation.healthy)
    } else if (this.isAlive()) {
      this.switchAnimation(BuildingAnimation.damaged)
    }
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
