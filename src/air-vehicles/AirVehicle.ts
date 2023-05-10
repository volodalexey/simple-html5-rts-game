import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { Vector, EVectorDirection } from '../Vector'
import { findAngle, angleDiff, wrapDirection, findAngleGrid } from '../common'
import { EItemType } from '../interfaces/IItem'
import { type IMoveable } from '../interfaces/IMoveable'
import { type IPointGridData } from '../interfaces/IOrder'
import { LifeBar } from '../LifeBar'
import { type ITurnable } from '../interfaces/ITurnable'
import { ECommandName } from '../Command'
import { TeleportableSelectableLifeableRoundItem, type ITeleportableSelectableLifeableRoundItemOptions } from '../TeleportableSelectableLifeableRoundItem'

export interface IAirVehicleTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
}

export interface IAirVehicleOptions extends ITeleportableSelectableLifeableRoundItemOptions {
  textures: {
    body: IAirVehicleTextures
    shadow: IAirVehicleTextures
  }
  direction?: EVectorDirection
  teleport?: boolean
}

enum ECollisionType {
  soft = 'soft',
  hard = 'hard',
  attraction = 'attraction',
}

export class AirVehicle extends TeleportableSelectableLifeableRoundItem implements IMoveable, ITurnable {
  public commands = [ECommandName.moveFollow, ECommandName.patrol]
  public type = EItemType.airVehicles
  public bodyAnimation!: {
    upAnimation: AnimatedSprite
    upRightAnimation: AnimatedSprite
    rightAnimation: AnimatedSprite
    downRightAnimation: AnimatedSprite
    downAnimation: AnimatedSprite
    downLeftAnimation: AnimatedSprite
    leftAnimation: AnimatedSprite
    upLeftAnimation: AnimatedSprite
  }

  public currentBodyAnimation!: AnimatedSprite

  public shadowAnimation!: {
    upAnimation: AnimatedSprite
    upRightAnimation: AnimatedSprite
    rightAnimation: AnimatedSprite
    downRightAnimation: AnimatedSprite
    downAnimation: AnimatedSprite
    downLeftAnimation: AnimatedSprite
    leftAnimation: AnimatedSprite
    upLeftAnimation: AnimatedSprite
  }

  public currentShadowAnimation!: AnimatedSprite
  public drawShadowOptions = {
    offset: {
      x: 0,
      y: 0
    }
  }

  public bodySpritesContainer = new Container<AnimatedSprite>()
  public shadowSpritesContainer = new Container<AnimatedSprite>()
  public vector = new Vector({ direction: EVectorDirection.down })
  public speed = 0
  public moveTurning = false
  public turnSpeed = 0
  public turnFactor = 0
  public hardCollision = false
  public collisionCount = 0
  public colliding = false
  public followRadius = 4
  public elapsedSwitchFrames = 0
  public switchFrames = 30 // allow to switch animation direction only once per some time to avoid jumping on edges

