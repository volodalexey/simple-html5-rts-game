import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { Vector, EVectorDirection } from '../utils/Vector'
import { findAngle, angleDiff, wrapDirection, findAngleGrid } from '../utils/helpers'
import { EItemType } from '../interfaces/IItem'
import { AStar } from '../utils/AStar'
import { type IMoveable } from '../interfaces/IMoveable'
import { type IGridPointData } from '../interfaces/IOrder'
import { LifeBar } from '../components/LifeBar'
import { type ITurnable } from '../interfaces/ITurnable'
import { ECommandName } from '../interfaces/ICommand'
import { TeleportableSelectableLifeableRoundItem, type ITeleportableSelectableLifeableRoundItemOptions } from '../oop/TeleportableSelectableLifeableRoundItem'

export interface IVehicleTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
}

export interface IVehicleOptions extends ITeleportableSelectableLifeableRoundItemOptions {
  textures: IVehicleTextures
  direction?: EVectorDirection
}

enum ECollisionType {
  soft = 'soft',
  hard = 'hard',
  attraction = 'attraction',
}

interface IPathPoint {
  x: number
  y: number
}

export class Vehicle extends TeleportableSelectableLifeableRoundItem implements IMoveable, ITurnable {
  public commands = [ECommandName.moveFollow, ECommandName.patrol]
  public type = EItemType.vehicles
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
  public vector = new Vector({ direction: EVectorDirection.down })
  public speed = 0
  public moveTurning = false
  public turnSpeed = 0
  public turnFactor = 0
  public hardCollision = false
  public collisionCount = 0
  public colliding = false
  public followRadius = 3
  public elapsedSwitchFrames = 0
  public switchFrames = 30 // allow to switch animation direction only once per some time to avoid jumping on edges

  constructor (options: IVehicleOptions) {
    super(options)
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
    }

