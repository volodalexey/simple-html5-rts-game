import { Container } from 'pixi.js'
import { StatusBar } from './StatusBar'
import { MiniMap } from './MiniMap'
import { type Game } from '../Game'

interface ITopBarOptions {
  game: Game
}

export class TopBar extends Container {
  static options = {
    statusBarWidth: 600,
    miniMapWidth: 150,
    initHeight: 100
  }

  public statusBar!: StatusBar
  public miniMap!: MiniMap

  constructor (options: ITopBarOptions) {
    super()

    this.setup(options)
  }

  setup ({ game }: ITopBarOptions): void {
    const { statusBarWidth, miniMapWidth, initHeight } = TopBar.options
    this.statusBar = new StatusBar({
      initWidth: statusBarWidth,
      initHeight
    })
    this.addChild(this.statusBar)

    this.miniMap = new MiniMap({
      game,
      initWidth: miniMapWidth,
      initHeight
    })
    this.addChild(this.miniMap)
    this.miniMap.position.set(this.statusBar.width, 0)
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    const { statusBarWidth, miniMapWidth, initHeight } = TopBar.options
    const statusBarLeftWidth = viewWidth - miniMapWidth
    const x = statusBarLeftWidth > statusBarWidth ? (statusBarLeftWidth - statusBarWidth) / 2 : 0
    this.statusBar.position.set(x, 0)
    const limitWidth = statusBarLeftWidth > statusBarWidth ? statusBarWidth : statusBarLeftWidth
    this.statusBar.setLimit({ width: limitWidth, height: initHeight })
    this.miniMap.x = viewWidth - this.miniMap.width
    this.miniMap.handleResize({ viewWidth, viewHeight })
  }

  handleUpdate (deltaMS: number): void {
    this.statusBar.handleUpdate(deltaMS)
    this.miniMap.handleUpdate(deltaMS)
  }
}
