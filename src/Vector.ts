export enum EVectorDirection {
  up = 0,
  upRight = 1,
  right = 2,
  downRight = 3,
  down = 4,
  downLeft = 5,
  left = 6,
  upLeft = 7,
}

interface IVectorOptions {
  direction: EVectorDirection
  speed: number
}

export class Vector {
  public direction!: EVectorDirection
  public directions = Object.keys(EVectorDirection).map(Number).filter(Number.isInteger).length
  constructor (options: IVectorOptions) {
    this.setDirection(options)
  }

  setDirection ({ direction }: IVectorOptions): void {
    this.direction = direction
  }
}
