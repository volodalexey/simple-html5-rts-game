import { Container, Graphics } from 'pixi.js'
import { type Game } from './Game'
import { CommandsBar } from './CommandsBar'
import { type SelectableItem } from './common'
import { logSideBar } from './logger'
import { Button } from './Button'

interface ISideBarOptions {
  game: Game
  viewWidth: number
  initY?: number
  align?: 'left' | 'right'
}

export class SideBar extends Container {
  public toX = 0
  public toOpen = false
  public toClose = false
  public opened = false
  public closed = true
  public game!: Game
  public align!: ISideBarOptions['align']
  public staticContent!: Container
  public toggleButton!: Button
  public hideableContent!: Container
  public commandsBar!: CommandsBar
  public contentMask!: Graphics
  public viewWidth!: number

  static options = {
    initWidth: 64,
    initHeight: 300
  }

  constructor (options: ISideBarOptions) {
    super()
    this.game = options.game
    this.viewWidth = options.viewWidth
    this.align = options.align ?? 'left'
    this.setup(options)

    this.drawStaticContent()
    this.drawMask()

    this.setAlignment()
  }

  setup (options: ISideBarOptions): void {
    this.staticContent = new Container()
    this.addChild(this.staticContent)

    this.hideableContent = new Container()
    this.addChild(this.hideableContent)

    this.commandsBar = new CommandsBar({
      game: options.game
    })
    this.hideableContent.addChild(this.commandsBar)

    this.contentMask = new Graphics()

    this.addChild(this.contentMask)

    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  setAlignment (): void {
    if (this.align === 'left') {
      this.position.x = 0
    } else {
      this.position.x = this.viewWidth - this.width
    }
  }

  setHideableContentAlignment ({ forceOpen = false, forceClose = false }: { forceOpen?: boolean, forceClose?: boolean } = {}): void {
    if (forceOpen) {
      if (this.align === 'left') {
        this.hideableContent.position.x = -this.width
        this.toX = 0
      } else {
        this.hideableContent.position.x = this.width
        this.toX = 0
      }
      logSideBar(`to open/closed hideable-${this.align} (${this.hideableContent.position.x}) toX=${this.toX}`)
    } else if (forceClose) {
      if (this.align === 'left') {
        this.hideableContent.position.x = 0
        this.toX = -this.width
      } else {
        this.hideableContent.position.x = 0
        this.toX = this.width
      }
      logSideBar(`to close/opened hideable-${this.align} (${this.hideableContent.position.x}) toX=${this.toX}`)
    }
  }

  getToggleText (): string {
    return `${this.align === 'left' ? '>>>' : '<<<'}\ncash:\n${this.game.cash[this.game.team]}`
  }

  drawStaticContent (): void {
    this.toggleButton = new Button({
      text: this.getToggleText(),
      fontSize: 16,
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      shadowTextColor: 0x800080,
      shadowThickness: 1,
      buttonSelectedAlpha: 0,
      buttonIdleAlpha: 0,
      buttonHoverAlpha: 0,
      onClick: () => {
        this.align = this.align === 'left' ? 'right' : 'left'
        this.setAlignment()
        this.setHideableContentAlignment({ forceOpen: this.toOpen, forceClose: this.toClose })
      }
    })
    this.staticContent.addChild(this.toggleButton)
  }

  drawMask ({ height }: { height?: number } = {}): void {
    const { initWidth, initHeight } = SideBar.options
    this.contentMask.clear()
    this.contentMask.beginFill(0xffffff)
    this.contentMask.drawRect(0, 0, initWidth, height ?? initHeight)
    this.contentMask.endFill()
    this.contentMask.position.set(0, this.staticContent.height)
    this.hideableContent.position.set(0, this.staticContent.height)

    this.hideableContent.mask = this.contentMask
  }

  handleResize ({ viewWidth, initY }: {
    viewWidth: number
    initY: number
  }): void {
    this.viewWidth = viewWidth
    this.position.y = initY
  }

  handleUpdate (deltaMS: number): void {
    this.toggleButton.text.text = this.getToggleText()
    const isLeft = this.align === 'left'
    if (this.toOpen) {
      logSideBar(`update-to-open (${this.hideableContent.position.x}) toX=${this.toX}`)
      if (isLeft
        ? this.hideableContent.position.x > this.toX - 0.1
        : this.hideableContent.position.x < this.toX + 0.1) {
        this.hideableContent.position.x = this.toX
        this.toOpen = false
        this.opened = true
        this.closed = false
      } else {
        if (isLeft) {
          this.hideableContent.position.x += (this.toX - this.hideableContent.position.x) * 0.1
        } else {
          this.hideableContent.position.x -= (this.hideableContent.position.x - this.toX) * 0.1
        }
      }
    } else if (this.toClose) {
      logSideBar(`update-to-close (${this.hideableContent.position.x}) toX=${this.toX}`)
      if (isLeft
        ? this.hideableContent.position.x < this.toX + 0.1
        : this.hideableContent.position.x > this.toX - 0.1) {
        this.hideableContent.position.x = this.toX
        this.toClose = false
        this.opened = false
        this.closed = true
      } else {
        if (isLeft) {
          this.hideableContent.position.x -= (this.hideableContent.position.x - this.toX) * 0.1
        } else {
          this.hideableContent.position.x += (this.toX - this.hideableContent.position.x) * 0.1
        }
      }
    }
  }

  handleSelectedItems (selectedItems: SelectableItem[]): void {
    logSideBar(`handleSelectedItems (${selectedItems.length}) opened=${this.opened} toOpen=${this.toOpen} toClose=${this.toClose}`)
    if (selectedItems.length > 0) {
      const commandsChanged = this.commandsBar.prepareCommands(selectedItems)
      if (commandsChanged) {
        this.drawMask({ height: this.commandsBar.height })
      }
      if ((!this.opened && !this.toOpen) || commandsChanged) {
        this.open()
      }
    } else {
      if (!this.closed || (this.opened && !this.toClose) || (!this.opened && this.toOpen)) {
        this.close()
      }
    }
  }

  open (): void {
    logSideBar('open()')
    this.toOpen = true
    this.toClose = false
    this.setHideableContentAlignment({ forceOpen: true })
  }

  close (): void {
    logSideBar('close()')
    this.toOpen = false
    this.toClose = true
    this.setHideableContentAlignment({ forceClose: true })
  }
}
