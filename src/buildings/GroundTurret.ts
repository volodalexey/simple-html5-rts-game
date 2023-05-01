import { AnimatedSprite, type Texture } from 'pixi.js'
import { Team, angleDiff, findAngleGrid, wrapDirection } from '../common'
import { Building, BuildingAnimation, type IBuildingOptions, type IBuildingTextures } from './Building'
import { type IBuildable } from '../interfaces/IBuildable'
import { type ITurnable } from '../interfaces/ITurnable'
import { EVectorDirection, Vector } from '../Vector'
import { CannonBall } from '../projectiles/CannonBall'
import { type IOrder } from '../interfaces/IOrder'

export type IGroundTurretOptions = Pick<
IBuildingOptions,
Exclude<keyof IBuildingOptions, 'textures'>
> & {
  direction?: EVectorDirection
}

export interface IGroundTurretTextures extends IBuildingTextures {
  upTextures: Texture[]
  upRightTextures: Texture[]
  rightTextures: Texture[]
  downRightTextures: Texture[]
  downTextures: Texture[]
  downLeftTextures: Texture[]
  leftTextures: Texture[]
  upLeftTextures: Texture[]
  teleportTextures: Texture[]
}

export enum GroundTurretAnimation {
  healthy = 'healthy',
  damaged = 'damaged',
  teleport = 'teleport',
}

export class GroundTurret extends Building implements IBuildable, ITurnable {
  static blueTextures: IGroundTurretTextures
  static greenTextures: IGroundTurretTextures
  static textures (team: Team): IGroundTurretTextures {
    return team === Team.blue ? GroundTurret.blueTextures : GroundTurret.greenTextures
  }

  static prepareTextures ({
    blueTextures,
    greenTextures
  }: {
    blueTextures: IGroundTurretTextures
    greenTextures: IGroundTurretTextures
  }): void {
    GroundTurret.blueTextures = blueTextures
    GroundTurret.greenTextures = greenTextures
  }

  public drawSelectionOptions = {
    width: 26,
    height: 23,
    radius: 0,
    strokeWidth: 2,
    strokeColor: 0,
    strokeSecondColor: 0xffffff,
    offset: {
      x: 6,
      y: 9
    }
  }

  public drawLifeBarOptions = {
    borderColor: 0xffffff,
    borderThickness: 1,
    borderAlpha: 0.5,
    width: 22,
    height: 5,
    fillColor: 0x15803d,
    emptyColor: 0xff0000,
    offset: {
      x: 8,
      y: 0
    }
  }

  public sight = 10
  public cost = 1500
  public hitPoints = 200
  public life = this.hitPoints
  public teleportingAnimationSpeed = 0.1
  public teleportingAnimation!: AnimatedSprite
  public upAnimation!: AnimatedSprite
  public upRightAnimation!: AnimatedSprite
  public rightAnimation!: AnimatedSprite
  public downRightAnimation!: AnimatedSprite
  public downAnimation!: AnimatedSprite
  public downLeftAnimation!: AnimatedSprite
  public leftAnimation!: AnimatedSprite
  public upLeftAnimation!: AnimatedSprite
  public canAttack = true
  public canAttackLand = true
  public canAttackAir = false
  public vector = new Vector({ direction: EVectorDirection.down })
  public moveTurning = false
  public turnSpeed = 4
  public Projectile = CannonBall
  public orders: IOrder = { type: 'sentry' }

  public buildableGrid = [
    [1]
  ]

  public passableGrid = [
    [1]
  ]

  constructor (options: IGroundTurretOptions) {
    super({
      ...options,
      textures: GroundTurret.textures(options.team)
    })
    this.setupChild()
    if (options.direction != null) {
      this.vector.setDirection({ direction: options.direction })
    }
    this.life = options.life ?? this.hitPoints
    this.drawSelectionOptions.strokeColor = options.team === Team.blue ? 0x0000ff : 0x00ff00
    this.drawSelection()
    this.setPositionByXY({ x: options.initX, y: options.initY })
    this.drawLifeBar()
    this.updateLife()
    this.updateAnimation()

    this.checkDrawBuildingBounds()
  }

  setupChild (): void {
    const {
      teleportTextures,
      upTextures,
      upRightTextures,
      rightTextures,
      downRightTextures,
      downTextures,
      downLeftTextures,
      leftTextures,
      upLeftTextures
    } = GroundTurret.textures(this.team)
    const teleportingAnimation = new AnimatedSprite(teleportTextures)
    teleportingAnimation.animationSpeed = this.teleportingAnimationSpeed
    this.spritesContainer.addChild(teleportingAnimation)
    this.teleportingAnimation = teleportingAnimation

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

  switchAnimation (animation: BuildingAnimation): void {
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

  processOrders (): void {
    // damaged turret cannot attack
    if (!this.isHealthy()) {
      return
    }
    switch (this.orders.type) {
      case 'sentry': {
        const target = this.findTargetInSight()
        if (target != null) {
          this.orders = { type: 'attack', to: target, nextOrder: this.orders }
        }
        break
      }
      case 'attack': {
        if (this.orders.to == null) {
          return
        }
        const thisGrid = this.getGridXY({ center: true })
        const toGrid = this.orders.to.getGridXY({ center: true })
        const distanceFromDestination = Math.pow(toGrid.gridX - thisGrid.gridX, 2) + Math.pow(toGrid.gridY - thisGrid.gridY, 2)
        if (this.orders.to.isDead() || !this.isValidTarget(this.orders.to) ||
          distanceFromDestination > Math.pow(this.sight, 2)
        ) {
          const target = this.findTargetInSight()
          if (target != null) {
            this.orders.to = target
          } else {
            this.orders = { type: 'sentry' }
          }
        }
        if (this.orders.type !== 'attack' || this.orders.to == null) {
          return
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
        break
      }
    }
    this.updateAnimation()
  }

  handleUpdate (deltaMS: number): void {
    if (this.reloadTimeLeft > 0) {
      this.reloadTimeLeft -= this.game.reloadAdjustmentFactor
    }
    this.processOrders()
    this.zIndex = this.y + this.height
  }
}
