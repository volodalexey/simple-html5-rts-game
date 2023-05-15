export interface IGameRoom<T extends Record<string, any> = Record<string, any>> {
  status: 'empty' | 'waiting' | 'starting' | 'running'
  players: T[]
  roomId: number
  playersReady: number
}

export type IClientGameRoom = Omit<IGameRoom, 'players'>

export interface IServerToClientEvents {
  latency_ping: () => void
  room_list: ({ list }: { list: IClientGameRoom[] }) => void
  joined_room: (options: { room: IClientGameRoom }) => void
  init_level: (options: { spawnLocations: { blue: number, green: number }, level: number }) => void
  end_game: (options: { reason: string }) => void
}

export interface IClientToServerEvents {
  latency_pong: () => void
  join_room: (options: { roomId: number }) => void
  leave_room: (options: { roomId: number }) => void
}

export interface IInterServerEvents {
  ping: () => void
}

export interface ISocketData {
  name: string
  age: number
}
