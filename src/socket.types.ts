export interface IGameRoom {
  status: 'empty'
  players: number[]
  roomId: number
}

export type IGameRoomRes = Omit<IGameRoom, 'players'>

export interface ServerToClientEvents {
  latency_ping: () => void
  room_list: ({ list }: { list: IGameRoomRes[] }) => void
}

export interface ClientToServerEvents {
  latency_pong: () => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  name: string
  age: number
}
