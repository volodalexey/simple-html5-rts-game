import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { Vector, EVectorDirection } from '../Vector'
import { findAngle, type Team, angleDiff, wrapDirection, type BaseActiveItem, findAngleGrid, generateUid } from '../common'
import { type ISelectable } from '../interfaces/ISelectable'
import { type ILifeable } from '../interfaces/ILifeable'
import { type IAttackable } from '../interfaces/IAttackable'
import { EItemType, type IItem } from '../interfaces/IItem'
import { type Game } from '../Game'
import { AStar } from '../AStar'
import { type IMoveable } from '../interfaces/IMoveable'
import { type IPointGridData, type IOrder } from '../interfaces/IOrder'
import { type IBuildable } from '../interfaces/IBuildable'
import { LifeBar } from '../LifeBar'
import { type Bullet } from '../projectiles/Bullet'
import { type CannonBall } from '../projectiles/CannonBall'
import { type Laser } from '../projectiles/Laser'
import { type Rocket } from '../projectiles/HeatSeeker'
import { logVehicleBounds } from '../logger'

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

export interface IVehicleOptions {
  game: Game
  uid?: number
  initX: number
  initY: number
  team: Team
  textures: IVehicleTextures
  direction?: EVectorDirection
  life?: number
  selectable?: boolean
  ordersable?: boolean
  orders?: IOrder
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

export class Vehicle extends Container implements IItem, ISelectable, ILifeable, IAttackable, IMoveable, IBuildable {
  public selected = false
  public selectable = true
  public selectedGraphics = new Container()
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
  public type = EItemType.vehicles
  public ordersable = true
  public hitPoints = 0
  public life = 0
  public lifeBar!: LifeBar
  public team: Team
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
  public hardCollision = false
  public collisionCount = 0
  public colliding = false
  public lastMovementGridX = 0
  public lastMovementGridY = 0
  public orders: IOrder
  public sight = 0
  public radius = 0
  public canAttack = false
  public canAttackLand = false
  public canAttackAir = false
  public cost = 0
  public reloadTimeLeft = 0
  public Projectile!: typeof Bullet | typeof CannonBall | typeof Laser | typeof Rocket

