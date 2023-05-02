import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team } from '../common'
import { Building, type IBuildingOptions, type IBuildingTextures } from './Building'
import { type IBuildable } from '../interfaces/IBuildable'

export type IOilDerrickOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
> & {
  initialAnimation?: OilDerrickAnimation
}

export interface IOilDerrickTextures extends IBuildingTextures {
  deployTextures: Texture[]
}

export enum OilDerrickAnimation {
  deploy = 'deploy',
  healthy = 'healthy',
  damaged = 'damaged',
}

export class OilDerrick extends Building implements IBuildable {
  static blueTextures: IOilDerrickTextures
  static greenTextures: IOilDerrickTextures
  static textures (team: Team): IOilDerrickTextures {
    return team === Team.blue ? OilDerrick.blueTextures : OilDerrick.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IOilDerrickTextures
    greenTextures: IOilDerrickTextures
  }): void {
    OilDerrick.blueTextures = blueTextures
    OilDerrick.greenTextures = greenTextures
  }

  public drawSelectionOptions = {
    width: 40,
    height: 22,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 0,
      y: 39
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 36,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 2,
      y: -4
    }
  }

  public sight = 3
  public cost = 5000
  public hitPoints = 300
  public life = this.hitPoints
  public deployAnimationSpeed = 0.1
  public deployAnimation!: AnimatedSprite

  static buildableGrid = [
    [1, 1]
  ]

  static passableGrid = [
    [1, 1]
  ]

  constructor (options: IOilDerrickOptions) {
    super({
      ...options,
      textures: OilDerrick.textures(options.team)
    })
    this.buildableGrid = OilDerrick.buildableGrid
    this.passableGrid = OilDerrick.passableGrid
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.deployAnimation.animationSpeed = this.deployAnimationSpeed
    if (options.initialAnimation) {
      this.switchAnimation(options.initialAnimation)
    } else {
      this.updateAnimation()
    }

    this.checkDrawBuildingBounds()
  }

  setup (options: IOilDerrickOptions): void {
    super.setup({
      ...options,
      textures: OilDerrick.textures(options.team)
    })
    const { deployTextures } = OilDerrick.textures(this.team)
    const deployAnimation = new AnimatedSprite(deployTextures)
    this.spritesContainer.addChild(deployAnimation)
    this.deployAnimation = deployAnimation
  }

  isDeploying (): boolean {
    return this.currentAnimation === this.deployAnimation
  }

  updateAnimation (): void {
    if (this.isHealthy()) {
      if (this.isDeploying() && this.deployAnimation.currentFrame === this.deployAnimation.totalFrames - 1) {
        this.switchAnimation(OilDerrickAnimation.healthy)
      }
    } else if (this.isAlive()) {
      this.switchAnimation(OilDerrickAnimation.damaged)
    }
  }

  switchAnimation <T>(animation: T): void {
    let newAnimation
    switch (animation) {
      case OilDerrickAnimation.deploy:
        newAnimation = this.deployAnimation
        break
      case OilDerrickAnimation.healthy:
        newAnimation = this.healthyAnimation
        break
      case OilDerrickAnimation.damaged:
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
}
