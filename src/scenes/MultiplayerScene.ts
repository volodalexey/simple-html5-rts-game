import { type Socket, io } from 'socket.io-client'
import { type Application, Container, Graphics, type TextStyleAlign, Assets, type Spritesheet, Text, type TextStyleFontWeight } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { type IGameOptions, type Game } from '../Game'
import { type BaseActiveItem, Team } from '../utils/helpers'
import { EMessageCharacter } from '../components/StatusBar'
import { type Trigger, createTrigger, ETriggerType, type IConditionalTrigger, handleTiggers } from '../utils/Trigger'
import { EItemName } from '../interfaces/IItem'
import { logCash, logLayout, logWebsocket } from '../utils/logger'
import { type SettingsModal } from '../components/SettingsModal'
import { Input } from '../components/Input'
import { Button, type IButtonOptions } from '../components/Button'
import { type ISendOrder, type IClientGameRoom, type IClientToServerEvents, type IServerToClientEvents, printObject } from '../common'
import { type IMapSettings, MapSettings } from '../utils/MapSettings'
import { castToClientOrder, castToServerOrder } from '../utils/Order'

interface IMultiplayerSceneOptions {
  app: Application
  game: Game
  settingsModal: SettingsModal
  viewWidth: number
  viewHeight: number
}

class Content extends Container {}
class Box extends Graphics {}
class HeaderText extends Text {}
class URLLabelText extends Text {}
class HomeButton extends Button {}
class RoomsListHeader extends Text {}
class RoomButton extends Button {
  public room: IClientGameRoom
  constructor (options: IButtonOptions & { room: IClientGameRoom }) {
    super(options)
    this.room = options.room
  }
}
class RoomsList extends Container<RoomButton> {}
class ConnectButton extends Button {}
class LeaveButton extends Button {}

export class MultiplayerScene extends Container implements IScene {
  public game!: Game
  public settingsModal!: SettingsModal
  public triggers: Trigger[] = []
  public content = new Content()
  public box = new Box()
  public headerText!: HeaderText
  public urlLabelText!: URLLabelText
  public homeButton!: HomeButton
  public input!: Input
  public roomsListHeader!: RoomsListHeader
  public roomsList = new RoomsList()
  public connectButton!: ConnectButton
  public leaveButton!: LeaveButton
  public socket?: Socket<IServerToClientEvents, IClientToServerEvents>
  public socketConnected = false
  public selectedRoom?: IClientGameRoom
  public joinedRoom?: IClientGameRoom
  static wsURLKey = 'wsURLKey'
  static boxOptions = {
    backgroundColor: 0x454545,
    outerBorderColor: 0x485b6c,
    outerBorderWidth: 3,
    width: 350,
    height: 500,
    borderRadius: 5
  }

  static homeButtonOptions = {
    offset: { x: 0, y: 0 },
    iconColor: 0xffffff,
    iconColorHover: 0xffff00,
    iconScale: 0.7,
    buttonIdleAlpha: 0,
    buttonHoverAlpha: 0,
    buttonSelectedAlpha: 0
  }

