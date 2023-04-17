import { type Application, Container } from 'pixi.js'
import { type IScene } from './SceneManager'
import { Game } from './Game'

interface ICampaignSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
}

export class CampaignScene extends Container implements IScene {
  public gameEnded = false

  public game!: Game

  constructor (options: ICampaignSceneOptions) {
    super()

    this.setup(options)
  }

  setup ({ viewWidth, viewHeight }: ICampaignSceneOptions): void {
    const game = new Game({
      viewWidth,
      viewHeight
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
  }
}
