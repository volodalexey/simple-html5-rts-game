import { Container, Graphics, Text } from 'pixi.js'

interface IButtonOptions {
  text: string
  btnWidth?: number
  btnHeight?: number
  onClick: (attackBtn: Button) => void
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
}

export class Button extends Container {
  public background!: Graphics
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

    this.buttonIdleColor = options.buttonIdleColor ?? 0x000000
    this.buttonIdleAlpha = options.buttonIdleAlpha ?? 1
    this.buttonHoverColor = options.buttonHoverColor ?? 0x000000
    this.buttonHoverAlpha = options.buttonHoverAlpha ?? 1
    this.setup(options)
    if (options.btnWidth != null && options.btnHeight != null) {
      this.draw({ btnWidth: options.btnWidth, btnHeight: options.btnHeight })
    } else {
      this.draw({ btnWidth: this.text.width, btnHeight: this.text.height })
    }
    this.color({ bgColor: this.buttonIdleColor, alpha: this.buttonIdleAlpha, txtColor: this.textColor })
  }

  setup ({ text: initText, btnWidth, btnHeight }: IButtonOptions): void {
    const background = new Graphics()
    this.addChild(background)
    this.background = background

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
      text.anchor.set(0.5, 0.5)
      text.position.set(btnWidth / 2, btnHeight / 2)
    }
    this.addChild(text)
    this.text = text

    this.initEventLesteners()
  }

  initEventLesteners (): void {
    this.on('pointertap', (e) => {
      this.onClick(this)
    })
    this.on('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        this.color({ bgColor: this.buttonHoverColor, alpha: this.buttonHoverAlpha, txtColor: this.textColorHover })
      }
    })
    this.on('pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        this.color({ bgColor: this.buttonHoverColor, alpha: this.buttonHoverAlpha, txtColor: this.textColorHover })
      }
    })
    this.on('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.color({ bgColor: this.buttonIdleColor, alpha: this.buttonIdleAlpha, txtColor: this.textColor })
      }
    })
    this.on('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        this.color({ bgColor: this.buttonIdleColor, alpha: this.buttonIdleAlpha, txtColor: this.textColor })
      }
    })
  }

  draw ({ btnWidth, btnHeight }: { btnWidth: number, btnHeight: number }): void {
    this.background.beginFill(0xffffff)
    this.background.drawRect(0, 0, btnWidth, btnHeight)
    this.background.endFill()
  }

  color ({ alpha, bgColor, txtColor }: { alpha: number, bgColor: number, txtColor: number }): void {
    this.background.tint = bgColor
    this.background.alpha = alpha
    this.text.tint = txtColor
  }
}
