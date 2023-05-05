import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { Vector, EVectorDirection } from '../Vector'
import { findAngle, type Team, angleDiff, wrapDirection, findAngleGrid, generateUid } from '../common'
import { type ISelectable } from '../interfaces/ISelectable'
import { type ILifeable } from '../interfaces/ILifeable'
import { EItemName, EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'
import { type IMoveable } from '../interfaces/IMoveable'
import { type IPointGridData, type IOrder } from '../interfaces/IOrder'
import { LifeBar } from '../LifeBar'
import { logItemBounds } from '../logger'
import { type ITurnable } from '../interfaces/ITurnable'

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

export interface IAirVehicleOptions {
  game: Game
  uid?: number
  initX: number
  initY: number
  team: Team
  textures: {
    body: IAirVehicleTextures
    shadow: IAirVehicleTextures
  }
  direction?: EVectorDirection
  life?: number
  selectable?: boolean
  ordersable?: boolean
  orders?: IOrder
  teleport?: boolean
}

enum ECollisionType {
  soft = 'soft',
  hard = 'hard',
  attraction = 'attraction',
}

export class AirVehicle extends Container implements IItem, ISelectable, ILifeable, IMoveable, ITurnable {
  public collisionGraphics = new Graphics()
  public collisionOptions = {
    width: 0,
    height: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public selectedGraphics = new Graphics()
  public selected = false
  public selectable = true
  public drawSelectionOptions = {
    width: 0,
    height: 0,
    radius: 0,
    strokeWidth: 0,
    strokeColor: 0,
    strokeSecondColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public lifeBar!: LifeBar
  public drawLifeBarOptions = {
    borderColor: 0,
    borderThickness: 0,
    borderAlpha: 0,
    width: 0,
    height: 0,
    fillColor: 0,
    emptyColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public game: Game
  public uid: number
  public type = EItemType.airVehicles
  public itemName = EItemName.None
  public ordersable = true
  public hitPoints = 0
  public life = 0
  public team: Team
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
  public hardCollision = false
  public collisionCount = 0
  public colliding = false
  public orders: IOrder
  public sight = 0
  public radius = 0
  public teleportGraphics?: Graphics

  constructor (options: IAirVehicleOptions) {
    super()
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.team = options.team
    this.orders = options.orders ?? { type: 'float' }
    this.setup(options)
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
    }
    if (typeof options.selectable === 'boolean') {
      this.selectable = options.selectable
    }
    if (typeof options.ordersable === 'boolean') {
      this.ordersable = options.ordersable
    }
  }

  setup ({
    textures: {
      body,
      shadow
    },
    teleport
  }: IAirVehicleOptions): void {
    this.addChild(this.selectedGraphics)
    this.addChild(this.bodySpritesContainer)
    this.addChild(this.shadowSpritesContainer)
    this.addChild(this.collisionGraphics)
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

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  getCollisionPosition ({ center = false, air = true } = {}): { x: number, y: number } {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const ret = {
      x: this.x + colX,
      y: this.y + colY
    }
    if (center) {
      ret.x += (colWidth) / 2
      ret.y += (colHeight) / 2
    }
    if (!air) {
      const { offset } = this.drawShadowOptions
      ret.y += offset.y
    }
    return ret
  }

  getCollisionBounds ({ air }: { air?: boolean } = {}): { top: number, right: number, bottom: number, left: number } {
    const collisionPosition = this.getCollisionPosition({ air })
    return {
      top: collisionPosition.y,
      right: collisionPosition.x + this.collisionGraphics.width,
      bottom: collisionPosition.y + this.collisionGraphics.height,
      left: collisionPosition.x
    }
  }

  getGridXY ({ floor = false, center = false, air = true } = {}): { gridX: number, gridY: number } {
    const { gridSize } = this.game.tileMap
    const collisionPosition = this.getCollisionPosition({ center, air })
    const ret = { gridX: collisionPosition.x / gridSize, gridY: collisionPosition.y / gridSize }
    if (floor) {
      ret.gridX = Math.floor(ret.gridX)
      ret.gridY = Math.floor(ret.gridY)
    }
    return ret
  }

  setPositionByXY ({ x, y, center = false }: { x: number, y: number, center?: boolean }): void {
    const { x: colX, y: colY, width: colWidth, height: colHeight } = this.collisionGraphics
    const diffX = 0 - (colX + (center ? colWidth / 2 : 0))
    const diffY = 0 - (colY + (center ? colHeight / 2 : 0))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
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

  updateAnimation (): void {
    this.switchAnimation(this.vector.direction)
  }

  switchAnimation (direction: EVectorDirection): void {
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
    if (newBodyAnimation === this.currentBodyAnimation) {
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

  drawCollision (): void {
    const { offset, width, height } = this.collisionOptions
    const { collisionGraphics } = this
    collisionGraphics.position.set(offset.x, offset.y)
    collisionGraphics.beginFill(0xffffff)
    collisionGraphics.drawRect(0, 0, width, height)
    collisionGraphics.endFill()
    collisionGraphics.alpha = logItemBounds.enabled ? 0.5 : 0
  }

  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, strokeSecondColor, radius } = this.drawSelectionOptions
    const { selectedGraphics } = this
    selectedGraphics.position.set(offset.x, offset.y)
    const segmentsCount = 8
    const segment = Math.PI * 2 / segmentsCount
    const cx = radius + strokeWidth
    const cy = radius + strokeWidth
    for (let i = 0; i < segmentsCount; i++) {
      selectedGraphics.beginFill(i % 2 === 0 ? strokeColor : strokeSecondColor)
      const angleStart = segment * i
      const angleEnd = segment * (i + 1)
      const radiusStroke = radius + strokeWidth
      selectedGraphics.moveTo(cx + radius * Math.cos(angleStart), cy + radius * Math.sin(angleStart))
      selectedGraphics.lineTo(cx + radiusStroke * Math.cos(angleStart), cy + radiusStroke * Math.sin(angleStart))
      selectedGraphics.arc(cx, cy, radiusStroke, angleStart, angleEnd)
      selectedGraphics.lineTo(cx + radius * Math.cos(angleEnd), cy + radius * Math.sin(angleEnd))
      selectedGraphics.arc(cx, cy, radius, angleEnd, angleStart, true)
      selectedGraphics.endFill()
    }
    selectedGraphics.alpha = 0
  }

  drawLifeBar (): void {
    this.lifeBar.draw(this.drawLifeBarOptions)
    const { offset } = this.drawLifeBarOptions
    this.lifeBar.position.set(offset.x, offset.y)
  }

  updateLife (): void {
    this.lifeBar.updateLife(this.life / this.hitPoints)
  }

  isAlive (): boolean {
    return this.life > 0
  }

  isHealthy (): boolean {
    return this.life >= this.hitPoints * 0.4
  }

  isDead (): boolean {
    return !this.isAlive()
  }

  subLife (damage: number): void {
    this.life -= damage
    if (this.life <= 0) {
      this.removeAndDestroy()
    } else {
      this.updateLife()
    }
  }

  processOrders (): boolean {
    const { tileMap } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.orders.type) {
      case 'move': {
        this.collisionCount = 0
        // Move towards destination until distance from destination is less than aircraft radius
        const distanceFromDestinationSquared = (Math.pow(this.orders.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.orders.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.radius / tileMap.gridSize, 2)) {
          this.orders = { type: 'float' }
          return true
        } else {
          if (this.colliding && (distanceFromDestinationSquared) < Math.pow(this.radius * 5 / tileMap.gridSize, 2)) {
            // Count collsions within 5 radius distance of goal
            if (this.collisionCount === 0) {
              this.collisionCount = 1
            } else {
              this.collisionCount++
            }
            // Stop if more than 30 collisions occur
            if (this.collisionCount > 30) {
              this.orders = { type: 'float' }
              return true
            }
          }
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo(this.orders.toPoint, distanceFromDestination)
          // Pathfinding couldn't find a path so stop
          if (!moving) {
            this.orders = { type: 'float' }
            return true
          }
        }
        return true
      }
      case 'follow': {
        if (this.orders.to.isDead()) {
          if (this.orders.nextOrder != null) {
            this.orders = this.orders.nextOrder
          } else {
            this.orders = { type: 'float' }
          }
          return true
        }
        const toGrid = this.orders.to.getGridXY({ center: true })
        const distanceFromDestinationSquared = (Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2))
        // When approaching the target of the guard, if there is an enemy in sight, attack him
        if (distanceFromDestinationSquared < Math.pow(this.sight - 1, 2)) {
          // do nothing
        } else {
          const toGrid = this.orders.to.getGridXY({ center: true })
          this._moveTo({ type: this.orders.to.type, ...toGrid }, distanceFromDestinationSquared)
        }
      }
    }
    return false
  }

  handleUpdate (deltaMS: number): void {
    this.processOrders()
    this.updateAnimation()
    this.zIndex = this.y + this.height
    if (this.teleportGraphics != null) {
      if (this.teleportGraphics.alpha > 0) {
        this.teleportGraphics.alpha -= 0.01
      } else {
        this.teleportGraphics.alpha = 0
        this.teleportGraphics.removeFromParent()
        this.teleportGraphics = undefined
      }
    }
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

    const { airItems } = tileMap
    for (let i = airItems.length - 1; i >= 0; i--) {
      const vehicle = airItems[i]
      const vehicleGrid = vehicle.getGridXY({ center: true })
      // Test vehicles that are less than 3 squares away for collisions
      if (vehicle !== this && Math.abs(vehicleGrid.gridX - thisGrid.gridX) < 3 && Math.abs(vehicleGrid.gridY - thisGrid.gridY) < 3) {
        const distanceSq = Math.pow(vehicleGrid.gridX - newX, 2) + Math.pow(vehicleGrid.gridY - newY, 2)
        if (distanceSq < Math.pow((this.radius + vehicle.radius) / tileMap.gridSize, 2)) {
          // Distance between vehicles is less than hard collision threshold (sum of vehicle radii)
          collisionObjects.push({ collisionType: ECollisionType.hard, with: { type: vehicle.type, x: vehicleGrid.gridX, y: vehicleGrid.gridY } })
        } else if (distanceSq < Math.pow((this.radius * 1.1 + vehicle.radius) / tileMap.gridSize, 2)) {
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
    const destX = Math.round(destination.gridX)
    const destY = Math.round(destination.gridY)
    const end = { gridX: destX, gridY: destY }

    let newDirection = findAngleGrid({
      from: destination,
      to: thisGrid,
      directions: this.vector.directions
    })

    // check if moving along current direction might cause collision..
    // If so, change newDirection
    const collisionObjects = this.checkCollisionObjects(distanceFromDestination)
    this.colliding = false
    this.hardCollision = false
    if (collisionObjects.length > 0) {
      this.colliding = true

      // Create a force vector object that adds up repulsion from all colliding objects
      const forceVector = { x: 0, y: 0 }
      // By default, the next step has a mild attraction force
      collisionObjects.push({
        collisionType: ECollisionType.attraction,
        with: { x: end.gridX, y: end.gridY }
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

    if (Math.abs(difference) > turnAmount * 10) {
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

  removeAndDestroy (): void {
    this.game.deselectItem(this)
    this.removeFromParent()
  }

  drawTeleport (): void {
    const { offset, strokeWidth, radius } = this.drawSelectionOptions
    const { teleportGraphics } = this
    if (teleportGraphics != null) {
      teleportGraphics.position.set(offset.x, offset.y)
      const cx = radius + strokeWidth
      const cy = radius + strokeWidth
      teleportGraphics.beginFill(0xffffff)
      teleportGraphics.drawCircle(cx, cy, radius + strokeWidth)
      teleportGraphics.endFill()
    }
  }

  setupShadow (): void {
    const { offset } = this.drawShadowOptions
    this.shadowSpritesContainer.position.set(offset.x, offset.y)
  }
}
