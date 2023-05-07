import { Graphics, Sprite, type Texture } from 'pixi.js'
import { SceneManager } from './SceneManager'

interface IHitboxOptions {
  initX: number
  initY: number
  initGridX: number
  initGridY: number
  initWidth: number
  initHeight: number
  occupied: boolean
}

export class Hitbox extends Sprite {
  static texturesCache: Texture
  public initGridX!: number
  public initGridY!: number
  public occupied = false
  static options = {
    borderWidth: 2
  }

  constructor ({ initX, initY, initGridX, initGridY, occupied }: IHitboxOptions) {
    super(Hitbox.texturesCache)
    this.initGridX = initGridX
    this.initGridY = initGridY
    this.position.set(initX, initY)
    this.setOccupied(occupied)
  }

  setOccupied (occupied: boolean): void {
    this.occupied = occupied
    this.tint = occupied ? 0xff0000 : 0x00ff00
  }

  static prepareRectTexture ({ initWidth, initHeight }: { initWidth: number, initHeight: number }): void {
    const { borderWidth } = Hitbox.options
    const gr = new Graphics()
    gr.beginFill(0xffffff)
    gr.drawRect(0, 0, initWidth, initHeight)
    gr.endFill()
    gr.beginHole()
    gr.drawRect(borderWidth, borderWidth, initWidth - borderWidth * 2, initHeight - borderWidth * 2)
    gr.endHole()
    Hitbox.texturesCache = SceneManager.app.renderer.generateTexture(gr)
  }
}
