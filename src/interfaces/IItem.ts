import { type Graphics } from 'pixi.js'
import { type IOrder } from './IOrder'
import { type ECommandName } from '../interfaces/ICommand'
import { type IGridPoint } from './IGridPoint'
import { type IGridBound, type IBound } from './IBound'

export enum EItemType {
  none = 'none',
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
  SCV = 'scv',
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

export type EItemNames = `${EItemName}`

export type UnitName = EItemName.SCV | EItemName.Harvester |
EItemName.Transport | EItemName.ScoutTank | EItemName.HeavyTank |
EItemName.Chopper | EItemName.Wraith
export type BuildName = EItemName.GroundTurret | EItemName.Starport
export type ProjectileName = EItemName.Bullet | EItemName.CannonBall | EItemName.Rocket | EItemName.Laser

export interface IItem {
  uid: number
  sightRadius: number
  collisionRadius: number
  type: EItemType
  itemName: EItemName
  commands: ECommandName[]
  order: IOrder
  collisionGraphics: Graphics
  collisionOptions: {
    width: number
    height: number
    offset: {
      x: number
      y: number
    }
  }
  getGridXY: (options: { floor?: boolean, center?: boolean, air?: boolean }) => IGridPoint
  setPositionByXY: (options: { x: number, y: number, center?: boolean }) => void
  setPositionByGridXY: (options: IGridPoint & { center?: boolean }) => void
  handleUpdate: (deltaMS: number) => void
  drawCollision: () => void
  getCollisionPosition: (options: { center?: boolean, air?: boolean }) => { x: number, y: number }
  getCollisionBounds: () => IBound
  getGridCollisionBounds: () => IGridBound
  processOrders: () => boolean
}
