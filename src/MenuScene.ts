import { type Application, Container, Sprite, type Texture, type Spritesheet, Assets } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { logLayout } from './logger'
import { Button, type IButtonOptions } from './Button'
import { TileMap } from './TileMap'
import { CampaignScene } from './CampaignScene'
import { StatusBar } from './StatusBar'

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
      mainOffset: {
        x: 50,
        y: 320
      },
      missionOffset: {
        x: 50,
        y: 50
      }
    }
  }

  constructor (options: IMenuSceneSceneOptions) {
    super()

    this.setup(options)

    this.drawMainOptions()

    setTimeout(() => {
      TileMap.idleLoad().then(() => {
        StatusBar.prepareTextures({
          textures: {
            girl1Texture: Assets.get('characterGirl1'),
            girl2Texture: Assets.get('characterGirl2'),
            man1Texture: Assets.get('characterMan1'),
            systemTexture: Assets.get('characterSystem')
          }
        })
      }).catch(console.error)
    }, 1000)
  }

  setup ({ menuTexture }: IMenuSceneSceneOptions): void {
    const background = new Sprite(menuTexture)
    this.addChild(background)
    this.background = background

    this.addChild(this.choices)
  }

  clearFromAll (): void {
    while (this.choices.children.length > 0) {
      this.choices.children[0].removeFromParent()
    }
  }

  drawMainOptions = (): void => {
    this.clearFromAll()
    const { mainOffset } = MenuScene.options.choices
    this.choices.position.set(mainOffset.x, mainOffset.y)

    const style: IButtonOptions = {
      text: '',
      fontSize: 48,
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      shadowTextColor: 0x800080,
      shadowThickness: 2,
      buttonSelectedAlpha: 0,
      buttonIdleAlpha: 0,
      buttonHoverAlpha: 0
    }
    const campaignButton = new Button({
      onClick: this.drawMissionOptions,
      ...style,
      text: 'Campaign'
    })
    this.choices.addChild(campaignButton)

    const vsCPUButton = new Button({
      onClick: this.goToMultiplayerScene,
      ...style,
      text: 'Versus CPU'
    })
    this.choices.addChild(vsCPUButton)
    vsCPUButton.position.set(0, campaignButton.height)
  }

  drawMissionOptions = (): void => {
    this.clearFromAll()
    const { missionOffset } = MenuScene.options.choices
    this.choices.position.set(missionOffset.x, missionOffset.y)

    const spritesheet: Spritesheet = Assets.get('spritesheet')
    const { textures } = spritesheet

    const style: IButtonOptions = {
      text: '',
      fontSize: 32,
      textColor: 0xffffff,
      textColorHover: 0xffff00,
      shadowTextColor: 0x800080,
      shadowThickness: 2,
      buttonIdleAlpha: 0,
      buttonSelectedAlpha: 0,
      buttonHoverAlpha: 0
    }
    const homeButton = new Button({
      iconTexture: textures['icon-home.png'],
      onClick: this.drawMainOptions,
      ...style,
      text: 'Home',
      buttonWidth: 200,
      buttonHeight: 50,
      iconScale: 1,
      iconColor: 0xffffff,
      iconColorHover: 0xffff00,
      fontSize: 48
    })
    this.choices.addChild(homeButton);

    [0, 1, 2, 3].forEach(missionIdx => {
      const vsCPUButton = new Button({
        onClick: () => { this.goToCampaignScene(missionIdx) },
        ...style,
        text: `Mission ${missionIdx + 1}`
      })
      vsCPUButton.position.set(0, this.choices.height)
      this.choices.addChild(vsCPUButton)
    })
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

  goToCampaignScene = (missionIdx?: number): void => {
    SceneManager.changeScene({
      name: 'campaign',
      newScene: new CampaignScene({
        app: SceneManager.app,
        viewWidth: SceneManager.width,
        viewHeight: SceneManager.height,
        missionIdx
      }),
      initialResize: false
    }).catch(console.error)
  }

  goToMultiplayerScene = (): void => {

  }
}
