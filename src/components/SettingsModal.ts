import { Container, type FederatedPointerEvent, Graphics, type Texture, Text, type TextStyleAlign, type TextStyleFontWeight } from 'pixi.js'
import { Button } from './Button'
import { logLayout } from '../utils/logger'
import { type Audio } from '../utils/Audio'

class VolumeButton extends Button {}
class Bar extends Graphics {}
class Caret extends Graphics {}

interface ISliderOptions {
  width: number
  onChange: (value: number) => void
}

class Slider extends Container {
  static options = {
    barRadius: 3,
    barHeight: 10,
    barColor: 0xffffff,
    barBorderColor: 0x181716,
    barBorderWidth: 3,
    caretRadius: 18,
    caretColor: 0x800080,
    caretBorderColor: 0x454545,
    caretBorderWidth: 3
  }

  public dragStartX = -1
  public bar = new Bar()
  public caret = new Caret()
  public onChange!: ISliderOptions['onChange']
  constructor (options: ISliderOptions) {
    super()
    this.onChange = options.onChange
    this.setup()
    this.draw(options)
    this.setupEventListeners()
  }

  setup (): void {
    this.addChild(this.bar)
    this.addChild(this.caret)
  }

  draw ({ width }: ISliderOptions): void {
    const {
      barBorderColor,
      barHeight,
      barRadius,
      barColor,
      barBorderWidth,
      caretRadius,
      caretBorderColor,
      caretBorderWidth,
      caretColor
    } = Slider.options
    const { bar, caret } = this
    bar.beginFill(barBorderColor)
    bar.drawRoundedRect(0, 0, width, barHeight, barRadius)
    bar.endFill()
    bar.beginFill(barColor)
    const innerBarHeight = barHeight - 2 * barBorderWidth
    bar.drawRoundedRect(barBorderWidth, barBorderWidth, width - barBorderWidth * 2, innerBarHeight, barRadius)
    bar.endFill()
    const barCenterX = barBorderWidth + innerBarHeight * 0.5
    const barCenterY = barBorderWidth + innerBarHeight * 0.5
    caret.position.set(barCenterX - caretRadius, barCenterY - caretRadius)
    caret.beginFill(caretBorderColor)
    caret.drawCircle(caretRadius, caretRadius, caretRadius)
    caret.endFill()
    caret.beginFill(caretColor)
    caret.drawCircle(caretRadius, caretRadius, caretRadius - caretBorderWidth)
    caret.endFill()
  }

  setupEventListeners (): void {
    this.eventMode = 'static'
    this.on('pointerdown', this.onPointerDown)
    this.on('pointermove', this.onPointerMove)
    this.on('pointerup', this.onPointerUp)
    this.on('pointerupoutside', this.onPointerUp)
  }

  onPointerDown = (e: FederatedPointerEvent): void => {
    this.dragStartX = this.bar.toLocal(e).x
  }

  onPointerMove = (e: FederatedPointerEvent): void => {
    if (this.dragStartX > -1) {
      const newX = this.bar.toLocal(e).x
      const diffX = newX - this.dragStartX
      this.caret.position.x += diffX
      this.dragStartX = newX
      this.checkCaretLimits()
      this.triggerChangeEvent()
    }
  }

  onPointerUp = (e: FederatedPointerEvent): void => {
    this.dragStartX = -1
    this.setCaretCenter(this.bar.toLocal(e).x)
    this.checkCaretLimits()
    this.triggerChangeEvent()
  }

  getCaretCenter (): number {
    return this.caret.position.x + Slider.options.caretRadius
  }

  setCaretCenter (x: number): void {
    this.caret.position.x = x - Slider.options.caretRadius
  }

  calcCaretLimits (): { min: number, max: number } {
    const { width } = this.bar
    const { barHeight, barBorderWidth } = Slider.options
    const halfInnerBarHeight = (barHeight - 2 * barBorderWidth) / 2
    const diffX = barBorderWidth + halfInnerBarHeight
    return { min: diffX, max: width - diffX }
  }

  checkCaretLimits (): void {
    const center = this.getCaretCenter()
    const { min, max } = this.calcCaretLimits()
    if (center < min) {
      this.setCaretCenter(min)
    } else if (center > max) {
      this.setCaretCenter(max)
    }
  }

  triggerChangeEvent (): void {
    const center = this.getCaretCenter()
    const { min, max } = this.calcCaretLimits()
    this.onChange((center - min) / (max - min))
  }

  updateCaretCenter (value: number): void {
    const { min, max } = this.calcCaretLimits()
    this.setCaretCenter(min + (max - min) * value)
  }
}

