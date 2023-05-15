import { type BaseActiveItem } from '../utils/common'
import { type IGridPoint } from './IGridPoint'
import { type UnitName, type EItemType, type BuildName } from './IItem'

export enum EOrderType {
  move = 'move',
  fire = 'fire',
  attack = 'attack',
  patrol = 'patrol',
  stand = 'stand',
  hunt = 'hunt',
  guard = 'guard',
  follow = 'follow',
  deploy = 'deploy',
  build = 'build',
  constructUnit = 'construct-unit',
  moveAndAttack = 'move-and-attack',
}

export type OrderTypes = `${EOrderType}`

export type IOrder = IMoveOrder | IMoveAndAttack
| IFireOrder | IAttackOrder | IPatrolOrder
| IStandOrder
| IHuntOrder | IGuardOrder | IFollowOrder
| IDeployOrder | IBuildOrder
| IConstructUnitOrder

interface IMoveOrder {
  type: 'move'
  toPoint: IGridPointData
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

export interface IGridPointData extends IGridPoint {
  type?: EItemType
}

interface IPatrolOrder {
  type: 'patrol'
  fromPoint: IGridPointData
  toPoint: IGridPointData
}

interface IStandOrder {
  type: 'stand'
}

interface IHuntOrder {
  type: 'hunt'
}

interface IDeployOrder {
  type: 'deploy'
  toPoint: IGridPointData
}

interface IBuildOrder {
  type: 'build'
  toPoint: IGridPointData
  name: BuildName
}

interface IConstructUnitOrder {
  type: 'construct-unit'
  name: UnitName
  unitOrder?: IOrder
  unitUid?: number
}

interface IMoveAndAttack {
  type: 'move-and-attack'
  toPoint: IGridPointData
  nextOrder?: IOrder
}
