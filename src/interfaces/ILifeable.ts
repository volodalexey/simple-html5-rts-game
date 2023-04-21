
export interface ILifeable {
  life: number
  hitPoints: number
  // drawLifeBarOptions: {
  //   width: number
  //   height: number
  //   lineWidth: number
  //   lineColor: number
  //   strokeWidth: number
  //   strokeColor: number
  //   offset: {
  //     x: number
  //     y: number
  //   }
  // }

  // selectedGraphics: Graphics

  isAlive: () => boolean
  isDead: () => boolean
}
