
import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import {
  type IGameRoom,
  type IClientToServerEvents,
  type IInterServerEvents,
  type IServerToClientEvents,
  type ISocketData,
  type IClientGameRoom,
  type ISendOrder,
  printObject
} from './common'
import debug from 'debug'
import express from 'express'

const logServer = debug('rts-srv')
const logLatency = debug('rts-srv-latency')
const logRooms = debug('rts-srv-rooms')
const logGame = debug('rts-srv-game')
const logWebsocket = debug('rts-srv-websocket')

const TIMEOUT = 16

interface ILatency {
  start: number
  end?: number
  roundTrip?: number
}

interface IPlayer {
  socket: Socket<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>
  averageLatency: number
  tickLag: number
  latencyTrips: ILatency[]
  room?: IServerGameRoom
  color?: 'blue' | 'green'
}

type IServerGameRoom = IGameRoom<IPlayer> & {
  orders: ISendOrder[]
  lastTickConfirmed: { blue: number, green: number }
  currentTick: number
  timeout?: NodeJS.Timeout
}

const app = express()
const httpServer = createServer(app)
const io = new Server<
IClientToServerEvents,
IServerToClientEvents,
IInterServerEvents,
ISocketData
>(httpServer, {
  cors: {
    origin: '*'
  }
})

app.use('/', express.static('./dist/'))

const port = typeof process.env.PORT === 'string' ? Number(process.env.PORT) : 8879

httpServer.listen(port)
httpServer.on('listening', () => {
  logServer(`Server has started listening on port ${port}`)
})

const players: IPlayer[] = []

io.on('connection', socket => {
  logWebsocket(`Client connection [${socket.id}] ${socket.client.conn.remoteAddress}`)

  const player: IPlayer = {
    socket,
    averageLatency: 0,
    tickLag: 0,
    latencyTrips: []
  }
  // Add the player to the players array

  players.push(player)

  // Measure latency for player
  measureLatency(player)

  // Send a fresh game room status list the first time player connects
  sendRoomsList(player)

  player.socket.on('join_room', ({ roomId }) => {
    logWebsocket(`Join room [${socket.id}] ${roomId}`)
    const room = joinRoom(player, roomId)
    sendRoomListToEveryone()
    if (room.players.length === 2) {
      initGame(room)
    }
  })

  player.socket.on('leave_room', ({ roomId }) => {
    logWebsocket(`Leave room [${socket.id}] ${roomId}`)
    leaveRoom(player, roomId)
    sendRoomListToEveryone()
  })

  player.socket.once('disconnect', (err) => {
    logWebsocket(`Disconnected [${socket.id}] ${socket.client.conn.remoteAddress}`, err)

    for (let i = players.length - 1; i >= 0; i--) {
      if (players[i] === player) {
        players.splice(i, 1)
      }
    };

    // If the player is in a room, remove him from room and notify everyone
    if (player.room != null) {
      const { status, roomId } = player.room
      // If the game was running, end the game as well
      if (status === 'running') {
        endGame(player.room, `The ${player.color} player has disconnected.`)
      } else {
        leaveRoom(player, roomId)
      }
      sendRoomListToEveryone()
    }
  })

  player.socket.once('error', (err) => {
    logWebsocket(`Error [${socket.id}] ${socket.client.conn.remoteAddress}`, err)

    for (let i = players.length - 1; i >= 0; i--) {
      if (players[i] === player) {
        players.splice(i, 1)
      }
    };

    // If the player is in a room, remove him from room and notify everyone
    if (player.room != null) {
      const { status, roomId } = player.room
      // If the game was running, end the game as well
      if (status === 'running') {
        endGame(player.room, `The ${player.color} player has error.`)
      } else {
        leaveRoom(player, roomId)
      }
      sendRoomListToEveryone()
    }
  })

  player.socket.once('initialized_level', () => {
    logWebsocket(`initialized_level [${socket.id}]`)
    if (player.room != null) {
      player.room.playersReady++
      if (player.room.playersReady === 2) {
        startGame(player.room)
      }
    }
  })
})

// Initialize a set of rooms
const gameRooms: IServerGameRoom[] = []
for (let i = 0; i < 9; i++) {
  gameRooms.push({
    status: 'empty',
    players: [],
    roomId: i + 1,
    playersReady: 0,
    orders: [],
    lastTickConfirmed: { blue: 0, green: 0 },
    currentTick: 0
  })
};

