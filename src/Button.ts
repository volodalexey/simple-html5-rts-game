import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js'

export interface IButtonOptions {
  text: string
  buttonWidth?: number
  buttonHeight?: number
  buttonRadius?: number
  onClick?: (attackBtn: Button) => void
  iconPaddingTop?: number
  iconPaddingLeft?: number
  iconIdleAlpha?: number
  iconHoverAlpha?: number
  iconSelectedAlpha?: number
  textPaddingTop?: number
  textPaddingLeft?: number
  fontSize?: number
  textColor?: number
  textColorHover?: number
  textColorSelected?: number
  shadowTextColor?: number
  shadowThickness?: number
  buttonIdleColor?: number
  buttonIdleAlpha?: number
  buttonHoverColor?: number
  buttonSelectedColor?: number
  buttonBorderWidth?: number
  buttonSelectedAlpha?: number
  buttonHoverAlpha?: number
  buttonBorderColor?: number
  buttonBorderSelectedColor?: number
  buttonBorderHoverColor?: number
  buttonBorderAlpha?: number
  buttonBorderHoverAlpha?: number
  buttonBorderSelectedAlpha?: number
  initX?: number
  initY?: number
  iconTexture?: Texture
  iconScale?: number
  iconColor?: number
  iconColorHover?: number
  iconColorSelected?: number
  flexDirection?: 'row' | 'col' | 'col-center'
}

