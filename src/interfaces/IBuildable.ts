import { type IGridPoint } from './IGridPoint'

export interface IBuildable {
  buildableGrid: number[][]
  passableGrid: number[][]
  calcPassablePoints: ({ gridX, gridY }: IGridPoint) => IGridPoint[]
  calcBuildablePoints: ({ gridX, gridY }: IGridPoint) => IGridPoint[]
}

export function calcPassablePoints ({ gridX, gridY, passableGrid }: IGridPoint & { passableGrid: number[][] }): IGridPoint[] {
  const ret = []
  for (let y = 0; y < passableGrid.length; y++) {
    for (let x = 0; x < passableGrid[y].length; x++) {
      if (passableGrid[y][x] === 1) {
        ret.push({ gridX: gridX + x, gridY: gridY + y })
      }
    }
  }
  return ret
}

export function calcBuildablePoints ({ gridX, gridY, buildableGrid }: IGridPoint & { buildableGrid: number[][] }): IGridPoint[] {
  const ret = []
  for (let y = 0; y < buildableGrid.length; y++) {
    for (let x = 0; x < buildableGrid[y].length; x++) {
      if (buildableGrid[y][x] === 1) {
        ret.push({ gridX: gridX + x, gridY: gridY + y })
      }
    }
  }
  return ret
}
