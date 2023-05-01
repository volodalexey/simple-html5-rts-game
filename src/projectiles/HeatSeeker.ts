import { AUDIO } from '../audio'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type IHeatSeekerOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class Rocket extends Projectile {
  static textures: IProjectileTextures
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
    textures: IProjectileTextures
  }): void {
    Rocket.textures = textures
  }
}
