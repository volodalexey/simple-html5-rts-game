import { AUDIO } from '../audio'
import { BaseProjectile, type IBaseProjectileOptions, type IBaseProjectileTextures } from './BaseProjectile'

export type IFireBallOptions = Pick<
IBaseProjectileOptions,
Exclude<keyof IBaseProjectileOptions, 'textures'>
>

export class Laser extends BaseProjectile {
  static textures: IBaseProjectileTextures
  static reloadTime = 30

  public speed = 60
  public range = 8
  public damage = 10

  constructor (options: IFireBallOptions) {
    super({
      ...options,
      textures: Laser.textures
    })

    AUDIO.play('laser')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IBaseProjectileTextures
  }): void {
    Laser.textures = textures
  }
}
