import { Container, type FederatedPointerEvent, Graphics, Sprite, type Texture } from 'pixi.js'
import { logNoFog, logPointerEvent } from '../utils/logger'
import { type Game } from '../Game'
import { type BaseActiveItem, Team } from '../utils/helpers'
import { EItemType } from '../interfaces/IItem'

export interface IMiniMapOptions {
  game: Game
  initWidth: number
  initHeight: number
}

class BorderRect extends Graphics {}
class CameraRect extends Graphics {}
class BorderContainer extends Container {}
class BackgroundContainer extends Container {}
class Background extends Sprite {}
class ActiveItems extends Graphics {}
class SightMini extends Graphics {}

export class MiniMap extends Container {
  static options = {
    borderColor: 0x454545,
    backgroundColor: 0x485b6c,
    borderWidth: 2,
    cameraRectColor: 0xc1a517,
    cameraRectThickness: 2,
    itemBlueTeamClor: 0x0000ff,
    itemBlueTeamAttackClor: 0xff0000,
    itemGreeTeamClor: 0x00ff00,
    itemGreenTeamAttackClor: 0xff0000
  }

  public game!: Game
  public rebuildRequired = true
  public pointerDownX = -1
  public pointerDownY = -1
  public border = new BorderRect()
  public borderContainer = new BorderContainer()
  public backgroundContainer = new BackgroundContainer()
  public background = new Background()
  public background2 = new Background()
  public sightMini = new SightMini()
  public cameraRect = new CameraRect()
  public activeItemsMini = new ActiveItems()
  public initWidth!: number
  public initHeight!: number
  constructor (options: IMiniMapOptions) {
    super()
    this.game = options.game
    this.initWidth = options.initWidth
    this.initHeight = options.initHeight

    this.setup()

    this.draw()

    this.addEventLesteners()
  }

  setup (): void {
    this.addChild(this.border)
    this.addChild(this.borderContainer)
    this.borderContainer.addChild(this.backgroundContainer)
    const { borderWidth } = MiniMap.options
    this.borderContainer.position.set(borderWidth, borderWidth)

    this.backgroundContainer.addChild(this.background)
    this.background.alpha = 0.3
    this.backgroundContainer.addChild(this.background2)
    this.backgroundContainer.addChild(this.activeItemsMini)
    this.backgroundContainer.addChild(this.cameraRect)
    this.backgroundContainer.addChild(this.sightMini)
  }

  draw (): void {
    const { initWidth, initHeight } = this
    const { borderColor, backgroundColor, borderWidth } = MiniMap.options
    this.border.beginFill(borderColor)
    this.border.drawRect(0, 0, initWidth, initHeight)
    this.border.endFill()

    this.border.beginFill(backgroundColor)
    this.border.drawRect(borderWidth, borderWidth, initWidth - borderWidth * 2, initHeight - borderWidth * 2)
    this.border.endFill()
  }

  addEventLesteners (): void {
    this.backgroundContainer.eventMode = 'static'
    this.backgroundContainer.on('pointerdown', this.handlePointerDown)
    this.backgroundContainer.on('pointerup', this.handlePointerUp)
    this.backgroundContainer.on('pointermove', this.handlePointerMove)
    this.backgroundContainer.on('pointerleave', this.handlePointerLeave)
    this.activeItemsMini.interactiveChildren = false
  }

  handlePointerDown = (e: FederatedPointerEvent): void => {
    if (this.game.gameEnded) {
      return
    }
    const localPosition = this.background.toLocal(e)
    this.pointerDownX = localPosition.x
    this.pointerDownY = localPosition.y
    logPointerEvent(`MiniMap pdX=${this.pointerDownX} pdX=${this.pointerDownY} down`)
    if (this.pointerDownX > -1 && this.pointerDownY > -1) {
      if (localPosition.x >= this.cameraRect.x && localPosition.x <= this.cameraRect.x + this.cameraRect.width &&
        localPosition.y >= this.cameraRect.y && localPosition.y <= this.cameraRect.y + this.cameraRect.height) {
        // do nothing
      } else {
        // only if click outside of camera rectangular
        this.game.tileMap.goTo(localPosition)
      }
    }
  }

