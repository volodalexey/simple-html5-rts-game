import { Graphics, Text } from 'pixi.js'

export interface IInputOptions {
  initWidth: number
  initHeight: number
  initValue?: string
  onChanged: (value: string) => void
}

export class Input extends Graphics {
  public text = new Text('', {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 16,
    fill: 0xffffff
  })

  public boxOptions = {
    backgroundColor: 0x454545,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 1,
    borderRadius: 0
  }

  public textOptions = {
    offset: { x: 2, y: 2 }
  }

  public onChanged: IInputOptions['onChanged']

  constructor (options: IInputOptions) {
    super()
    this.onChanged = options.onChanged
    this.setup(options)
    this.draw(options)
    this.setupEventListeners()
  }

  setup ({ initValue }: IInputOptions): void {
    this.addChild(this.text)
    const { textOptions } = this
    this.text.position.set(this.boxOptions.outerBorderWidth + textOptions.offset.x, this.boxOptions.outerBorderWidth + textOptions.offset.y - 1)
    this.text.text = initValue ?? ''
  }

  draw ({ initWidth, initHeight }: IInputOptions): void {
    const {
      boxOptions: { backgroundColor, outerBorderWidth, outerBorderColor, borderRadius }
    } = this

    let offsetX = 0
    let offsetY = 0
    let leftWidth = initWidth
    let leftHeight = initHeight

    this.clear()
    this.beginFill(backgroundColor)
    this.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.endFill()

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    this.beginFill(outerBorderColor)
    this.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.endFill()
  }

  setupEventListeners (): void {
    this.eventMode = 'static'
    this.on('pointertap', () => {
      this.focus()
    })
  }

  focus (): void {
    const domForm = document.querySelector<HTMLFormElement>('form')
    const domInput = document.querySelector<HTMLInputElement>('.dom-input')
    if (domInput != null && domForm != null) {
      const globalPosition = this.getGlobalPosition()
      domForm.classList.remove('hidden')
      domInput.style.top = `${globalPosition.y}px`
      domInput.style.left = `${globalPosition.x}px`
      domInput.style.width = `${this.width}px`
      domInput.style.height = `${this.height}px`
      domInput.style.paddingLeft = `${this.textOptions.offset.x}px`
      domInput.style.paddingTop = `${this.textOptions.offset.y}px`
      domInput.value = this.text.text
      domInput.onblur = () => {
        this.blur()
      }
      domForm.onsubmit = (e: SubmitEvent) => {
        e.preventDefault()
        e.stopPropagation()
        domInput.onblur = null
        this.blur()
      }
      domInput.oninput = () => {
        this.text.text = domInput.value
      }
      domInput.focus()
    }
  }

  blur (): void {
    const domForm = document.querySelector<HTMLFormElement>('form')
    const domInput = document.querySelector<HTMLInputElement>('.dom-input')
    if (domInput != null && domForm != null) {
      domInput.blur()
      domForm.classList.add('hidden')
    }
    this.onChanged(this.text.text)
  }
}
