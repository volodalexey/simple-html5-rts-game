import { AUDIO } from '../audio'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type IBulletOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class Bullet extends Projectile {
  static textures: IProjectileTextures
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
    textures: IProjectileTextures
  }): void {
    Bullet.textures = textures
  }

  playHitSound (): void {
    AUDIO.play('bullet-hit')
  }
}
