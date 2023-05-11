import { type Container, Graphics, Sprite, type Texture } from 'pixi.js'

export class Hitbox extends Sprite {
  static prepareGraphics ({ tileWidth, tileHeight, borderWidth, mapGridHeight, mapGridWidth }:
  { tileWidth: number, tileHeight: number, borderWidth: number, mapGridHeight: number, mapGridWidth: number }): Graphics {
    const graphics = new Graphics()
    graphics.beginFill(0xffffff)
    graphics.drawRect(0, 0, tileWidth, tileHeight)
    graphics.endFill()
    graphics.beginHole()
    graphics.drawRect(borderWidth, borderWidth, tileWidth - borderWidth * 2, tileHeight - borderWidth * 2)
    graphics.endHole()
    return graphics
  }

  static cacheTexture: Texture
  public initGridX: number
  public initGridY: number

  constructor ({ initGridX, initGridY }: { initGridX: number, initGridY: number }) {
    super(Hitbox.cacheTexture)
    this.initGridX = initGridX
    this.initGridY = initGridY
  }

  static prepareTextures ({
    texture
  }: {
    texture: Texture
  }): void {
    Hitbox.cacheTexture = texture
  }

  static updateColor ({
    currentMapGrid,
    hitboxes
  }: {
    currentMapGrid: Array<Array<1 | 0>>
    hitboxes: Container<Hitbox>
  }): void {
    hitboxes.children.forEach(hitbox => {
      hitbox.tint = currentMapGrid[hitbox.initGridY][hitbox.initGridX] === 1 ? 0xff0000 : 0x00ff00
    })
  }
}
