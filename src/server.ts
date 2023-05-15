
import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { type IGameRoom, type IClientToServerEvents, type IInterServerEvents, type IServerToClientEvents, type ISocketData, type IClientGameRoom } from './socket.types'
import debug from 'debug'

export const logServer = debug('rts-srv')
export const logConnection = debug('rts-srv-connection')
export const logLatency = debug('rts-srv-latency')
export const logPlayer = debug('rts-srv-player')
export const logRooms = debug('rts-srv-rooms')

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

type IServerGameRoom = IGameRoom<IPlayer>

const httpServer = createServer()
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

const port = typeof process.env.PORT === 'string' ? Number(process.env.PORT) : 8879

httpServer.listen(port)
httpServer.on('listening', () => {
  logServer(`Server has started listening on port ${port}`)
})

const players: IPlayer[] = []

io.on('connection', socket => {
  logConnection(`Client connection [${socket.id}] ${socket.client.conn.remoteAddress}`)

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
    const room = joinRoom(player, roomId)
    sendRoomListToEveryone()
    if (room.players.length === 2) {
      initGame(room)
    }
  })

  player.socket.on('leave_room', ({ roomId }) => {
    leaveRoom(player, roomId)
    sendRoomListToEveryone()
  })

  player.socket.on('disconnect', (err) => {
    logConnection(`Connection error [${socket.id}] ${socket.client.conn.remoteAddress} disconnected.`, err)

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

  player.socket.on('error', (err) => {
    logConnection(`Connection error [${socket.id}] ${socket.client.conn.remoteAddress} disconnected.`, err)

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
/*
  // On Message event handler for a connection
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
        const clientMessage = JSON.parse(message.utf8Data)
        switch (clientMessage.type) {
            case 'initialized_level':
                player.room.playersReady++
                if (player.room.playersReady == 2) {
                    startGame(player.room)
                }
                break
          break
            case 'command':
                if (player.room && player.room.status == 'running') {
                    if (clientMessage.uids) {
                        player.room.commands.push({ uids: clientMessage.uids, details: clientMessage.details })
                    }
                    player.room.lastTickConfirmed[player.color] = clientMessage.currentTick + player.tickLag
                }
                break
        case 'lose_game':
          endGame(player.room, 'The ' + player.color + ' team has been defeated.')
          break
        case 'chat':
          if (player.room && player.room.status == 'running') {
            const cleanedMessage = clientMessage.message.replace(/[<>]/g, '')
   sendRoomWebSocketMessage(player.room, { type: 'chat', from: player.color, message: cleanedMessage })
            console.log(clientMessage.message, 'was cleaned to', cleanedMessage)
          }
          break
        }
    }
  })

   */
})

// Initialize a set of rooms
const gameRooms: IServerGameRoom[] = []
for (let i = 0; i < 9; i++) {
  gameRooms.push({ status: 'empty', players: [], roomId: i + 1, playersReady: 0 })
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
      console.log('alreadyJoinedRoom.players.length', alreadyJoinedRoom.roomId, alreadyJoinedRoom.status)
    }
  }
  logRooms('Adding player to room', roomId)
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
    player.socket.emit('joined_room', { room: castGameRoom(room) })
  }
  return room
}

function leaveRoom (player: IPlayer, roomId: IGameRoom['roomId']): void {
  const room = gameRooms[roomId - 1]
  logRooms(`Removing player from room ${roomId}`)

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
  return { status: room.status, roomId: room.roomId, playersReady: room.playersReady }
}

function prepareRoomsList (): IClientGameRoom[] {
  const list: IClientGameRoom[] = []
  for (const gameRoom of gameRooms) {
    list.push(castGameRoom(gameRoom))
  };
  logRooms(`prepareRoomsList() [${list.map(r => `id=${r.roomId} status=${r.status} playersReady=${r.playersReady}`).join(', ')}]`)
  return list
}

function sendRoomListToEveryone (): void {
  // Notify all connected players of the room status changes
  const roomsList = prepareRoomsList()
  for (const player of players) {
    player.socket.emit('room_list', { list: roomsList })
  };
}

function initGame (room: IServerGameRoom): void {
  console.log(`Both players Joined. Initializing game for Room ${room.roomId}`)

  // Number of players who have loaded the level
  room.playersReady = 0

  // Load the first multiplayer level for both players
  // This logic can change later to let the players pick a level
  const currentLevel = 0

  // Randomly select two spawn locations between 0 and 3 for both players.
  const spawns = [0, 1]
  const spawnLocations = { blue: spawns.splice(Math.floor(Math.random() * spawns.length), 1)[0], green: spawns.splice(Math.floor(Math.random() * spawns.length), 1)[0] }

  sendRoomWebSocketMessage(room, 'init_level', [{ spawnLocations, level: currentLevel }])
}

function endGame (room: IServerGameRoom, reason: string): void {
  // clearInterval(room.interval)
  room.status = 'empty'
  sendRoomWebSocketMessage(room, 'end_game', [{ reason }])
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
    player.socket.emit(event, ...params)
  };
}

/*

function startGame (room) {
  console.log('Both players are ready. Starting game in room', room.roomId)
  room.status = 'running'
  sendRoomListToEveryone()
  // Notify players to start the game
  sendRoomWebSocketMessage(room, { type: 'start_game' })

  room.commands = []
  room.lastTickConfirmed = { blue: 0, green: 0 }
  room.currentTick = 0

  // Calculate tick lag for room as the max of both player's tick lags
  const roomTickLag = Math.max(room.players[0].tickLag, room.players[1].tickLag)

  room.interval = setInterval(function () {
    // Confirm that both players have send in commands for upto present tick
    if (room.lastTickConfirmed.blue >= room.currentTick && room.lastTickConfirmed.green >= room.currentTick) {
      // Commands should be executed after the tick lag
      sendRoomWebSocketMessage(room, { type: 'game_tick', tick: room.currentTick + roomTickLag, commands: room.commands })
      room.currentTick++
      room.commands = []
    } else {
      // One of the players is causing the game to lag. Handle appropriately
      if (room.lastTickConfirmed.blue < room.currentTick) {
        console.log('Room', room.roomId, 'Blue is lagging on Tick:', room.currentTick, 'by', room.currentTick - room.lastTickConfirmed.blue)
      }
      if (room.lastTickConfirmed.green < room.currentTick) {
        console.log('Room', room.roomId, 'Green is lagging on Tick:', room.currentTick, 'by', room.currentTick - room.lastTickConfirmed.green)
      }
    }
  }, 100)
}

*/

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
  player.socket.emit('room_list', { list: prepareRoomsList() })
}
