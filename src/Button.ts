import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js'

export interface IButtonOptions {
  text: string
  btnWidth?: number
  btnHeight?: number
  btnRadius?: number
  onClick?: (attackBtn: Button) => void
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  fontSize?: number
  textColor?: number
  textColorHover?: number
  shadowTextColor?: number
  shadowThickness?: number
  buttonIdleColor?: number
  buttonIdleAlpha?: number
  buttonHoverColor?: number
  buttonHoverAlpha?: number
  initX?: number
  initY?: number
  iconTexture?: Texture
  iconScale?: number
  iconColor?: number
  iconColorHover?: number
}

export class Button extends Container {
  public background!: Graphics
  public icon!: Sprite
  public text!: Text
  public paddingTop !: number
  public paddingRight !: number
  public paddingBottom !: number
  public paddingLeft !: number
  public buttonIdleColor !: number
  public buttonIdleAlpha !: number
  public buttonHoverColor !: number
  public buttonHoverAlpha !: number
  public textColor !: number
  public textColorHover !: number
  public shadowTextColor !: number
  public shadowThickness !: number
  public iconColor !: number
  public iconColorHover !: number
  public fontSize !: number
  public onClick!: IButtonOptions['onClick']
  constructor (options: IButtonOptions) {
    super()
    this.interactive = true
    this.cursor = 'pointer'
    this.onClick = options.onClick
    this.paddingTop = options.paddingTop ?? 20
    this.paddingRight = options.paddingRight ?? 20
    this.paddingBottom = options.paddingBottom ?? 20
    this.paddingLeft = options.paddingLeft ?? 20
    this.fontSize = options.fontSize ?? 16
    this.textColor = options.textColor ?? 0x000000
    this.textColorHover = options.textColorHover ?? 0x000000
    this.shadowTextColor = options.shadowTextColor ?? 0x000000
    this.shadowThickness = options.shadowThickness ?? 0

    this.iconColor = options.iconColor ?? 0x000000
    this.iconColorHover = options.iconColorHover ?? 0x000000

    this.buttonIdleColor = options.buttonIdleColor ?? 0x000000
    this.buttonIdleAlpha = options.buttonIdleAlpha ?? 1
    this.buttonHoverColor = options.buttonHoverColor ?? options.buttonIdleColor ?? 0x000000
    this.buttonHoverAlpha = options.buttonHoverAlpha ?? 1
    this.setup(options)
    if (options.btnWidth != null && options.btnHeight != null) {
      this.draw({ btnWidth: options.btnWidth, btnHeight: options.btnHeight, btnRadius: options.btnRadius })
    } else {
      this.draw({ btnWidth: this.text.width, btnHeight: this.text.height, btnRadius: options.btnRadius })
    }
    this.idleColor()
    if (typeof options.initX === 'number') {
      this.position.x = options.initX
    }
    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  setup ({ text: initText, btnWidth, btnHeight, iconTexture, iconScale = 0 }: IButtonOptions): void {
    const background = new Graphics()
    this.addChild(background)
    this.background = background
    const { paddingLeft, paddingTop } = this
    const icon = new Sprite(iconTexture)
    icon.scale.set(iconScale)
    icon.position.set(paddingLeft, paddingTop)
    this.addChild(icon)
    this.icon = icon

    const text = new Text(initText, {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: this.fontSize,
      fill: 0xffffff,
      align: 'center',
      // dropShadow: true,
      // dropShadowColor: this.shadowTextColor,
      // dropShadowBlur: 5,
      stroke: this.shadowTextColor,
      strokeThickness: this.shadowThickness
    })
    if (btnWidth != null && btnHeight != null) {
      if (iconTexture != null) {
        text.position.set(icon.x + icon.width + paddingLeft, paddingTop)
      } else {
        text.anchor.set(0.5, 0.5)
        text.position.set(btnWidth / 2, btnHeight / 2)
      }
    }
    this.addChild(text)
    this.text = text

    this.initEventLesteners()
  }

  initEventLesteners (): void {
    this.on('pointertap', (e) => {
      if (typeof this.onClick === 'function') {
        this.onClick(this)
      }
    })
    this.on('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        this.hoverColor()
      }
    })
    this.on('pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        this.hoverColor()
      }
    })
    this.on('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.idleColor()
      }
    })
    this.on('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        this.idleColor()
      }
    })
  }

  draw ({ btnWidth, btnHeight, btnRadius = 0 }: { btnWidth: number, btnHeight: number, btnRadius?: number }): void {
    this.background.beginFill(0xffffff)
    this.background.drawRoundedRect(0, 0, btnWidth, btnHeight, btnRadius)
    this.background.endFill()
  }

  color ({
    alpha,
    bgColor,
    txtColor,
    iconColor
  }: {
    alpha: number
    bgColor: number
    txtColor: number
    iconColor: number
  }): void {
    this.background.tint = bgColor
    this.background.alpha = alpha
    this.text.tint = txtColor
    this.icon.tint = iconColor
  }

  idleColor ({
    alpha = this.buttonIdleAlpha,
    bgColor = this.buttonIdleColor,
    txtColor = this.textColor,
    iconColor = this.iconColor
  }: {
    alpha?: number
    bgColor?: number
    txtColor?: number
    iconColor?: number
  } = {}): void {
    this.color({ alpha, bgColor, txtColor, iconColor })
  }

  hoverColor ({
    alpha = this.buttonHoverAlpha,
    bgColor = this.buttonHoverColor,
    txtColor = this.textColorHover,
    iconColor = this.iconColorHover
  }: {
    alpha?: number
    bgColor?: number
    txtColor?: number
    iconColor?: number
  } = {}): void {
    this.color({ alpha, bgColor, txtColor, iconColor })
  }
}
