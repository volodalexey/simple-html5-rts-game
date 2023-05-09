import { AnimatedSprite, Container, type Texture } from 'pixi.js'
import { EItemType } from '../interfaces/IItem'
import { type IMoveable } from '../interfaces/IMoveable'
import { EVectorDirection, Vector } from '../Vector'
import { type BaseActiveItem, angleDiff, wrapDirection, checkCollision, findAngleGrid, generateUid } from '../common'
import { type IItemOptions, Item } from '../Item'

export interface IProjectileTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
  explodeTextures: Texture[]
}

export interface IProjectileOptions extends IItemOptions {
  textures: IProjectileTextures
  direction: EVectorDirection
  target: BaseActiveItem
}

export class Projectile extends Item implements IMoveable {
  public commands = []
  static reloadTime = 0

  public type = EItemType.projectiles
  public distanceTolive = 0
  public damage = 0
  public distanceTravelled = 0
  public vector = new Vector({ direction: EVectorDirection.down })
  public speed = 0
  public radius = 0
  public followRadius = 0
  public turnSpeed = 0
  public turnFactor = 0
  public moveTurning = false
  public hardCollision = false
  public collisionCount = 0
  public colliding = false

  public upAnimation!: AnimatedSprite
  public upRightAnimation!: AnimatedSprite
  public rightAnimation!: AnimatedSprite
  public downRightAnimation!: AnimatedSprite
  public downAnimation!: AnimatedSprite
  public downLeftAnimation!: AnimatedSprite
  public leftAnimation!: AnimatedSprite
  public upLeftAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  public explodeAnimation!: AnimatedSprite
  public spritesContainer = new Container<AnimatedSprite>()

  constructor (options: IProjectileOptions) {
    super(options)
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.order = { type: 'fire', to: options.target }
    this.setup(options)
    this.vector.setDirection({ direction: options.direction })
    this.switchAnimation()
  }

  override setup ({
    textures: {
      upTextures,
      upRightTextures,
      rightTextures,
      downRightTextures,
      downTextures,
      downLeftTextures,
      leftTextures,
      upLeftTextures,
      explodeTextures
    }
  }: IProjectileOptions): void {
    this.addChild(this.spritesContainer)
    this.addChild(this.collisionGraphics)

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

    const explodeAnimation = new AnimatedSprite(explodeTextures)
    explodeAnimation.loop = false
    this.spritesContainer.addChild(explodeAnimation)
    this.explodeAnimation = explodeAnimation
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation (): void {
    let newAnimation
    const step = 0.5
    const { direction } = this.vector
    if ((direction >= EVectorDirection.upLeft + step && direction <= EVectorDirection.up) ||
        (direction >= EVectorDirection.up && direction <= EVectorDirection.upRight - step)) {
      // special case because of max direction
      newAnimation = this.upAnimation
    } else if (direction >= EVectorDirection.upRight + step && direction <= EVectorDirection.downRight - step) {
      newAnimation = this.rightAnimation
    } else if (direction >= EVectorDirection.downRight + step && direction <= EVectorDirection.downLeft - step) {
      newAnimation = this.downAnimation
    } else if (direction >= EVectorDirection.downLeft + step && direction <= EVectorDirection.upLeft - step) {
      newAnimation = this.leftAnimation
    } else if (direction > EVectorDirection.up && direction < EVectorDirection.right) {
      newAnimation = this.upRightAnimation
    } else if (direction > EVectorDirection.right && direction < EVectorDirection.down) {
      newAnimation = this.downRightAnimation
    } else if (direction >= EVectorDirection.down && direction < EVectorDirection.left) {
      newAnimation = this.downLeftAnimation
    } else {
      newAnimation = this.upLeftAnimation
    }
    if (newAnimation === this.currentAnimation) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }

  switchToExplodeAnimation (): void {
    this.hideAllAnimations()
    this.currentAnimation = this.explodeAnimation
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
    this.currentAnimation.onComplete = () => {
      this.removeFromParent()
    }
  }

  reachedTarget (): boolean {
    if (this.order.type === 'fire') {
      const thisBounds = this.getCollisionBounds()
      const toBounds = this.order.to.getCollisionBounds()
      return checkCollision(thisBounds, toBounds) > 0.5
    }
    return false
  }

  playHitSound (): void {}

  isExploding (): boolean {
    return this.currentAnimation === this.explodeAnimation
  }

  processOrders (): boolean {
    switch (this.order.type) {
      case 'fire': {
        // Move towards destination and stop when close by or if travelled past range
        const reachedTarget = this.reachedTarget()
        if (this.distanceTravelled > this.distanceTolive || reachedTarget) {
          if (reachedTarget) {
            this.playHitSound()

            this.order.to.subLife(this.damage)
            this.switchToExplodeAnimation()
            this.order = { type: 'stand' }
          } else {
            // Bullet fizzles out without hitting target
            this.removeFromParent()
          }
        } else {
          this._moveTo(this.order.to)
        }
        return true
      }
    }
    return false
  }

  handleUpdate (deltaMS: number): void {
    this.processOrders()
  }

  _moveTo (destination: BaseActiveItem): void {
    const thisGrid = this.getGridXY({ center: true })
    // Weapons like the heatseeker can turn slowly towards target while moving
    if (this.turnSpeed > 0) {
      const destGrid = destination.getGridXY({ center: true })
      // Find out where we need to turn to get to destination
      const newDirection = findAngleGrid({
        from: destGrid, to: thisGrid, directions: this.vector.directions
      })
      // Calculate difference between new direction and current direction
      const difference = angleDiff({
        angle1: this.vector.direction, angle2: newDirection, directions: this.vector.directions
      })
      // Calculate amount that bullet can turn per animation cycle
      const turnAmount = this.turnSpeed * this.game.turnSpeedAdjustmentFactor
      if (Math.abs(difference) > turnAmount) {
        this.vector.setDirection({
          direction: wrapDirection({
            direction: this.vector.direction + turnAmount * Math.abs(difference) / difference,
            directions: this.vector.directions
          })
        })
        this.switchAnimation()
      }
    }

    const movement = this.speed * this.game.speedAdjustmentFactor
    this.distanceTravelled += movement

    const angleRadians = -(this.vector.direction / this.vector.directions) * 2 * Math.PI
    const lastMovementGridX = -(movement * Math.sin(angleRadians))
    const lastMovementGridY = -(movement * Math.cos(angleRadians))
    const newGridX = thisGrid.gridX + lastMovementGridX
    const newGridY = thisGrid.gridY + lastMovementGridY
    this.setPositionByGridXY({
      gridX: newGridX,
      gridY: newGridY,
      center: true
    })
  }
}