function joinRoom (player: IPlayer, roomId: IServerGameRoom['roomId']): IServerGameRoom {
  const room = gameRooms[roomId - 1]
  const alreadyJoinedRoom = gameRooms.find(gr => gr.players.includes(player))
  if (alreadyJoinedRoom != null) {
    if (alreadyJoinedRoom.roomId === roomId) {
      logRooms(`Attempt to join the same room room ${roomId}`)
      return alreadyJoinedRoom
    } else {
      logRooms(`Attempt to join anohter room ${roomId}, while participating in ${alreadyJoinedRoom.roomId}`)
      alreadyJoinedRoom.players = alreadyJoinedRoom.players.filter(p => p !== player)
      alreadyJoinedRoom.status = alreadyJoinedRoom.players.length > 0 ? 'waiting' : 'empty'
    }
  }
  logRooms(`Adding player [${player.socket.id}] to room ${roomId}`)
  // Add the player to the room
  room.players.push(player)
  player.room = room
  // Update room status
  if (room.players.length === 1) {
    room.status = 'waiting'
    player.color = 'blue'
  } else if (room.players.length === 2) {
    room.status = 'starting'
    player.color = 'green'
  } else {
    logRooms(`Could not detect room players ${room.roomId}`)
  }
  // Confirm to player that he was added
  if (player.color != null) {
    const params = { room: castGameRoom(room) }
    if (logWebsocket.enabled) {
      logWebsocket(`joined_room ${printObject(params)}`)
    }
    player.socket.emit('joined_room', params)
  }
  return room
}

function leaveRoom (player: IPlayer, roomId: IGameRoom['roomId']): void {
  const room = gameRooms[roomId - 1]
  logRooms(`Removing player [${player.socket.id}] from room ${roomId}`)

  for (let i = room.players.length - 1; i >= 0; i--) {
    if (room.players[i] === player) {
      room.players.splice(i, 1)
    }
  };
  delete player.room
  // Update room status
  if (room.players.length === 0) {
    room.status = 'empty'
  } else if (room.players.length === 1) {
    room.status = 'waiting'
  }
}

function castGameRoom (room: IServerGameRoom): IClientGameRoom {
  return { status: room.status, roomId: room.roomId }
}

function prepareRoomsList (): IClientGameRoom[] {
  const list: IClientGameRoom[] = []
  for (const gameRoom of gameRooms) {
    list.push(castGameRoom(gameRoom))
  };
  logRooms(`prepareRoomsList() [${list.map(r => `id=${r.roomId} status=${r.status}`).join(', ')}]`)
  return list
}

function sendRoomListToEveryone (): void {
  // Notify all connected players of the room status changes
  const roomsList = prepareRoomsList()
  for (const player of players) {
    const params = { list: roomsList, playerId: player.socket.id }
    if (logWebsocket.enabled) {
      logWebsocket(`room_list ${printObject(params)}`)
    }
    player.socket.emit('room_list', params)
  };
}

function initGame (room: IServerGameRoom): void {
  logGame(`Both players [${room.players.map(p => p.socket.id).join(', ')}] joined. Initializing game for Room ${room.roomId}`)

  // Number of players who have loaded the level
  room.playersReady = 0

  // Randomly select two spawn locations between 0 and 3 for both players.
  let spawns = [0, 1]
  const blueSpawn = spawns[Math.floor(Math.random() * spawns.length)]
  spawns = spawns.filter(spawn => spawn !== blueSpawn)
  const greenSpawn = spawns[Math.floor(Math.random() * spawns.length)]
  let players = room.players.map(p => p.socket.id)
  const bluePlayer = players[Math.floor(Math.random() * players.length)]
  players = players.filter(player => player !== bluePlayer)
  const greenPlayer = players[Math.floor(Math.random() * players.length)]

  sendRoomWebSocketMessage(room, 'init_level', [{
    spawnLocations: { blue: blueSpawn, green: greenSpawn }, players: { blue: bluePlayer, green: greenPlayer }
  }])
}

