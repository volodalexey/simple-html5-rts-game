import { type Socket, io } from 'socket.io-client'
import { type Application, Container, Graphics, type TextStyleAlign, Assets, type Spritesheet, Text, type TextStyleFontWeight } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { type Game } from '../Game'
import { Team } from '../utils/common'
import { EMessageCharacter } from '../components/StatusBar'
import { type Trigger, createTrigger, ETriggerType, type IConditionalTrigger, handleTiggers } from '../utils/Trigger'
import { EItemName } from '../interfaces/IItem'
import { logCash, logLayout } from '../utils/logger'
import { type SettingsModal } from '../components/SettingsModal'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

interface IMultiplayerSceneOptions {
  app: Application
  game: Game
  settingsModal: SettingsModal
  viewWidth: number
  viewHeight: number
}

class Content extends Container {}
class Box extends Graphics {}
class HeaderText extends Text {}
class URLLabelText extends Text {}
class HomeButton extends Button {}

export class MultiplayerScene extends Container implements IScene {
  public game!: Game
  public settingsModal!: SettingsModal
  public triggers: Trigger[] = []
  public content = new Content()
  public box = new Box()
  public headerText!: HeaderText
  public urlLabelText!: URLLabelText
  public homeButton!: HomeButton
  public input!: Input
  public socket?: Socket
  public socketConnected = false
  static wsURLKey = 'wsURLKey'
  static boxOptions = {
    backgroundColor: 0x454545,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 3,
    width: 350,
    height: 500,
    borderRadius: 5
  }

  static homeButtonOptions = {
    offset: { x: 0, y: 0 },
    iconColor: 0xffffff,
    iconColorHover: 0xffff00,
    iconScale: 0.7,
    buttonIdleAlpha: 0,
    buttonHoverAlpha: 0,
    buttonSelectedAlpha: 0
  }

