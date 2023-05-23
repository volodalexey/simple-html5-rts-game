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
  approachAndAttack = 'approach-and-attack',
}

export type OrderTypes = `${EOrderType}`

export type IOrder = IMoveOrder | IMoveAndAttack | IApproachAndAttack
| IFireOrder | IAttackOrder | IPatrolOrder
| IStandOrder
| IHuntOrder | IGuardOrder | IFollowOrder
| ITryDeployOrder | IEndDeployOrder
| ITryBuildOrder | IEndBuildOrder
| ITryConstructUnitOrder | IStartConstructUnitOrder | IEndConstructUnitOrder

interface IMoveOrder {
  type: 'move'
  toPoint: IGridPointData
  processed?: boolean
}

export type IToOrder = IFireOrder | IAttackOrder | IGuardOrder | IFollowOrder

export interface IFireOrder {
  type: 'fire'
  to: BaseActiveItem
  processed?: boolean
}

export interface IAttackOrder {
  type: 'attack'
  to: BaseActiveItem
  nextOrder?: IOrder
  processed?: boolean
}

export interface IGuardOrder {
  type: 'guard'
  to: BaseActiveItem
  nextOrder?: IOrder
  processed?: boolean
}

export interface IFollowOrder {
  type: 'follow'
  to: BaseActiveItem
  nextOrder?: IOrder
  processed?: boolean
}

export interface IGridPointData extends IGridPoint {
  type?: EItemType
}

interface IPatrolOrder {
  type: 'patrol'
  fromPoint: IGridPointData
  toPoint: IGridPointData
  processed?: boolean
}

interface IStandOrder {
  type: 'stand'
  processed?: boolean
}

interface IHuntOrder {
  type: 'hunt'
  processed?: boolean
}

interface ITryDeployOrder {
  type: 'try-deploy'
  toPoint: IGridPointData
  buildingUid?: number
  processed?: boolean
}

interface IEndDeployOrder {
  type: 'end-deploy'
  toPoint: IGridPointData
  buildingUid?: number
  processed?: boolean
}

interface ITryBuildOrder {
  type: 'try-build'
  toPoint: IGridPointData
  name: BuildName
  buildingUid?: number
  processed?: boolean
}

interface IEndBuildOrder {
  type: 'end-build'
  toPoint: IGridPointData
  name: BuildName
  buildingUid?: number
  processed?: boolean
}

interface ITryConstructUnitOrder {
  type: 'try-construct-unit'
  name: UnitName
  unitOrder?: IOrder
  unitUid?: number
  processed?: boolean
}

interface IStartConstructUnitOrder {
  type: 'start-construct-unit'
  name: UnitName
  unitOrder?: IOrder
  unitUid?: number
  processed?: boolean
}

interface IEndConstructUnitOrder {
  type: 'end-construct-unit'
  name: UnitName
  toPoint: IGridPointData
  unitOrder?: IOrder
  unitUid?: number
  processed?: boolean
}

interface IMoveAndAttack {
  type: 'move-and-attack'
  toPoint: IGridPointData
  nextOrder?: IOrder
  processed?: boolean
}

interface IApproachAndAttack {
  type: 'approach-and-attack'
  toPoint: IGridPointData
  nextOrder?: IOrder
  processed?: boolean
}
