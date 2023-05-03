import { AUDIO } from '../audio'
import { EItemName } from '../interfaces/IItem'
import { Projectile, type IProjectileOptions, type IProjectileTextures } from './Projectile'

export type IFireBallOptions = Pick<
IProjectileOptions,
Exclude<keyof IProjectileOptions, 'textures'>
>

export class Laser extends Projectile {
  public itemName = EItemName.Laser
  static textures: IProjectileTextures
  static reloadTime = 30

  public speed = 60
  public range = 8
  public damage = 10

  constructor (options: IFireBallOptions) {
    super({
      ...options,
      textures: Laser.textures
    })

    this.drawCollision()
    this.setPositionByXY({ x: options.initX, y: options.initY, center: true })
    AUDIO.play('laser')
  }

  static prepareTextures ({
    textures
  }: {
    textures: IProjectileTextures
  }): void {
    Laser.textures = textures
  }
}
