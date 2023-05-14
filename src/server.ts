
import { createServer } from 'http'
import { Server } from 'socket.io'
import { type ClientToServerEvents, type InterServerEvents, type ServerToClientEvents, type SocketData } from './socket.types'

const httpServer = createServer()
const io = new Server<
ClientToServerEvents,
ServerToClientEvents,
InterServerEvents,
SocketData
>(httpServer, {
  cors: {
    origin: '*'
  }
})

const port = typeof process.env.PORT === 'string' ? Number(process.env.PORT) : 8879

httpServer.listen(port)
httpServer.on('listening', () => {
  console.log(`Server has started listening on port ${port}`)
})
// httpServer.on('request', (req, res) => {
//   console.log(req.method, req.url)
//   const headers = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
//     'Access-Control-Max-Age': 2592000 // 30 days
//   }
//   res.writeHead(200, headers)
//   res.end()
// })

// const players = []

io.on('connection', socket => {
  console.log('Client connection', socket.client.conn.remoteAddress)

  // const player = {
  //   connection,
  //   latencyTrips: []
  // }
  // Add the player to the players array

  // players.push(player)
/*
  // Measure latency for player
  measureLatency(player)

  // Send a fresh game room status list the first time player connects
  sendRoomList(connection)

  // On Message event handler for a connection
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
        const clientMessage = JSON.parse(message.utf8Data)
        switch (clientMessage.type) {
            case 'join_room':
                var room = joinRoom(player, clientMessage.roomId)
                sendRoomListToEveryone()
                if (room.players.length == 2) {
                    initGame(room)
                }
                break
            case 'leave_room':
                leaveRoom(player, clientMessage.roomId)
                sendRoomListToEveryone()
                break
            case 'initialized_level':
                player.room.playersReady++
                if (player.room.playersReady == 2) {
                    startGame(player.room)
                }
                break
        case 'latency_pong':
          finishMeasuringLatency(player, clientMessage)
          // Measure latency atleast thrice
          if (player.latencyTrips.length < 3) {
            measureLatency(player)
          }
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

  connection.on('close', function (reasonCode, description) {
    console.log('Connection from ' + request.remoteAddress + ' disconnected.')

    for (let i = players.length - 1; i >= 0; i--) {
        if (players[i] == player) {
            players.splice(i, 1)
        }
    };

    // If the player is in a room, remove him from room and notify everyone
    if (player.room) {
        const status = player.room.status
        const roomId = player.room.roomId
        // If the game was running, end the game as well
        if (status == 'running') {
            endGame(player.room, 'The ' + player.color + ' player has disconnected.')
        } else {
            leaveRoom(player, roomId)
        }
        sendRoomListToEveryone()
    }
  }) */
})

interface IGameRoom {
  status: 'empty'
  players: number[]
  roomId: number
}

// Initialize a set of rooms
const gameRooms: IGameRoom[] = []
for (let i = 0; i < 1; i++) {
  gameRooms.push({ status: 'empty', players: [], roomId: i + 1 })
};

/*
function sendRoomList (connection) {
  const status = []
  for (let i = 0; i < gameRooms.length; i++) {
    status.push(gameRooms[i].status)
  };
  const clientMessage = { type: 'room_list', status }
  connection.send(JSON.stringify(clientMessage))
}

function sendRoomListToEveryone () {
  // Notify all connected players of the room status changes
  const status = []
  for (var i = 0; i < gameRooms.length; i++) {
    status.push(gameRooms[i].status)
  };
  const clientMessage = { type: 'room_list', status }
  const clientMessageString = JSON.stringify(clientMessage)
  for (var i = 0; i < players.length; i++) {
    players[i].connection.send(clientMessageString)
  };
}

function joinRoom (player, roomId) {
  const room = gameRooms[roomId - 1]
  console.log('Adding player to room', roomId)
  // Add the player to the room
  room.players.push(player)
  player.room = room
  // Update room status
  if (room.players.length == 1) {
    room.status = 'waiting'
    player.color = 'blue'
  } else if (room.players.length == 2) {
    room.status = 'starting'
    player.color = 'green'
  }
  // Confirm to player that he was added
  const confirmationMessageString = JSON.stringify({ type: 'joined_room', roomId, color: player.color })
  player.connection.send(confirmationMessageString)
  return room
}

function leaveRoom (player, roomId) {
  const room = gameRooms[roomId - 1]
  console.log('Removing player from room', roomId)

  for (let i = room.players.length - 1; i >= 0; i--) {
    if (room.players[i] == player) {
      room.players.splice(i, 1)
    }
  };
  delete player.room
  // Update room status
  if (room.players.length == 0) {
    room.status = 'empty'
  } else if (room.players.length == 1) {
    room.status = 'waiting'
  }
}

function initGame (room) {
  console.log('Both players Joined. Initializing game for Room ' + room.roomId)

  // Number of players who have loaded the level
  room.playersReady = 0

  // Load the first multiplayer level for both players
  // This logic can change later to let the players pick a level
  const currentLevel = 0

  // Randomly select two spawn locations between 0 and 3 for both players.
  const spawns = [0, 1, 2, 3]
  const spawnLocations = { blue: spawns.splice(Math.floor(Math.random() * spawns.length), 1), green: spawns.splice(Math.floor(Math.random() * spawns.length), 1) }

  sendRoomWebSocketMessage(room, { type: 'init_level', spawnLocations, level: currentLevel })
}

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

function sendRoomWebSocketMessage (room, messageObject) {
  const messageString = JSON.stringify(messageObject)
  for (let i = room.players.length - 1; i >= 0; i--) {
    room.players[i].connection.send(messageString)
  };
}

function measureLatency (player) {
  const connection = player.connection
  const measurement = { start: Date.now() }
  player.latencyTrips.push(measurement)
  const clientMessage = { type: 'latency_ping' }
  connection.send(JSON.stringify(clientMessage))
}
function finishMeasuringLatency (player, clientMessage) {
  const measurement = player.latencyTrips[player.latencyTrips.length - 1]
  measurement.end = Date.now()
  measurement.roundTrip = measurement.end - measurement.start
  player.averageLatency = 0
  for (let i = 0; i < player.latencyTrips.length; i++) {
    player.averageLatency += measurement.roundTrip / 2
  };
  player.averageLatency = player.averageLatency / player.latencyTrips.length
  player.tickLag = Math.round(player.averageLatency * 2 / 100) + 1
  console.log('Measuring Latency for player. Attempt', player.latencyTrips.length, '- Average Latency:', player.averageLatency, 'Tick Lag:', player.tickLag)
}
function endGame (room, reason) {
  clearInterval(room.interval)
  room.status = 'empty'
  sendRoomWebSocketMessage(room, { type: 'end_game', reason })
  for (let i = room.players.length - 1; i >= 0; i--) {
    leaveRoom(room.players[i], room.roomId)
  };
  sendRoomListToEveryone()
}
*/
