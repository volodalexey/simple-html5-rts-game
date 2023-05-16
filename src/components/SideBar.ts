import { Container, Graphics, type Texture } from 'pixi.js'
import { type Game } from '../Game'
import { CommandsBar } from './CommandsBar'
import { type SelectableItem } from '../utils/helpers'
import { logSideBar } from '../utils/logger'
import { Button } from './Button'
import { SceneManager } from '../scenes/SceneManager'

interface ISideBarOptions {
  game: Game
  onSettingsClick: () => void
  viewWidth: number
  initY?: number
  align?: 'left' | 'right'
}

interface ISideBarTextures {
  iconGearsTexture: Texture
}

class StaticContent extends Container {}
class HideableContent extends Container {}
class ContentMask extends Graphics {}
class SettingsButton extends Button {}
class ToggleButton extends Button {}

export class SideBar extends Container {
  static textures: ISideBarTextures

  static prepareTextures ({ textures }: { textures: ISideBarTextures }): void {
    SideBar.textures = textures
  }

  public toX = 0
  public toOpen = false
  public toClose = false
  public opened = false
  public closed = true
  public game!: Game
  public onSettingsClick!: ISideBarOptions['onSettingsClick']
  public align!: ISideBarOptions['align']
  public staticContent!: StaticContent
  public settingsButton!: SettingsButton
  public toggleButton!: ToggleButton
  public hideableContent!: HideableContent
  public commandsBar!: CommandsBar
  public contentMask!: ContentMask
  public viewWidth!: number

  static options = {
    initWidth: 70,
    initHeight: 300
  }

  constructor (options: ISideBarOptions) {
    super()
    this.game = options.game
    this.onSettingsClick = options.onSettingsClick
    this.viewWidth = options.viewWidth
    this.align = options.align ?? 'left'
    this.setup(options)

    this.drawStaticContent()
    this.drawMask()

    this.setAlignment()
    this.setStaticContentAlignment()
  }

  setup (options: ISideBarOptions): void {
    this.staticContent = new StaticContent()
    this.addChild(this.staticContent)

    this.hideableContent = new HideableContent()
    this.addChild(this.hideableContent)

    this.commandsBar = new CommandsBar({
      game: options.game
    })
    this.hideableContent.addChild(this.commandsBar)

    this.contentMask = new ContentMask()

    this.addChild(this.contentMask)

    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }

