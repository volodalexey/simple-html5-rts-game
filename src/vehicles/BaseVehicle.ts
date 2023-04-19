import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { Vector, EVectorDirection } from '../Vector'
import { type Team } from '../common'
import { type ISelectable } from '../common/ISelectable'

export interface IBaseVehicleTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
}

export interface IBaseVehicleOptions {
  uid?: number
  initX?: number
  initY?: number
  team: Team
  textures: IBaseVehicleTextures
  direction?: EVectorDirection
}

export class BaseVehicle extends Container implements ISelectable {
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

  public uid?: number
  public team!: Team
  public upAnimation!: AnimatedSprite
  public upRightAnimation!: AnimatedSprite
  public rightAnimation!: AnimatedSprite
  public downRightAnimation!: AnimatedSprite
  public downAnimation!: AnimatedSprite
  public downLeftAnimation!: AnimatedSprite
  public leftAnimation!: AnimatedSprite
  public upLeftAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public spritesContainer = new Container<AnimatedSprite>()
  public velocity = new Vector({ direction: EVectorDirection.down, speed: 0 })

  constructor (options: IBaseVehicleOptions) {
    super()
    this.uid = options.uid
    this.team = options.team
    this.setup(options)
    if (options.initX != null) {
      this.position.x = options.initX
    }
    if (options.initY != null) {
      this.position.y = options.initY
    }
    if (options.direction) {
      this.velocity.setDirection({ direction: options.direction, speed: 0 })
      this.switchAnimation(options.direction)
    }
  }

  setup ({
    textures: {
      upTextures,
      upRightTextures,
      rightTextures,
      downRightTextures,
      downTextures,
      downLeftTextures,
      leftTextures,
      upLeftTextures
    }
  }: IBaseVehicleOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.spritesContainer)

    const upAnimation = new AnimatedSprite(upTextures)
    this.spritesContainer.addChild(upAnimation)
    this.upAnimation = upAnimation

    const upRightAnimation = new AnimatedSprite(upRightTextures)
    this.spritesContainer.addChild(upRightAnimation)
    this.upRightAnimation = upRightAnimation

    const rightAnimation = new AnimatedSprite(rightTextures)
    this.spritesContainer.addChild(rightAnimation)
    this.rightAnimation = rightAnimation

    const downRightAnimation = new AnimatedSprite(downRightTextures)
    this.spritesContainer.addChild(downRightAnimation)
    this.downRightAnimation = downRightAnimation

    const downAnimation = new AnimatedSprite(downTextures)
    this.spritesContainer.addChild(downAnimation)
    this.downAnimation = downAnimation

    const downLeftAnimation = new AnimatedSprite(downLeftTextures)
    this.spritesContainer.addChild(downLeftAnimation)
    this.downLeftAnimation = downLeftAnimation

    const leftAnimation = new AnimatedSprite(leftTextures)
    this.spritesContainer.addChild(leftAnimation)
    this.leftAnimation = leftAnimation

    const upLeftAnimation = new AnimatedSprite(upLeftTextures)
    this.spritesContainer.addChild(upLeftAnimation)
    this.upLeftAnimation = upLeftAnimation
  }

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation (direction: EVectorDirection): void {
    let newAnimation
    switch (direction) {
      case EVectorDirection.up:
        newAnimation = this.upAnimation
        break
      case EVectorDirection.upRight:
        newAnimation = this.upRightAnimation
        break
      case EVectorDirection.right:
        newAnimation = this.rightAnimation
        break
      case EVectorDirection.downRight:
        newAnimation = this.downRightAnimation
        break
      case EVectorDirection.down:
        newAnimation = this.downAnimation
        break
      case EVectorDirection.downLeft:
        newAnimation = this.downLeftAnimation
        break
      case EVectorDirection.left:
        newAnimation = this.leftAnimation
        break
      case EVectorDirection.upLeft:
        newAnimation = this.upLeftAnimation
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

  drawSelection (): void {
    const { offset, lineWidth, lineColor, strokeWidth, strokeColor, radius } = this.drawSelectionOptions
    this.selectedGraphics.lineStyle({
      width: lineWidth,
      color: lineColor
    })
    this.selectedGraphics.drawCircle(offset.x, offset.y, radius)
    this.selectedGraphics.endFill()
    this.selectedGraphics.lineStyle({
      width: strokeWidth,
      color: strokeColor
    })
    this.selectedGraphics.drawCircle(offset.x, offset.y, radius + strokeWidth)
    this.selectedGraphics.endFill()
    this.selectedGraphics.alpha = 0
  }

  isAlive (): boolean {
    return true
  }
}
