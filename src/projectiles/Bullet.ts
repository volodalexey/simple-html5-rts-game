import { AUDIO } from '../audio'
import { EItemName } from '../interfaces/IItem'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type IBulletOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class Bullet extends Projectile {
  public itemName = EItemName.Bullet
  static textures: IProjectileTextures
  static reloadTime = 2
  static shootAudio = ''

  public speed = 50
  public distanceTolive = 10
  public damage = 1

  public collisionOptions = {
    width: 4,
    height: 4,
    offset: {
      x: 3,
      y: 4
    }
  }

  constructor (options: IBulletOptions) {
    super({
      ...options,
      textures: Bullet.textures
    })

    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: true })
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
