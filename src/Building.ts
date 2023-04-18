import { AnimatedSprite, Container, type Texture } from 'pixi.js'
import { Team } from './common'

export class BaseBuilding extends Container {
  public buildableGrid = [
    [1, 1],
    [1, 1]
  ]

  public passableGrid = [
    [1, 1],
    [1, 1]
  ]

  public sight = 3
  public hitPoints = 500
  public cost = 5000
  public life = 100
}

export interface IBaseOptions {
  initX?: number
  initY?: number
  team: Team
}

export enum BaseAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  constructing = 'constructing',
}

interface IBaseTextures {
  healthyTextures: Texture[]
  damagedTextures: Texture[]
  constructingTextures: Texture[]
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

  public team!: Team
  public healthyAnimation!: AnimatedSprite
  public damagedAnimation!: AnimatedSprite
  public constructingAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public animationsContainer = new Container<AnimatedSprite>()
  static options = {
    healthyAnimationSpeed: 0.1,
    damagedAnimationSpeed: 0.1,
    constructingAnimationSpeed: 0.1
  }

  constructor (options: IBaseOptions) {
    super()
    this.team = options.team
    this.setup(options)
    if (options.initX != null) {
      this.position.x = options.initX
    }
    if (options.initY != null) {
      this.position.y = options.initY
    }

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
    this.addChild(this.animationsContainer)

    const { team } = this
    const { blueTextures, greenTextures } = Base
    const { healthyTextures, damagedTextures, constructingTextures } = team === Team.blue ? blueTextures : greenTextures
    const { healthyAnimationSpeed, damagedAnimationSpeed, constructingAnimationSpeed } = Base.options
    const healthyAnimation = new AnimatedSprite(healthyTextures)
    healthyAnimation.animationSpeed = healthyAnimationSpeed
    this.animationsContainer.addChild(healthyAnimation)
    this.healthyAnimation = healthyAnimation

    const damagedAnimation = new AnimatedSprite(damagedTextures)
    damagedAnimation.animationSpeed = damagedAnimationSpeed
    this.animationsContainer.addChild(damagedAnimation)
    this.damagedAnimation = damagedAnimation

    const constructingAnimation = new AnimatedSprite(constructingTextures)
    constructingAnimation.animationSpeed = constructingAnimationSpeed
    this.animationsContainer.addChild(constructingAnimation)
    this.constructingAnimation = constructingAnimation
  }

  hideAllAnimations (): void {
    this.animationsContainer.children.forEach(spr => {
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
