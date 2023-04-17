import { type Application, Container } from 'pixi.js'
import { type IScene } from './SceneManager'
import { Game } from './Game'
import { type IMapSettings } from './MapSettings'

interface ISinglePlayerSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  levelSettings: IMapSettings
}

export class SinglePlayerScene extends Container implements IScene {
  public gravity = 0.7
  public gameEnded = false

  public game!: Game

  constructor (options: ISinglePlayerSceneOptions) {
    super()

    this.setup(options)
  }

  setup ({ viewWidth, viewHeight }: ISinglePlayerSceneOptions): void {
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
