import './styles.css'
import { SceneManager } from './SceneManager'
import { LoaderScene } from './LoaderScene'
import { MenuScene } from './MenuScene'

async function run (): Promise<void> {
  const loader: HTMLElement | null = document.querySelector('.loader')
  if (loader != null) {
    loader.parentElement?.removeChild(loader)
  }
  await SceneManager.initialize()
  const loaderScene = new LoaderScene({
    viewWidth: SceneManager.width,
    viewHeight: SceneManager.height
  })
  await SceneManager.changeScene({ name: 'loader', newScene: loaderScene })
  await loaderScene.initializeLoader()
  const { menuBackground } = loaderScene.getAssets()
  await SceneManager.changeScene({
    name: 'menu',
    newScene: new MenuScene({
      app: SceneManager.app,
      viewWidth: SceneManager.width,
      viewHeight: SceneManager.height,
      menuTexture: menuBackground
    })
  })
}

run().catch((err) => {
  console.error(err)
  const errorMessageDiv: HTMLElement | null = document.querySelector('.error-message')
  if (errorMessageDiv != null) {
    errorMessageDiv.classList.remove('hidden')
    errorMessageDiv.innerText = ((Boolean(err)) && (Boolean(err.message))) ? err.message : err
  }
  const errorStackDiv: HTMLElement | null = document.querySelector('.error-stack')
  if (errorStackDiv != null) {
    errorStackDiv.classList.remove('hidden')
    errorStackDiv.innerText = ((Boolean(err)) && (Boolean(err.stack))) ? err.stack : ''
  }
  const canvas: HTMLCanvasElement | null = document.querySelector('canvas')
  if (canvas != null) {
    canvas.parentElement?.removeChild(canvas)
  }
})
