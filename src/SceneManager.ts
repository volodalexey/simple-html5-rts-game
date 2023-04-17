import { Application, Container, type DisplayObject } from 'pixi.js'
import { logApp } from './logger'

export interface IScene extends DisplayObject {
  handleUpdate: (deltaMS: number) => void
  handleResize: (options: {
    viewWidth: number
    viewHeight: number
  }) => void
}

class DefaultScene extends Container implements IScene {
  init (): void {}
  handleUpdate (): void {}
  handleResize (): void {}
}

export abstract class SceneManager {
  private constructor () { }
  public static app: Application<HTMLCanvasElement>
  private static currentScene: IScene = new DefaultScene()
  private static resizeTimeoutId: NodeJS.Timeout
  private static readonly resizeTimeout = 300

  public static get width (): number {
    return window.innerWidth
  }

  public static get height (): number {
    return window.innerHeight
  }

  public static async initialize (): Promise<void> {
    const app = new Application<HTMLCanvasElement>({
      autoDensity: true,
      resolution: window.devicePixelRatio ?? 1,
      width: SceneManager.width,
      height: SceneManager.height,
      resizeTo: window
    })
    document.body.appendChild(app.view)
    if (logApp.enabled) {
      logApp('window.app initialized!');
      (window as unknown as any).app = app
    }

    SceneManager.app = app

    SceneManager.setupEventLesteners()
  }

  static setupEventLesteners (): void {
    window.addEventListener('resize', SceneManager.resizeDeBounce)
    SceneManager.app.ticker.add(SceneManager.updateHandler)
  }

  public static async changeScene (newScene: IScene): Promise<void> {
    SceneManager.app.stage.removeChild(SceneManager.currentScene)
    SceneManager.currentScene.destroy()

    SceneManager.currentScene = newScene
    SceneManager.app.stage.addChild(SceneManager.currentScene)

    SceneManager.resizeHandler()
  }

  private static resizeDeBounce (): void {
    SceneManager.cancelScheduledResizeHandler()
    SceneManager.scheduleResizeHandler()
  }

  private static cancelScheduledResizeHandler (): void {
    clearTimeout(SceneManager.resizeTimeoutId)
  }

  private static scheduleResizeHandler (): void {
    SceneManager.resizeTimeoutId = setTimeout(() => {
      SceneManager.cancelScheduledResizeHandler()
      SceneManager.resizeHandler()
    }, SceneManager.resizeTimeout)
  }

  public static resizeHandler (): void {
    SceneManager.currentScene.handleResize({
      viewWidth: SceneManager.width,
      viewHeight: SceneManager.height
    })
  }

  public static updateHandler (): void {
    SceneManager.currentScene.handleUpdate(SceneManager.app.ticker.deltaMS)
  }
}
