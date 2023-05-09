import { Container, type FederatedPointerEvent, Graphics, Sprite, type Texture } from 'pixi.js'
import { logPointerEvent } from './logger'
import { type Game } from './Game'
import { type BaseActiveItem, Team } from './common'
import { EItemType } from './interfaces/IItem'

export interface IMiniMapOptions {
  game: Game
  initWidth: number
  initHeight: number
}

class BorderRect extends Graphics {}
class CameraRect extends Graphics {}
class BackgroundContainer extends Container {}
class Background extends Sprite {}

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
  public backgroundContainer = new BackgroundContainer()
  public background = new Background()
  public cameraRect = new CameraRect()
  public activeItems = new Container<Graphics>()
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

    this.background.addChild(this.cameraRect)
    this.background.addChild(this.activeItems)
    this.backgroundContainer.addChild(this.background)
    const { borderWidth } = MiniMap.options
    this.backgroundContainer.position.set(borderWidth, borderWidth)
    this.addChild(this.backgroundContainer)
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
    this.background.eventMode = 'static'
    this.background.on('pointerdown', this.handlePointerDown)
    this.background.on('pointerup', this.handlePointerUp)
    this.background.on('pointermove', this.handlePointerMove)
    this.background.on('pointerleave', this.handlePointerLeave)
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

    this.backgroundContainer.scale.set(scale)

    const { width: bgWidth, height: bgHeight } = this.background
    const innerWidthScaled = innerWidth / this.backgroundContainer.scale.x
    const innerHeightScaled = innerHeight / this.backgroundContainer.scale.y

    const x = innerWidthScaled > bgWidth ? (innerWidthScaled - bgWidth) / 2 : 0
    const y = innerHeightScaled > bgHeight ? (innerHeightScaled - bgHeight) / 2 : 0
    this.background.x = x
    this.background.y = y
  }

  drawCameraRect (): void {
    const { cameraRectColor, cameraRectThickness } = MiniMap.options
    this.cameraRect.clear()
    this.cameraRect.beginFill(cameraRectColor)
    const { width, height } = this.game.camera
    const { scale: { x: tmSX, y: tmSY } } = this.game.tileMap
    const cameraWidth = width / tmSX
    const cameraHeight = height / tmSY
    const { scale: { x: bgSX, y: bgSY } } = this.backgroundContainer
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
    while (this.activeItems.children.length > 0) {
      this.activeItems.children[0].removeFromParent()
    }
    const { width, height } = this.background.texture
    const bgBounds = { top: 0, right: 0 + width, bottom: 0 + height, left: 0 }
    const { activeItems } = this.game.tileMap
    for (let i = 0; i < activeItems.children.length; i++) {
      const activeItem = activeItems.children[i]
      const graphics = new Graphics()
      graphics.beginFill(this.getItemColor(activeItem))
      const itemBounds = activeItem.getCollisionBounds()
      if ((itemBounds.left < bgBounds.left && itemBounds.right < bgBounds.left) ||
        (itemBounds.left > bgBounds.right && itemBounds.right > bgBounds.right) ||
        (itemBounds.top < bgBounds.top && itemBounds.bottom < bgBounds.top) ||
        (itemBounds.top > bgBounds.bottom && itemBounds.bottom > bgBounds.bottom)) {
        // item outside of map bounds
        // skip draw on mini-map
        continue
      }
      if (activeItem.type === EItemType.buildings) {
        graphics.drawRect(0, 0, itemBounds.right - itemBounds.left, itemBounds.bottom - itemBounds.top)
      } else if (activeItem.type === EItemType.vehicles || activeItem.type === EItemType.airVehicles) {
        graphics.drawCircle(0, 0, (itemBounds.right - itemBounds.left) / 2)
      }
      graphics.endFill()
      graphics.position.set(itemBounds.left, itemBounds.top)
      this.activeItems.addChild(graphics)
    }
  }
}
