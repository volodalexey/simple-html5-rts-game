import { type BaseActiveItem } from '../common'
import { type UnitName, type EItemType } from './IItem'

export enum EOrderType {
  move = 'move',
  fire = 'fire',
  attack = 'attack',
  patrol = 'patrol',
  stand = 'stand',
  float = 'float',
  sentry = 'sentry',
  hunt = 'hunt',
  guard = 'guard',
  follow = 'follow',
  deploy = 'deploy',
  constructUnit = 'construct-unit',
  moveAndAttack = 'move-and-attack',
}

export type OrderTypes = `${EOrderType}`

export type IOrder = IMoveOrder | IMoveAndAttack
| IFireOrder | IAttackOrder | IPatrolOrder
| IStandOrder | IFloatOrder
| ISentryOrder | IHuntOrder | IGuardOrder | IFollowOrder | IDeployOrder | IConstructUnitOrder

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
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IGuardOrder {
  type: 'guard'
  to: BaseActiveItem
  nextOrder?: IOrder
}

interface IFollowOrder {
  type: 'follow'
  to: BaseActiveItem
  nextOrder?: IOrder
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

interface IFloatOrder {
  type: 'float'
}

interface ISentryOrder {
  type: 'sentry'
}

interface IHuntOrder {
  type: 'hunt'
}

interface IDeployOrder {
  type: 'deploy'
  toPoint: IPointGridData
}

interface IConstructUnitOrder {
  type: 'construct-unit'
  name: UnitName
  orders?: IOrder
}

interface IMoveAndAttack {
  type: 'move-and-attack'
  toPoint: IPointGridData
  nextOrder?: IOrder
}
