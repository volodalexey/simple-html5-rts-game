import { js } from 'easystarjs'
import { type IGridPoint } from '../interfaces/IGridPoint'
import { type IGrid } from '../interfaces/IGrid'

interface IResult {
  x: number
  y: number
}

export class Pathfinder {
  // eslint-disable-next-line new-cap
  static easystar = new js()

  static calc ({
    grid, start, end
  }: {
    grid: IGrid
    start: IGridPoint
    end: IGridPoint
  }): IResult[] {
    let result: IResult[] = []
    Pathfinder.easystar.setGrid(grid)
    Pathfinder.easystar.enableSync()
    Pathfinder.easystar.enableDiagonals()
    Pathfinder.easystar.setAcceptableTiles([0])

    Pathfinder.easystar.findPath(start.gridX, start.gridY, end.gridX, end.gridY, (path) => {
      if (Array.isArray(path)) {
        result = path
      }
    })
    Pathfinder.easystar.calculate()
    return result
  }
}