interface IFormLineTextures {
  iconVolumeOffTexture: Texture
  iconVolumeLowTexture: Texture
  iconVolumeMiddleTexture: Texture
  iconVolumeHighTexture: Texture
}

interface IFormLineOptions {
  text: string
  volume?: number
  onChanged?: (volume: number) => void
}

class FormLine extends Container {
  static textures: IFormLineTextures

  static prepareTextures ({
    textures
  }: {
    textures: IFormLineTextures
  }): void {
    FormLine.textures = textures
  }

  static options = {
    minVolume: 0,
    lowVolume: 0.3,
    middleVolume: 0.7,
    maxVolume: 1,
    volumeButton: {
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      textPaddingLeft: 15,
      textPaddingTop: 12,
      iconScale: 0.5,
      iconColor: 0xffffff,
      iconColorHover: 0xffff00,
      iconPaddingLeft: 10,
      iconPaddingTop: 10,
      buttonRadius: 3,
      buttonHeight: 50,
      buttonIdleAlpha: 0,
      buttonHoverAlpha: 0,
      buttonSelectedAlpha: 0,
      offset: { x: 50, y: 0 }
    },
    slider: {
      width: 300,
      offset: { x: 5, y: 50 }
    }
  }

  public volume: number
  public volumeButton!: VolumeButton
  public slider!: Slider
  public onChanged!: IFormLineOptions['onChanged']
  static triggerTimeout = 200
  public resizeTimeoutId = 0
  constructor (options: IFormLineOptions) {
    super()
    this.onChanged = options.onChanged
    this.volume = options.volume ?? 0
    this.setup(options)
    this.updateTexture()
    this.slider.updateCaretCenter(this.volume)
  }

  setup ({ text }: IFormLineOptions): void {
    const {
      minVolume, maxVolume, slider, volumeButton: {
        offset,
        textColor,
        textColorHover,
        textPaddingLeft,
        textPaddingTop,
        iconScale,
        iconColor,
        iconColorHover,
        iconPaddingLeft,
        iconPaddingTop,
        buttonRadius,
        buttonHeight,
        buttonIdleAlpha,
        buttonHoverAlpha,
        buttonSelectedAlpha
      }
    } = FormLine.options
    this.volumeButton = new VolumeButton({
      text,
      textColor,
      textColorHover,
      textPaddingLeft,
      textPaddingTop,
      iconTexture: FormLine.textures.iconVolumeHighTexture,
      iconScale,
      iconColor,
      iconColorHover,
      onClick: () => {
        this.volume = this.volume > minVolume ? minVolume : maxVolume
        this.updateTexture()
        this.slider.updateCaretCenter(this.volume)
        this.triggerDeBounce()
      },
      iconPaddingLeft,
      iconPaddingTop,
      buttonRadius,
      buttonHeight,
      buttonIdleAlpha,
      buttonHoverAlpha,
      buttonSelectedAlpha
    })
    this.volumeButton.position.set(offset.x, offset.y)
    this.addChild(this.volumeButton)

    this.slider = new Slider({
      width: slider.width,
      onChange: (value: number) => {
        this.volume = value
        this.updateTexture()
        this.triggerDeBounce()
      }
    })
    this.slider.position.set(slider.offset.x, slider.offset.y)
    this.addChild(this.slider)
  }

  limitVolume (): void {
    const { maxVolume, minVolume } = FormLine.options
    if (this.volume > maxVolume) {
      this.volume = maxVolume
    } else if (this.volume < minVolume) {
      this.volume = minVolume
    }
  }

  updateTexture (): void {
    this.limitVolume()
    const {
      iconVolumeOffTexture,
      iconVolumeLowTexture,
      iconVolumeMiddleTexture,
      iconVolumeHighTexture
    } = FormLine.textures
    const { minVolume, lowVolume, middleVolume } = FormLine.options
    const { icon } = this.volumeButton
    if (this.volume === minVolume) {
      icon.texture = iconVolumeOffTexture
    } else if (this.volume <= lowVolume) {
      icon.texture = iconVolumeLowTexture
    } else if (this.volume <= middleVolume) {
      icon.texture = iconVolumeMiddleTexture
    } else {
      icon.texture = iconVolumeHighTexture
    }
  }

  triggerDeBounce (): void {
    this.cancelScheduledTriggerHandler()
    this.scheduleTriggerHandler()
  }

  cancelScheduledTriggerHandler (): void {
    clearTimeout(this.resizeTimeoutId)
  }

  scheduleTriggerHandler (): void {
    this.resizeTimeoutId = window.setTimeout(() => {
      this.cancelScheduledTriggerHandler()
      this.triggerOnChanged()
    }, FormLine.triggerTimeout)
  }

  triggerOnChanged (): void {
    if (typeof this.onChanged === 'function') {
      this.onChanged(this.volume)
    }
  }
}