    this.setup(options)
  }

  override setup (options: IVehicleOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.spritesContainer)
    this.addChild(this.collisionGraphics)
    const {
      textures: {
        upTextures,
        upRightTextures,
        rightTextures,
        downRightTextures,
        downTextures,
        downLeftTextures,
        leftTextures,
        upLeftTextures
      },
      teleport
    } = options
    if (teleport === true) {
      this.teleportGraphics = new Graphics()
      this.addChild(this.teleportGraphics)
    }

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

    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  updateAnimation (allowSwitch = false): void {
    this.switchAnimation(this.vector.direction, allowSwitch)
  }

  switchAnimation (direction: EVectorDirection, allowSwitch: boolean): void {
    let newAnimation
    const step = 0.5
    if ((direction >= EVectorDirection.upLeft + step && direction <= EVectorDirection.upLeft + 1) ||
        (direction >= EVectorDirection.up && direction <= EVectorDirection.upRight - step)) {
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
    if (newAnimation === this.currentAnimation || !allowSwitch) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }

  processOrder (): boolean {
    if (this.order.processed === true) {
      return true
    }
    const { tileMap } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.order.type) {
      case 'move': {
        this.collisionCount = 0
        // Move towards destination until distance from destination is less than vehicle radius
        const distanceFromDestinationSquared = (Math.pow(this.order.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.order.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.collisionRadius / tileMap.gridSize, 2)) {
          // Stop when within one radius of the destination
          this.setOrder({ type: 'stand' })
          return true
        } else if (this.colliding && distanceFromDestinationSquared < Math.pow(this.collisionRadius * 3 / tileMap.gridSize, 2)) {
          // Stop when within 3 radius of the destination if colliding with something
          this.setOrder({ type: 'stand' })
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
              this.setOrder({ type: 'stand' })
              return true
            }
          }
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo(this.order.toPoint, distanceFromDestination)
          // Pathfinding couldn't find a path so stop
          if (!moving) {
            this.setOrder({ type: 'stand' })
            return true
          }
        }
        return true
      }
      case 'follow': {
        if (this.order.to.isDead()) {
          if (this.order.nextOrder != null) {
            this.setOrder(this.order.nextOrder)
          } else {
            this.setOrder({ type: 'stand' })
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
    this.processOrder()
    if (this.elapsedSwitchFrames >= this.switchFrames) {
      this.updateAnimation(true)
      this.elapsedSwitchFrames = 0
    } else {
      this.updateAnimation(this.moveTurning || this.elapsedSwitchFrames === 0)
    }
    this.elapsedSwitchFrames += 1
    this.zIndex = this.y + this.height // TODO to slow height
  }

  checkCollisionObjects (grid: Array<Array<0 | 1>>, distanceFromDestination: number): Array<{
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
    const angleRadians = -(this.vector.direction / this.vector.directions) * 2 * Math.PI
    const newX = thisGrid.gridX - (movement * Math.sin(angleRadians))
    const newY = thisGrid.gridY - (movement * Math.cos(angleRadians))

    // List of objects that will collide after next movement step
    const collisionObjects = []

    const x1 = Math.max(0, Math.floor(newX) - 3)
    const x2 = Math.min(tileMap.mapGridWidth - 1, Math.floor(newX) + 3)
    const y1 = Math.max(0, Math.floor(newY) - 3)
    const y2 = Math.min(tileMap.mapGridHeight - 1, Math.floor(newY) + 3)
    // Test grid upto 3 squares away
    for (let j = x1; j <= x2; j++) {
      for (let i = y1; i <= y2; i++) {
        if (grid[i][j] === 1) { // grid square is obstructed
          const centerX = j + 0.5
          const centerY = i + 0.5
          const distanceSq = Math.pow(centerX - newX, 2) + Math.pow(centerY - newY, 2)
          if (distanceSq < Math.pow(this.collisionRadius / tileMap.gridSize, 2)) {
            // Distance of obstructed grid from vehicle is less than hard collision threshold
            collisionObjects.push({ collisionType: ECollisionType.hard, with: { type: 'wall', x: centerX, y: centerY } })
          } else if (distanceSq < Math.pow(this.collisionRadius * 1.1 / tileMap.gridSize, 2)) {
            // Distance of obstructed grid from vehicle is less than soft collision threshold
            collisionObjects.push({ collisionType: ECollisionType.soft, with: { type: 'wall', x: centerX, y: centerY } })
          }
        }
      }
    }

    const { groundMoveableItems } = tileMap
    for (let i = groundMoveableItems.length - 1; i >= 0; i--) {
      const vehicle = groundMoveableItems[i]
      const vehicleGrid = vehicle.getGridXY({ center: true })
      // Test vehicles that are less than 3 squares away for collisions
      if (vehicle !== this && Math.abs(vehicleGrid.gridX - thisGrid.gridX) < 3 && Math.abs(vehicleGrid.gridY - thisGrid.gridY) < 3) {
        const distanceSq = Math.pow(vehicleGrid.gridX - newX, 2) + Math.pow(vehicleGrid.gridY - newY, 2)
        if (distanceSq < Math.pow((this.collisionRadius + vehicle.collisionRadius) / tileMap.gridSize, 2)) {
          // Distance between vehicles is less than hard collision threshold (sum of vehicle radii)
          collisionObjects.push({ collisionType: ECollisionType.hard, with: { type: vehicle.type, x: vehicleGrid.gridX, y: vehicleGrid.gridY } })
        } else if (distanceSq < Math.pow((this.collisionRadius * 1.1 + vehicle.collisionRadius) / tileMap.gridSize, 2)) {
          // Distance between vehicles is less than soft collision threshold (1.5 times vehicle radius + colliding vehicle radius)
          collisionObjects.push({ collisionType: ECollisionType.soft, with: { type: vehicle.type, x: vehicleGrid.gridX, y: vehicleGrid.gridY } })
        }
      }
    }

    return collisionObjects
  }

  _moveTo (destination: IGridPointData, distanceFromDestination: number): boolean {
    const { tileMap, turnSpeedAdjustmentFactor, speedAdjustmentFactor, speedAdjustmentWhileTurningFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })

    // First find path to destination
    const destX = Math.floor(destination.gridX)
    const destY = Math.floor(destination.gridY)
    const start = { gridX: Math.floor(thisGrid.gridX), gridY: Math.floor(thisGrid.gridY) }
    const end = { gridX: destX, gridY: destY }

    const grid = tileMap.currentCopyMapPassableGrid
    // Allow destination to be "movable" so that algorithm can find a path
    if (destination.type === EItemType.buildings || destination.type === EItemType.terrain) {
      grid[destY][destX] = 0
    }

    let newDirection

    const vehicleOutsideMapBounds = start.gridY < 0 || start.gridY >= tileMap.mapGridHeight || start.gridX < 0 || start.gridX >= tileMap.mapGridWidth
    const vehicleReachedDestinationTile = start.gridX === end.gridX && start.gridY === end.gridY
    let path: IPathPoint[] = []
    if (vehicleOutsideMapBounds || vehicleReachedDestinationTile) {
      // Don't use A*. Just turn towards destination.
      path = [{ x: thisGrid.gridX, y: thisGrid.gridY }, { x: destination.gridX, y: destination.gridY }]
      newDirection = findAngleGrid({
        from: destination, to: thisGrid, directions: this.vector.directions
      })
    } else {
      // Use A* algorithm to try and find a path to the destination
      path = AStar.calc({ grid, start, end, f: 'Euclidean' })
      if (path.length > 1) {
        newDirection = findAngle({
          from: { x: path[1].x + 0.5, y: path[1].y + 0.5 },
          to: { x: thisGrid.gridX, y: thisGrid.gridY },
          directions: this.vector.directions
        })
      } else {
        // There is no path
        return false
      }
    }

    // check if moving along current direction might cause collision..
    // If so, change newDirection
    const collisionObjects = this.checkCollisionObjects(grid, distanceFromDestination)
    this.hardCollision = false
    if (collisionObjects.length > 0) {
      this.colliding = true

      // Create a force vector object that adds up repulsion from all colliding objects
      const forceVector = { x: 0, y: 0 }
      // By default, the next step has a mild attraction force
      collisionObjects.push({
        collisionType: ECollisionType.attraction,
        with: { x: path[1].x + 0.5, y: path[1].y + 0.5 }
      })
      for (let i = collisionObjects.length - 1; i >= 0; i--) {
        const collObject = collisionObjects[i]
        const objectAngle = findAngle({
          from: collObject.with,
          to: { x: thisGrid.gridX, y: thisGrid.gridY },
          directions: this.vector.directions
        })
        const objectAngleRadians = -(objectAngle / this.vector.directions) * 2 * Math.PI
        let forceMagnitude
        switch (collObject.collisionType) {
          case ECollisionType.hard:
            forceMagnitude = 2
            this.hardCollision = true
            break
          case ECollisionType.soft:
            forceMagnitude = 1
            break
          case ECollisionType.attraction:
            forceMagnitude = -0.5
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
    let movement = Math.min(maximumMovement, distanceFromDestination)

    if (this.hardCollision) {
      movement = 0
    }

    const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
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
}