  constructor (options: IAirVehicleOptions) {
    super(options)
    this.order = options.order ?? { type: 'stand' }
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
    }
    this.setup(options)
  }

  override setup (options: IAirVehicleOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.bodySpritesContainer)
    this.addChild(this.shadowSpritesContainer)
    this.addChild(this.collisionGraphics)
    const {
      textures: {
        body,
        shadow
      },
      teleport
    } = options
    if (teleport === true) {
      this.teleportGraphics = new Graphics()
      this.addChild(this.teleportGraphics)
    }

    const bodyUpAnimation = new AnimatedSprite(body.upTextures)
    this.bodySpritesContainer.addChild(bodyUpAnimation)

    const bodyUpRightAnimation = new AnimatedSprite(body.upRightTextures)
    this.bodySpritesContainer.addChild(bodyUpRightAnimation)

    const bodyRightAnimation = new AnimatedSprite(body.rightTextures)
    this.bodySpritesContainer.addChild(bodyRightAnimation)

    const bodyDownRightAnimation = new AnimatedSprite(body.downRightTextures)
    this.bodySpritesContainer.addChild(bodyDownRightAnimation)

    const bodyDownAnimation = new AnimatedSprite(body.downTextures)
    this.bodySpritesContainer.addChild(bodyDownAnimation)

    const bodyDownLeftAnimation = new AnimatedSprite(body.downLeftTextures)
    this.bodySpritesContainer.addChild(bodyDownLeftAnimation)

    const bodyLeftAnimation = new AnimatedSprite(body.leftTextures)
    this.bodySpritesContainer.addChild(bodyLeftAnimation)

    const bodyUpLeftAnimation = new AnimatedSprite(body.upLeftTextures)
    this.bodySpritesContainer.addChild(bodyUpLeftAnimation)

    this.bodyAnimation = {
      upAnimation: bodyUpAnimation,
      upRightAnimation: bodyUpRightAnimation,
      rightAnimation: bodyRightAnimation,
      downRightAnimation: bodyDownRightAnimation,
      downAnimation: bodyDownAnimation,
      downLeftAnimation: bodyDownLeftAnimation,
      leftAnimation: bodyLeftAnimation,
      upLeftAnimation: bodyUpLeftAnimation
    }

    const shadowUpAnimation = new AnimatedSprite(shadow.upTextures)
    this.shadowSpritesContainer.addChild(shadowUpAnimation)

    const shadowUpRightAnimation = new AnimatedSprite(shadow.upRightTextures)
    this.shadowSpritesContainer.addChild(shadowUpRightAnimation)

    const shadowRightAnimation = new AnimatedSprite(shadow.rightTextures)
    this.shadowSpritesContainer.addChild(shadowRightAnimation)

    const shadowDownRightAnimation = new AnimatedSprite(shadow.downRightTextures)
    this.shadowSpritesContainer.addChild(shadowDownRightAnimation)

    const shadowDownAnimation = new AnimatedSprite(shadow.downTextures)
    this.shadowSpritesContainer.addChild(shadowDownAnimation)

    const shadowDownLeftAnimation = new AnimatedSprite(shadow.downLeftTextures)
    this.shadowSpritesContainer.addChild(shadowDownLeftAnimation)

    const shadowLeftAnimation = new AnimatedSprite(shadow.leftTextures)
    this.shadowSpritesContainer.addChild(shadowLeftAnimation)

    const shadowUpLeftAnimation = new AnimatedSprite(shadow.upLeftTextures)
    this.shadowSpritesContainer.addChild(shadowUpLeftAnimation)

    this.shadowAnimation = {
      upAnimation: shadowUpAnimation,
      upRightAnimation: shadowUpRightAnimation,
      rightAnimation: shadowRightAnimation,
      downRightAnimation: shadowDownRightAnimation,
      downAnimation: shadowDownAnimation,
      downLeftAnimation: shadowDownLeftAnimation,
      leftAnimation: shadowLeftAnimation,
      upLeftAnimation: shadowUpLeftAnimation
    }

    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  hideAllBodyAnimations (): void {
    this.bodySpritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  hideAllShadowAnimations (): void {
    this.shadowSpritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  updateAnimation (allowSwitch = false): void {
    this.switchAnimation(this.vector.direction, allowSwitch)
  }

  switchAnimation (direction: EVectorDirection, allowSwitch: boolean): void {
    let newBodyAnimation
    let newShadowAnimation
    const step = 0.5
    if ((direction >= EVectorDirection.upLeft + step && direction <= EVectorDirection.upLeft + 1) ||
        (direction >= EVectorDirection.up && direction <= EVectorDirection.upRight - step)) {
      // special case because of max direction
      newBodyAnimation = this.bodyAnimation.upAnimation
      newShadowAnimation = this.shadowAnimation.upAnimation
    } else if (direction >= EVectorDirection.upRight + step && direction <= EVectorDirection.downRight - step) {
      newBodyAnimation = this.bodyAnimation.rightAnimation
      newShadowAnimation = this.shadowAnimation.rightAnimation
    } else if (direction >= EVectorDirection.downRight + step && direction <= EVectorDirection.downLeft - step) {
      newBodyAnimation = this.bodyAnimation.downAnimation
      newShadowAnimation = this.shadowAnimation.downAnimation
    } else if (direction >= EVectorDirection.downLeft + step && direction <= EVectorDirection.upLeft - step) {
      newBodyAnimation = this.bodyAnimation.leftAnimation
      newShadowAnimation = this.shadowAnimation.leftAnimation
    } else if (direction > EVectorDirection.up && direction < EVectorDirection.right) {
      newBodyAnimation = this.bodyAnimation.upRightAnimation
      newShadowAnimation = this.shadowAnimation.upRightAnimation
    } else if (direction > EVectorDirection.right && direction < EVectorDirection.down) {
      newBodyAnimation = this.bodyAnimation.downRightAnimation
      newShadowAnimation = this.shadowAnimation.downRightAnimation
    } else if (direction >= EVectorDirection.down && direction < EVectorDirection.left) {
      newBodyAnimation = this.bodyAnimation.downLeftAnimation
      newShadowAnimation = this.shadowAnimation.downLeftAnimation
    } else {
      newBodyAnimation = this.bodyAnimation.upLeftAnimation
      newShadowAnimation = this.shadowAnimation.upLeftAnimation
    }
    if (newBodyAnimation === this.currentBodyAnimation || !allowSwitch) {
      return
    }
    this.currentBodyAnimation = newBodyAnimation
    this.currentShadowAnimation = newShadowAnimation
    this.hideAllBodyAnimations()
    this.hideAllShadowAnimations()
    this.currentBodyAnimation.gotoAndPlay(0)
    this.currentShadowAnimation.gotoAndPlay(0)
    this.currentBodyAnimation.visible = true
    this.currentShadowAnimation.visible = true
  }

  processOrders (): boolean {
    const { tileMap } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.order.type) {
      case 'move': {
        this.collisionCount = 0
        // Move towards destination until distance from destination is less than aircraft radius
        const distanceFromDestinationSquared = (Math.pow(this.order.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.order.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.collisionRadius / tileMap.gridSize, 2)) {
          this.order = { type: 'stand' }
          return true
        } else {
          if (this.colliding && (distanceFromDestinationSquared) < Math.pow(this.collisionRadius * 5 / tileMap.gridSize, 2)) {
            // Count collsions within 5 radius distance of goal
            if (this.collisionCount === 0) {
              this.collisionCount = 1
            } else {
              this.collisionCount++
            }
            // Stop if more than 30 collisions occur
            if (this.collisionCount > 30) {
              this.order = { type: 'stand' }
              return true
            }
          }
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo(this.order.toPoint, distanceFromDestination)
          // Pathfinding couldn't find a path so stop
          if (!moving) {
            this.order = { type: 'stand' }
            return true
          }
        }
        return true
      }
      case 'follow': {
        if (this.order.to.isDead()) {
          if (this.order.nextOrder != null) {
            this.order = this.order.nextOrder
          } else {
            this.order = { type: 'stand' }
          }
          return true
        }
        const toGrid = this.order.to.getGridXY({ center: true })
        const distanceFromDestinationSquared = (Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2))
        // When approaching the target of the guard, if there is an enemy in sight, attack him
        if (distanceFromDestinationSquared < Math.pow(this.followRadius, 2)) {
          // do nothing
        } else {
          const toGrid = this.order.to.getGridXY({ center: true })
          this._moveTo({ type: this.order.to.type, ...toGrid }, distanceFromDestinationSquared)
        }
        return true
      }
      case 'patrol': {
        const distanceFromDestinationSquared = (Math.pow(this.order.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.order.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.sightRadius / tileMap.gridSize, 2)) {
          const to = this.order.toPoint
          this.order.toPoint = this.order.fromPoint
          this.order.fromPoint = to
        } else {
          this._moveTo(this.order.toPoint, distanceFromDestinationSquared)
        }
        return true
      }
    }
    return false
  }

  handleUpdate (deltaMS: number): void {
    super.handleUpdate(deltaMS)
    this.processOrders()
    if (this.elapsedSwitchFrames >= this.switchFrames) {
      this.updateAnimation(true)
      this.elapsedSwitchFrames = 0
    } else {
      this.updateAnimation(this.moveTurning || this.elapsedSwitchFrames === 0)
    }
    this.elapsedSwitchFrames += 1
    this.zIndex = this.y + this.height
  }

  checkCollisionObjects (distanceFromDestination: number): Array<{
    collisionType: ECollisionType
    with: {
      type?: string
      x: number
      y: number
    }
  }> {
    // Calculate new position on present path
    const { tileMap, speedAdjustmentFactor, speedAdjustmentWhileTurningFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })
    const maximumMovement = this.speed * speedAdjustmentFactor * (this.moveTurning ? speedAdjustmentWhileTurningFactor : 1)
    const movement = Math.min(maximumMovement, distanceFromDestination)
    const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
    const newX = thisGrid.gridX - (movement * Math.sin(angleRadians))
    const newY = thisGrid.gridY - (movement * Math.cos(angleRadians))

    // List of objects that will collide after next movement step
    const collisionObjects = []

    const { airMoveableItems } = tileMap
    for (let i = airMoveableItems.length - 1; i >= 0; i--) {
      const vehicle = airMoveableItems[i]
      const vehicleGrid = vehicle.getGridXY({ center: true })
      // Test vehicles that are less than 3 squares away for collisions
      if (vehicle !== this && Math.abs(vehicleGrid.gridX - thisGrid.gridX) < 3 && Math.abs(vehicleGrid.gridY - thisGrid.gridY) < 3) {
        const distanceSq = Math.pow(vehicleGrid.gridX - newX, 2) + Math.pow(vehicleGrid.gridY - newY, 2)
        if (distanceSq < Math.pow((this.collisionRadius + vehicle.collisionRadius) * 0.2 / tileMap.gridSize, 2)) {
          // Distance between vehicles is less than hard collision threshold (sum of vehicle radii)
          collisionObjects.push({ collisionType: ECollisionType.hard, with: { type: vehicle.type, x: vehicleGrid.gridX, y: vehicleGrid.gridY } })
        } else if (distanceSq < Math.pow((this.collisionRadius + vehicle.collisionRadius) * 0.5 / tileMap.gridSize, 2)) {
          // Distance between vehicles is less than soft collision threshold (1.5 times vehicle radius + colliding vehicle radius)
          collisionObjects.push({ collisionType: ECollisionType.soft, with: { type: vehicle.type, x: vehicleGrid.gridX, y: vehicleGrid.gridY } })
        }
      }
    }

    return collisionObjects
  }

  _moveTo (destination: IPointGridData, distanceFromDestination: number): boolean {
    const { turnSpeedAdjustmentFactor, speedAdjustmentFactor, speedAdjustmentWhileTurningFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })
    // First find path to destination
    let newDirection = findAngleGrid({
      from: destination,
      to: thisGrid,
      directions: this.vector.directions
    })

    // check if moving along current direction might cause collision..
    // If so, change newDirection
    const collisionObjects = this.checkCollisionObjects(distanceFromDestination)
    this.hardCollision = false
    if (collisionObjects.length > 0) {
      this.colliding = true

      // Create a force vector object that adds up repulsion from all colliding objects
      const forceVector = { x: 0, y: 0 }
      for (let i = collisionObjects.length - 1; i >= 0; i--) {
        const collObject = collisionObjects[i]
        const objectAngle = findAngle({
          from: collObject.with,
          to: { x: thisGrid.gridX, y: thisGrid.gridY },
          directions: this.vector.directions
        })
        const objectAngleRadians = -(objectAngle / this.vector.directions) * 2 * Math.PI
        let forceMagnitude = 0
        switch (collObject.collisionType) {
          case ECollisionType.hard:
            forceMagnitude = 1.5 + Math.random()
            this.hardCollision = true
            break
          case ECollisionType.soft:
            forceMagnitude = 0.5 + Math.random()
            break
        }

        forceVector.x += (forceMagnitude * Math.sin(objectAngleRadians))
        forceVector.y += (forceMagnitude * Math.cos(objectAngleRadians))
      }
      // Find a new direction based on the force vector
      newDirection = findAngle({ from: forceVector, to: { x: 0, y: 0 }, directions: this.vector.directions })
    } else {
      this.colliding = false
    }

    // Calculate turn amount for new direction
    const difference = angleDiff({ angle1: this.vector.direction, angle2: newDirection, directions: this.vector.directions })
    const turnAmount = this.turnSpeed * turnSpeedAdjustmentFactor

    if (Math.abs(difference) > turnAmount * this.turnFactor) {
      this.vector.setDirection({
        direction: wrapDirection({
          direction: this.vector.direction + turnAmount * Math.abs(difference) / difference,
          directions: this.vector.directions
        })
      })
      this.moveTurning = true
    } else {
      this.vector.setDirection({ direction: newDirection })
      this.moveTurning = false
    }

    const maximumMovement = this.speed * speedAdjustmentFactor * (this.moveTurning ? speedAdjustmentWhileTurningFactor : 1)
    const movement = Math.min(maximumMovement, distanceFromDestination)
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

    return true
  }

  setupShadow (): void {
    const { offset } = this.drawShadowOptions
    this.shadowSpritesContainer.position.set(offset.x, offset.y)
  }
}