export interface ISettingsModalTextures extends IFormLineTextures {
  iconHomeTexture: Texture
  iconCircleXMarkTexture: Texture
  iconCircleCheckTexture: Texture
  iconGearsTexture: Texture
}

interface ISettingsModalOptions {
  viewWidth: number
  viewHeight: number
  audio: Audio
  onHomeClick?: () => void
  onClosed: () => void
}

class ModalBox extends Graphics {}
class Buttons extends Container {}
class ButtonLeft extends Button {}
class ButtonRight extends Button {}
class HeaderText extends Text {}

export class SettingsModal extends Container {
  static textures: ISettingsModalTextures

  static prepareTextures ({
    textures
  }: {
    textures: ISettingsModalTextures
  }): void {
    SettingsModal.textures = textures
    FormLine.prepareTextures({
      textures
    })
  }

  public modalBox!: ModalBox
  public headerText!: HeaderText
  public voiceVolumeFormLine!: FormLine
  public shootVolumeFormLine!: FormLine
  public hitVolumeFormLine!: FormLine
  public messageVolumeFormLine!: FormLine
  public buttons!: Buttons
  public buttonLeft!: ButtonLeft
  public buttonRight!: ButtonRight
  static boxOptions = {
    backgroundColor: 0x454545,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 3,
    width: 350,
    height: 500,
    borderRadius: 5
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
      x: 110,
      y: 25
    }
  }

  static volumeLinesOptions = {
    voiceLine: { offset: { x: 20, y: 80 } },
    shootLine: { offset: { x: 20, y: 160 } },
    hitLine: { offset: { x: 20, y: 240 } },
    messageLine: { offset: { x: 20, y: 320 } }
  }

  static buttonOptions = {
    top: 430,
    leftTwo: 15,
    paddingLeft: 12,
    twoPaddingLeft: 20,
    iconPaddingTop: 10,
    textPaddingTop: 16,
    widthLeft: 150,
    widthRight: 150,
    height: 55,
    fillRegular: 0x454545,
    fillError: 0x9a3412,
    fillSuccess: 0x22c55e,
    borderRadius: 10,
    iconScale: 0.7,
    buttonBorderColor: 0x485b6c,
    buttonBorderHoverColor: 0xffff00,
    buttonBorderWidth: 1
  }

  static buttonTextOptions = {
    top: 95,
    textColor: 0xffffff,
    textSize: 20,
    textColorHover: 0xffff00
  }

  public audio!: Audio
  public onClosed!: ISettingsModalOptions['onClosed']

  constructor (options: ISettingsModalOptions) {
    super()
    this.audio = options.audio
    this.onClosed = options.onClosed
    this.setup(options)
    this.draw(options)
  }

  setup (_: ISettingsModalOptions): void {
    this.modalBox = new ModalBox()
    this.addChild(this.modalBox)

    const { fontFamily, fontSize, fontWeight, fill, align, shadowTextColor, shadowThickness, offset } = SettingsModal.headerTextOptions
    this.headerText = new HeaderText('Settings', {
      fontFamily,
      fontSize,
      fontWeight,
      fill,
      align,
      stroke: shadowTextColor,
      strokeThickness: shadowThickness
    })
    this.headerText.position.set(offset.x, offset.y)
    this.addChild(this.headerText)

    const { voiceLine, shootLine, hitLine, messageLine } = SettingsModal.volumeLinesOptions
    this.voiceVolumeFormLine = new FormLine({
      ...SettingsModal.textures,
      volume: this.audio.voiceVolume,
      text: 'Voice volume',
      onChanged: (volume: number) => {
        this.audio.voiceVolume = volume
        this.audio.playRandomVoice()
      }
    })
    this.voiceVolumeFormLine.position.set(voiceLine.offset.x, voiceLine.offset.y)
    this.addChild(this.voiceVolumeFormLine)

    this.shootVolumeFormLine = new FormLine({
      ...SettingsModal.textures,
      volume: this.audio.shootVolume,
      text: 'Shoot volume',
      onChanged: (volume: number) => {
        this.audio.shootVolume = volume
        this.audio.playRandomShoot()
      }
    })
    this.shootVolumeFormLine.position.set(shootLine.offset.x, shootLine.offset.y)
    this.addChild(this.shootVolumeFormLine)

    this.hitVolumeFormLine = new FormLine({
      ...SettingsModal.textures,
      volume: this.audio.hitVolume,
      text: 'Hit volume',
      onChanged: (volume: number) => {
        this.audio.hitVolume = volume
        this.audio.playRandomHit()
      }
    })
    this.hitVolumeFormLine.position.set(hitLine.offset.x, hitLine.offset.y)
    this.addChild(this.hitVolumeFormLine)

    this.messageVolumeFormLine = new FormLine({
      ...SettingsModal.textures,
      volume: this.audio.messageVolume,
      text: 'Message volume',
      onChanged: (volume: number) => {
        this.audio.messageVolume = volume
        this.audio.playRandomMessage()
      }
    })
    this.messageVolumeFormLine.position.set(messageLine.offset.x, messageLine.offset.y)
    this.addChild(this.messageVolumeFormLine)

    this.buttons = new Buttons()
    this.addChild(this.buttons)
  }

  draw (_: ISettingsModalOptions): void {
    const {
      boxOptions: { width, height, backgroundColor, outerBorderWidth, outerBorderColor, borderRadius }
    } = SettingsModal

    let offsetX = 0
    let offsetY = 0
    let leftWidth = width
    let leftHeight = height

    this.modalBox.beginFill(backgroundColor)
    this.modalBox.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.modalBox.endFill()

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    this.modalBox.beginFill(outerBorderColor)
    this.modalBox.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.modalBox.endFill()

    const { iconCircleXMarkTexture, iconCircleCheckTexture } = SettingsModal.textures
    const {
      leftTwo, top, fillSuccess, fillError,
      widthLeft, widthRight,
      iconPaddingTop, textPaddingTop, paddingLeft, iconScale,
      height: buttonHeight, twoPaddingLeft,
      buttonBorderColor, buttonBorderHoverColor, buttonBorderWidth
    } = SettingsModal.buttonOptions
    const {
      textSize, textColor, textColorHover
    } = SettingsModal.buttonTextOptions

    const buttonLeft = new ButtonLeft({
      text: 'Cancel',
      fontSize: textSize,
      textColor,
      textColorHover,
      iconColor: textColor,
      iconColorHover: textColorHover,
      iconTexture: iconCircleXMarkTexture,
      iconScale,
      iconPaddingLeft: paddingLeft,
      iconPaddingTop,
      textPaddingLeft: paddingLeft,
      textPaddingTop,
      buttonHeight,
      buttonRadius: borderRadius,
      buttonIdleColor: fillError,
      buttonWidth: widthLeft,
      buttonBorderColor,
      buttonBorderHoverColor,
      buttonBorderWidth,
      initX: leftTwo,
      initY: top,
      onClick: () => {
        this.audio.resetAll()
        this.hideModal()
        this.onClosed()
      }
    })
    this.buttons.addChild(buttonLeft)
    this.buttonLeft = buttonLeft

    const buttonRight = new ButtonRight({
      text: 'Apply',
      fontSize: textSize,
      textColor,
      textColorHover,
      iconColor: textColor,
      iconColorHover: textColorHover,
      iconTexture: iconCircleCheckTexture,
      iconScale,
      iconPaddingLeft: paddingLeft,
      iconPaddingTop,
      textPaddingLeft: paddingLeft,
      textPaddingTop,
      buttonIdleColor: fillSuccess,
      buttonWidth: widthRight,
      buttonHeight,
      buttonRadius: borderRadius,
      buttonBorderColor,
      buttonBorderHoverColor,
      buttonBorderWidth,
      initX: leftTwo + widthLeft + twoPaddingLeft,
      initY: top,
      onClick: () => {
        this.audio.saveAll()
        this.hideModal()
        this.onClosed()
      }
    })
    this.buttons.addChild(buttonRight)
    this.buttonRight = buttonRight
  }

  showModal (): void {
    this.visible = true
  }

  hideModal (): void {
    this.visible = false
  }

  handleUpdate (deltaMS: number): void {}

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const { width: tWidth, height: tHeight } = SettingsModal.boxOptions
    const totalWidth = tWidth
    const totalHeight = tHeight
    let scale = 1
    if (totalHeight >= totalWidth) {
      if (availableHeight < totalHeight) {
        scale = availableHeight / totalHeight
        if (scale * totalWidth > availableWidth) {
          scale = availableWidth / totalWidth
        }
        logLayout(`Settings Modal by height (sc=${scale})`)
      }
    } else {
      if (availableWidth < totalWidth) {
        scale = availableWidth / totalWidth
        if (scale * totalHeight > availableHeight) {
          scale = availableHeight / totalHeight
        }
        logLayout(`Settings Modal by width (sc=${scale})`)
      }
    }
    const occupiedWidth = Math.floor(totalWidth * scale)
    const occupiedHeight = Math.floor(totalHeight * scale)
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.x = x
    this.width = occupiedWidth
    this.y = y
    this.height = occupiedHeight
    logLayout(`x=${x} y=${y} w=${this.width} h=${this.height}`)
  }
}
