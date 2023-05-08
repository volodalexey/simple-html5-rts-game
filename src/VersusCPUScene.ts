import { type Application, Container } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { Team } from './common'
import { EMessageCharacter } from './StatusBar'
import { type Trigger, createTrigger, ETriggerType, type TimedTrigger, type ConditionalTrigger, type IntervalTrigger, type IConditionalTrigger } from './Trigger'
import { EItemName } from './interfaces/IItem'
import { AI } from './AI'

interface IVersusCPUSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
}

export class VersusCPUScene extends Container implements IScene {
  public game!: Game
  public triggers: Trigger[] = []

  constructor (options: IVersusCPUSceneOptions) {
    super()
    this.setup(options)
  }

  setup ({ viewWidth, viewHeight }: IVersusCPUSceneOptions): void {
    const game = new Game({
      viewWidth,
      viewHeight,
      team: Team.blue,
      type: 'singleplayer'
    })
    this.addChild(game)
    this.game = game
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.game.handleResize(options)
  }

  handleUpdate (deltaMS: number): void {
    this.game.handleUpdate(deltaMS)

    if (this.game.gameEnded) {
      return
    }

    for (let i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i]
      let triggered = false
      switch (trigger.type) {
        case ETriggerType.timed: {
          if (this.game.time >= (trigger as TimedTrigger).time) {
            trigger.action()
            this.triggers.splice(i, 1)
            i--
            triggered = true
          }
          break
        }
        case ETriggerType.conditional: {
          if ((trigger as ConditionalTrigger).condition()) {
            trigger.action()
            this.triggers.splice(i, 1)
            i--
            triggered = true
          }
          break
        }
        case ETriggerType.interval: {
          if ((trigger as IntervalTrigger).isElapsed(deltaMS)) {
            trigger.action()
            triggered = true
          }
          break
        }
      }
      if (triggered && trigger.insertTrigger != null) {
        const newTrigger = createTrigger(trigger.insertTrigger)
        this.triggers.push(newTrigger)
      }
    }
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
      startGridX: 0,
      startGridY: 30
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
    this.game.cash[Team.blue] = 160
    this.game.cash[Team.green] = 1600

    this.game.showMessage({
      character: EMessageCharacter.system,
      message: 'Versus CPU',
      playSound: false
    })

    this.game.ai = new AI({ game: this.game, team: Team.green })
  }

  mountedHandler (): void {
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