  handlePointerUp = (e: FederatedPointerEvent): void => {
    if (this.game.gameEnded) {
      return
    }
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`MiniMap pdX=${this.pointerDownX} pdX=${this.pointerDownY} up`)
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    if (this.game.gameEnded) {
      return
    }
    if (this.pointerDownX > -1 && this.pointerDownY > -1) {
      const localPosition = this.background.toLocal(e)
      logPointerEvent(`MiniMap pdX=${this.pointerDownX} pdX=${this.pointerDownY} mX=${localPosition.x} mY=${localPosition.y}`)
      this.game.tileMap.goDiff({ diffX: localPosition.x - this.pointerDownX, diffY: localPosition.y - this.pointerDownY })
      this.pointerDownX = localPosition.x
      this.pointerDownY = localPosition.y
    }
  }

  handlePointerLeave = (e: FederatedPointerEvent): void => {
    if (this.game.gameEnded) {
      return
    }
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} up`)
  }

  assignBackgroundTexture ({ texture }: { texture: Texture }): void {
    this.background.texture = texture
    this.background2.texture = texture
    this.fit({ texture })
    this.drawCameraRect()
    this.updateCameraRect()
  }

  handleUpdate (deltaMS: number): void {
    this.updateCameraRect()
    this.updateItems()
  }

  handleResize (_: { viewWidth: number, viewHeight: number }): void {
    this.drawCameraRect()
    this.updateCameraRect()
  }

  fit ({ texture }: { texture: Texture }): void {
    const { gridSize } = this.game.tileMap
    const { initWidth, initHeight } = this
    const { borderWidth } = MiniMap.options
    const { width, height } = texture

    const innerWidth = initWidth - borderWidth * 2
    const innerHeight = initHeight - borderWidth * 2
    let scale = 1
    const padTextureWidth = width + gridSize * 2
    const padTextureHeight = height + gridSize * 2
    if (padTextureWidth >= padTextureHeight) {
      scale = innerWidth / padTextureWidth
    } else {
      scale = innerHeight / padTextureHeight
    }

    this.borderContainer.scale.set(scale)

    // const { width: bgWidth, height: bgHeight } = this.background.texture
    const innerWidthScaled = innerWidth / this.borderContainer.scale.x
    const innerHeightScaled = innerHeight / this.borderContainer.scale.y

    const x = innerWidthScaled > width ? (innerWidthScaled - width) / 2 : 0
    const y = innerHeightScaled > height ? (innerHeightScaled - height) / 2 : 0
    this.backgroundContainer.x = x
    this.backgroundContainer.y = y
  }

  drawCameraRect (): void {
    const { cameraRectColor, cameraRectThickness } = MiniMap.options
    this.cameraRect.clear()
    this.cameraRect.beginFill(cameraRectColor)
    const { width, height } = this.game.camera
    const { scale: { x: tmSX, y: tmSY } } = this.game.tileMap
    const cameraWidth = width / tmSX
    const cameraHeight = height / tmSY
    const { scale: { x: bgSX, y: bgSY } } = this.borderContainer
    const scaledBorderWidthX = cameraRectThickness / bgSX
    const scaledBorderWidthY = cameraRectThickness / bgSY
    this.cameraRect.drawRect(0, 0, cameraWidth, cameraHeight)
    this.cameraRect.endFill()
    this.cameraRect.beginHole()
    this.cameraRect.drawRect(scaledBorderWidthX, scaledBorderWidthY, cameraWidth - scaledBorderWidthX * 2, cameraHeight - scaledBorderWidthY * 2)
    this.cameraRect.endHole()
  }

  updateCameraRect (): void {
    const { x: camX, y: camY } = this.game.tileMap.pivot
    this.cameraRect.position.set(camX, camY)
  }

  updateItems (): void {
    if (this.rebuildRequired) {
      this.drawItems()
      // this.rebuildRequired = false
    }
  }

  getItemColor (item: BaseActiveItem): number {
    const { itemBlueTeamClor, itemGreeTeamClor, itemBlueTeamAttackClor, itemGreenTeamAttackClor } = MiniMap.options
    if (item.order.type === 'attack') {
      return item.team === Team.blue ? itemBlueTeamAttackClor : itemGreenTeamAttackClor
    }
    return item.team === Team.blue ? itemBlueTeamClor : itemGreeTeamClor
  }

  drawItems (): void {
    const { activeItemsMini, background2, sightMini } = this
    const { enableFog } = this.game.debug
    const { activeItems, gridSize } = this.game.tileMap
    activeItemsMini.clear()
    sightMini.clear()
    for (let i = 0; i < activeItems.children.length; i++) {
      const activeItem = activeItems.children[i]
      if (!activeItem.renderable) {
        continue
      }
      activeItemsMini.beginFill(this.getItemColor(activeItem))
      const itemBounds = activeItem.getCollisionBounds()
      const itemCenter = activeItem.getCollisionPosition({ center: true })
      if (activeItem.type === EItemType.buildings) {
        activeItemsMini.drawRect(itemBounds.left, itemBounds.top, itemBounds.right - itemBounds.left, itemBounds.bottom - itemBounds.top)
      } else if (activeItem.type === EItemType.vehicles || activeItem.type === EItemType.airVehicles) {
        activeItemsMini.drawCircle(itemCenter.x, itemCenter.y, Math.max(activeItem.collisionGraphics.width, activeItem.collisionGraphics.height) / 2)
      }
      if ((!logNoFog.enabled && enableFog) && activeItem.team === this.game.team) {
        sightMini.beginFill(0xffffff)
        sightMini.drawCircle(itemCenter.x, itemCenter.y, activeItem.sightRadius * gridSize)
        sightMini.endFill()
      }
      activeItemsMini.endFill()
    }
    if (!logNoFog.enabled && enableFog) {
      background2.mask = sightMini
    }
  }
}
