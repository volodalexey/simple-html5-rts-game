import { AnimatedSprite, Container, type Texture } from 'pixi.js'
import { EItemType, type IItem } from '../interfaces/IItem'
import { type IMoveable } from '../interfaces/IMoveable'
import { EVectorDirection, Vector } from '../Vector'
import { type Game } from '../Game'
import { type IOrder } from '../interfaces/IOrder'
import { findAngle, type BaseActiveItem, angleDiff, wrapDirection } from '../common'

export interface IBaseProjectileTextures {
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

export interface IBaseProjectileOptions {
  game: Game
  textures: IBaseProjectileTextures
  direction: EVectorDirection
  initX: number
  initY: number
  target: BaseActiveItem
}

export class BaseProjectile extends Container implements IItem, IMoveable {
  static reloadTime = 0

  public game: Game
  public type = EItemType.bullets
  public range = 0
  public damage = 0
  public distanceTravelled = 0
  public vector = new Vector({ direction: EVectorDirection.down })
  public speed = 0
  public turnSpeed = 0
  public hardCollision = false
  public colliding = false
  public lastMovementGridX = 0
  public lastMovementGridY = 0
  public orders: IOrder

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

  constructor (options: IBaseProjectileOptions) {
    super()
    this.game = options.game
    this.orders = { type: 'fire', to: options.target }
    this.setup(options)
    this.position.set(options.initX, options.initY)
    this.vector.setDirection({ direction: options.direction })
    this.switchAnimationByDirection(options.direction)
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
      upLeftTextures,
      explodeTextures
    }
  }: IBaseProjectileOptions): void {
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

  switchAnimationByDirection (direction: EVectorDirection): void {
    let newAnimation
    const step = 0.5
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

  getGridXY ({ floor = false, center = false } = {}): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    let ret = { gridX: this.x / gridSize, gridY: this.y / gridSize }
    if (center) {
      ret = { gridX: (this.x + this.width / 2) / gridSize, gridY: (this.y + this.height / 2) / gridSize }
    } else {
      ret = { gridX: this.x / gridSize, gridY: this.y / gridSize }
    }
    if (floor) {
      ret.gridX = Math.floor(ret.gridX)
      ret.gridY = Math.floor(ret.gridY)
    }
    return ret
  }

  setPositionByGridXY ({ gridX, gridY }: { gridX: number, gridY: number }): void {
    const { gridSize } = this.game.tileMap
    this.position.set(gridX * gridSize, gridY * gridSize)
  }

  reachedTarget (): boolean {
    if (this.orders.type === 'fire') {
      const item = this.orders.to
      return this.x >= item.x &&
      this.x <= item.x + item.width &&
      this.y >= item.y &&
      this.y <= item.y + item.height
    }
    return false
  }

  playHitSound (): void {}

  isExploding (): boolean {
    return this.currentAnimation === this.explodeAnimation
  }

  processOrders (): void {
    this.lastMovementGridX = 0
    this.lastMovementGridY = 0
    switch (this.orders.type) {
      case 'fire': {
        // Move towards destination and stop when close by or if travelled past range
        const reachedTarget = this.reachedTarget()
        if (this.distanceTravelled > this.range || reachedTarget) {
          if (reachedTarget) {
            this.playHitSound()

            this.orders.to.subLife(this.damage)
            this.switchToExplodeAnimation()
            this.orders = { type: 'stand' }
          } else {
            // Bullet fizzles out without hitting target
            this.removeFromParent()
          }
        } else {
          this.moveTo(this.orders.to)
        }
        break
      }
    }
  }

  handleUpdate (deltaMS: number): void {
    this.processOrders()
  }

  moveTo (destination: BaseActiveItem): void {
    const thisGrid = this.getGridXY()
    // Weapons like the heatseeker can turn slowly towards target while moving
    if (this.turnSpeed > 0) {
      const destGrid = destination.getGridXY({ center: true })
      // Find out where we need to turn to get to destination
      const newDirection = findAngle({
        object: {
          x: destGrid.gridX,
          y: destGrid.gridY
        },
        unit: { x: thisGrid.gridX, y: thisGrid.gridY },
        directions: this.vector.directions
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
      }
    }

    const movement = this.speed * this.game.speedAdjustmentFactor
    this.distanceTravelled += movement

    const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
    this.lastMovementGridX = -(movement * Math.sin(angleRadians))
    this.lastMovementGridY = -(movement * Math.cos(angleRadians))
    const newGridX = thisGrid.gridX + this.lastMovementGridX
    const newGridY = thisGrid.gridY + this.lastMovementGridY
    this.setPositionByGridXY({
      gridX: newGridX,
      gridY: newGridY
    })
  }
}
