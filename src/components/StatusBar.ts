import { Container, type FederatedPointerEvent, Graphics, Sprite, Text, type Texture, type FederatedWheelEvent } from 'pixi.js'
import { logPointerEvent } from '../utils/logger'

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

  public img!: Sprite
  public msgText!: Text

  constructor (options: IStatusMessageOptions) {
    super()
    this.setupAndDraw(options)
  }

  setupAndDraw ({ texture, message, time, maxWidth = 0 }: IStatusMessageOptions): void {
    const { characterWidth, timeTextSize, timeTextColor } = StatusMessage.options
    const img = new Sprite(texture)
    img.width = characterWidth
    img.height = img.scale.x * img.height
    this.addChild(img)
    this.img = img

    const timeText = new Text(StatusBar.getTimeText(time), {
      fontSize: timeTextSize,
      fill: timeTextColor
    })
    timeText.position.set(img.x, img.height)
    this.addChild(timeText)

    this.reAppendMessage({ maxWidth, message })
  }

  reAppendMessage ({ maxWidth, message }: { maxWidth: number, message?: string }): void {
    if (this.msgText != null) {
      message = this.msgText.text
      this.msgText.destroy()
    }
    const { padding, messageTextSize, messageTextColor } = StatusMessage.options
    const msgText = new Text(message, {
      fontSize: messageTextSize,
      fill: messageTextColor,
      wordWrap: true,
      wordWrapWidth: maxWidth - this.img.width - padding * 2
    })
    msgText.position.set(this.img.width + padding, 0)
    this.addChild(msgText)
    this.msgText = msgText
  }
}

export interface IStatusBarOptions {
  initWidth: number
  initHeight: number
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

  public graphicsBox!: Graphics
  public graphicsBoxShadow!: Graphics
  public messageList!: Container<StatusMessage>
  public messageListMask!: Graphics

  public scrollToLastMessage = false
  public pointerDownY = -1

  constructor (options: IStatusBarOptions) {
    super()
    this.setup()
    this.draw(options)

    this.addEventLesteners()
  }

  static getTimeText (time: number): string {
    let timeDiff = time / 1000
    const seconds = Math.round(timeDiff % 60)
    timeDiff = Math.floor(timeDiff / 60) // remove seconds from the time
    const minutes = Math.round(timeDiff % 60)
    timeDiff = Math.floor(timeDiff / 60) // remove minutes from the time
    const hours = Math.round(timeDiff % 24)
    const addZero = (num: number): string => String(num).padStart(2, '0')
    return `Time:\n${addZero(hours)}:${addZero(minutes)}:${addZero(seconds)}`
  }

  setup (): void {
    const graphicsBox = new Graphics()
    this.addChild(graphicsBox)
    this.graphicsBox = graphicsBox

    const graphicsBoxShadow = new Graphics()
    graphicsBox.addChild(graphicsBoxShadow)
    this.graphicsBoxShadow = graphicsBoxShadow

    const messageListMask = new Graphics()
    graphicsBox.addChild(messageListMask)
    this.messageListMask = messageListMask

    const messageList = new Container<StatusMessage>()
    graphicsBox.addChild(messageList)
    this.messageList = messageList
  }

