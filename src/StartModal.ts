import { Container, Graphics, Text, type Texture, type TextStyleFontWeight, ParticleContainer } from 'pixi.js'
import { Button, type IButtonOptions } from './Button'
import { Firework } from './Particle'

export interface IStartModalTextures {
  iconHomeTexture: Texture
  iconRepeatTexture: Texture
  iconNextTexture: Texture
}

interface IStartModalOptions {
  viewWidth: number
  viewHeight: number
}

export class StartModal extends Container {
  static textures: IStartModalTextures

  static prepareTextures ({
    textures
  }: {
    textures: IStartModalTextures
  }): void {
    StartModal.textures = textures
  }

  public sucess = false
  public elapsedSpawnFrames = 0
  public spawnFrame = Math.floor(Math.random() * 20 + 60)
  public modalBox!: Graphics
  public particles = new ParticleContainer(300, { position: true, scale: true, tint: true })
  public reasonText!: Text
  public boxOptions = {
    backgroundColor: 0x454545,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 3,
    width: 350,
    height: 250,
    borderRadius: 5
  }

  public reasonTextOptions = {
    top: -50,
    textColor: 0xc1a517,
    strokeColor: 0x800080,
    strokeThickness: 1,
    textSize: 20,
    fontWeight: 'bold',
    lineHeight: 30
  }

  public buttonOptions = {
    top: 170,
    leftOne: 105,
    leftTwo: 15,
    paddingLeft: 20,
    paddingTop: 15,
    widthOne: 150,
    widthLeft: 150,
    widthRight: 150,
    height: 50,
    fillRegular: 0x454545,
    fillError: 0x9a3412,
    fillSuccess: 0x22c55e,
    borderRadius: 10,
    iconScale: 0.5
  }

  public buttonTextOptions = {
    top: 95,
    textColor: 0xffffff,
    textSize: 20,
    textColorHover: 0xffff00
  }

  constructor (options: IStartModalOptions) {
    super()
    this.setup(options)
    this.draw(options)
  }

  setup (_: IStartModalOptions): void {
    this.modalBox = new Graphics()
    this.addChild(this.modalBox)

    const { boxOptions, reasonTextOptions } = this

    this.reasonText = new Text('-', {
      fontSize: reasonTextOptions.textSize,
      fill: reasonTextOptions.textColor,
      fontWeight: reasonTextOptions.fontWeight as TextStyleFontWeight,
      fontFamily: "'Courier New', Courier, monospace",
      align: 'center',
      wordWrap: true,
      wordWrapWidth: boxOptions.width - boxOptions.outerBorderWidth * 2,
      stroke: reasonTextOptions.strokeColor,
      strokeThickness: reasonTextOptions.strokeThickness,
      lineHeight: reasonTextOptions.lineHeight
    })
    this.reasonText.anchor.set(0.5, 0.5)
    this.reasonText.position.set(boxOptions.width / 2, boxOptions.height / 2 + reasonTextOptions.top)
    this.addChild(this.reasonText)
  }

  draw (_: IStartModalOptions): void {
    const {
      boxOptions: { width, height, backgroundColor, outerBorderWidth, outerBorderColor, borderRadius }
    } = this

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
  }

  showModal ({
    message, success, view, onLeftClick, onRightClick
  }: {
    message: string
    success: boolean
    view: 'home-repeat' | 'home-next' | 'home'
    onLeftClick?: () => void
    onRightClick?: () => void
  }): void {
    const { iconHomeTexture, iconNextTexture, iconRepeatTexture } = StartModal.textures
    const {
      leftOne, leftTwo, top, fillRegular, fillSuccess, fillError,
      widthOne, widthLeft, widthRight, height, borderRadius,
      paddingTop, paddingLeft, iconScale
    } = this.buttonOptions
    const {
      textSize, textColor, textColorHover
    } = this.buttonTextOptions

    this.sucess = success
    this.visible = true
    this.reasonText.text = message

    const buttonLeftStyle: IButtonOptions = {
      text: 'Home',
      fontSize: textSize,
      textColor,
      textColorHover,
      iconColor: textColor,
      iconColorHover: textColorHover,
      onClick: onLeftClick,
      iconTexture: iconHomeTexture,
      iconScale,
      paddingLeft,
      paddingTop,
      btnHeight: height,
      btnRadius: borderRadius
    }

    const buttonRightStyle: IButtonOptions = {
      text: '',
      fontSize: textSize,
      textColor,
      textColorHover,
      iconColor: textColor,
      iconColorHover: textColorHover,
      onClick: onRightClick,
      iconScale,
      paddingLeft,
      paddingTop,
      buttonIdleColor: success ? fillSuccess : fillError,
      btnWidth: widthRight,
      btnHeight: height,
      btnRadius: borderRadius,
      initX: leftTwo + widthLeft + paddingLeft,
      initY: top
    }

    switch (view) {
      case 'home':
        buttonLeftStyle.buttonIdleColor = success ? fillSuccess : fillError
        buttonLeftStyle.btnWidth = widthOne
        buttonLeftStyle.initX = leftOne
        buttonLeftStyle.initY = top
        break
      case 'home-next': {
        buttonLeftStyle.buttonIdleColor = fillRegular
        buttonLeftStyle.btnWidth = widthLeft
        buttonLeftStyle.initX = leftTwo
        buttonLeftStyle.initY = top

        buttonRightStyle.text = 'Next'
        buttonRightStyle.iconTexture = iconNextTexture
        const buttonRight = new Button(buttonRightStyle)
        this.addChild(buttonRight)
        break
      }

      case 'home-repeat': {
        buttonLeftStyle.buttonIdleColor = fillRegular
        buttonLeftStyle.btnWidth = widthLeft
        buttonLeftStyle.initX = leftTwo
        buttonLeftStyle.initY = top

        buttonRightStyle.text = 'Repeat'
        buttonRightStyle.iconTexture = iconRepeatTexture
        const buttonRight = new Button(buttonRightStyle)
        this.addChild(buttonRight)
        break
      }
    }

    const buttonLeft = new Button(buttonLeftStyle)
    this.addChild(buttonLeft)

    this.addChild(this.particles)
  }

  hideModal (): void {
    this.visible = false
  }

  cleanFromAll (): void {
    this.hideModal()
    while (this.particles.children[0] != null) {
      this.particles.children[0].removeFromParent()
    }
  }

  handleUpdate (deltaMS: number): void {
    if (this.visible) {
      this.particles.children.forEach((fire) => {
        (fire as Firework).handleUpdate()
      })
      if (this.elapsedSpawnFrames >= this.spawnFrame && this.sucess) {
        const position = { x: Math.random() * this.width, y: Math.random() * this.height }
        for (let i = 0; i < 30; i++) {
          const firework = new Firework()
          this.particles.addChild(firework)
          firework.position.set(position.x, position.y)
        }
        this.spawnFrame = Math.floor(Math.random() * 20 + 60)
        this.elapsedSpawnFrames = 0
      }
      this.elapsedSpawnFrames += 1

      for (let i = 0; i < this.particles.children.length; i++) {
        const particle = this.particles.children[i] as Firework
        if (particle.markedForDeletion) {
          particle.removeFromParent()
          i--
        }
      }
    }
  }
}
