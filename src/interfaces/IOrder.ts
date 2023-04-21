import { type BaseItem } from '../common'
import { type EItemType } from './IItem'

export type IOrder = IMoveOrder | IAttackOrder | IPatrolOrder | IStandOrder | IGuardOrder | IDeployOrder

type IPath = Array<{
  x: number
  y: number
}>

interface IMoveOrder {
  type: 'move'
  to: IPointGridData
  path?: IPath
  collisionCount: number
}

interface IAttackOrder {
  type: 'attack'
  to?: BaseItem
  nextOrder?: IOrder
  path?: IPath
  toUid?: number
}

export interface IPointGridData {
  gridX: number
  gridY: number
  type?: EItemType
}

interface IPatrolOrder {
  type: 'patrol'
  from: IPointGridData
  to: IPointGridData
  path?: IPath
}

interface IStandOrder {
  type: 'stand'
  path?: IPath
}

interface IGuardOrder {
  type: 'guard'
  toUid?: number
  path?: IPath
  to?: IPointGridData
}

interface IDeployOrder {
  type: 'deploy'
  toUid?: number
  path?: IPath
  to?: IPointGridData
}