  constructor (options: IVehicleOptions) {
    super()
    this.uid = typeof options.uid === 'number' ? options.uid : generateUid()
    this.game = options.game
    this.team = options.team
    this.orders = options.orders ?? { type: 'stand' }
    this.setup(options)
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
      this.switchAnimation(options.direction)
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
      upTextures,
      upRightTextures,
      rightTextures,
      downRightTextures,
      downTextures,
      downLeftTextures,
      leftTextures,
      upLeftTextures
    }
  }: IVehicleOptions): void {
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

    this.lifeBar = new LifeBar(this.drawLifeBarOptions)
    this.addChild(this.lifeBar)
  }

  setSelected (selected: boolean): void {
    this.selectedGraphics.alpha = selected ? 0.5 : 0
    this.selected = selected
  }

  getSelectionPosition ({ center = false } = {}): { x: number, y: number } {
    const sub = this.drawSelectionOptions.strokeWidth
    const ret = {
      x: this.x + this.selectedGraphics.x + sub,
      y: this.y + this.selectedGraphics.y + sub
    }
    if (center) {
      ret.x += (this.selectedGraphics.width - sub * 2) / 2
      ret.y += (this.selectedGraphics.height - sub * 2) / 2
    }
    return ret
  }

  getSelectionBounds (): { top: number, right: number, bottom: number, left: number } {
    const selectionPosition = this.getSelectionPosition()
    const sub = this.drawSelectionOptions.strokeWidth
    return {
      top: selectionPosition.y,
      right: selectionPosition.x + this.selectedGraphics.width - sub * 2,
      bottom: selectionPosition.y + this.selectedGraphics.height - sub * 2,
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
    const sub = this.drawSelectionOptions.strokeWidth
    const diffX = 0 - (this.selectedGraphics.x + (center ? this.selectedGraphics.width / 2 : sub))
    const diffY = 0 - (this.selectedGraphics.y + (center ? this.selectedGraphics.height / 2 : sub))
    this.position.set(x + diffX, y + diffY)
  }

  setPositionByGridXY ({ gridX, gridY, center }: { gridX: number, gridY: number, center?: boolean }): void {
    const { gridSize } = this.game.tileMap
    this.setPositionByXY({ x: gridX * gridSize, y: gridY * gridSize, center })
  }

  checkDrawVehicleBounds (): void {
    if (logVehicleBounds.enabled) {
      const selectionBounds = this.getSelectionBounds()
      const gr = new Graphics()
      gr.beginFill(0xffffff)
      gr.alpha = 0.5
      gr.drawRect(selectionBounds.left - this.x, selectionBounds.top - this.y, selectionBounds.right - selectionBounds.left, selectionBounds.bottom - selectionBounds.top)
      gr.endFill()
      this.addChild(gr)
    }
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation (direction: EVectorDirection): void {
    let newAnimation
    const step = 0.5
    if ((direction >= EVectorDirection.upLeft + step && direction <= EVectorDirection.upLeft + 1) ||
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

  drawSelection (): void {
    const { offset, strokeWidth, strokeColor, strokeSecondColor, radius } = this.drawSelectionOptions
    this.selectedGraphics.position.set(offset.x, offset.y)
    const selection = new Graphics()
    this.selectedGraphics.addChild(selection)
    const segmentsCount = 8
    const segment = Math.PI * 2 / segmentsCount
    const cx = radius + strokeWidth
    const cy = radius + strokeWidth
    for (let i = 0; i < segmentsCount; i++) {
      selection.beginFill(i % 2 === 0 ? strokeColor : strokeSecondColor)
      const angleStart = segment * i
      const angleEnd = segment * (i + 1)
      const radiusStroke = radius + strokeWidth
      selection.moveTo(cx + radius * Math.cos(angleStart), cy + radius * Math.sin(angleStart))
      selection.lineTo(cx + radiusStroke * Math.cos(angleStart), cy + radiusStroke * Math.sin(angleStart))
      selection.arc(cx, cy, radiusStroke, angleStart, angleEnd)
      selection.lineTo(cx + radius * Math.cos(angleEnd), cy + radius * Math.sin(angleEnd))
      selection.arc(cx, cy, radius, angleEnd, angleStart, true)
      selection.endFill()
    }
    this.selectedGraphics.alpha = 0
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

  isValidTarget (item: BaseActiveItem): boolean {
    return item.team !== this.team &&
      (
        (this.canAttackLand && (item.type === EItemType.buildings || item.type === EItemType.vehicles)) ||
        (this.canAttackAir && (item.type === EItemType.aircraft))
      )
  }

  findTargetInSight (addSight = 0): BaseActiveItem | undefined {
    const thisGrid = this.getGridXY({ center: true })
    const targetsByDistance: Record<string, BaseActiveItem[]> = {}
    const items = this.game.tileMap.activeItems.children
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]
      if (this.isValidTarget(item)) {
        const itemGrid = item.getGridXY({ center: true })
        const distance = Math.pow(itemGrid.gridX - thisGrid.gridX, 2) + Math.pow(itemGrid.gridY - thisGrid.gridY, 2)
        if (distance < Math.pow(this.sight + addSight, 2)) {
          if (!Array.isArray(targetsByDistance[distance])) {
            targetsByDistance[distance] = []
          }
          targetsByDistance[distance].push(item)
        }
      }
    }

    // Sort targets based on distance from attacker
    const targetKeys = Object.keys(targetsByDistance).map(Number).sort((a, b) => a - b)
    const targets = targetKeys.map(key => targetsByDistance[key]).flat()

    return targets[0]
  }

  processOrders (): void {
    const { tileMap, turnSpeedAdjustmentFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.orders.type) {
      case 'move': {
        this.collisionCount = 0
        // Move towards destination until distance from destination is less than vehicle radius
        const distanceFromDestinationSquared = (Math.pow(this.orders.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.orders.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.radius / tileMap.gridSize, 2)) {
          // Stop when within one radius of the destination
          this.orders = { type: 'stand' }
          return
        } else if (this.colliding && distanceFromDestinationSquared < Math.pow(this.radius * 3 / tileMap.gridSize, 2)) {
          // Stop when within 3 radius of the destination if colliding with something
          this.orders = { type: 'stand' }
          return
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
              this.orders = { type: 'stand' }
              return
            }
          }
          const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
          const moving = this._moveTo(this.orders.toPoint, distanceFromDestination)
          // Pathfinding couldn't find a path so stop
          if (!moving) {
            this.orders = { type: 'stand' }
            return
          }
        }
        break
      }
      case 'stand': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.orders = { type: 'attack', to: target }
        }
        break
      }
      case 'sentry': {
        const target = this.findTargetInSight(2)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
        }
        break
      }
      case 'hunt': {
        const target = this.findTargetInSight(100)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
        }
        break
      }
      case 'attack': {
        if (this.orders.to == null) {
          return
        }
        if (this.orders.to.isDead() || !this.isValidTarget(this.orders.to)) {
          if (this.orders.nextOrder != null) {
            this.orders = this.orders.nextOrder
          } else {
            this.orders = { type: 'stand' }
          }
          return
        }
        const toGrid = this.orders.to.getGridXY({ center: true })
        const distanceFromDestination = Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2)
        if (distanceFromDestination < Math.pow(this.sight, 2)) {
          // Turn towards target and then start attacking when within range of the target
          const newDirection = findAngleGrid({
            from: toGrid, to: thisGrid, directions: this.vector.directions
          })
          const difference = angleDiff({ angle1: this.vector.direction, angle2: newDirection, directions: this.vector.directions })
          const turnAmount = this.turnSpeed * turnSpeedAdjustmentFactor
          if (Math.abs(difference) > turnAmount) {
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
            if (this.reloadTimeLeft <= 0) {
              this.reloadTimeLeft = this.Projectile.reloadTime
              const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
              const bulletX = thisGrid.gridX - (this.radius * Math.sin(angleRadians) / tileMap.gridSize)
              const bulletY = thisGrid.gridY - (this.radius * Math.cos(angleRadians) / tileMap.gridSize)
              const projectile = new this.Projectile({
                game: this.game,
                initX: bulletX * tileMap.gridSize,
                initY: bulletY * tileMap.gridSize,
                direction: newDirection,
                target: this.orders.to
              })
              tileMap.addItem(projectile)
            }
          }
        } else {
          const distanceFromDestinationSquared = Math.pow(distanceFromDestination, 0.5)
          const moving = this._moveTo({ type: this.orders.to.type, ...toGrid }, distanceFromDestinationSquared)
          if (!moving) {
            // Pathfinding couldn't find a path so stop
            // e.g. enemy is in hard collide state
            this.orders = { type: 'stand' }
            return
          }
        }
        break
      }
      case 'patrol': {
        const target = this.findTargetInSight(1)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
          return
        }
        const distanceFromDestinationSquared = (Math.pow(this.orders.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.orders.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.sight / tileMap.gridSize, 2)) {
          const to = this.orders.toPoint
          this.orders.toPoint = this.orders.fromPoint
          this.orders.fromPoint = to
        } else {
          this._moveTo(this.orders.toPoint, distanceFromDestinationSquared)
        }
        break
      }
      case 'guard': {
        if (this.orders.to.isDead()) {
          if (this.orders.nextOrder != null) {
            this.orders = this.orders.nextOrder
          } else {
            this.orders = { type: 'stand' }
          }
          return
        }
        const toGrid = this.orders.to.getGridXY({ center: true })
        const distanceFromDestinationSquared = (Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2))
        // When approaching the target of the guard, if there is an enemy in sight, attack him
        if (distanceFromDestinationSquared < Math.pow(this.sight - 1, 2)) {
          const target = this.findTargetInSight(1)
          if (target != null) {
            this.orders = { type: 'attack', to: target, nextOrder: this.orders }
            return
          }
          const targetToAttackTo = this.orders.to.findTargetInSight(1)
          if (targetToAttackTo != null) {
            this.orders = { type: 'attack', to: targetToAttackTo, nextOrder: this.orders }
            return
          }
        } else {
          const target = this.findTargetInSight(1)
          if (target != null) {
            this.orders = { type: 'attack', to: target, nextOrder: this.orders }
          } else {
            const toGrid = this.orders.to.getGridXY({ center: true })
            this._moveTo({ type: this.orders.to.type, ...toGrid }, distanceFromDestinationSquared)
          }
        }
      }
    }
    this.switchAnimation(this.vector.direction)
  }

  handleUpdate (deltaMS: number): void {
    if (this.reloadTimeLeft > 0) {
      this.reloadTimeLeft -= this.game.reloadAdjustmentFactor
    }
    this.processOrders()
    this.zIndex = this.y + this.height
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
    const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
    const newX = thisGrid.gridX - (movement * Math.sin(angleRadians))
    const newY = thisGrid.gridY - (movement * Math.cos(angleRadians))

    // List of objects that will collide after next movement step
    const collisionObjects = []

    const x1 = Math.max(0, Math.round(newX) - 3)
    const x2 = Math.min(tileMap.mapGridWidth - 1, Math.round(newX) + 3)
    const y1 = Math.max(0, Math.round(newY) - 3)
    const y2 = Math.min(tileMap.mapGridHeight - 1, Math.round(newY) + 3)
    // Test grid upto 3 squares away
    for (let j = x1; j <= x2; j++) {
      for (let i = y1; i <= y2; i++) {
        if (grid[i][j] === 1) { // grid square is obstructed
          const centerX = j + 0.5
          const centerY = i + 0.5
          const distanceSq = Math.pow(centerX - newX, 2) + Math.pow(centerY - newY, 2)
          if (distanceSq < Math.pow(this.radius / tileMap.gridSize, 2)) {
            // Distance of obstructed grid from vehicle is less than hard collision threshold
            collisionObjects.push({ collisionType: ECollisionType.hard, with: { type: 'wall', x: centerX, y: centerY } })
          } else if (distanceSq < Math.pow(this.radius * 1.1 / tileMap.gridSize, 2)) {
            // Distance of obstructed grid from vehicle is less than soft collision threshold
            collisionObjects.push({ collisionType: ECollisionType.soft, with: { type: 'wall', x: centerX, y: centerY } })
          }
        }
      }
    }

    const { moveableItems } = tileMap
    for (let i = moveableItems.length - 1; i >= 0; i--) {
      const vehicle = moveableItems[i]
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
    this.lastMovementGridX = 0
    this.lastMovementGridY = 0
    const { tileMap, turnSpeedAdjustmentFactor, speedAdjustmentFactor, speedAdjustmentWhileTurningFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })

    // First find path to destination
    const destX = Math.round(destination.gridX)
    const destY = Math.round(destination.gridY)
    const start = { gridX: Math.round(thisGrid.gridX), gridY: Math.round(thisGrid.gridY) }
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
        const nextStep = { x: path[1].x, y: path[1].y }
        newDirection = findAngle({
          from: nextStep,
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
    this.colliding = false
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
    this.lastMovementGridX = -(movement * Math.sin(angleRadians))
    this.lastMovementGridY = -(movement * Math.cos(angleRadians))
    const newGridX = thisGrid.gridX + this.lastMovementGridX
    const newGridY = thisGrid.gridY + this.lastMovementGridY
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
}