  draw ({ initWidth, initHeight }: IStatusBarOptions): void {
    const {
      options: {
        backgroundColor,
        outerBorderColor,
        outerBorderWidth,
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

    this.graphicsBox.clear()
    this.graphicsBox.beginFill(outerBorderColor)
    this.graphicsBox.drawRect(offsetX, offsetY, leftWidth, leftHeight)
    this.graphicsBox.endFill()

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    this.graphicsBox.beginFill(innerBorderColor)
    this.graphicsBox.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    this.graphicsBox.endFill()

    offsetX += innerBorderWidth
    offsetY += innerBorderWidth
    leftWidth -= innerBorderWidth * 2
    leftHeight -= innerBorderWidth * 2

    this.graphicsBox.beginFill(backgroundColor)
    this.graphicsBox.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, innerBorderRadius)
    this.graphicsBox.endFill()

    this.graphicsBoxShadow.clear()
    this.graphicsBoxShadow.position.set(offsetX, offsetY)
    this.graphicsBoxShadow.lineStyle({
      width: shadowWidth,
      color: shadowColor
    })
    this.graphicsBoxShadow.drawRoundedRect(0, 0, leftWidth, leftHeight, innerBorderRadius)
    this.graphicsBoxShadow.endFill()
    this.graphicsBoxShadow.alpha = shadowAlpha

    offsetX += innerBorderRadius
    offsetY += innerBorderRadius
    leftWidth -= innerBorderRadius * 2
    leftHeight -= innerBorderRadius * 2

    this.messageListMask.position.set(offsetX, offsetY)
    this.drawMask({ width: leftWidth, height: leftHeight })
    this.messageList.mask = this.messageListMask
    this.messageList.position.set(offsetX, offsetY)
  }

  drawMask ({ width, height }: { width: number, height: number }): void {
    const {
      options: {
        backgroundColor,
        innerBorderRadius
      }
    } = StatusBar
    this.messageListMask.clear()
    this.messageListMask.beginFill(backgroundColor)
    this.messageListMask.drawRoundedRect(0, 0, width, height, innerBorderRadius)
    this.messageListMask.endFill()
    this.messageList.mask = this.messageListMask
  }

  appendMessage ({ character, message, time, selfRemove, height }: { character: EMessageCharacter, message: string, time: number, selfRemove: boolean, height: number }): void {
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
      const statusMessage = new StatusMessage({
        texture,
        message,
        time,
        maxWidth: this.maxMessageWidth
      })
      statusMessage.position.set(padding, this.messageList.height === 0 ? padding : this.messageList.height + padding * 2)
      this.messageList.addChild(statusMessage)
      if (selfRemove) {
        setTimeout(() => {
          statusMessage.removeFromParent()
          this.reAppendMessages({ width: this.width, height })
          this.messageList.pivot.y = this.maxPivot
        }, 3000)
      }
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
    return this.messageList.height > 0 ? (this.messageList.height - scrollHeight) : 0
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
    this.eventMode = 'static'
    this.on('pointerdown', this.handlePointerDown)
    this.on('pointermove', this.handlePointerMove)
    this.on('pointerup', this.handlePointerUp)
    this.on('pointerleave', this.handlePointerLeave)
    this.on('wheel', this.handleWheel)
  }

  handlePointerDown = (e: FederatedPointerEvent): void => {
    const localPosition = this.messageList.toLocal(e)
    this.pointerDownY = localPosition.y
    logPointerEvent(`StatusBar.pointerDownY=${this.pointerDownY} down`)
  }

  handlePointerUp = (): void => {
    this.pointerDownY = -1
    logPointerEvent(`StatusBar.pointerDownY=${this.pointerDownY} up`)
  }

  handlePointerLeave = (): void => {
    this.pointerDownY = -1
    logPointerEvent(`StatusBar.pointerDownY=${this.pointerDownY} leave`)
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    logPointerEvent(`StatusBar.pointerDownY=${this.pointerDownY} move`)
    if (this.pointerDownY > -1) {
      const localPosition = this.messageList.toLocal(e)
      logPointerEvent(`localPositionX=${localPosition.x} localPositionY=${localPosition.y}`)
      const nextPivot = this.pointerDownY - localPosition.y
      this.messageList.pivot.y += nextPivot
      const { maxPivot } = this
      const { pivot } = this.messageList
      if (pivot.y <= 0) {
        pivot.y = 0
      } else if (pivot.y > maxPivot) {
        pivot.y = maxPivot
      }
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

  get maxMessageWidth (): number {
    return (this.messageList.mask as Graphics).width - StatusBar.options.padding * 2
  }

  reAppendMessages ({ width, height }: { width: number, height: number }): void {
    const { padding } = StatusBar.options
    const messages: StatusMessage[] = []
    for (let i = 0; i < this.messageList.children.length; i++) {
      const msg = this.messageList.children[i]
      msg.removeFromParent()
      messages.push(msg)
      i--
    }
    this.draw({ initWidth: width, initHeight: height })
    messages.forEach(msg => {
      msg.position.set(padding, this.messageList.height === 0 ? padding : this.messageList.height + padding * 2)
      msg.reAppendMessage({ maxWidth: this.maxMessageWidth })
      this.messageList.addChild(msg)
    })
    this.messageList.pivot.y = 0
  }

  setLimit ({ width, height }: { width: number, height: number }): void {
    if (this.width === width) {
      return
    }
    this.reAppendMessages({ width, height })
    this.messageList.pivot.y = this.maxPivot
  }
}
