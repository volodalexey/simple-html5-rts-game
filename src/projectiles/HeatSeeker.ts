import { AUDIO } from '../audio'
import { BaseProjectile, type IBaseProjectileOptions, type IBaseProjectileTextures } from './BaseProjectile'

export type IHeatSeekerOptions = Pick<
IBaseProjectileOptions,
Exclude<keyof IBaseProjectileOptions, 'textures'>
>

export class Rocket extends BaseProjectile {
  static textures: IBaseProjectileTextures
  static reloadTime = 40

  public speed = 25
  public range = 9
  public damage = 20
  public turnSpeed = 2

  constructor (options: IHeatSeekerOptions) {
    super({
      ...options,
      textures: Rocket.textures
    })

    AUDIO.play('rocket')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IBaseProjectileTextures
  }): void {
    Rocket.textures = textures
  }
}
