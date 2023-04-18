import { Container } from 'pixi.js'
import { StatusBar } from './StatusBar'
import { InputHandler } from './InputHandler'
import { TileMap } from './TileMap'
import { Camera } from './Camera'
import { logLayout } from './logger'

export interface IGameOptions {
  viewWidth: number
  viewHeight: number
}

export class Game extends Container {
  public gameEnded = false
  public time = 0

  public viewWidth: number
  public viewHeight: number
  public inputHandler!: InputHandler
  public tileMap!: TileMap
  public statusBar!: StatusBar
  public camera!: Camera

  constructor (options: IGameOptions) {
    super()
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup(options)
  }

  setup ({
    viewWidth,
    viewHeight
  }: IGameOptions): void {
    this.tileMap = new TileMap({
      viewWidth,
      viewHeight
    })
    this.addChild(this.tileMap)

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.inputHandler = new InputHandler({ eventTarget: this.tileMap })

    this.camera = new Camera({ tileMap: this.tileMap })
  }

  startGame = ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void => {
    this.gameEnded = false
    this.time = 0
    this.runLevel({ mapImageSrc, mapSettingsSrc })
    this.inputHandler.restart()
  }

  endGame (): void {
    this.gameEnded = true
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.tileMap.handleResize({ viewWidth, viewHeight })

    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const totalWidth = this.tileMap.background.width
    const totalHeight = this.tileMap.background.height
    const occupiedWidth = totalWidth
    const occupiedHeight = totalHeight
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.statusBar.visible = false
    this.x = x
    this.y = y
    logLayout(`x=${x} y=${y}`)
    this.statusBar.visible = true

    const calcWidth = availableWidth > occupiedWidth ? occupiedWidth : availableWidth
    this.statusBar.position.set(calcWidth / 2 - this.statusBar.width / 2, 0)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      return
    }
    this.time += deltaMS
    this.statusBar.updateTime(this.time)
    this.tileMap.handleUpdate(deltaMS)
    this.camera.handleUpdate(deltaMS)
  }

  runLevel ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void {
    this.tileMap.restart()
    this.tileMap.cleanFromAll()

    this.tileMap.initLevel({ mapImageSrc, mapSettingsSrc })

    this.statusBar.updateLevel(0)
  }
}