export class Button extends Container {
  public border!: Graphics
  public background!: Graphics
  public icon!: Sprite
  public text!: Text
  public iconPaddingTop !: number
  public iconPaddingLeft !: number
  public iconIdleAlpha !: number
  public iconHoverAlpha !: number
  public iconSelectedAlpha !: number
  public textPaddingTop !: number
  public textPaddingLeft !: number
  public buttonIdleColor !: number
  public buttonIdleAlpha !: number
  public buttonHoverColor !: number
  public buttonSelectedColor !: number
  public buttonHoverAlpha !: number
  public buttonSelectedAlpha !: number
  public buttonBorderWidth !: number
  public buttonBorderColor !: number
  public buttonBorderHoverColor !: number
  public buttonBorderSelectedColor !: number
  public buttonBorderAlpha !: number
  public buttonBorderHoverAlpha !: number
  public buttonBorderSelectedAlpha !: number
  public textColor !: number
  public textColorHover !: number
  public textColorSelected !: number
  public shadowTextColor !: number
  public shadowThickness !: number
  public iconColor !: number
  public iconColorHover !: number
  public iconColorSelected !: number
  public fontSize !: number
  public flexDirection !: IButtonOptions['flexDirection']
  public onClick!: IButtonOptions['onClick']
  public selected = false
  constructor (options: IButtonOptions) {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.onClick = options.onClick
    this.iconPaddingTop = options.iconPaddingTop ?? 20
    this.iconPaddingLeft = options.iconPaddingLeft ?? 20
    this.iconIdleAlpha = options.iconIdleAlpha ?? 1
    this.iconHoverAlpha = options.iconHoverAlpha ?? 1
    this.iconSelectedAlpha = options.iconSelectedAlpha ?? 1
    this.textPaddingTop = options.textPaddingTop ?? 20
    this.textPaddingLeft = options.textPaddingLeft ?? 20
    this.fontSize = options.fontSize ?? 16
    this.textColor = options.textColor ?? 0x000000
    this.textColorHover = options.textColorHover ?? 0x000000
    this.shadowTextColor = options.shadowTextColor ?? 0x000000
    this.shadowThickness = options.shadowThickness ?? 0

    this.iconColor = options.iconColor ?? 0x000000
    this.iconColorSelected = options.iconColorSelected ?? this.iconColor ?? 0x000000
    this.iconColorHover = options.iconColorHover ?? 0x000000

    this.buttonIdleColor = options.buttonIdleColor ?? 0x000000
    this.buttonIdleAlpha = options.buttonIdleAlpha ?? 1
    this.buttonHoverColor = options.buttonHoverColor ?? options.buttonIdleColor ?? 0x000000
    this.buttonHoverAlpha = options.buttonHoverAlpha ?? 1
    this.buttonBorderWidth = options.buttonBorderWidth ?? 0
    this.buttonBorderColor = options.buttonBorderColor ?? options.buttonIdleColor ?? 0x000000
    this.buttonBorderHoverColor = options.buttonBorderHoverColor ?? options.buttonIdleColor ?? 0x000000
    this.buttonBorderAlpha = options.buttonBorderAlpha ?? 1
    this.buttonBorderHoverAlpha = options.buttonBorderHoverAlpha ?? 1
    this.buttonSelectedColor = options.buttonSelectedColor ?? options.buttonIdleColor ?? 0x000000
    this.buttonSelectedAlpha = options.buttonSelectedAlpha ?? 1
    this.buttonBorderSelectedColor = options.buttonBorderSelectedColor ?? this.buttonBorderColor ?? 0x000000
    this.buttonBorderSelectedAlpha = options.buttonBorderSelectedAlpha ?? 1
    this.textColorSelected = options.textColorSelected ?? this.textColor ?? 0x000000
    this.flexDirection = options.flexDirection ?? 'row'
    this.setup(options)
    this.draw(options)
    this.selected ? this.selectedColor() : this.idleColor()
    if (typeof options.initX === 'number') {
      this.position.x = options.initX
    }
    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  setup ({
    text: initText,
    buttonWidth,
    buttonHeight,
    iconTexture,
    iconScale = 1,
    buttonBorderWidth = 0
  }: IButtonOptions): void {
    const border = new Graphics()
    this.addChild(border)
    this.border = border
    const background = new Graphics()
    this.addChild(background)
    this.background = background
    this.background.position.set(buttonBorderWidth, buttonBorderWidth)
    const { iconPaddingTop, iconPaddingLeft, textPaddingTop, textPaddingLeft, flexDirection } = this
    const icon = new Sprite(iconTexture)
    icon.scale.set(iconScale)
    icon.position.set(iconPaddingLeft + buttonBorderWidth, iconPaddingTop + buttonBorderWidth)
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
    if (iconTexture != null) {
      if (flexDirection === 'row') {
        text.position.set(icon.x + icon.width + textPaddingLeft, textPaddingTop)
      } else if (flexDirection === 'col-center') {
        text.anchor.set(0.5, 0)
        text.position.set(
          buttonWidth != null ? buttonWidth / 2 : (buttonBorderWidth + iconPaddingLeft + icon.width / 2),
          icon.y + icon.height + textPaddingTop
        )
      } else {
        text.position.set(buttonBorderWidth + textPaddingLeft, icon.y + icon.height + textPaddingTop)
      }
    } else if (buttonWidth != null && buttonHeight != null) {
      text.anchor.set(0.5, 0.5)
      text.position.set(buttonWidth / 2, buttonHeight / 2)
    }
    this.addChild(text)
    this.text = text

    this.initEventLesteners()
  }

  initEventLesteners (): void {
    this.on('pointertap', (e) => {
      this.selected = !this.selected
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
        this.selected ? this.selectedColor() : this.idleColor()
      }
    })
    this.on('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        this.selected ? this.selectedColor() : this.idleColor()
      }
    })
  }

  draw ({
    iconPaddingTop = 0,
    buttonWidth,
    buttonHeight,
    buttonRadius = 0,
    buttonBorderWidth = 0,
    textPaddingTop = 0
  }: IButtonOptions): void {
    if (typeof buttonWidth !== 'number') {
      buttonWidth = this.width + buttonBorderWidth * 2
    }
    if (typeof buttonHeight !== 'number') {
      buttonHeight = iconPaddingTop + this.icon.height + textPaddingTop + this.text.height + buttonBorderWidth * 2
    }
    this.border.beginFill(0xffffff)
    this.border.drawRoundedRect(0, 0, buttonWidth, buttonHeight, buttonRadius)
    this.border.endFill()
    this.border.beginHole()
    this.border.drawRoundedRect(buttonBorderWidth, buttonBorderWidth, buttonWidth - buttonBorderWidth * 2, buttonHeight - buttonBorderWidth * 2, buttonRadius)
    this.border.endHole()
    this.background.beginFill(0xffffff)
    this.background.drawRoundedRect(0, 0, buttonWidth - buttonBorderWidth * 2, buttonHeight - buttonBorderWidth * 2, buttonRadius)
    this.background.endFill()
  }

  color ({
    bgAlpha,
    brdColor,
    brdAlpha,
    bgColor,
    txtColor,
    iconColor,
    iconAlpha
  }: {
    bgAlpha: number
    brdColor: number
    brdAlpha: number
    bgColor: number
    txtColor: number
    iconColor: number
    iconAlpha: number
  }): void {
    this.border.tint = brdColor
    this.border.alpha = brdAlpha
    this.background.tint = bgColor
    this.background.alpha = bgAlpha
    this.text.tint = txtColor
    this.icon.tint = iconColor
    this.icon.alpha = iconAlpha
  }

  idleColor ({
    bgAlpha = this.buttonIdleAlpha,
    brdColor = this.buttonBorderColor,
    brdAlpha = this.buttonBorderAlpha,
    bgColor = this.buttonIdleColor,
    txtColor = this.textColor,
    iconColor = this.iconColor,
    iconAlpha = this.iconIdleAlpha
  }: {
    brdColor?: number
    brdAlpha?: number
    bgAlpha?: number
    bgColor?: number
    txtColor?: number
    iconColor?: number
    iconAlpha?: number
  } = {}): void {
    this.color({ bgAlpha, brdAlpha, brdColor, bgColor, txtColor, iconColor, iconAlpha })
  }

  hoverColor ({
    bgAlpha = this.buttonHoverAlpha,
    brdColor = this.buttonBorderHoverColor,
    brdAlpha = this.buttonBorderHoverAlpha,
    bgColor = this.buttonHoverColor,
    txtColor = this.textColorHover,
    iconColor = this.iconColorHover,
    iconAlpha = this.iconHoverAlpha
  }: {
    brdColor?: number
    brdAlpha?: number
    bgAlpha?: number
    bgColor?: number
    txtColor?: number
    iconColor?: number
    iconAlpha?: number
  } = {}): void {
    this.color({ bgAlpha, brdAlpha, brdColor, bgColor, txtColor, iconColor, iconAlpha })
  }

  selectedColor ({
    bgAlpha = this.buttonSelectedAlpha,
    brdColor = this.buttonBorderSelectedColor,
    brdAlpha = this.buttonBorderSelectedAlpha,
    bgColor = this.buttonSelectedColor,
    txtColor = this.textColorSelected,
    iconColor = this.iconColorSelected,
    iconAlpha = this.iconSelectedAlpha
  }: {
    brdColor?: number
    brdAlpha?: number
    bgAlpha?: number
    bgColor?: number
    txtColor?: number
    iconColor?: number
    iconAlpha?: number
  } = {}): void {
    this.color({ bgAlpha, brdAlpha, brdColor, bgColor, txtColor, iconColor, iconAlpha })
  }

  setSelected (selected: boolean): void {
    this.selected = selected
    this.selected ? this.selectedColor() : this.idleColor()
  }
}
