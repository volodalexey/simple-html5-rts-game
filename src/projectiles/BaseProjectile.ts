import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { EItemType, type IItem } from '../interfaces/IItem'
import { type IMoveable } from '../interfaces/IMoveable'
import { EVectorDirection, Vector } from '../Vector'
import { type Game } from '../Game'
import { type IOrder } from '../interfaces/IOrder'
import { type BaseActiveItem, angleDiff, wrapDirection, checkCollision, findAngleGrid, generateUid } from '../common'
import { logProjectileBounds } from '../logger'

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
  uid?: number
}

export class BaseProjectile extends Container implements IItem, IMoveable {
  static reloadTime = 0

  public game: Game
  public uid: number
  public type = EItemType.bullets
  public ordersable = true
  public range = 0
  public damage = 0
  public distanceTravelled = 0
  public vector = new Vector({ direction: EVectorDirection.down })
  public speed = 0
  public turnSpeed = 0
  public moveTurning = false
  public hardCollision = false
  public collisionCount = 0
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
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.orders = { type: 'fire', to: options.target }
    this.setup(options)
    this.setPositionByXY({ x: options.initX, y: options.initY, center: true })
    this.vector.setDirection({ direction: options.direction })
    this.switchAnimationByDirection(options.direction)

    this.checkDrawProjectileBounds()
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

  getSelectionPosition ({ center = false } = {}): { x: number, y: number } {
    const ret = {
      x: this.x,
      y: this.y
    }
    if (center) {
      ret.x += this.width / 2
      ret.y += this.height / 2
    }
    return ret
  }

  getSelectionBounds (): { top: number, right: number, bottom: number, left: number } {
    const selectionPosition = this.getSelectionPosition()
    return {
      top: selectionPosition.y,
      right: selectionPosition.x + this.width,
      bottom: selectionPosition.y + this.height,
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
    const diffX = 0 - (center ? this.upAnimation.width / 2 : 0)
    const diffY = 0 - (center ? this.upAnimation.height / 2 : 0)
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
  }

  checkDrawProjectileBounds (): void {
    if (logProjectileBounds.enabled) {
      const gr = new Graphics()
      gr.beginFill(0xffffff)
      gr.alpha = 0.5
      gr.drawRect(0, 0, this.width, this.height)
      gr.endFill()
      this.addChild(gr)
    }
  }

  reachedTarget (): boolean {
    if (this.orders.type === 'fire') {
      const thisBounds = this.getSelectionBounds()
      const toBounds = this.orders.to.getSelectionBounds()
      return checkCollision(thisBounds, toBounds) > 0.12
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
          this._moveTo(this.orders.to)
        }
        break
      }
    }
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
      }
    }

    const movement = this.speed * this.game.speedAdjustmentFactor
    this.distanceTravelled += movement

    const angleRadians = -(this.vector.direction / this.vector.directions) * 2 * Math.PI
    this.lastMovementGridX = -(movement * Math.sin(angleRadians))
    this.lastMovementGridY = -(movement * Math.cos(angleRadians))
    const newGridX = thisGrid.gridX + this.lastMovementGridX
    const newGridY = thisGrid.gridY + this.lastMovementGridY
    this.setPositionByGridXY({
      gridX: newGridX,
      gridY: newGridY,
      center: true
    })
  }
}
