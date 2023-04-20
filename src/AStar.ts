/* Pathfinding related functions */

type IGrid = Array<Array<0 | 1>>

interface IGridPoint {
  gridX: number
  gridY: number
}

interface IResult {
  x: number
  y: number
}

interface IIter {
  x: number
  y: number
  f: number
  g: number
  v: number
}

interface IIterP extends IIter {
  p?: IIterP
}

type FindFunc = (options: {
  $N: boolean
  $S: boolean
  $E: boolean
  $W: boolean
  N: number
  S: number
  E: number
  W: number
  grid: IGrid
  rows: number
  cols: number
  result: IResult[]
  i: number
}) => IResult[]

type FindFuncParams = Parameters<FindFunc>[0]

type F1Func = Math['abs']
type F2Func = Math['max']

type DistFunc = ({ start, end, f1, f2 }: { start: IResult, end: IResult, f1: F1Func, f2: F2Func }) => number
type DistFuncParams = Parameters<DistFunc>[0]

/**
   * A* (A-Star) algorithm for a path finder
   * @author  Andrea Giammarchi
   * @license Mit Style License
   */
export abstract class AStar {
  static diagonalSuccessors ({ $N, $S, $E, $W, N, S, E, W, grid, result, i }: FindFuncParams): IResult[] {
    if ($N) {
      $E && (grid[N][E] === 0) && (result[i++] = { x: E, y: N })
      $W && (grid[N][W] === 0) && (result[i++] = { x: W, y: N })
    }
    if ($S) {
      $E && (grid[S][E] === 0) && (result[i++] = { x: E, y: S })
      $W && (grid[S][W] === 0) && (result[i++] = { x: W, y: S })
    }
    return result
  }

  static diagonalSuccessorsFree ({ $N, $S, $E, $W, N, S, E, W, grid, rows, cols, result, i }: FindFuncParams): IResult[] {
    $N = N > -1
    $S = S < rows
    $E = E < cols
    $W = W > -1
    if ($E) {
      $N && (grid[N][E] === 0) && (result[i++] = { x: E, y: N })
      $S && (grid[S][E] === 0) && (result[i++] = { x: E, y: S })
    }
    if ($W) {
      $N && (grid[N][W] === 0) && (result[i++] = { x: W, y: N })
      $S && (grid[S][W] === 0) && (result[i++] = { x: W, y: S })
    }
    return result
  }

  static nothingToDo ({ result }: FindFuncParams): IResult[] {
    return result
  }

  static successors ({
    find, x, y, grid, rows, cols
  }: {
    find: FindFunc
    x: number
    y: number
    grid: IGrid
    rows: number
    cols: number
  }): IResult[] {
    const
      N = y - 1
    const S = y + 1
    const E = x + 1
    const W = x - 1
    const $N = N > -1 && (grid[N][x] === 0)
    const $S = S < rows && (grid[S][x] === 0)
    const $E = E < cols && (grid[y][E] === 0)
    const $W = W > -1 && (grid[y][W] === 0)
    const result = []
    let i = 0

    $N && (result[i++] = { x, y: N })
    $E && (result[i++] = { x: E, y })
    $S && (result[i++] = { x, y: S })
    $W && (result[i++] = { x: W, y })
    return find({ $N, $S, $E, $W, N, S, E, W, grid, rows, cols, result, i })
  }

  static diagonal ({ start, end, f1, f2 }: DistFuncParams): number {
    return f2(f1(start.x - end.x), f1(start.y - end.y))
  }

  static euclidean ({ start, end, f2 }: DistFuncParams): number {
    const
      x = start.x - end.x
    const y = start.y - end.y

    return f2(x * x + y * y)
  }

  static manhattan ({ start, end, f1 }: DistFuncParams): number {
    return f1(start.x - end.x) + f1(start.y - end.y)
  }

  static calc ({
    grid, start, end, f
  }: {
    grid: IGrid
    start: IGridPoint
    end: IGridPoint
    f: 'Diagonal' | 'DiagonalFree' | 'Euclidean' | 'EuclideanFree'
  }): IResult[] {
    const cols = grid[0].length
    const rows = grid.length
    const limit = cols * rows
    const f1 = Math.abs
    let f2 = Math.max
    const list: Record<number, number> = {}
    const result = []
    const open: IIterP[] = [{ x: start.gridX, y: start.gridY, f: 0, g: 0, v: start.gridX + start.gridY * cols }]
    let length = 1
    let adj: IIterP; let distance: DistFunc; let find: FindFunc; let i: number; let j: number
    let max; let min; let current: IIterP | undefined; let next

    const endLocal = { x: end.gridX, y: end.gridY, v: end.gridX + end.gridY * cols }
    switch (f) {
      case 'Diagonal':
        find = AStar.diagonalSuccessors
        distance = AStar.diagonal
        break
      case 'DiagonalFree':
        find = AStar.diagonalSuccessors
        distance = AStar.diagonal
        break
      case 'Euclidean':
        f2 = Math.sqrt
        find = AStar.diagonalSuccessors
        distance = AStar.euclidean
        break
      case 'EuclideanFree':
        f2 = Math.sqrt
        find = AStar.diagonalSuccessors
        distance = AStar.euclidean
        break
      default:
        f2 = Math.sqrt
        distance = AStar.manhattan
        find = AStar.nothingToDo
        break
    }
    ;(find != null) || (find = AStar.diagonalSuccessorsFree)
    do {
      max = limit
      min = 0
      for (i = 0; i < length; ++i) {
        const f = open[i].f
        if (f < max) {
          max = f
          min = i
        }
      }
      current = open.splice(min, 1)[0]
      if (current.v !== endLocal.v) {
        --length
        next = AStar.successors({ find, x: current.x, y: current.y, grid, rows, cols })
        for (i = 0, j = next.length; i < j; ++i) {
          adj = {
            x: next[i].x,
            y: next[i].y,
            f: 0,
            g: 0,
            v: next[i].x + next[i].y * cols,
            p: current
          }
          if (!(adj.v in list)) {
            adj.f = (adj.g = current.g + distance({ start: adj, end: current, f1, f2 })) + distance({ start: adj, end: endLocal, f1, f2 })
            open[length++] = adj
            list[adj.v] = 1
          }
        }
      } else {
        i = length = 0
        do {
          result[i++] = { x: current.x, y: current.y }
        } while ((current = current.p) != null)
        result.reverse()
      }
    } while (length > 0)
    return result
  }
}
