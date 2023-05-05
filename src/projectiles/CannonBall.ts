import { AUDIO } from '../audio'
import { EItemName } from '../interfaces/IItem'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type ICannonBallOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class CannonBall extends Projectile {
  public itemName = EItemName.CannonBall
  static textures: IProjectileTextures
  static reloadTime = 40

  public speed = 60
  public range = 15
  public damage = 20

  public collisionOptions = {
    width: 4,
    height: 4,
    offset: {
      x: 3,
      y: 3
    }
  }

  constructor (options: ICannonBallOptions) {
    super({
      ...options,
      textures: CannonBall.textures
    })

    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: true })
    AUDIO.play('cannon-ball')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IProjectileTextures
  }): void {
    CannonBall.textures = textures
  }

  playHitSound (): void {
    AUDIO.play('cannon-hit')
  }
}
