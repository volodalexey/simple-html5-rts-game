import { type BaseActiveItem } from '../utils/helpers'
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
  tryBuild = 'try-build',
  build = 'build',
  tryConstructUnit = 'try-construct-unit',
  constructUnit = 'construct-unit',
  moveAndAttack = 'move-and-attack',
}

export type OrderTypes = `${EOrderType}`

export type IOrder = IMoveOrder | IMoveAndAttack
| IFireOrder | IAttackOrder | IPatrolOrder
| IStandOrder
| IHuntOrder | IGuardOrder | IFollowOrder
| ITryDeployOrder | IEndDeployOrder
| ITryBuildOrder | IEndBuildOrder
| ITryConstructUnitOrder | IStartConstructUnitOrder | IEndConstructUnitOrder

interface IMoveOrder {
  type: 'move'
  toPoint: IGridPointData
}

export type IToOrder = IFireOrder | IAttackOrder | IGuardOrder | IFollowOrder

export interface IFireOrder {
  type: 'fire'
  to: BaseActiveItem
}

export interface IAttackOrder {
  type: 'attack'
  to: BaseActiveItem
  nextOrder?: IOrder
}

export interface IGuardOrder {
  type: 'guard'
  to: BaseActiveItem
  nextOrder?: IOrder
}

export interface IFollowOrder {
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

interface ITryDeployOrder {
  type: 'try-deploy'
  toPoint: IGridPointData
  buildingUid?: number
}

interface IEndDeployOrder {
  type: 'end-deploy'
  toPoint: IGridPointData
  buildingUid?: number
}

interface ITryBuildOrder {
  type: 'try-build'
  toPoint: IGridPointData
  name: BuildName
  buildingUid?: number
}

interface IEndBuildOrder {
  type: 'end-build'
  toPoint: IGridPointData
  name: BuildName
  buildingUid?: number
}

interface ITryConstructUnitOrder {
  type: 'try-construct-unit'
  name: UnitName
  unitOrder?: IOrder
  unitUid?: number
}

interface IStartConstructUnitOrder {
  type: 'start-construct-unit'
  name: UnitName
  unitOrder?: IOrder
  unitUid?: number
}

interface IEndConstructUnitOrder {
  type: 'end-construct-unit'
  name: UnitName
  toPoint: IGridPointData
  unitOrder?: IOrder
  unitUid?: number
}

interface IMoveAndAttack {
  type: 'move-and-attack'
  toPoint: IGridPointData
  nextOrder?: IOrder
}
