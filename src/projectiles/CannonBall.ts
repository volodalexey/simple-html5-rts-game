import { AUDIO } from '../audio'
import { BaseProjectile, type IBaseProjectileOptions, type IBaseProjectileTextures } from './BaseProjectile'

export type ICannonBallOptions = Pick<
IBaseProjectileOptions,
Exclude<keyof IBaseProjectileOptions, 'textures'>
>

export class CannonBall extends BaseProjectile {
  static textures: IBaseProjectileTextures
  static reloadTime = 40

  public speed = 60
  public range = 6
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
    textures: IBaseProjectileTextures
  }): void {
    CannonBall.textures = textures
  }

  playHitSound (): void {
    AUDIO.cannonHit.play()
  }
}
