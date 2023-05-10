import { ECommandName } from '../Command'
import { ReloadBar } from '../ReloadBar'
import { findAngleGrid, type BaseActiveItem, angleDiff, wrapDirection } from '../common'
import { type IAttackable } from '../interfaces/IAttackable'
import { EItemType, type ProjectileName } from '../interfaces/IItem'
import { type IAirVehicleOptions, AirVehicle } from './AirVehicle'

export interface IAttackableAirVehicleOptions extends IAirVehicleOptions {}

export class AttackableAirVehicle extends AirVehicle implements IAttackable {
  public commands = [ECommandName.moveFollow, ECommandName.attackGuard, ECommandName.patrol]
  public reloadTimeLeft = 0
  public projectile!: ProjectileName
  public reloadBar!: ReloadBar
  public drawReloadBarOptions = {
    alpha: 0,
    width: 0,
    height: 0,
    fillColor: 0,
    offset: {
      x: 0,
      y: 0
    }
  }

  public attackRadius = 0
  public canAttack = false
  public canAttackLand = false
  public canAttackAir = false

  constructor (options: IAttackableAirVehicleOptions) {
    super(options)
    this.setup(options)
  }

  setup (options: IAttackableAirVehicleOptions): void {
    super.setup(options)
    this.reloadBar = new ReloadBar(this.drawReloadBarOptions)
    this.addChild(this.reloadBar)
  }

  isValidTarget (item: BaseActiveItem): boolean {
    return item.team !== this.team &&
      (
        (this.canAttackLand && (item.type === EItemType.buildings || item.type === EItemType.vehicles)) ||
        (this.canAttackAir && (item.type === EItemType.airVehicles))
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
        if (distance < Math.pow(this.sightRadius + addSight, 2)) {
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

  processOrders (): boolean {
    if (this.order.type !== 'patrol' && super.processOrders()) {
      return true
    }
    const { tileMap, turnSpeedAdjustmentFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.order.type) {
      case 'stand': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.order = { type: 'attack', to: target }
        }
        return true
      }
      case 'hunt': {
        const target = this.findTargetInSight(100)
        if (target != null) {
          this.order = { type: 'attack', to: target, nextOrder: this.order }
        }
        return true
      }
      case 'attack': {
        if (this.order.to == null) {
          return true
        }
        if (this.order.to.isDead() || !this.isValidTarget(this.order.to)) {
          if (this.order.nextOrder != null) {
            this.order = this.order.nextOrder
          } else {
            this.order = { type: 'stand' }
          }
          return true
        }
        const toGrid = this.order.to.getGridXY({ center: true })
        const distanceFromDestination = Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2)
        if (distanceFromDestination < Math.pow(this.attackRadius, 2)) {
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
              const reloadTime = this.game.getReloadTime(this.projectile)
              if (typeof reloadTime === 'number') {
                this.reloadTimeLeft = reloadTime
                const angleRadians = -(this.vector.direction / this.vector.directions) * 2 * Math.PI
                const bulletX = thisGrid.gridX - (this.collisionRadius * Math.sin(angleRadians) / tileMap.gridSize)
                const bulletY = thisGrid.gridY - (this.collisionRadius * Math.cos(angleRadians) / tileMap.gridSize)
                const projectile = this.game.createProjectile({
                  name: this.projectile,
                  initX: bulletX * tileMap.gridSize,
                  initY: bulletY * tileMap.gridSize,
                  direction: newDirection,
                  target: this.order.to
                })
                if (projectile != null) {
                  tileMap.addItem(projectile)
                }
              }
            }
          }
        } else {
          const distanceFromDestinationSquared = Math.pow(distanceFromDestination, 0.5)
          const moving = this._moveTo({ type: this.order.to.type, ...toGrid }, distanceFromDestinationSquared)
          if (!moving) {
            // Pathfinding couldn't find a path so stop
            // e.g. enemy is in hard collide state
            this.order = { type: 'stand' }
          }
        }
        return true
      }
      case 'patrol': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.order = { type: 'attack', to: target, nextOrder: this.order }
          return true
        }
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
      case 'guard': {
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
          const target = this.findTargetInSight()
          if (target != null) {
            this.order = { type: 'attack', to: target, nextOrder: this.order }
            return true
          }
          if (this.order.to.order.type === 'attack') {
            this.order = {
              type: 'attack',
              to: this.order.to.order.to,
              nextOrder: this.order
            }
          }
        } else {
          const target = this.findTargetInSight()
          if (target != null) {
            this.order = { type: 'attack', to: target, nextOrder: this.order }
          } else {
            const toGrid = this.order.to.getGridXY({ center: true })
            this._moveTo({ type: this.order.to.type, ...toGrid }, distanceFromDestinationSquared)
          }
        }
        return true
      }
      case 'move-and-attack': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.order = { type: 'attack', to: target, nextOrder: this.order }
          return true
        }
        const distanceFromDestinationSquared = (Math.pow(this.order.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.order.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.collisionRadius / tileMap.gridSize, 2)) {
          // Stop when within one radius of the destination
          this.order = { type: 'stand' }
          return true
        }
        const distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5)
        const moving = this._moveTo(this.order.toPoint, distanceFromDestination)
        // Pathfinding couldn't find a path so stop
        if (!moving) {
          this.order = { type: 'stand' }
          return true
        }
        return true
      }
    }
    return false
  }

  override handleUpdate (deltaMS: number): void {
    if (this.reloadTimeLeft > 0) {
      this.reloadTimeLeft -= this.game.reloadAdjustmentFactor
    }
    this.updateReload()
    super.handleUpdate(deltaMS)
  }

  drawReloadBar (): void {
    this.reloadBar.draw(this.drawReloadBarOptions)
    const { offset } = this.drawReloadBarOptions
    this.reloadBar.position.set(offset.x, offset.y)
  }

  updateReload (): void {
    const reloadTime = this.game.getReloadTime(this.projectile)
    if (typeof reloadTime === 'number') {
      this.reloadBar.updateReload((reloadTime - this.reloadTimeLeft) / reloadTime)
    }
  }
}
