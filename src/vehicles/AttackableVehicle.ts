import { ReloadBar } from '../ReloadBar'
import { findAngleGrid, type BaseActiveItem, angleDiff, wrapDirection } from '../common'
import { type IAttackable } from '../interfaces/IAttackable'
import { EItemType, type ProjectileName } from '../interfaces/IItem'
import { type IVehicleOptions, Vehicle } from './Vehicle'

export interface IAttackableVehicleOptions extends IVehicleOptions {}

export class AttackableVehicle extends Vehicle implements IAttackable {
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

  public canAttack = false
  public canAttackLand = false
  public canAttackAir = false

  constructor (options: IAttackableVehicleOptions) {
    super(options)
    this.setup(options)
  }

  setup (options: IAttackableVehicleOptions): void {
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

  processOrders (): boolean {
    if (super.processOrders()) {
      return true
    }
    const { tileMap, turnSpeedAdjustmentFactor } = this.game
    const thisGrid = this.getGridXY({ center: true })
    switch (this.orders.type) {
      case 'stand': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.orders = { type: 'attack', to: target }
        }
        return true
      }
      case 'sentry': {
        const target = this.findTargetInSight(2)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
        }
        return true
      }
      case 'hunt': {
        const target = this.findTargetInSight(100)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
        }
        return true
      }
      case 'attack': {
        if (this.orders.to == null) {
          return true
        }
        if (this.orders.to.isDead() || !this.isValidTarget(this.orders.to)) {
          if (this.orders.nextOrder != null) {
            this.orders = this.orders.nextOrder
          } else {
            this.orders = { type: 'stand' }
          }
          return true
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
              const reloadTime = this.game.getReloadTime(this.projectile)
              if (typeof reloadTime === 'number') {
                this.reloadTimeLeft = reloadTime
                const angleRadians = -(this.vector.direction / this.vector.directions) * 2 * Math.PI
                const bulletX = thisGrid.gridX - (this.radius * Math.sin(angleRadians) / tileMap.gridSize)
                const bulletY = thisGrid.gridY - (this.radius * Math.cos(angleRadians) / tileMap.gridSize)
                const projectile = this.game.createProjectile({
                  name: this.projectile,
                  initX: bulletX * tileMap.gridSize,
                  initY: bulletY * tileMap.gridSize,
                  direction: newDirection,
                  target: this.orders.to
                })
                if (projectile != null) {
                  tileMap.addItem(projectile)
                }
              }
            }
          }
        } else {
          const distanceFromDestinationSquared = Math.pow(distanceFromDestination, 0.5)
          const moving = this._moveTo({ type: this.orders.to.type, ...toGrid }, distanceFromDestinationSquared)
          if (!moving) {
            // Pathfinding couldn't find a path so stop
            // e.g. enemy is in hard collide state
            this.orders = { type: 'stand' }
          }
        }
        return true
      }
      case 'patrol': {
        const target = this.findTargetInSight(1)
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
          return true
        }
        const distanceFromDestinationSquared = (Math.pow(this.orders.toPoint.gridX - thisGrid.gridX, 2) + Math.pow(this.orders.toPoint.gridY - thisGrid.gridY, 2))
        if (distanceFromDestinationSquared < Math.pow(this.sight / tileMap.gridSize, 2)) {
          const to = this.orders.toPoint
          this.orders.toPoint = this.orders.fromPoint
          this.orders.fromPoint = to
        } else {
          this._moveTo(this.orders.toPoint, distanceFromDestinationSquared)
        }
        return true
      }
      case 'guard': {
        if (this.orders.to.isDead()) {
          if (this.orders.nextOrder != null) {
            this.orders = this.orders.nextOrder
          } else {
            this.orders = { type: 'stand' }
          }
          return true
        }
        const toGrid = this.orders.to.getGridXY({ center: true })
        const distanceFromDestinationSquared = (Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2))
        // When approaching the target of the guard, if there is an enemy in sight, attack him
        if (distanceFromDestinationSquared < Math.pow(this.sight - 1, 2)) {
          const target = this.findTargetInSight(1)
          if (target != null) {
            this.orders = { type: 'attack', to: target, nextOrder: this.orders }
            return true
          }
          // const targetToAttackTo = this.orders.to.findTargetInSight(1)
          if (this.orders.to.orders.type === 'attack') {
            this.orders = {
              type: 'attack',
              to: this.orders.to.orders.to,
              toUid: this.orders.to.orders.toUid,
              nextOrder: this.orders
            }
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
