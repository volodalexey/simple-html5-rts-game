import { AUDIO } from '../audio'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type ICannonBallOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class CannonBall extends Projectile {
  static textures: IProjectileTextures
  static reloadTime = 40

  public speed = 60
  public range = 15
  public damage = 20

  constructor (options: ICannonBallOptions) {
    super({
      ...options,
      textures: CannonBall.textures
    })

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
    AUDIO.cannonHit.play()
  }
}