function startGame (room: IServerGameRoom): void {
  logGame(`Both players [${players.map(p => p.socket.id).join(', ')}] are ready. Starting game in room ${room.roomId}`)
  room.status = 'running'
  sendRoomListToEveryone()
  // Notify players to start the game
  sendRoomWebSocketMessage(room, 'start_game', [])

  room.orders = []
  room.lastTickConfirmed = { blue: 0, green: 0 }
  room.currentTick = 0

  // Calculate tick lag for room as the max of both player's tick lags
  const roomTickLag = Math.max(room.players[0].tickLag, room.players[1].tickLag)

  const serverTick = (): void => {
    if (room.status !== 'running') {
      logGame('Skip tick, room status is not running')
      return
    }
    // schedule next tick
    room.timeout = setTimeout(serverTick, TIMEOUT)
    // Confirm that both players have send in commands for upto present tick
    if (room.lastTickConfirmed.blue >= room.currentTick && room.lastTickConfirmed.green >= room.currentTick) {
      // Commands should be executed after the tick lag
      sendRoomWebSocketMessage(room, 'game_tick', [{ tick: room.currentTick + roomTickLag, orders: room.orders }])
      room.currentTick++
      room.orders = []
    } else {
      // One of the players is causing the game to lag. Handle appropriately
      if (room.lastTickConfirmed.blue < room.currentTick) {
        logGame(`Room ${room.roomId} Blue is lagging on Tick: ${room.currentTick} by ${room.currentTick - room.lastTickConfirmed.blue} blue=${room.lastTickConfirmed.blue}`)
      }
      if (room.lastTickConfirmed.green < room.currentTick) {
        logGame(`Room ${room.roomId} Green is lagging on Tick: ${room.currentTick} by ${room.currentTick - room.lastTickConfirmed.green} green=${room.lastTickConfirmed.green}`)
      }
    }
  }

  room.timeout = setTimeout(serverTick, TIMEOUT)

  for (const player of room.players) {
    player.socket.on('tick_orders', ({ currentTick, orders }) => {
      if (logWebsocket.enabled) {
        logWebsocket(`orders [${player.socket.id}] ${currentTick} ${printObject(orders)}`)
      }
      if (player.room != null && player.room.status === 'running' && player.color != null) {
        if (Array.isArray(orders)) {
          player.room.orders.push(...orders)
        }
        player.room.lastTickConfirmed[player.color] = currentTick + player.tickLag
      }
    })

    player.socket.once('lose_game', () => {
      logWebsocket(`lose_game [${player.socket.id}] ${player.color}`)
      endGame(room, `The ${player.color} team has been defeated.`, player)
    })

    player.socket.on('chat_message', ({ playerId, message }) => {
      logWebsocket(`chat_message [${player.socket.id}] ${playerId} ${message}`)
      if (player.room != null && player.room.status === 'running') {
        sendRoomWebSocketMessage(room, 'chat_message', [{ playerId, message }])
      }
    })
  }
}

function endGame (room: IServerGameRoom, reason: string, losePlayer?: IPlayer): void {
  clearTimeout(room.timeout)
  room.status = 'empty'
  const wonPlayer = room.players.find(p => p !== losePlayer)
  sendRoomWebSocketMessage(room, 'end_game', [{ wonPlayerId: wonPlayer?.socket.id ?? '', reason }])
  for (let i = room.players.length - 1; i >= 0; i--) {
    leaveRoom(room.players[i], room.roomId)
  };
  sendRoomListToEveryone()
}

function sendRoomWebSocketMessage<Key extends keyof IServerToClientEvents> (
  room: IServerGameRoom,
  event: Key,
  params: Parameters<IServerToClientEvents[Key]>
): void {
  for (const player of room.players) {
    if (logWebsocket.enabled) {
      logWebsocket(`[${player.socket.id}] ${event} ${printObject(params)}`)
    }
    player.socket.emit(event, ...params)
  };
}

function measureLatency (player: IPlayer): void {
  const { socket } = player
  const measurement: ILatency = { start: Date.now() }
  player.latencyTrips.push(measurement)
  socket.once('latency_pong', () => {
    finishMeasuringLatency(player)
    // Measure latency atleast thrice
    if (player.latencyTrips.length < 3) {
      measureLatency(player)
    }
  })
  logLatency(`Ping (${measurement.start})`)
  if (logWebsocket.enabled) {
    logWebsocket('latency_ping')
  }
  socket.emit('latency_ping')
}

function finishMeasuringLatency (player: IPlayer): void {
  const measurement = player.latencyTrips[player.latencyTrips.length - 1]
  measurement.end = Date.now()
  measurement.roundTrip = measurement.end - measurement.start
  player.averageLatency = 0
  for (let i = 0; i < player.latencyTrips.length; i++) {
    player.averageLatency += measurement.roundTrip / 2
  };
  player.averageLatency = player.averageLatency / player.latencyTrips.length
  player.tickLag = Math.round(player.averageLatency * 2 / 100) + 1
  logLatency(`Measuring Latency for player. Attempt ${player.latencyTrips.length} - Average Latency: ${player.averageLatency} Tick Lag: ${player.tickLag}`)
}

function sendRoomsList (player: IPlayer): void {
  const params = { list: prepareRoomsList(), playerId: player.socket.id }
  if (logWebsocket.enabled) {
    logWebsocket(`room_list ${printObject(params)}`)
  }
  player.socket.emit('room_list', params)
}
