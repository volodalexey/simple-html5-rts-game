import { Graphics, Sprite, type Texture } from 'pixi.js'

interface IParticleOptions {
  texture: Texture
}

class Particle extends Sprite {
  public markedForDeletion = false

  public velocity = {
    vx: 0,
    vy: 0
  }

  constructor ({ texture }: IParticleOptions) {
    super(texture)
  }

  handleUpdate (): void {
    this.x -= this.velocity.vx
    this.y -= this.velocity.vy
    this.alpha *= 0.99
    if (this.alpha < 0.1) {
      this.markedForDeletion = true
    }
  }
}

interface ISplashTextures {
  texture: Texture
}

export class Firework extends Particle {
  static textures: ISplashTextures

  static prepareTextures ({
    textures
  }: {
    textures: ISplashTextures
  }): void {
    Firework.textures = textures
  }

  static options = {
    gravity: 0.08,
    renderRadius: 100
  }

  constructor () {
    super({ texture: Firework.textures.texture })
    this.width = this.height = Math.random() * 10 + 10
    this.velocity.vx = Math.random() * 10 - 5
    this.velocity.vy = Math.random() * 2 + 1

    this.tint = (Math.random() * 0xFFFFFF << 0)
  }

  handleUpdate (): void {
    this.velocity.vy -= Firework.options.gravity
    super.handleUpdate()
  }

  static prepareGraphics (): Graphics {
    const graphics = new Graphics()
    graphics.beginFill(0xffffff)
    graphics.drawCircle(0, 0, Firework.options.renderRadius)
    graphics.endFill()
    graphics.cacheAsBitmap = true
    return graphics
  }
}
