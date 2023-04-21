import { type IOrder } from './IOrder'

export enum EItemType {
  buildings = 'buildings',
  vehicles = 'vehicles',
  aircraft = 'aircraft',
  terrain = 'terrain'
}

export interface IItem {
  uid?: number
  type: EItemType
  getGridXY: () => { gridX: number, gridY: number }
  setPositionByGridXY: (options: { gridX: number, gridY: number }) => void
  processOrders: () => void
  orders: IOrder
}
