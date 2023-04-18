export enum EVectorDirection {
  up = 'up', // 0
  upRight = 'upRight', // 1
  right = 'right', // 2
  downRight = 'downRight', // 3
  down = 'down', // 4
  downLeft = 'downLeft', // 5
  left = 'left', // 6
  upLeft = 'upLeft', // 7
}

interface IVectorOptions {
  direction: EVectorDirection
  speed: number
}

export class Vector {
  public direction!: EVectorDirection
  public speed!: number
  public x!: number
  public y!: number
  constructor (options: IVectorOptions) {
    this.setDirection(options)
  }

  setDirection ({ direction, speed }: IVectorOptions): void {
    this.direction = direction
    this.speed = speed
    this.x = 0
    this.y = 0
    switch (direction) {
      case EVectorDirection.up:
        this.y = -speed
        break

      case EVectorDirection.down:
        this.y = speed
        break

      case EVectorDirection.right:
        this.x = speed
        break

      case EVectorDirection.left:
        this.x = -speed
        break
    }
  }

  move ({ object, dt }: { object: { x: number, y: number }, dt: number }): void {
    object.x += dt * (this.x / 1000)
    object.y += dt * (this.y / 1000)
  }

  stop (): void {
    this.x = 0
    this.y = 0
  }
}
