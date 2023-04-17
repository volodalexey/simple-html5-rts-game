import { Container, Graphics, Text, type TextStyleFontWeight } from 'pixi.js'

interface IStartModalOptions {
  viewWidth: number
  viewHeight: number
}

export class StartModal extends Container {
  public modalBox!: Graphics
  public reasonText!: Text
  public button!: Graphics
  public buttonText!: Text
  public boxOptions = {
    fill: 0xffffff,
    width: 300,
    height: 200,
    borderRadius: 5
  }

  public reasonTextOptions = {
    top: -50,
    textColor: 0x000000,
    textSize: 40,
    fontWeight: 'bold'
  }

  public buttonOptions = {
    top: 120,
    left: 50,
    width: 200,
    height: 50,
    fill: 0xffffff,
    fillError: 0x9a3412,
    fillSuccess: 0x22c55e,
    borderRadius: 10
  }

  public buttonTextOptions = {
    top: 95,
    textColor: 0xffffff,
    textSize: 20
  }

  constructor (options: IStartModalOptions) {
    super()
    this.setup(options)
    this.draw(options)
    this.setupEventListeners()
  }

  setup (_: IStartModalOptions): void {
    this.modalBox = new Graphics()
    this.addChild(this.modalBox)

    const { boxOptions, reasonTextOptions, buttonTextOptions } = this

    this.reasonText = new Text('-', {
      fontSize: reasonTextOptions.textSize,
      fill: reasonTextOptions.textColor,
      fontWeight: reasonTextOptions.fontWeight as TextStyleFontWeight
    })
    this.reasonText.anchor.set(0.5, 0.5)
    this.reasonText.position.set(boxOptions.width / 2, boxOptions.height / 2 + reasonTextOptions.top)
    this.addChild(this.reasonText)

    this.button = new Graphics()
    this.button.interactive = true
    this.button.cursor = 'pointer'
    this.addChild(this.button)

    this.buttonText = new Text('Start Game', {
      fontSize: buttonTextOptions.textSize,
      fill: buttonTextOptions.textColor
    })
    this.buttonText.anchor.set(0.5, 0.5)
    this.buttonText.position.set(boxOptions.width / 2, boxOptions.height / 2 / 2 + buttonTextOptions.top)
    this.button.addChild(this.buttonText)
  }

  draw (_: IStartModalOptions): void {
    const { boxOptions, buttonOptions } = this
    this.modalBox.beginFill(boxOptions.fill)
    this.modalBox.drawRoundedRect(0, 0, boxOptions.width, boxOptions.height, boxOptions.borderRadius)
    this.modalBox.endFill()

    this.button.beginFill(buttonOptions.fill)
    this.button.drawRoundedRect(buttonOptions.left, buttonOptions.top, buttonOptions.width, buttonOptions.height, buttonOptions.borderRadius)
    this.button.endFill()
  }

  setupEventListeners (): void {
    this.button.on('pointertap', (e) => {
      this.emit('click', e)
    })
  }

  win (text: string): void {
    this.reasonText.text = text
    this.button.tint = this.buttonOptions.fillSuccess
  }

  lose (text: string): void {
    this.reasonText.text = text
    this.button.tint = this.buttonOptions.fillError
  }
}
