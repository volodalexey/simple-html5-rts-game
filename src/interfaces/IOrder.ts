import { type BaseActiveItem } from '../common'
import { type EItemType } from './IItem'

export type IOrder = IMoveOrder | IFireOrder | IAttackOrder | IPatrolOrder | IStandOrder
| ISentryOrder | IHuntOrder | IGuardOrder | IFollowOrder | IDeployOrder

interface IMoveOrder {
  type: 'move'
  toPoint: IPointGridData
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
  fromPoint: IPointGridData
  toPoint: IPointGridData
}

interface IStandOrder {
  type: 'stand'
}

interface ISentryOrder {
  type: 'sentry'
}

interface IHuntOrder {
  type: 'hunt'
}

interface IGuardOrder {
  type: 'guard'
  toUid?: number
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IFollowOrder {
  type: 'follow'
  toUid?: number
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IDeployOrder {
  type: 'deploy'
  toUid?: number
  toPoint?: IPointGridData
}
