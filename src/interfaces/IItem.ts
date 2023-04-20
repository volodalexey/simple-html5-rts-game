export enum EItemType {
  buildings = 'buildings',
  vehicles = 'vehicles',
  aircraft = 'aircraft',
  terrain = 'terrain'
}

export interface IItem {
  type: EItemType
  getGridXY: () => { gridX: number, gridY: number }
  processOrders: () => void
}
