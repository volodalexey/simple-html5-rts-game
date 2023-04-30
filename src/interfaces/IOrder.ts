import { type BaseActiveItem } from '../common'
import { type EItemType } from './IItem'

export type IOrder = IMoveOrder | IFireOrder | IAttackOrder | IPatrolOrder | IStandOrder | ISentryOrder | IHuntOrder | IGuardOrder | IDeployOrder

interface IMoveOrder {
  type: 'move'
  to: IPointGridData
  collisionCount: number
}

export interface IFireOrder {
  type: 'fire'
  to: BaseActiveItem
}

interface IAttackOrder {
  type: 'attack'
  to?: BaseActiveItem
  nextOrder?: IOrder
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
}

interface IStandOrder {
  type: 'stand'
}

interface ISentryOrder {
  type: 'sentry'
  to?: IPointGridData
}

interface IHuntOrder {
  type: 'hunt'
  to?: IPointGridData
}

interface IGuardOrder {
  type: 'guard'
  toUid?: number
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IDeployOrder {
  type: 'deploy'
  toUid?: number
  to?: IPointGridData
}