  static headerTextOptions = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 24,
    fontWeight: 'bold' as TextStyleFontWeight,
    fill: 0xffffff,
    align: 'center' as TextStyleAlign,
    shadowTextColor: 0x800080,
    shadowThickness: 1,
    offset: {
      x: 90,
      y: 25
    }
  }

  static urlTextOptions = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 16,
    fill: 0xffffff,
    align: 'center' as TextStyleAlign,
    shadowTextColor: 0x800080,
    shadowThickness: 1,
    offset: {
      x: 25,
      y: 70
    }
  }

  static urlInputOptions = {
    offset: {
      x: 25,
      y: 100
    },
    height: 22,
    width: 300
  }

  static roomsHeaderOptions = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 16,
    fill: 0xffffff,
    align: 'center' as TextStyleAlign,
    shadowTextColor: 0x800080,
    shadowThickness: 1,
    offset: {
      x: 25,
      y: 150
    }
  }

  static roomsListOptions = {
    offset: {
      x: 25,
      y: 180
    },
    height: 22,
    width: 300,
    buttonStyle: {
      text: '',
      fontSize: 20,
      textColor: 0x111111,
      textColorHover: 0xffff00,
      buttonIdleColor: 0xb3b3b3,
      buttonSelectedColor: 0x22c55e,
      textColorSelected: 0xffff00,
      buttonHoverColor: 0xb3b3b3
    } satisfies IButtonOptions
  }

  static connectButtonOptions = {
    offset: {
      x: 105,
      y: 430
    },
    buttonStyle: {
      text: 'Connect',
      fontSize: 20,
      textColor: 0x111111,
      textColorHover: 0xffff00,
      buttonIdleColor: 0x22c55e,
      buttonSelectedColor: 0x22c55e,
      buttonHoverColor: 0x22c55e,
      iconScale: 0.5,
      iconColorHover: 0xffff00,
      iconPaddingLeft: 10,
      iconPaddingTop: 13,
      textPaddingLeft: 10,
      textPaddingTop: 15,
      buttonWidth: 150,
      buttonHeight: 50,
      buttonRadius: 3
    } satisfies IButtonOptions
  }

  static leaveButtonOptions = {
    offset: {
      x: 105,
      y: 430
    },
    buttonStyle: {
      text: 'Leave',
      fontSize: 20,
      textColor: 0x111111,
      textColorHover: 0xffff00,
      buttonIdleColor: 0x9a3412,
      buttonSelectedColor: 0x9a3412,
      buttonHoverColor: 0x9a3412,
      iconScale: 0.5,
      iconColorHover: 0xffff00,
      iconPaddingLeft: 10,
      iconPaddingTop: 13,
      textPaddingLeft: 10,
      textPaddingTop: 16,
      buttonWidth: 150,
      buttonHeight: 50,
      buttonRadius: 3
    } satisfies IButtonOptions
  }

  public lastReceivedTick = 0
  public currentTick = 0
  public playerId = ''
  public ordersByTick: Array<{ tick: number, orders: ISendOrder[] }> = []
  public sentOrdersForTick = false
  constructor (options: IMultiplayerSceneOptions) {
    super()
    this.game = options.game
    this.settingsModal = options.settingsModal
    this.setup(options)
    this.draw(options)
  }

  draw (options: IMultiplayerSceneOptions): void {
    const {
      boxOptions: { width, height, backgroundColor, outerBorderWidth, outerBorderColor, borderRadius }
    } = MultiplayerScene

    let offsetX = 0
    let offsetY = 0
    let leftWidth = width
    let leftHeight = height

    this.box.beginFill(backgroundColor)
    this.box.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.box.endFill()

    offsetX += outerBorderWidth
    offsetY += outerBorderWidth
    leftWidth -= outerBorderWidth * 2
    leftHeight -= outerBorderWidth * 2

    this.box.beginFill(outerBorderColor)
    this.box.drawRoundedRect(offsetX, offsetY, leftWidth, leftHeight, borderRadius)
    this.box.endFill()
  }

  setup (_: IMultiplayerSceneOptions): void {
    this.addChild(this.content)

    this.content.addChild(this.box)

    const { textures }: Spritesheet = Assets.get('spritesheet')

    const { homeButtonOptions } = MultiplayerScene
    this.homeButton = new HomeButton({
      iconTexture: textures['icon-home.png'],
      ...homeButtonOptions,
      onClick: this.returnToMenuScene
    })
    this.homeButton.position.set(homeButtonOptions.offset.x, homeButtonOptions.offset.y)
    this.content.addChild(this.homeButton)

    const { headerTextOptions } = MultiplayerScene
    this.headerText = new URLLabelText('Multiplayer', {
      ...headerTextOptions,
      stroke: headerTextOptions.shadowTextColor,
      strokeThickness: headerTextOptions.shadowThickness
    })
    this.headerText.position.set(headerTextOptions.offset.x, headerTextOptions.offset.y)
    this.content.addChild(this.headerText)

    const { urlTextOptions } = MultiplayerScene
    this.urlLabelText = new URLLabelText('Web socket server url:', {
      ...urlTextOptions,
      stroke: urlTextOptions.shadowTextColor,
      strokeThickness: urlTextOptions.shadowThickness
    })
    this.urlLabelText.position.set(urlTextOptions.offset.x, urlTextOptions.offset.y)
    this.content.addChild(this.urlLabelText)

    const { urlInputOptions } = MultiplayerScene
    this.input = new Input({
      initHeight: urlInputOptions.height,
      initWidth: urlInputOptions.width,
      initValue: localStorage.getItem(MultiplayerScene.wsURLKey) ?? 'ws://localhost:8879',
      onChanged: (value) => {
        localStorage.setItem(MultiplayerScene.wsURLKey, value)
        this.connect()
      }
    })
    this.input.position.set(urlInputOptions.offset.x, urlInputOptions.offset.y)
    this.content.addChild(this.input)

    const { roomsHeaderOptions } = MultiplayerScene
    this.roomsListHeader = new RoomsListHeader('Rooms:', {
      ...roomsHeaderOptions,
      stroke: roomsHeaderOptions.shadowTextColor,
      strokeThickness: roomsHeaderOptions.shadowThickness
    })
    this.roomsListHeader.position.set(roomsHeaderOptions.offset.x, roomsHeaderOptions.offset.y)
    this.content.addChild(this.roomsListHeader)

    const { roomsListOptions } = MultiplayerScene
    this.roomsList.position.set(roomsListOptions.offset.x, roomsListOptions.offset.y)
    this.content.addChild(this.roomsList)

    const { connectButtonOptions, leaveButtonOptions } = MultiplayerScene
    const connectButton = new ConnectButton({
      ...connectButtonOptions.buttonStyle,
      iconTexture: textures['icon-next.png'],
      onClick: () => {
        if (this.selectedRoom != null) {
          this.socket?.once('init_level', (options) => {
            logWebsocket(`init_level ${printObject(options)}`)
            this.start(options)
          })
          logWebsocket(`join_room ${this.selectedRoom.roomId}`)
          this.socket?.emit('join_room', { roomId: this.selectedRoom.roomId })
        }
      }
    })
    const leaveButton = new LeaveButton({
      ...leaveButtonOptions.buttonStyle,
      iconTexture: textures['icon-circle-xmark.png'],
      onClick: () => {
        if (this.selectedRoom != null) {
          this.joinedRoom = undefined
          logWebsocket(`leave_room ${this.selectedRoom.roomId}`)
          this.socket?.emit('leave_room', { roomId: this.selectedRoom.roomId })
          this.updateButtons()
        }
      }
    })
    connectButton.position.set(connectButtonOptions.offset.x, connectButtonOptions.offset.y)
    connectButton.visible = false
    this.content.addChild(connectButton)
    this.connectButton = connectButton
    leaveButton.position.set(connectButtonOptions.offset.x, connectButtonOptions.offset.y)
    leaveButton.visible = false
    this.content.addChild(leaveButton)
    this.leaveButton = leaveButton
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    if (this.content.visible) {
      this.resizeBox(options)
      this.input.handleResize()
    } else {
      this.game.handleResize(options)
    }
    this.settingsModal.handleResize(options)
  }

  resizeBox ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const { width: tWidth, height: tHeight } = MultiplayerScene.boxOptions
    const totalWidth = tWidth
    const totalHeight = tHeight
    let scale = 1
    if (totalHeight >= totalWidth) {
      if (availableHeight < totalHeight) {
        scale = availableHeight / totalHeight
        if (scale * totalWidth > availableWidth) {
          scale = availableWidth / totalWidth
        }
        logLayout(`Multiplayer scene by height (sc=${scale})`)
      }
    } else {
      if (availableWidth < totalWidth) {
        scale = availableWidth / totalWidth
        if (scale * totalHeight > availableHeight) {
          scale = availableHeight / totalHeight
        }
        logLayout(`Multiplayer scene by width (sc=${scale})`)
      }
    }
    const occupiedWidth = Math.floor(totalWidth * scale)
    const occupiedHeight = Math.floor(totalHeight * scale)
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.content.x = x
    this.width = occupiedWidth
    this.content.y = y
    this.height = occupiedHeight
    logLayout(`x=${x} y=${y} w=${this.width} h=${this.height}`)
  }

  handleUpdate (deltaMS: number): void {
    // if the commands for that tick have been received
    // execute the commands and move on to the next tick
    // otherwise wait for server to catch up
    if (this.currentTick <= this.lastReceivedTick) {
      const ordersIdx = this.ordersByTick.findIndex(({ tick }) => tick === this.currentTick)
      const orders = this.ordersByTick[ordersIdx]
      if (Array.isArray(orders)) {
        for (const { uids, order } of orders) {
          this.game.processOrder({
            uids,
            order: castToClientOrder(order, (uid: number) => {
              return this.game.tileMap.getItemByUid(uid) ?? {} as unknown as BaseActiveItem
            }),
            forceProcess: true // force game to process orders, otherwise infinity loop though websocket
          })
        };
      }
      if (ordersIdx > -1) {
        this.ordersByTick.splice(ordersIdx, 1) // remove proessed orders
      }

      this.game.handleUpdate(deltaMS)
      // In case no command was sent for this current tick, send an empty command to the server
      // So that the server knows that everything is working smoothly
      if (!this.sentOrdersForTick) {
        this.sendOrders()
      }
      this.currentTick++
      this.sentOrdersForTick = false
    }

    if (this.game.gameEnded) {
      return
    }

    handleTiggers({ deltaMS, triggers: this.triggers })
  }

  sendOrders (options?: Parameters<NonNullable<IGameOptions['serializeOrders']>>[0]): void {
    this.sentOrdersForTick = true
    const params: Parameters<IClientToServerEvents['orders']>[0] = { currentTick: this.currentTick }
    if (options != null) {
      params.orders = [{ uids: options.uids, order: castToServerOrder(options.order) }]
    }
    if (logWebsocket.enabled) {
      logWebsocket(`orders ${printObject(params)}`)
    }
    this.socket?.emit('orders', params)
  }

  start = ({ spawnLocations, players }: Parameters<IServerToClientEvents['init_level']>[0]): void => {
    if (this.socket == null) {
      return
    }
    const settings: IMapSettings = Assets.get('level2Settings')

    const spawnLocationPoints = MapSettings.mapObjectToPositions({
      mapSettings: settings,
      layerName: 'Spawn-Locations'
    })
    const blueSpawnPoint = spawnLocationPoints[spawnLocations.blue]
    const blueSpawnGridPoint = { initGridX: blueSpawnPoint.x / settings.tilewidth, initGridY: blueSpawnPoint.y / settings.tileheight }
    const greenSpawnPoint = spawnLocationPoints[spawnLocations.green]
    const greenSpawnGridPoint = { initGridX: greenSpawnPoint.x / settings.tilewidth, initGridY: greenSpawnPoint.y / settings.tileheight }
    const isBlue = this.playerId === players.blue
    const team = isBlue ? Team.blue : Team.green

    this.triggers = [
      {
        type: ETriggerType.conditional,
        condition: () => {
          return this.game.tileMap.staticItems.filter(item => item.team === this.game.team).length === 0
        },
        action: () => {
          logWebsocket('lose_game')
          this.socket?.emit('lose_game')
        }
      } satisfies IConditionalTrigger
    ].map(triggerDescription => createTrigger(triggerDescription))

    this.game.startGame({
      mapImageSrc: 'level2Background',
      mapSettingsSrc: 'level2Settings',
      startGridX: (isBlue ? blueSpawnGridPoint.initGridX : greenSpawnGridPoint.initGridX),
      startGridY: (isBlue ? blueSpawnGridPoint.initGridY : greenSpawnGridPoint.initGridY),
      team,
      type: 'multiplayer',
      serializeOrders: ({ uids, order }) => {
        this.sendOrders({ uids, order })
      }
    });

    [
      { name: EItemName.Base, initGridX: blueSpawnGridPoint.initGridX, initGridY: blueSpawnGridPoint.initGridY, team: Team.blue },
      { name: EItemName.Base, initGridX: greenSpawnGridPoint.initGridX, initGridY: greenSpawnGridPoint.initGridY, team: Team.green }
    ].forEach((itemOptions) => {
      const item = this.game.createItem(itemOptions)
      if (item != null) {
        this.game.tileMap.addItem(item)
      }
    })
    this.game.tileMap.rebuildBuildableGrid()
    this.game.cash[Team.blue] = 1600
    this.game.cash[Team.green] = 1600
    logCash(`(${this.game.team}) initial b=${this.game.cash.blue} g=${this.game.cash.green}`)

    this.game.showMessage({
      character: EMessageCharacter.system,
      message: `Multiplayer. You (${team}) Opponent (${team === Team.blue ? Team.green : Team.blue})`,
      playSound: false
    })

    logWebsocket('initialized_level')
    this.socket.emit('initialized_level')
    this.socket.on('game_tick', ({ tick, orders }) => {
      if (logWebsocket.enabled) {
        logWebsocket(`game_tick ${tick} ${printObject(orders)}`)
      }
      this.lastReceivedTick = tick
      this.ordersByTick.push({ tick, orders })
    })
    this.socket.once('end_game', ({ wonPlayerId, reason }) => {
      logWebsocket(`end_game ${wonPlayerId} ${reason}`)
      this.endMultiplayer({ success: this.playerId === wonPlayerId, reason })
    })
    this.socket.once('chat_message', ({ playerId, message }) => {
      logWebsocket(`chat_message ${playerId} ${message}`)
      this.game.showMessage({
        character: EMessageCharacter.driver,
        message
      })
    })

    this.addChild(this.game)
    this.content.visible = false
    this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
  }

  mountedHandler (): void {
    this.game.removeFromParent()
    this.addChild(this.settingsModal)
    this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
    this.connect()
  }

  endMultiplayer ({ success, reason }: { success: boolean, reason: string }): void {
    this.game.endGame({
      success,
      message: reason,
      view: 'home',
      onLeftClick: () => {
        this.game.removeFromParent()
        SceneManager.changeScene({ name: 'menu' }).catch(console.error)
      }
    })
  }

  closeSocket (): void {
    if (this.socket != null) {
      this.socket.removeAllListeners()
      this.socket.io.removeAllListeners()
      this.socket.close()
      this.socket = undefined
    }
  }

  connect (): void {
    this.closeSocket()
    this.headerText.text = 'Connecting...'
    this.socket = io(this.input.text.text)
    this.socket.once('connect', () => {
      logWebsocket('Socket Connect')
      this.onSocketConnect()
    })
    this.socket.on('latency_ping', () => {
      logWebsocket('latency_pong')
      this.socket?.emit('latency_pong')
    })
    this.socket.on('room_list', ({ list, playerId }) => {
      if (logWebsocket.enabled) {
        logWebsocket(`room_list ${playerId} ${printObject(list)}`)
      }
      this.playerId = playerId
      this.renderRoomsList(list)
    })
    this.socket.on('joined_room', ({ room }) => {
      logWebsocket(`joined_room ${printObject(room)}`)
      this.joinedRoom = room
      this.updateButtons()
    })
    this.socket.io.once('error', (err) => {
      logWebsocket('Socket Error')
      this.onSocketError(err)
    })
    this.socket.io.once('close', () => {
      logWebsocket('Socket Close')
      this.onSocketClose()
    })
  }

  onSocketConnect = (): void => {
    this.socketConnected = true
    this.headerText.text = 'Connected'
  }

  onSocketError = (e: Error): void => {
    console.error(e)
    this.socketConnected = false
    this.headerText.text = 'Error!'
    this.selectedRoom = undefined
    this.joinedRoom = undefined
    this.closeSocket()
    this.clearRoomsList()
    this.updateButtons()
    this.endMultiplayer({ success: false, reason: 'Wesocket error!' })
  }

  onSocketClose = (): void => {
    this.socketConnected = false
    this.headerText.text = 'Closed'
    this.selectedRoom = undefined
    this.joinedRoom = undefined
    this.closeSocket()
    this.clearRoomsList()
    this.updateButtons()
    this.endMultiplayer({ success: false, reason: 'Wesocket was closed' })
  }

  returnToMenuScene = (): void => {
    this.input.blur()
    this.closeSocket()
    SceneManager.changeScene({ name: 'menu' }).catch(console.error)
  }

  clearRoomsList (): void {
    while (this.roomsList.children.length > 0) {
      this.roomsList.children[0].removeFromParent()
    }
  }

  renderRoomsList (rooms: IClientGameRoom[]): void {
    this.clearRoomsList()
    const { buttonStyle } = MultiplayerScene.roomsListOptions
    for (const room of rooms) {
      const roomButton = new RoomButton({
        ...buttonStyle,
        room,
        onClick: () => {
          this.selectedRoom = room
          this.updateButtons()
        },
        text: `Room [${room.roomId}] (${room.status})`,
        selected: this.selectedRoom != null ? this.selectedRoom.roomId === room.roomId : undefined
      })
      roomButton.position.set(0, this.roomsList.height)
      this.roomsList.addChild(roomButton)
    }
  }

  updateButtons (): void {
    if (this.selectedRoom != null) {
      if (this.joinedRoom != null) {
        if (this.joinedRoom.roomId === this.selectedRoom.roomId) {
          this.connectButton.visible = false
          this.leaveButton.visible = true
        } else {
          this.connectButton.visible = true
          this.leaveButton.visible = false
        }
      } else {
        this.connectButton.visible = true
        this.leaveButton.visible = false
      }
      for (const roomButton of this.roomsList.children) {
        if (roomButton.room === this.selectedRoom) {
          roomButton.setSelected(true)
        } else {
          roomButton.setSelected(false)
        }
      }
    } else {
      this.connectButton.visible = this.leaveButton.visible = false
      for (const roomButton of this.roomsList.children) {
        roomButton.setSelected(false)
      }
    }
  }
}
