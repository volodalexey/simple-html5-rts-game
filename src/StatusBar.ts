import { Container, type FederatedPointerEvent, Graphics, Sprite, Text, type Texture, type FederatedWheelEvent } from 'pixi.js'
import { logPointerEvent } from './logger'

export interface IStatusBarTextures {
  girl1Texture: Texture
  girl2Texture: Texture
  man1Texture: Texture
  systemTexture: Texture
}

export enum EMessageCharacter {
  system = 'system',
  op = 'op',
  pilot = 'pilot',
  driver = 'driver'
}

interface IStatusMessageOptions {
  texture: Texture
  message: string
  time: number
  maxWidth?: number
}

class StatusMessage extends Container {
  static options = {
    padding: 20,
    characterWidth: 40,
    timeTextColor: 0x8296a2,
    timeTextSize: 12,
    messageTextColor: 0xc1a517,
    messageTextSize: 14
  }

  constructor (options: IStatusMessageOptions) {
    super()
    this.setupAndDraw(options)
  }

  setupAndDraw ({ texture, message, time, maxWidth = 0 }: IStatusMessageOptions): void {
    const { padding, characterWidth, timeTextSize, timeTextColor, messageTextSize, messageTextColor } = StatusMessage.options
    const img = new Sprite(texture)
    this.addChild(img)
    img.width = characterWidth
    img.height = img.scale.x * img.height

    const timeText = new Text(StatusBar.getTimeText(time), {
      fontSize: timeTextSize,
      fill: timeTextColor
    })
    timeText.position.set(img.x, img.height)
    this.addChild(timeText)

    const msgText = new Text(message, {
      fontSize: messageTextSize,
      fill: messageTextColor,
      wordWrap: true,
      wordWrapWidth: maxWidth - img.width - padding * 2
    })
    msgText.position.set(img.width + padding, 0)
    this.addChild(msgText)
  }
}

export class StatusBar extends Container {
  static textures: IStatusBarTextures

  static prepareTextures ({
    textures
  }: {
    textures: IStatusBarTextures
  }): void {
    StatusBar.textures = textures
  }

  static options = {
    initWidth: 500,
    initHeight: 100,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 3,
    innerBorderColor: 0x181716,
    innerBorderWidth: 2,
    innerBorderRadius: 3,
    backgroundColor: 0x454545,
    shadowColor: 0x181716,
    shadowWidth: 3,
    shadowAlpha: 0.5,
    padding: 10
  }

  public messageBox!: Container
  public messageList!: Container

  public scrollToLastMessage = false
  public pointerDown = false

  constructor () {
    super()
    this.setup()
    this.draw()

    this.addEventLesteners()
  }

  static getTimeText (time: number): string {
    const hours = Math.trunc(time / (1000 * 60 * 60))
    const minutes = Math.trunc((time - hours) / (1000 * 60))
    const seconds = Math.trunc((time - hours - minutes) / 1000)
    const addZero = (num: number): string => String(num).padStart(2, '0')
    return `Time:\n${addZero(hours)}:${addZero(minutes)}:${addZero(seconds)}`
  }

  setup (): void {
    const messageBox = new Container()
    this.addChild(messageBox)
    this.messageBox = messageBox

    const messageList = new Container()
    this.addChild(messageList)
    this.messageList = messageList
  }

