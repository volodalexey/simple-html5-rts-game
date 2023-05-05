import { type Graphics } from 'pixi.js'
import { type IOrder } from './IOrder'
import { type ECommandName } from '../Command'

export enum EItemType {
  buildings = 'buildings',
  vehicles = 'vehicles',
  airVehicles = 'airVehicles',
  terrain = 'terrain',
  projectiles = 'projectiles'
}

export enum EItemName {
  None = 'none',
  Base = 'base',
  OilDerrick = 'oil-derrick',
  Starport = 'starport',
  GroundTurret = 'ground-turret',
  Harvester = 'harvester',
  Transport = 'transport',
  ScoutTank = 'scout-tank',
  HeavyTank = 'heavy-tank',
  Chopper = 'chopper',
  Wraith = 'wraith',
  Bullet = 'bullet',
  CannonBall = 'cannon-ball',
  Rocket = 'heatseeker',
  Laser = 'laser',
}

export type UnitName = EItemName.Harvester | EItemName.Transport | EItemName.ScoutTank | EItemName.HeavyTank
export type ProjectileName = EItemName.Bullet | EItemName.CannonBall | EItemName.Rocket | EItemName.Laser

export interface IItem {
  uid: number
  sight: number
  type: EItemType
  itemName: EItemName
  ordersable: boolean
  commands: ECommandName[]
  getGridXY: (options: { floor?: boolean, center?: boolean, air?: boolean }) => { gridX: number, gridY: number }
  setPositionByXY: (options: { x: number, y: number, center?: boolean }) => void
  setPositionByGridXY: (options: { gridX: number, gridY: number, center?: boolean }) => void
  handleUpdate: (deltaMS: number) => void
  orders: IOrder
  collisionGraphics: Graphics
  collisionOptions: {
    width: number
    height: number
    offset: {
      x: number
      y: number
    }
  }
  drawCollision: () => void
  getCollisionPosition: (options: { center?: boolean, air?: boolean }) => { x: number, y: number }
  getCollisionBounds: () => { top: number, right: number, bottom: number, left: number }
  getGridCollisionBounds: () => { topGridY: number, rightGridX: number, bottomGridY: number, leftGridX: number }
}
