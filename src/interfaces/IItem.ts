import { type IOrder } from './IOrder'

export enum EItemType {
  buildings = 'buildings',
  vehicles = 'vehicles',
  aircraft = 'aircraft',
  terrain = 'terrain',
  bullets = 'bullets'
}

export interface IItem {
  uid?: number
  type: EItemType
  ordersable: boolean
  getGridXY: () => { gridX: number, gridY: number }
  setPositionByXY: (options: { x: number, y: number, center?: boolean }) => void
  setPositionByGridXY: (options: { gridX: number, gridY: number, center?: boolean }) => void
  handleUpdate: (deltaMS: number) => void
  orders: IOrder
}
