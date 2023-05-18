import { type Application, Container } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { type Game } from '../Game'
import { Team } from '../utils/helpers'
import { EMessageCharacter } from '../components/StatusBar'
import { type Trigger, createTrigger, ETriggerType, type IConditionalTrigger, handleTiggers } from '../utils/Trigger'
import { EItemName } from '../interfaces/IItem'
import { AI } from '../utils/AI'
import { logCash } from '../utils/logger'
import { type SettingsModal } from '../components/SettingsModal'

interface IVersusCPUSceneOptions {
  app: Application
  game: Game
  settingsModal: SettingsModal
  viewWidth: number
  viewHeight: number
}

export class VersusCPUScene extends Container implements IScene {
  public game!: Game
  public settingsModal!: SettingsModal
  public triggers: Trigger[] = []

  constructor (options: IVersusCPUSceneOptions) {
    super()
    this.settingsModal = options.settingsModal
    this.setup(options)
  }

  setup ({ viewWidth, viewHeight, game }: IVersusCPUSceneOptions): void {
    game.viewWidth = viewWidth
    game.viewHeight = viewHeight
    game.team = Team.blue
    game.type = 'singleplayer'
    this.game = game
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.game.handleResize(options)
    this.settingsModal.handleResize(options)
  }

  handleUpdate (deltaMS: number): void {
    this.game.handleUpdate(deltaMS)

    if (this.game.gameEnded) {
      return
    }

    handleTiggers({ deltaMS, triggers: this.triggers })
  }

  start (): void {
    this.triggers = [
      {
        type: ETriggerType.conditional,
        condition: () => {
          return this.game.tileMap.staticItems.filter(item => item.team === this.game.team).length === 0
        },
        action: () => {
          this.endVersus({ success: false })
        }
      } satisfies IConditionalTrigger,
      {
        type: ETriggerType.conditional,
        condition: () => {
          return this.game.tileMap.staticItems.filter(item => item.team === Team.green).length === 0
        },
        action: () => {
          this.endVersus({ success: true })
        }
      } satisfies IConditionalTrigger
    ].map(triggerDescription => createTrigger(triggerDescription))

    this.game.startGame({
      mapImageSrc: 'level2Background',
      mapSettingsSrc: 'level2Settings',
      startGridX: 2,
      startGridY: 37,
      team: Team.blue,
      type: 'singleplayer'
    });

    [
      { name: EItemName.Base, initGridX: 2, initGridY: 36, team: Team.blue },
      { name: EItemName.Base, initGridX: 56, initGridY: 2, team: Team.green }
    ].forEach((itemOptions) => {
      const item = this.game.createItem(itemOptions)
      if (item != null) {
        this.game.tileMap.addItem(item)
      }
    })
    this.game.tileMap.rebuildBuildableGrid()
    this.game.cash[Team.blue] = 1600
    this.game.cash[Team.green] = 1600
    logCash(`(${this.game.team}) initial b=${this.game.cash.blue} g=${this.game.cash.green}`)

    this.game.showMessage({
      character: EMessageCharacter.system,
      message: 'Versus CPU',
      playSound: false
    })

    this.game.ai = new AI({ game: this.game, team: Team.green })
  }

  mountedHandler (): void {
    this.addChild(this.game)
    this.addChild(this.settingsModal)
    this.start()
  }

  endVersus ({ success }: { success: boolean }): void {
    this.game.endGame({
      success,
      message: success
        ? 'You win!\nOne more time?'
        : 'You lose...\nTry again?',
      view: success ? 'home-repeat' : 'home-repeat',
      onLeftClick: () => {
        SceneManager.changeScene({ name: 'menu' }).catch(console.error)
      },
      onRightClick: () => {
        this.start()
      }
    })
  }
}
