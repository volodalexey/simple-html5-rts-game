import { AnimatedSprite, type Texture } from 'pixi.js'
import { ReloadBar } from '../ReloadBar'
import { EVectorDirection, Vector } from '../Vector'
import { findAngleGrid, type BaseActiveItem, angleDiff, wrapDirection } from '../common'
import { type IAttackable } from '../interfaces/IAttackable'
import { EItemType, type ProjectileName } from '../interfaces/IItem'
import { type ITurnable } from '../interfaces/ITurnable'
import { Building, type IBuildingTextures, type IBuildingOptions, BuildingAnimation } from './Building'

export interface IAttackableBuildingOptions extends IBuildingOptions {
  direction?: EVectorDirection
  textures: IAttackableBuildingTextures
}

export interface IAttackableBuildingTextures extends IBuildingTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
}

export class AttackableBuilding extends Building implements ITurnable, IAttackable {
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

  public upAnimation!: AnimatedSprite
  public upRightAnimation!: AnimatedSprite
  public rightAnimation!: AnimatedSprite
  public downRightAnimation!: AnimatedSprite
  public downAnimation!: AnimatedSprite
  public downLeftAnimation!: AnimatedSprite
  public leftAnimation!: AnimatedSprite
  public upLeftAnimation!: AnimatedSprite

  public canAttack = false
  public canAttackLand = false
  public canAttackAir = false

  public vector = new Vector({ direction: EVectorDirection.down })
  public moveTurning = false
  public turnSpeed = 0

  constructor (options: IAttackableBuildingOptions) {
    super(options)
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
    }
  }

  override setup (options: IAttackableBuildingOptions): void {
    super.setup(options)

    this.reloadBar = new ReloadBar(this.drawReloadBarOptions)
    this.addChild(this.reloadBar)

    const {
      upTextures,
      upRightTextures,
      rightTextures,
      downRightTextures,
      downTextures,
      downLeftTextures,
      leftTextures,
      upLeftTextures
    } = options.textures

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

  override switchAnimation (animation: BuildingAnimation): void {
    let newAnimation
    switch (animation) {
      case BuildingAnimation.healthy: {
        const step = 0.5
        const { direction } = this.vector
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
        break
      }
      case BuildingAnimation.damaged:
        newAnimation = this.damagedAnimation
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

  override processOrders (): boolean {
    // damaged turret cannot attack
    if (!this.isHealthy()) {
      return false
    }
    switch (this.order.type) {
      case 'sentry': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.order = { type: 'attack', to: target, nextOrder: this.order }
        }
        break
      }
      case 'attack': {
        if (this.order.to == null) {
          return true
        }
        const thisGrid = this.getGridXY({ center: true })
        const toGrid = this.order.to.getGridXY({ center: true })
        const distanceFromDestination = Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2)
        if (this.order.to.isDead() || !this.isValidTarget(this.order.to) ||
          distanceFromDestination > Math.pow(this.sight, 2)
        ) {
          const target = this.findTargetInSight()
          if (target != null) {
            this.order.to = target
          } else {
            this.order = { type: 'sentry' }
          }
        }
        if (this.order.type !== 'attack' || this.order.to == null) {
          return true
        }
        const { turnSpeedAdjustmentFactor, tileMap } = this.game
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
              const angleRadians = -(Math.round(this.vector.direction) / this.vector.directions) * 2 * Math.PI
              const bulletX = thisGrid.gridX - (this.radius * Math.sin(angleRadians) / tileMap.gridSize)
              const bulletY = thisGrid.gridY - (this.radius * Math.cos(angleRadians) / tileMap.gridSize)
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
        break
      }
    }
    return false
  }

  override handleUpdate (deltaMS: number): void {
    if (this.reloadTimeLeft > 0) {
      this.reloadTimeLeft -= this.game.reloadAdjustmentFactor
    }
    this.processOrders()
    this.updateAnimation()
    this.updateReload()
    this.zIndex = this.y + this.height
  }
}