  static headerTextOptions = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 24,
    fontWeight: 'bold' as TextStyleFontWeight,
    fill: 0xffffff,
    align: 'center' as TextStyleAlign,
    shadowTextColor: 0x800080,
    shadowThickness: 1,
    offset: {
      x: 90,
      y: 25
    }
  }

  static urlTextOptions = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 16,
    fill: 0xffffff,
    align: 'center' as TextStyleAlign,
    shadowTextColor: 0x800080,
    shadowThickness: 1,
    offset: {
      x: 25,
      y: 70
    }
  }

  static urlInputOptions = {
    offset: {
      x: 25,
      y: 100
    },
    height: 22,
    width: 300
  }

  constructor (options: IMultiplayerSceneOptions) {
    super()
    this.game = options.game
    this.settingsModal = options.settingsModal
    this.setup(options)
    this.draw(options)
  }

  draw (options: IMultiplayerSceneOptions): void {
    const {
      boxOptions: { width, height, backgroundColor, outerBorderWidth, outerBorderColor, borderRadius }
    } = MultiplayerScene

    let offsetX = 0
    let offsetY = 0
    let leftWidth = width
    let leftHeight = height

    this.box.beginFill(backgroundColor)
    this.box.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.box.endFill()

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    this.box.beginFill(outerBorderColor)
    this.box.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.box.endFill()
  }

  setup (_: IMultiplayerSceneOptions): void {
    this.addChild(this.content)

    this.content.addChild(this.box)

    const { textures }: Spritesheet = Assets.get('spritesheet')

    const { homeButtonOptions } = MultiplayerScene
    this.homeButton = new HomeButton({
      iconTexture: textures['icon-home.png'],
      ...homeButtonOptions,
      onClick: this.returnToMenuScene
    })
    this.homeButton.position.set(homeButtonOptions.offset.x, homeButtonOptions.offset.y)
    this.content.addChild(this.homeButton)

    const { headerTextOptions } = MultiplayerScene
    this.headerText = new URLLabelText('Multiplayer', {
      ...headerTextOptions,
      stroke: headerTextOptions.shadowTextColor,
      strokeThickness: headerTextOptions.shadowThickness
    })
    this.headerText.position.set(headerTextOptions.offset.x, headerTextOptions.offset.y)
    this.content.addChild(this.headerText)

    const { fontFamily, fontSize, fill, align, shadowTextColor, shadowThickness, offset } = MultiplayerScene.urlTextOptions
    this.urlLabelText = new URLLabelText('Web socket server url:', {
      fontFamily,
      fontSize,
      fill,
      align,
      stroke: shadowTextColor,
      strokeThickness: shadowThickness
    })
    this.urlLabelText.position.set(offset.x, offset.y)
    this.content.addChild(this.urlLabelText)

    const { urlInputOptions } = MultiplayerScene
    this.input = new Input({
      initHeight: urlInputOptions.height,
      initWidth: urlInputOptions.width,
      initValue: localStorage.getItem(MultiplayerScene.wsURLKey) ?? 'ws://localhost:8879',
      onChanged: (value) => {
        localStorage.setItem(MultiplayerScene.wsURLKey, value)
        this.connect()
      }
    })
    this.input.position.set(urlInputOptions.offset.x, urlInputOptions.offset.y)
    this.content.addChild(this.input)
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    if (this.content.visible) {
      this.resizeBox(options)
    } else {
      this.game.handleResize(options)
    }
    this.settingsModal.handleResize(options)
  }

  resizeBox ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const { width: tWidth, height: tHeight } = MultiplayerScene.boxOptions
    const totalWidth = tWidth
    const totalHeight = tHeight
    let scale = 1
    if (totalHeight >= totalWidth) {
      if (availableHeight < totalHeight) {
        scale = availableHeight / totalHeight
        if (scale * totalWidth > availableWidth) {
          scale = availableWidth / totalWidth
        }
        logLayout(`Multiplayer scene by height (sc=${scale})`)
      }
    } else {
      if (availableWidth < totalWidth) {
        scale = availableWidth / totalWidth
        if (scale * totalHeight > availableHeight) {
          scale = availableHeight / totalHeight
        }
        logLayout(`Multiplayer scene by width (sc=${scale})`)
      }
    }
    const occupiedWidth = Math.floor(totalWidth * scale)
    const occupiedHeight = Math.floor(totalHeight * scale)
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.content.x = x
    this.width = occupiedWidth
    this.content.y = y
    this.height = occupiedHeight
    logLayout(`x=${x} y=${y} w=${this.width} h=${this.height}`)
  }

  handleUpdate (deltaMS: number): void {
    this.game.handleUpdate(deltaMS)

    if (this.game.gameEnded) {
      return
    }

    handleTiggers({ deltaMS, triggers: this.triggers })
  }

  start (): void {
    this.triggers = [
      {
        type: ETriggerType.conditional,
        condition: () => {
          return this.game.tileMap.staticItems.filter(item => item.team === this.game.team).length === 0
        },
        action: () => {
          this.endMultiplayer({ success: false })
        }
      } satisfies IConditionalTrigger,
      {
        type: ETriggerType.conditional,
        condition: () => {
          return this.game.tileMap.staticItems.filter(item => item.team === Team.green).length === 0
        },
        action: () => {
          this.endMultiplayer({ success: true })
        }
      } satisfies IConditionalTrigger
    ].map(triggerDescription => createTrigger(triggerDescription))

    this.game.startGame({
      mapImageSrc: 'level2Background',
      mapSettingsSrc: 'level2Settings',
      startGridX: 2,
      startGridY: 37
    });

    [
      { name: EItemName.Base, initGridX: 2, initGridY: 36, team: Team.blue },
      { name: EItemName.Base, initGridX: 56, initGridY: 2, team: Team.green }
    ].forEach((itemOptions) => {
      const item = this.game.createItem(itemOptions)
      if (item != null) {
        this.game.tileMap.addItem(item)
      }
    })
    this.game.tileMap.rebuildBuildableGrid()
    this.game.cash[Team.blue] = 1600
    this.game.cash[Team.green] = 1600
    logCash(`(${this.game.team}) initial b=${this.game.cash.blue} g=${this.game.cash.green}`)

    this.game.showMessage({
      character: EMessageCharacter.system,
      message: 'Multiplayer',
      playSound: false
    })
  }

  mountedHandler (): void {
    this.game.removeFromParent()
    this.addChild(this.settingsModal)
    this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
    this.connect()
  }

  endMultiplayer ({ success }: { success: boolean }): void {
    this.game.endGame({
      success,
      message: success
        ? 'You win!'
        : 'You lose...',
      view: 'home',
      onLeftClick: () => {
        SceneManager.changeScene({ name: 'menu' }).catch(console.error)
      }
    })
  }

  closeSocket (): void {
    if (this.socket != null) {
      this.socket.removeAllListeners()
      this.socket.io.removeAllListeners()
      this.socket.close()
      this.socket = undefined
    }
  }

  connect (): void {
    this.closeSocket()
    this.headerText.text = 'Connecting...'
    this.socket = io(this.input.text.text)
    this.socket.once('connect', this.onSocketConnect)
    this.socket.io.once('error', this.onSocketError)
  }

  onSocketConnect = (): void => {
    this.socketConnected = true
    this.headerText.text = 'Connected'
  }

  onWSMessage = (e: MessageEvent): void => {

  }

  onSocketError = (e: Error): void => {
    this.socketConnected = false
    this.headerText.text = 'Error!'
    this.closeSocket()
    console.error(e)
  }

  returnToMenuScene = (): void => {
    this.input.blur()
    this.closeSocket()
    SceneManager.changeScene({ name: 'menu' }).catch(console.error)
  }
}
