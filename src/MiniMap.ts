import { Container, type FederatedPointerEvent, Graphics, Sprite, type Texture } from 'pixi.js'
import { type Camera } from './Camera'
import { logPointerEvent } from './logger'

export interface IMiniMapOptions {
  camera: Camera
  initWidth: number
  initHeight: number
  onCameraGoTo: (options: { x: number, y: number }) => void
  onCameraGoDiff: (options: { diffX: number, diffY: number }) => void
}

export class MiniMap extends Container {
  static options = {
    borderColor: 0x454545,
    backgroundColor: 0x485b6c,
    borderWidth: 2,
    cameraRectColor: 0xc1a517,
    cameraRectThickness: 2
  }

  public onCameraGoTo !: IMiniMapOptions['onCameraGoTo']
  public onCameraGoDiff !: IMiniMapOptions['onCameraGoDiff']
  public pointerDownX = -1
  public pointerDownY = -1
  public camera!: Camera
  public border = new Graphics()
  public backgroundContainer = new Container()
  public background = new Sprite()
  public cameraRect = new Graphics()
  public initWidth!: number
  public initHeight!: number
  constructor (options: IMiniMapOptions) {
    super()
    this.camera = options.camera
    this.initWidth = options.initWidth
    this.initHeight = options.initHeight
    this.onCameraGoTo = options.onCameraGoTo
    this.onCameraGoDiff = options.onCameraGoDiff

    this.setup()

    this.draw()

    this.addEventLesteners()
  }

  setup (): void {
    this.addChild(this.border)

    this.background.addChild(this.cameraRect)
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
    this.background.interactive = true
    this.background.on('pointerdown', this.handlePointerDown)
    this.background.on('pointerup', this.handlePointerUp)
    this.background.on('pointermove', this.handlePointerMove)
    this.background.on('pointerleave', this.handlePointerLeave)
  }

  handlePointerDown = (e: FederatedPointerEvent): void => {
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
        const goX = localPosition.x - this.cameraRect.x
        const goY = localPosition.y - this.cameraRect.y
        this.onCameraGoTo({ x: goX, y: goY })
      }
    }
  }

  handlePointerUp = (e: FederatedPointerEvent): void => {
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`MiniMap pdX=${this.pointerDownX} pdX=${this.pointerDownY} up`)
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    if (this.pointerDownX > -1 && this.pointerDownY > -1) {
      const localPosition = this.background.toLocal(e)
      logPointerEvent(`MiniMap pdX=${this.pointerDownX} pdX=${this.pointerDownY} mX=${localPosition.x} mY=${localPosition.y}`)
      this.onCameraGoDiff({ diffX: localPosition.x - this.pointerDownX, diffY: localPosition.y - this.pointerDownY })
      this.pointerDownX = localPosition.x
      this.pointerDownY = localPosition.y
    }
  }

  handlePointerLeave = (e: FederatedPointerEvent): void => {
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} up`)
  }

  assignBackgroundTexture ({ texture, camX, camY }: { texture: Texture, camX?: number, camY?: number }): void {
    this.background.texture = texture
    this.fit({ texture })
    this.drawCameraRect()
    this.updateCameraRect({ camX, camY })
  }

  handleUpdate ({ camX, camY }: {
    deltaMS: number
    camX?: number
    camY?: number
  }): void {
    this.updateCameraRect({ camX, camY })
  }

  handleResize ({ viewWidth, viewHeight, camX, camY }: {
    viewWidth: number
    viewHeight: number
    camX: number
    camY: number
  }): void {
    this.drawCameraRect()
    this.updateCameraRect({ camX, camY })
  }

  fit ({ texture }: { texture: Texture }): void {
    const { initWidth, initHeight } = this
    const { borderWidth } = MiniMap.options
    const { width, height } = texture

    const innerWidth = initWidth - borderWidth * 2
    const innerHeight = initHeight - borderWidth * 2
    let scale = 1
    if (width >= height) {
      scale = innerWidth / width
    } else {
      scale = innerHeight / height
    }

    this.background.scale.set(scale)

    const { width: bgWidth, height: bgHeight } = this.background

    const x = innerWidth > bgWidth ? (innerWidth - bgWidth) / 2 : 0
    const y = innerHeight > bgHeight ? (innerHeight - bgHeight) / 2 : 0
    this.background.x = x
    this.background.y = y
  }

  drawCameraRect (): void {
    const { cameraRectColor, cameraRectThickness } = MiniMap.options
    this.cameraRect.clear()
    this.cameraRect.beginFill(cameraRectColor)
    const { width, height } = this.camera
    const { scale: { x: sx, y: sy } } = this.background
    const scaledBorderWidthX = cameraRectThickness / sx
    const scaledBorderWidthY = cameraRectThickness / sy
    this.cameraRect.drawRect(0, 0, width, height)
    this.cameraRect.endFill()
    this.cameraRect.beginHole()
    this.cameraRect.drawRect(scaledBorderWidthX, scaledBorderWidthY, width - scaledBorderWidthX * 2, height - scaledBorderWidthY * 2)
    this.cameraRect.endHole()
  }

  updateCameraRect ({ camX = 0, camY = 0 }: { camX?: number, camY?: number }): void {
    this.cameraRect.position.set(camX, camY)
  }
}
