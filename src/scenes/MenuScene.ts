import { type Application, Container, Sprite, type Texture, type Spritesheet, Assets } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { logLayout } from '../utils/logger'
import { Button, type IButtonOptions } from '../components/Button'
import { TileMap } from '../components/TileMap'
import { CampaignScene } from './CampaignScene'
import { StatusBar } from '../components/StatusBar'
import { VersusCPUScene } from './VersusCPUScene'
import { Game } from '../Game'
import { Team } from '../utils/common'
import { SettingsModal } from '../components/SettingsModal'

interface IMenuSceneSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  menuTexture: Texture
}

class Choices extends Container<Button> {}
class SettingsButton extends Button {}

export class MenuScene extends Container implements IScene {
  public game!: Game
  public gravity = 0.7
  public gameEnded = false

  public background!: Sprite
  public choices = new Choices()
  public settingsButton!: SettingsButton
  public settingsModal!: SettingsModal

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
    },
    settingsButton: {
      offset: {
        x: 550,
        y: 400
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
    })
  }

  setup ({ menuTexture }: IMenuSceneSceneOptions): void {
    const background = new Sprite(menuTexture)
    this.addChild(background)
    this.background = background

    this.addChild(this.choices)

    const { textures }: Spritesheet = Assets.get('spritesheet')

    const { x, y } = MenuScene.options.settingsButton.offset
    this.settingsButton = new SettingsButton({
      text: '',
      textColor: 0xffffff,
      initX: x,
      initY: y,
      iconColor: 0xffffff,
      iconColorHover: 0xffff00,
      iconPaddingLeft: 10,
      iconPaddingTop: 10,
      buttonWidth: 75,
      buttonHeight: 65,
      buttonIdleColor: 0x454545,
      buttonBorderColor: 0xffffff,
      buttonBorderHoverColor: 0xffff00,
      buttonBorderWidth: 1,
      buttonRadius: 10,
      iconTexture: textures['icon-gears.png'],
      onClick: () => {
        this.settingsModal.showModal()
      }
    })
    this.addChild(this.settingsButton)

    SettingsModal.prepareTextures({
      textures: {
        iconHomeTexture: textures['icon-home.png'],
        iconVolumeOffTexture: textures['icon-volume-off.png'],
        iconVolumeLowTexture: textures['icon-volume-low.png'],
        iconVolumeMiddleTexture: textures['icon-volume-middle.png'],
        iconVolumeHighTexture: textures['icon-volume-high.png'],
        iconCircleXMarkTexture: textures['icon-circle-xmark.png'],
        iconCircleCheckTexture: textures['icon-circle-check.png'],
        iconGearsTexture: textures['icon-gears.png']
      }
    })

    const settingsModal = new SettingsModal({
      viewWidth: SceneManager.width,
      viewHeight: SceneManager.height,
      onHomeClick: () => { console.log('onHomeClick') },
      onApplyClick: () => { console.log('onApplyClick') }
    })
    this.settingsModal = settingsModal
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
      onClick: this.goToVersusCPUScene,
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
    const calcWidth = availableWidth > occupiedWidth ? occupiedWidth : availableWidth
    const calcHeight = availableHeight > occupiedHeight ? occupiedHeight : availableHeight
    this.settingsModal.position.set(calcWidth / 2 - this.settingsModal.width / 2, calcHeight / 2 - this.settingsModal.height / 2)
  }

  handleUpdate (deltaMS: number): void {}

  goToCampaignScene = (missionIdx?: number): void => {
    if (this.game == null) {
      this.game = new Game({
        viewWidth: SceneManager.width,
        viewHeight: SceneManager.height,
        type: 'campaign',
        team: Team.blue
      })
    }
    SceneManager.changeScene({
      name: 'campaign',
      newScene: new CampaignScene({
        app: SceneManager.app,
        game: this.game,
        viewWidth: SceneManager.width,
        viewHeight: SceneManager.height,
        missionIdx
      }),
      initialResize: false
    }).catch(console.error)
  }

  goToVersusCPUScene = (): void => {
    if (this.game == null) {
      this.game = new Game({
        viewWidth: SceneManager.width,
        viewHeight: SceneManager.height,
        type: 'singleplayer',
        team: Team.blue
      })
    }
    SceneManager.changeScene({
      name: 'versusCPU',
      newScene: new VersusCPUScene({
        app: SceneManager.app,
        game: this.game,
        viewWidth: SceneManager.width,
        viewHeight: SceneManager.height
      }),
      initialResize: false
    }).catch(console.error)
  }

  mountedHandler (): void {
    this.addChild(this.settingsModal)
    this.settingsModal.hideModal()
  }
}