    SceneManager.app.ticker.add(this.handleUpdate)
  }

  setAlignment (): void {
    if (this.align === 'left') {
      this.position.x = 0
      this.settingsButton.position.x = 0
      this.toggleButton.position.x = this.settingsButton.width
    } else {
      this.position.x = this.viewWidth - this.width
      this.settingsButton.position.x = -this.settingsButton.width
      this.toggleButton.position.x = this.settingsButton.position.x - this.toggleButton.width
    }
  }

  setStaticContentAlignment (): void {
    if (this.align === 'left') {
      this.settingsButton.position.x = 0
      this.toggleButton.position.x = this.settingsButton.width
    } else {
      this.toggleButton.position.x = 0
      this.settingsButton.position.x = this.toggleButton.width
    }
  }

  setHideableContentPosition (): void {
    if (this.closed) {
      if (this.align === 'left') {
        this.hideableContent.position.x = -this.hideableContent.width
      } else {
        this.hideableContent.position.x = this.width
      }
      logSideBar(`closed hideable-${this.align} ${this.hideableContent.position.x}`)
    } else if (this.opened) {
      if (this.align === 'left') {
        this.hideableContent.position.x = 0
      } else {
        this.hideableContent.position.x = this.width - this.hideableContent.width
      }
      logSideBar(`opened hideable-${this.align} ${this.hideableContent.position.x}`)
    }
  }

  calcHideableContentPosition ({ forceOpen = false, forceClose = false }: { forceOpen?: boolean, forceClose?: boolean } = {}): void {
    if (forceOpen) {
      if (this.align === 'left') {
        this.toX = 0
      } else {
        this.toX = this.width - this.hideableContent.width
      }
      logSideBar(`force open hideable-${this.align} toX=${this.toX}`)
    } else if (forceClose) {
      if (this.align === 'left') {
        this.toX = -this.hideableContent.width
      } else {
        this.toX = this.width
      }
      logSideBar(`force close hideable-${this.align} toX=${this.toX}`)
    }
  }

  getToggleText (): string {
    return `${this.align === 'left' ? '>>>' : '<<<'}\ncash:\n${this.game.cash[this.game.team]}`
  }

  drawStaticContent (): void {
    this.settingsButton = new SettingsButton({
      textColor: 0xffffff,
      iconColor: 0xffffff,
      iconColorHover: 0xffff00,
      iconPaddingLeft: 5,
      iconPaddingTop: 7,
      buttonHeight: 60,
      buttonWidth: 63,
      buttonIdleColor: 0x454545,
      buttonBorderColor: 0x181716,
      buttonBorderHoverColor: 0xffff00,
      buttonBorderWidth: 2,
      textPaddingLeft: 0,
      textPaddingTop: 0,
      iconTexture: SideBar.textures.iconGearsTexture,
      iconWidth: 50,
      iconHeight: 40,
      onClick: this.onSettingsClick
    })
    this.staticContent.addChild(this.settingsButton)
    this.toggleButton = new ToggleButton({
      text: this.getToggleText(),
      fontSize: 16,
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      shadowTextColor: 0x800080,
      shadowThickness: 1,
      buttonWidth: SideBar.options.initWidth,
      buttonBorderHoverColor: 0xffff00,
      buttonHoverColor: 0x454545,
      buttonIdleColor: 0x454545,
      buttonSelectedColor: 0x454545,
      buttonBorderWidth: 2,
      buttonBorderColor: 0x181716,
      onClick: () => {
        if (this.game.gameEnded) {
          return
        }
        this.align = this.align === 'left' ? 'right' : 'left'
        this.setAlignment()
        this.setStaticContentAlignment()
        this.setHideableContentPosition()
        this.calcHideableContentPosition({ forceOpen: this.toOpen, forceClose: this.toClose })
      }
    })
    this.staticContent.addChild(this.toggleButton)
  }

  drawMask ({ height }: { height?: number } = {}): void {
    const { initWidth, initHeight } = SideBar.options
    this.contentMask.clear()
    this.contentMask.beginFill(0xffffff)
    this.contentMask.drawRect(0, 0, Math.max(initWidth, this.width), height ?? initHeight)
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
    this.setStaticContentAlignment()
  }

  handleUpdate = (deltaMS: number): void => {
    const text = this.getToggleText()
    if (this.toggleButton.text.text !== text) {
      this.toggleButton.text.text = text
    }
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
      if (commandsChanged || this.commandsBar.commandTiles.children.length === 0) {
        this.drawMask({ height: this.commandsBar.height })
      }
      if ((!this.opened && !this.toOpen) || commandsChanged) {
        this.open()
      }
    } else {
      if (!this.closed || (this.opened && !this.toClose) || (!this.opened && this.toOpen)) {
        this.close()
      }
      this.commandsBar.deselectTiles()
    }
  }

  open (): void {
    logSideBar('open()')
    this.toOpen = true
    this.toClose = false
    this.setHideableContentPosition()
    this.calcHideableContentPosition({ forceOpen: true })
  }

  close (): void {
    logSideBar('close()')
    this.toOpen = false
    this.toClose = true
    this.setHideableContentPosition()
    this.calcHideableContentPosition({ forceClose: true })
  }

  clearAll (): void {
    this.commandsBar.clearCommandTiles()
    this.closed = true
    this.opened = false
    this.toClose = false
    this.toOpen = false
    this.setHideableContentPosition()
  }
}
