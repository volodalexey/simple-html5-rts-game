import { Application, Container, type DisplayObject } from 'pixi.js'
import { logApp } from '../utils/logger'

export interface IScene extends DisplayObject {
  handleUpdate: (deltaMS: number) => void
  mountedHandler?: () => void
  unmountedHandler?: () => void
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
  private static readonly scenes = new Map<string, IScene>()

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

  public static async changeScene ({ name, newScene, initialResize = true }: { name: string, newScene?: IScene, initialResize?: boolean }): Promise<void> {
    if (newScene != null) {
      if (!SceneManager.scenes.has(name)) {
        SceneManager.scenes.set(name, newScene)
      }
    } else {
      newScene = SceneManager.scenes.get(name)
    }
    if (newScene == null) {
      throw new Error('Unable to detect new scene')
    }
    SceneManager.app.stage.removeChild(SceneManager.currentScene)
    if (typeof SceneManager.currentScene.unmountedHandler === 'function') {
      SceneManager.currentScene.unmountedHandler()
    }
    // SceneManager.currentScene.destroy()

    SceneManager.currentScene = newScene
    SceneManager.app.stage.addChild(SceneManager.currentScene)

    if (initialResize) {
      SceneManager.resizeHandler()
    }

    if (typeof newScene.mountedHandler === 'function') {
      newScene.mountedHandler()
    }
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