  draw (): void {
    const {
      options: {
        backgroundColor,
        outerBorderColor,
        outerBorderWidth,
        initWidth,
        initHeight,
        innerBorderColor,
        innerBorderWidth,
        innerBorderRadius,
        shadowColor,
        shadowWidth,
        shadowAlpha
      }
    } = StatusBar

    let offsetX = 0
    let offsetY = 0
    let leftWidth = initWidth
    let leftHeight = initHeight

    const outerBorder = new Graphics()
    outerBorder.beginFill(outerBorderColor)
    outerBorder.drawRect(offsetX, offsetY, leftWidth, leftHeight)
    outerBorder.endFill()
    this.messageBox.addChild(outerBorder)

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    const innerBorder = new Graphics()
    innerBorder.beginFill(innerBorderColor)
    innerBorder.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    innerBorder.endFill()
    this.messageBox.addChild(innerBorder)

    offsetX += innerBorderWidth
    offsetY += innerBorderWidth
    leftWidth -= innerBorderWidth * 2
    leftHeight -= innerBorderWidth * 2

    const bgRect = new Graphics()
    bgRect.beginFill(backgroundColor)
    bgRect.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    bgRect.endFill()
    this.messageBox.addChild(bgRect)

    const shadow = new Graphics()
    shadow.lineStyle({
      width: shadowWidth,
      color: shadowColor
    })
    shadow.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    shadow.endFill()
    shadow.alpha = shadowAlpha
    this.messageBox.addChild(shadow)

    offsetX += innerBorderRadius
    offsetY += innerBorderRadius
    leftWidth -= innerBorderRadius * 2
    leftHeight -= innerBorderRadius * 2

    const mask = new Graphics()
    mask.beginFill(backgroundColor)
    mask.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    mask.endFill()
    this.messageBox.addChild(mask)
    this.messageList.mask = mask
    this.messageList.position.set(offsetX, offsetY)
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {

  }

  appendMessage ({ character, message, time }: { character: EMessageCharacter, message: string, time: number }): void {
    let texture: Texture
    switch (character) {
      case EMessageCharacter.system:
        texture = StatusBar.textures.systemTexture
        break
      case EMessageCharacter.op:
        texture = StatusBar.textures.girl1Texture
        break
      case EMessageCharacter.pilot:
        texture = StatusBar.textures.girl2Texture
        break
      case EMessageCharacter.driver:
        texture = StatusBar.textures.man1Texture
        break
    }
    if (this.messageList.mask != null) {
      const { padding } = StatusBar.options
      const mask = (this.messageList.mask as Container)
      const statusMessage = new StatusMessage({
        texture,
        message,
        time,
        maxWidth: mask.width - padding
      })
      statusMessage.position.set(padding, this.messageList.height === 0 ? padding : this.messageList.height + padding * 2)
      this.messageList.addChild(statusMessage)
      const { maxPivot } = this
      if (this.messageList.height > maxPivot) {
        this.scrollToLastMessage = true
      }
    }
  }

  get maxPivot (): number {
    const { padding } = StatusBar.options
    const mask = (this.messageList.mask as Container)
    const scrollHeight = mask.height - padding * 2
    return this.messageList.height - scrollHeight
  }

  handleUpdate (deltaMS: number): void {
    if (this.scrollToLastMessage) {
      const { maxPivot } = this
      if (this.messageList.pivot.y < (maxPivot - 0.01)) {
        this.messageList.pivot.y += maxPivot * 0.01
      } else {
        this.scrollToLastMessage = false
      }
    }
  }

  addEventLesteners (): void {
    this.interactive = true
    this.on('pointerdown', this.handlePointerDown)
    this.on('pointermove', this.handlePointerMove)
    this.on('pointerup', this.handlePointerUp)
    this.on('pointerleave', this.handlePointerLeave)
    this.on('wheel', this.handleWheel)
  }

  handlePointerDown = (): void => {
    this.pointerDown = true
    logPointerEvent(`StatusBar.pointerDown=${this.pointerDown} down`)
  }

  handlePointerUp = (): void => {
    this.pointerDown = false
    logPointerEvent(`StatusBar.pointerDown=${this.pointerDown} up`)
  }

  handlePointerLeave = (): void => {
    this.pointerDown = false
    logPointerEvent(`StatusBar.pointerDown=${this.pointerDown} leave`)
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    logPointerEvent(`StatusBar.pointerDown=${this.pointerDown} move`)
    if (this.pointerDown) {
      logPointerEvent(`e.movementY=${e.movementY}`)
      let nextPivot = this.messageList.pivot.y - e.movementY
      const { maxPivot } = this
      if (nextPivot <= 0) {
        nextPivot = 0
      } else if (nextPivot > maxPivot) {
        nextPivot = maxPivot
      }
      this.messageList.pivot.y = nextPivot
    }
  }

  handleWheel = (e: FederatedWheelEvent): void => {
    let nextPivot = this.messageList.pivot.y + e.deltaY / 10
    const { maxPivot } = this
    if (nextPivot <= 0) {
      nextPivot = 0
    } else if (nextPivot > maxPivot) {
      nextPivot = maxPivot
    }
    this.messageList.pivot.y = nextPivot
  }

  cleanFromAll (): void {
    while (this.messageList.children[0] != null) {
      this.messageList.children[0].removeFromParent()
    }
    this.scrollToLastMessage = false
    this.messageList.pivot.y = 0
  }
}
