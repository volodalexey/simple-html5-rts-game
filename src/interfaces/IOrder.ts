import { type BaseItem } from '../common'
import { type EItemType } from './IItem'

export type IOrder = IAttackOrder | IPatrolOrder | IStandOrder

interface IAttackOrder {
  type: 'attack'
  to: BaseItem
  nextOrder?: IOrder
  path?: Array<{
    x: number
    y: number
  }>
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
  path?: Array<{
    x: number
    y: number
  }>
}

interface IStandOrder {
  type: 'stand'
  path?: Array<{
    x: number
    y: number
  }>
}
