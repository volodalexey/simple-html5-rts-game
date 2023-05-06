import { Container, Graphics } from 'pixi.js'
import { type Game } from './Game'
import { CommandsBar } from './CommandsBar'
import { type SelectableItem } from './common'
import { logSideBar } from './logger'

interface ISideBarOptions {
  game: Game
  initY?: number
  initRight?: number
}

export class SideBar extends Container {
  public toOpen = false
  public toClose = false
  public opened = false
  public content!: Container
  public commandsBar!: CommandsBar
  public contentMask!: Graphics

  static options = {
    initWidth: 64,
    initHeight: 300
  }

  constructor (options: ISideBarOptions) {
    super()

    this.setup(options)

    this.drawMask()
  }

  setup (options: ISideBarOptions): void {
    this.content = new Container()
    this.addChild(this.content)

    this.commandsBar = new CommandsBar({
      game: options.game
    })
    this.content.addChild(this.commandsBar)

    this.contentMask = new Graphics()

    this.addChild(this.contentMask)

    if (typeof options.initRight === 'number') {
      this.position.x = options.initRight
    }
    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  drawMask (): void {
    const { initWidth, initHeight } = SideBar.options
    this.contentMask.beginFill(0xffffff)
    this.contentMask.drawRect(0, 0, initWidth, initHeight)
    this.contentMask.endFill()

    this.content.mask = this.contentMask
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {

  }

  handleUpdate (deltaMS: number): void {
    if (this.toOpen) {
      if (this.content.position.x >= 0 - 0.2) {
        this.content.position.x = 0
        this.toOpen = false
        this.opened = true
      } else {
        this.content.position.x += (0 - this.content.position.x) * 0.1
      }
    } else if (this.toClose) {
      const { initWidth } = SideBar.options
      if (this.content.position.x <= -initWidth + 0.2) {
        this.content.position.x = -initWidth
        this.toClose = false
        this.opened = false
      } else {
        this.content.position.x -= (initWidth - this.content.position.x) * 0.1
      }
    }
  }

  handleSelectedItems (selectedItems: SelectableItem[]): void {
    logSideBar(`handleSelectedItems (${selectedItems.length}) opened=${this.opened} toOpen=${this.toOpen} toClose=${this.toClose}`)
    if (selectedItems.length > 0) {
      const commandsChanged = this.commandsBar.prepareCommands(selectedItems)
      if ((!this.opened && !this.toOpen) || commandsChanged) {
        this.open()
      }
    } else {
      if (this.opened || !this.toClose) {
        this.close()
      }
    }
  }

  open (): void {
    logSideBar('open()')
    const { initWidth } = SideBar.options
    this.toOpen = true
    this.toClose = false
    this.content.position.set(-initWidth, 0)
  }

  close (): void {
    logSideBar('close()')
    this.toOpen = false
    this.toClose = true
    this.content.position.set(0, 0)
  }
}
