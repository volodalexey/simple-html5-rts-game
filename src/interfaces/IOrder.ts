import { type BaseActiveItem } from '../common'
import { type EItemType } from './IItem'

export type IOrder = IMoveOrder | IFireOrder | IAttackOrder | IPatrolOrder | IStandOrder | ISentryOrder | IHuntOrder | IGuardOrder | IDeployOrder

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

export interface IFireOrder {
  type: 'fire'
  to: BaseActiveItem
  path?: IPath
}

interface IAttackOrder {
  type: 'attack'
  to?: BaseActiveItem
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

interface ISentryOrder {
  type: 'sentry'
  path?: IPath
  to?: IPointGridData
}

interface IHuntOrder {
  type: 'hunt'
  path?: IPath
  to?: IPointGridData
}

interface IGuardOrder {
  type: 'guard'
  toUid?: number
  path?: IPath
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IDeployOrder {
  type: 'deploy'
  toUid?: number
  path?: IPath
  to?: IPointGridData
}
