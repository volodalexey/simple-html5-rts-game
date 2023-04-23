import { AUDIO } from '../audio'
import { BaseProjectile, type IBaseProjectileOptions, type IBaseProjectileTextures } from './BaseProjectile'

export type IBulletOptions = Pick<
IBaseProjectileOptions,
Exclude<keyof IBaseProjectileOptions, 'textures'>
>

export class Bullet extends BaseProjectile {
  static textures: IBaseProjectileTextures
  static reloadTime = 2
  static shootAudio = ''

  public speed = 50
  public range = 5
  public damage = 1

  constructor (options: IBulletOptions) {
    super({
      ...options,
      textures: Bullet.textures
    })

    AUDIO.play('bullet')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IBaseProjectileTextures
  }): void {
    Bullet.textures = textures
  }

  playHitSound (): void {
    AUDIO.bulletHit.play()
  }
}
