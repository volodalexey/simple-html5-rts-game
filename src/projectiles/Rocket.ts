import { AUDIO } from '../audio'
import { EItemName } from '../interfaces/IItem'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type IHeatSeekerOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class Rocket extends Projectile {
  public itemName = EItemName.Rocket
  static textures: IProjectileTextures
  static reloadTime = 40

  public speed = 25
  public range = 9
  public damage = 20
  public turnSpeed = 2

  public collisionOptions = {
    width: 5,
    height: 5,
    offset: {
      x: 3,
      y: 3
    }
  }

  constructor (options: IHeatSeekerOptions) {
    super({
      ...options,
      textures: Rocket.textures
    })

    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: true })
    AUDIO.play('rocket')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IProjectileTextures
  }): void {
    Rocket.textures = textures
  }

  playHitSound (): void {
    AUDIO.play('rocket-hit')
  }
}
