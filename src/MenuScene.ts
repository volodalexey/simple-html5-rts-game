import { type Application, Container, Sprite, type Texture } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { logLayout } from './logger'
import { Button } from './Button'
import { TileMap } from './TileMap'
import { CampaignScene } from './CampaignScene'

interface IMenuSceneSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  menuTexture: Texture
}

export class MenuScene extends Container implements IScene {
  public gravity = 0.7
  public gameEnded = false

  public background!: Sprite
  public choices = new Container()

  static options = {
    choices: {
      offset: {
        x: 50,
        y: 320
      }
    }
  }

  constructor (options: IMenuSceneSceneOptions) {
    super()

    this.setup(options)

    setTimeout(() => {
      void TileMap.idleLoad().catch(console.error)
    }, 1000)
  }

  setup ({ menuTexture }: IMenuSceneSceneOptions): void {
    const background = new Sprite(menuTexture)
    this.addChild(background)
    this.background = background

    this.addChild(this.choices)
    const { offset } = MenuScene.options.choices
    this.choices.position.set(offset.x, offset.y)

    const style = {
      fontSize: 48,
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      shadowTextColor: 0x800080,
      shadowThickness: 2,
      buttonIdleAlpha: 0,
      buttonHoverAlpha: 0
    }
    const campaignButton = new Button({
      text: 'Campaign',
      onClick: this.goToCampaignScene,
      ...style
    })
    this.choices.addChild(campaignButton)

    const vsCPUButton = new Button({
      text: 'Versus CPU',
      onClick: this.goToMultiplayerScene,
      ...style
    })
    this.choices.addChild(vsCPUButton)
    vsCPUButton.position.set(0, campaignButton.height)
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const { width: tWidth, height: tHeight } = this.background.texture
    const totalWidth = tWidth
    const totalHeight = tHeight
    let scale = 1
    if (totalHeight >= totalWidth) {
      if (availableHeight < totalHeight) {
        scale = availableHeight / totalHeight
        if (scale * totalWidth > availableWidth) {
          scale = availableWidth / totalWidth
        }
        logLayout(`By height (sc=${scale})`)
      }
    } else {
      if (availableWidth < totalWidth) {
        scale = availableWidth / totalWidth
        if (scale * totalHeight > availableHeight) {
          scale = availableHeight / totalHeight
        }
        logLayout(`By width (sc=${scale})`)
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

  handleUpdate (deltaMS: number): void {
  }

  goToCampaignScene = (): void => {
    SceneManager.changeScene(new CampaignScene({
      app: SceneManager.app,
      viewWidth: SceneManager.width,
      viewHeight: SceneManager.height
    })).catch(console.error)
  }

  goToMultiplayerScene = (): void => {

  }
}
