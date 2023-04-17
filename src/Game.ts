import { Container } from 'pixi.js'
import { StatusBar } from './StatusBar'
import { StartModal } from './StartModal'
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

  static options = {
    maxTime: 600000,
    startLevel: 1,
    maxLevel: 2
  }

  public currentLevel = Game.options.startLevel

  public viewWidth: number
  public viewHeight: number
  public inputHandler!: InputHandler
  public tileMap!: TileMap
  public statusBar!: StatusBar
  public startModal!: StartModal
  public camera!: Camera

  constructor (options: IGameOptions) {
    super()
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup(options)

    this.addEventLesteners()

    this.runLevel()
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

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)
  }

  addEventLesteners (): void {
    this.startModal.on('click', this.startGame)
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.gameEnded = false
    this.time = 0
    this.currentLevel = Game.options.startLevel
    this.runLevel()
    this.inputHandler.restart()
  }

  endGame (success = false): void {
    this.gameEnded = true
    this.startModal.visible = true
    if (success) {
      this.startModal.win('Win!!')
    } else {
      this.startModal.lose('You lose!')
    }
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
    const calcHeight = availableHeight > occupiedHeight ? occupiedHeight : availableHeight
    this.statusBar.position.set(calcWidth / 2 - this.statusBar.width / 2, 0)
    this.startModal.position.set(calcWidth / 2 - this.startModal.width / 2, calcHeight / 2 - this.startModal.height / 2)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      return
    }
    this.time += deltaMS
    this.statusBar.updateTime(this.time)
    if (this.time > Game.options.maxTime) {
      this.endGame()
      return
    }
    this.tileMap.handleUpdate(deltaMS)
    this.camera.handleUpdate(deltaMS)
  }

  runLevel (increment?: boolean): void {
    if (increment === true) {
      this.currentLevel++
    }
    if (this.currentLevel > Game.options.maxLevel) {
      this.endGame(true)
      return
    }
    this.tileMap.restart()
    this.tileMap.cleanFromAll()

    this.tileMap.initLevel(this.currentLevel)

    this.statusBar.updateLevel(this.currentLevel)
  }
}
