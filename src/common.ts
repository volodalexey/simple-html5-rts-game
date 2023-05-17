export interface IGameRoom<T extends Record<string, any> = Record<string, any>> {
  status: 'empty' | 'waiting' | 'starting' | 'running'
  players: T[]
  roomId: number
  playersReady: number
}

export type IClientGameRoom = Omit<IGameRoom, 'players' | 'playersReady'>

export interface IServerToClientEvents {
  latency_ping: () => void
  room_list: ({ list }: { list: IClientGameRoom[], playerId: string }) => void
  joined_room: (options: { room: IClientGameRoom }) => void
  init_level: (options: { spawnLocations: { blue: number, green: number }, players: { blue: string, green: string } }) => void
  end_game: (options: { wonPlayerId: string, reason: string }) => void
  start_game: () => void
  game_tick: (options: { tick: number, orders: ISendOrder[] }) => void
  chat_message: (options: { playerId: string, message: string }) => void
}

export interface ISendOrder {
  uids: number[]
  order: IServerOrder
}

export interface IClientToServerEvents {
  latency_pong: () => void
  join_room: (options: { roomId: number }) => void
  leave_room: (options: { roomId: number }) => void
  initialized_level: () => void
  tick_orders: (options: { currentTick: number, orders?: ISendOrder[] }) => void
  lose_game: () => void
  chat_message: (options: { playerId: string, message: string }) => void
}

export interface IInterServerEvents {
  ping: () => void
}

export interface ISocketData {
  name: string
  age: number
}

interface IServerGridPoint {
  gridX: number
  gridY: number
}

export interface IServerGridPointData extends IServerGridPoint {
  type?: string
}

export type IServerOrder = IServerMoveOrder | IServerMoveAndAttack
| IServerFireOrder | IServerAttackOrder | IServerPatrolOrder
| IServerStandOrder
| IServerHuntOrder | IServerGuardOrder | IServerFollowOrder
| IServerTryDeployOrder | IServerEndDeployOrder
| IServerTryBuildOrder | IServerEndBuildOrder
| IServerTryConstructUnitOrder | IServerStartConstructUnitOrder | IServerEndConstructUnitOrder

interface IServerMoveOrder {
  type: 'move'
  toPoint: IServerGridPointData
}

interface IServerFireOrder {
  type: 'fire'
  toUid: number
}

interface IServerAttackOrder {
  type: 'attack'
  toUid: number
  nextOrder?: IServerOrder
}

interface IServerGuardOrder {
  type: 'guard'
  toUid: number
  nextOrder?: IServerOrder
}

interface IServerFollowOrder {
  type: 'follow'
  toUid: number
  nextOrder?: IServerOrder
}

interface IServerPatrolOrder {
  type: 'patrol'
  fromPoint: IServerGridPointData
  toPoint: IServerGridPointData
}

interface IServerStandOrder {
  type: 'stand'
}

interface IServerHuntOrder {
  type: 'hunt'
}

interface IServerTryDeployOrder {
  type: 'try-deploy'
  toPoint: IServerGridPointData
  buildingUid?: number
}

interface IServerEndDeployOrder {
  type: 'end-deploy'
  toPoint: IServerGridPointData
  buildingUid?: number
}

interface IServerTryBuildOrder {
  type: 'try-build'
  toPoint: IServerGridPointData
  name: string
  buildingUid?: number
}

interface IServerEndBuildOrder {
  type: 'end-build'
  toPoint: IServerGridPointData
  name: string
  buildingUid?: number
}

interface IServerTryConstructUnitOrder {
  type: 'try-construct-unit'
  name: string
  unitOrder?: IServerOrder
  unitUid?: number
}

interface IServerStartConstructUnitOrder {
  type: 'start-construct-unit'
  name: string
  unitOrder?: IServerOrder
  unitUid?: number
}

interface IServerEndConstructUnitOrder {
  type: 'end-construct-unit'
  name: string
  toPoint: IServerGridPointData
  unitOrder?: IServerOrder
  unitUid?: number
}

interface IServerMoveAndAttack {
  type: 'move-and-attack'
  toPoint: IServerGridPointData
  nextOrder?: IServerOrder
}

export function printObject (obj: any): string {
  const type = typeof obj
  if (Array.isArray(obj)) {
    return `[${obj.map((i) => printObject(i)).join(', ')}]`
  } else if (obj !== null && type === 'object') {
    return JSON.stringify(obj)
  } else if (obj === null) {
    return 'null'
  } else if (obj === true) {
    return 'true'
  } else if (obj === false) {
    return 'false'
  } else if (type === 'string') {
    return obj
  } else if (type === 'number') {
    return obj
  } else {
    return `${type} ${obj}`
  }
}
