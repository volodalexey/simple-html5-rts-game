import { AnimatedSprite, Container, type Texture } from 'pixi.js'
import { Team } from '../common'
import { BaseAnimation, BaseBuilding } from './BaseBuilding'

interface IBaseTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
  constructingTextures: Texture[]
}

export interface IBaseOptions {
  uid?: number
  initX?: number
  initY?: number
  team: Team
}

export class Base extends BaseBuilding {
  static blueTextures: {
    healthyTextures: Texture[]
    damagedTextures: Texture[]
    constructingTextures: Texture[]
  }

  static greenTextures: {
    healthyTextures: Texture[]
    damagedTextures: Texture[]
    constructingTextures: Texture[]
  }

  public healthyAnimation!: AnimatedSprite
  public damagedAnimation!: AnimatedSprite
  public constructingAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public spritesContainer = new Container<AnimatedSprite>()
  static options = {
    healthyAnimationSpeed: 0.1,
    damagedAnimationSpeed: 0.1,
    constructingAnimationSpeed: 0.1
  }

  constructor (options: IBaseOptions) {
    super(options)

    this.setup(options)

    this.switchAnimation(BaseAnimation.healthy)
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

  setup (_: IBaseOptions): void {
    this.addChild(this.spritesContainer)

    const { team } = this
    const { blueTextures, greenTextures } = Base
    const { healthyTextures, damagedTextures, constructingTextures } = team === Team.blue ? blueTextures : greenTextures
    const { healthyAnimationSpeed, damagedAnimationSpeed, constructingAnimationSpeed } = Base.options
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
}
