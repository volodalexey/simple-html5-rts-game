import { Container, type Spritesheet, type FederatedPointerEvent, Assets, Graphics, type IPointData, type FederatedWheelEvent } from 'pixi.js'
import { type EMessageCharacter, StatusBar } from './StatusBar'
import { TileMap } from './TileMap'
import { Camera } from './Camera'
import { logLayout, logPointerEvent } from './logger'
import { Team, type SelectableItem, type BaseActiveItem } from './common'
import { Base } from './buildings/Base'
import { Harvester } from './vehicles/Harvester'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'
import { EItemName, type EItemNames, EItemType } from './interfaces/IItem'
import { type OrderTypes, type IOrder } from './interfaces/IOrder'
import { AUDIO } from './audio'
import { Bullet } from './projectiles/Bullet'
import { CannonBall } from './projectiles/CannonBall'
import { Laser } from './projectiles/Laser'
import { Rocket } from './projectiles/Rocket'
import { Order } from './Order'
import { StartModal } from './StartModal'
import { Firework } from './Particle'
import { SceneManager } from './SceneManager'
import { TopBar } from './TopBar'
import { GroundTurret } from './buildings/GroundTurret'
import { OilDerrick } from './buildings/OilDerrick'
import { Starport } from './buildings/Starport'
import { type EVectorDirection } from './Vector'
import { Chopper } from './air-vehicles/Chopper'
import { Wraith } from './air-vehicles/Wraith'
import { SideBar } from './SideBar'
import { CommandsBar } from './CommandsBar'
import { ECommandName } from './Command'

export interface IGameOptions {
  viewWidth: number
  viewHeight: number
  type: 'campaign' | 'singleplayer' | 'multiplayer'
  team: Team
}

export class Game extends Container {
  public gameEnded = false
  public time = 0
  public type!: IGameOptions['type']
  public team!: IGameOptions['team']
  public cash = {
    [Team.blue]: 0,
    [Team.green]: 0
  }

  public speedAdjustmentFactor = 1 / 512
  public turnSpeedAdjustmentFactor = 1 / 64
  public speedAdjustmentWhileTurningFactor = 0.4
  public reloadAdjustmentFactor = 1 / 8
  public deployBuilding = false
  public canDeployBuilding = false

  public viewWidth: number
  public viewHeight: number
  public tileMap!: TileMap
  public topBar!: TopBar
  public sideBar!: SideBar
  public startModal!: StartModal
  public camera!: Camera
  public selectedItems: SelectableItem[] = []
  public dragSelectThreshold = 5
  public dragSelect = new Graphics()
  static options = {
    doubleTapMaxTime: 300,
    wheelScaleFactor: 1.5,
    pinchScaleFactor: 1
  }

  public pointerMainDownId = -1
  public pointerMainDownX = -1
  public pointerMainDownY = -1
  public pointerSecondDownId = -1
  public pointerSecondDownX = -1
  public pointerSecondDownY = -1
  public pointerZoomed = false
  public previousPointerTapEvent?: {
    type: FederatedPointerEvent['pointerType']
    pointerId: FederatedPointerEvent['pointerId']
    pointerType: FederatedPointerEvent['pointerType']
    timeStamp: FederatedPointerEvent['timeStamp']
    globalX: FederatedPointerEvent['globalX']
    globalY: FederatedPointerEvent['globalY']
  }

  constructor (options: IGameOptions) {
    super()
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.type = options.type
    this.team = options.team
    this.setup(options)

    this.prepareTextures()
    this.addEventLesteners()
  }

  setup ({
    viewWidth,
    viewHeight
  }: IGameOptions): void {
    const leftHeight = viewHeight - TopBar.options.initHeight
    this.camera = new Camera({
      viewWidth, viewHeight: leftHeight, initY: TopBar.options.initHeight
    })
    this.addChild(this.camera)

    this.tileMap = new TileMap({
      game: this, initY: TopBar.options.initHeight
    })
    this.addChild(this.tileMap)
    this.tileMap.mask = this.camera
    this.addChild(this.dragSelect)

    this.topBar = new TopBar({
      game: this
    })
    this.addChild(this.topBar)

    this.sideBar = new SideBar({
      game: this, initY: TopBar.options.initHeight
    })
    this.addChild(this.sideBar)

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.hideModal()
    this.addChild(this.startModal)
  }

  addEventLesteners (): void {
    this.tileMap.eventMode = 'static'
    this.tileMap.on('pointerdown', this.handlePointerDown)
    this.tileMap.on('pointerup', this.handlePointerUp)
    this.tileMap.on('pointermove', this.handlePointerMove)
    this.tileMap.on('pointerleave', this.handlePointerLeave)
    this.tileMap.on('wheel', this.handleWheel)
  }

  handlePointerTap = (e: FederatedPointerEvent): void => {
    logPointerEvent('Game pointertap')
    if (this.gameEnded) {
      return
    }
    const point = this.tileMap.toLocal(e)
    const underPointerItem = this.tileMap.itemUnderPointer(point)
    const { previousPointerTapEvent } = this
    if (previousPointerTapEvent != null && underPointerItem != null) {
      const isPreviousMouse = previousPointerTapEvent.pointerType === 'mouse' && e.pointerType === 'mouse' && previousPointerTapEvent.pointerId === e.pointerId
      const isPreviousTouch = previousPointerTapEvent.pointerType === 'touch' && e.pointerType === 'touch' && previousPointerTapEvent.pointerId + 1 === e.pointerId
      if ((isPreviousMouse || isPreviousTouch) && e.timeStamp - previousPointerTapEvent.timeStamp < Game.options.doubleTapMaxTime) {
        if (Math.abs(e.globalX - previousPointerTapEvent.globalX) < 10 && Math.abs(e.globalY - previousPointerTapEvent.globalY) < 10) {
          logPointerEvent('Game pointerdoubletap')
          this.clearSelection()
          const { activeItems } = this.tileMap
          for (let i = 0; i < activeItems.children.length; i++) {
            const item = activeItems.children[i]
            if (underPointerItem.itemName === item.itemName && item.team === underPointerItem.team) {
              // select all the same items include under pointer item
              this.selectItem(item)
            }
          }
          this.sideBar.handleSelectedItems(this.selectedItems)
          return
        }
      }
    }
    let selectedCommandName = this.sideBar.commandsBar.getSelectedCommandName()

    let order: IOrder | undefined

    const uids: number[] = []
    if (underPointerItem != null) {
      switch (selectedCommandName) {
        case ECommandName.moveFollow:
          order = { type: 'follow', to: underPointerItem }
          break
        case ECommandName.attackGuard:
          if (underPointerItem.team === this.team) {
            order = { type: 'guard', to: underPointerItem }
          } else {
            order = { type: 'attack', to: underPointerItem }
          }
          break
      }
      const teamItemsCount = this.selectedItems.filter(si => si.team === this.team && si !== underPointerItem).length
      if (underPointerItem.team === this.team) {
        if (selectedCommandName != null && teamItemsCount > 0 && order != null) {
          // identify selected items from players team that can process command
          for (let i = this.selectedItems.length - 1; i >= 0; i--) {
            const item = this.selectedItems[i]
            if (item.team === this.team && underPointerItem !== item &&
            item.commands.includes(selectedCommandName)) {
              uids.push(item.uid)
            }
          }
          if (uids.length > 0) {
            this.processCommand({ uids, order })
          }
        } else {
          this.clearSelection()
          this.selectItem(underPointerItem)
        }
      } else {
        // Player clicked on an enemy item
        if (teamItemsCount > 0) {
          if (selectedCommandName == null) {
            selectedCommandName = ECommandName.attackGuard
            order = { type: 'attack', to: underPointerItem }
          }
          // identify selected items from players team that can process command
          for (let i = this.selectedItems.length - 1; i >= 0; i--) {
            const item = this.selectedItems[i]
            if (item.team === this.team && underPointerItem !== item &&
              item.commands.includes(selectedCommandName)) {
              uids.push(item.uid)
            }
          }
          if (uids.length > 0) {
            this.processCommand({ uids, order })
          }
        } else {
          this.clearSelection()
          this.selectItem(underPointerItem)
        }
      }
    } else {
      // Player clicked on the ground
      if (selectedCommandName == null) {
        selectedCommandName = ECommandName.moveFollow
      }
      const { gridSize } = this.tileMap
      const gridX = point.x / gridSize
      const gridY = point.y / gridSize
      switch (selectedCommandName) {
        case ECommandName.moveFollow:
          order = { type: 'move', toPoint: { gridX, gridY } }
          break
        case ECommandName.attackGuard:
          order = { type: 'move-and-attack', toPoint: { gridX, gridY } }
          break
      }
      // identify selected items from players team that can process command
      for (let i = this.selectedItems.length - 1; i >= 0; i--) {
        const item = this.selectedItems[i]
        if (item.team === this.team &&
          (item.type === EItemType.vehicles || item.type === EItemType.airVehicles) &&
          item.commands.includes(selectedCommandName)) {
          if (selectedCommandName === ECommandName.patrol) {
            // process patrol order individually
            const thisGrid = item.getGridXY({ center: true })
            this.processCommand({ uids: [item.uid], order: { type: 'patrol', fromPoint: thisGrid, toPoint: { gridX, gridY } } })
          } else {
            uids.push(item.uid)
          }
        }
      }
      // then command them to move to the clicked location
      if (uids.length > 0) {
        this.processCommand({ uids, order })
      }
    }

    this.sideBar.handleSelectedItems(this.selectedItems)

    this.previousPointerTapEvent = {
      type: e.type,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      timeStamp: e.timeStamp,
      globalX: e.globalX,
      globalY: e.globalY
    }
  }

  handlePointerDown = (e: FederatedPointerEvent): void => {
    if (this.gameEnded) {
      return
    }
    this.pointerZoomed = false
    const localPosition = this.toLocal(e)
    if (this.pointerMainDownId > -1) {
      this.pointerSecondDownId = e.pointerId
      this.pointerSecondDownX = localPosition.x
      this.pointerSecondDownY = localPosition.y
    } else {
      this.pointerMainDownId = e.pointerId
      this.pointerMainDownX = localPosition.x
      this.pointerMainDownY = localPosition.y
    }
    logPointerEvent(`Game pdX=${localPosition.x} pdX=${localPosition.y} down`)
  }

  handlePointerUp = (e: FederatedPointerEvent): void => {
    if (this.gameEnded) {
      return
    }
    this.pointerSecondDownId = this.pointerSecondDownX = this.pointerSecondDownY = -1
    this.pointerMainDownId = this.pointerMainDownX = this.pointerSecondDownY = -1
    logPointerEvent('Game pointer up')
    if (this.dragSelect.width > 0) {
      this.clearSelection()
      const dragSelectBounds = this.dragSelect.getBounds()
      const startPoint = this.tileMap.toLocal({ x: dragSelectBounds.left, y: dragSelectBounds.top })
      const endPoint = this.tileMap.toLocal({ x: dragSelectBounds.right, y: dragSelectBounds.bottom })
      const left = startPoint.x
      const right = endPoint.x
      const top = startPoint.y
      const bottom = endPoint.y
      const { moveableItems } = this.tileMap
      moveableItems.forEach((moveableItem) => {
        if (!moveableItem.selectable || moveableItem.isDead()) {
          return
        }

        const itemPosition = moveableItem.getCollisionPosition({ center: true })

        if (itemPosition.x >= left &&
          itemPosition.x <= right &&
          itemPosition.y >= top &&
          itemPosition.y <= bottom
        ) {
          this.selectItem(moveableItem)
        }
      })
      this.sideBar.handleSelectedItems(this.selectedItems)
    } else if (!this.pointerZoomed) {
      this.handlePointerTap(e)
    }
    this.dragSelect.clear()
  }

  handlePointerLeave = (e: FederatedPointerEvent): void => {
    if (this.gameEnded) {
      return
    }
    if (e.pointerId === this.pointerSecondDownId) {
      this.pointerSecondDownId = this.pointerSecondDownX = this.pointerSecondDownY = -1
      logPointerEvent('Game pointer second leave')
    } else {
      this.pointerMainDownId = this.pointerMainDownX = this.pointerSecondDownY = -1
      logPointerEvent('Game pointer main leave')
    }
    this.dragSelect.clear()
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    if (this.gameEnded) {
      return
    }
    const localPosition = this.toLocal(e)
    logPointerEvent('Game pointer move')
    if (this.pointerMainDownId !== -1 && this.pointerSecondDownId === -1) {
      if (this.pointerMainDownX > -1 && this.pointerMainDownY > -1 &&
        Math.abs(localPosition.x - this.pointerMainDownX) > this.dragSelectThreshold &&
        Math.abs(localPosition.y - this.pointerMainDownY) > this.dragSelectThreshold) {
        this.drawDragSelect(localPosition)
      }
    } else if (this.pointerMainDownId !== -1 && this.pointerSecondDownId !== -1) {
      if (this.dragSelect.width > 0) {
        this.dragSelect.clear()
      }
      const isMain = e.pointerId === this.pointerMainDownId
      const fromX = isMain ? this.pointerSecondDownX : this.pointerMainDownX
      const fromY = isMain ? this.pointerSecondDownY : this.pointerMainDownY
      const toOldX = isMain ? this.pointerMainDownX : this.pointerSecondDownX
      const toOldY = isMain ? this.pointerMainDownY : this.pointerSecondDownY
      const toNewX = localPosition.x
      const toNewY = localPosition.y
      const distanceOld = Math.hypot(fromY - toOldY, fromX - toOldX)
      const distance = Math.hypot(fromY - toNewY, fromX - toNewX)
      const scaleFactor = distance / distanceOld * Game.options.pinchScaleFactor
      const middleX = Math.min(fromX, toNewX) + (fromX - toNewX) * 0.5
      const middleY = Math.min(fromY, toNewY) + (fromY - toNewY) * 0.5
      const globalMiddle = this.toGlobal({ x: middleX, y: middleY })
      const tileMapMiddle = this.tileMap.toLocal(globalMiddle)
      this.tileMap.zoom({ scaleFactor: scaleFactor < 1 ? 1 / scaleFactor * -1 : scaleFactor, sX: tileMapMiddle.x, sY: tileMapMiddle.y })
      this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
      if (isMain) {
        this.pointerMainDownX = localPosition.x
        this.pointerMainDownY = localPosition.y
      } else {
        this.pointerSecondDownX = localPosition.x
        this.pointerSecondDownY = localPosition.y
      }
      this.pointerZoomed = true
    }
  }

  drawDragSelect (currentPosition: IPointData): void {
    this.dragSelect.clear()
    const width = Math.abs(currentPosition.x - this.pointerMainDownX)
    const height = Math.abs(currentPosition.y - this.pointerMainDownY)
    if (width > 0 && height > 0) {
      this.dragSelect.lineStyle({
        width: 1,
        color: 0xffff00
      })
      const x = Math.min(currentPosition.x, this.pointerMainDownX)
      const y = Math.min(currentPosition.y, this.pointerMainDownY)
      this.dragSelect.position.set(x, y)
      this.dragSelect.drawRect(0, 0, width, height)
      this.dragSelect.endFill()
    }
  }

  handleWheel = (e: FederatedWheelEvent): void => {
    if (this.gameEnded) {
      return
    }
    const localPosition = this.tileMap.toLocal(e)
    const scaleModifier = -1 * Math.sign(e.deltaY) * Game.options.wheelScaleFactor
    this.tileMap.zoom({ scaleFactor: scaleModifier, sX: localPosition.x, sY: localPosition.y })
    this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
  }

  isItemSelected (item: SelectableItem): boolean {
    return this.selectedItems.includes(item)
  }

  selectItem (item: SelectableItem): void {
    if (item.selected) {
      return
    }

    if (item.selectable && !item.selected) {
      item.setSelected(true)
      this.selectedItems.push(item)
    }
  }

  deselectItem (item: SelectableItem): void {
    const selectedIdx = this.selectedItems.indexOf(item)
    if (selectedIdx > -1) {
      const selectedItem = this.selectedItems.splice(selectedIdx, 1)[0]
      const order = this.tileMap.orders.children.find(o => o.item === selectedItem)
      if (order != null) {
        order.removeFromParent()
      }
    }
    item.setSelected(false)
  }

  startGame = ({
    mapImageSrc, mapSettingsSrc, startGridX = 0, startGridY = 0
  }: {
    mapImageSrc: string
    mapSettingsSrc: string
    startGridX?: number
    startGridY?: number
  }): void => {
    this.gameEnded = false
    this.time = 0
    this.runLevel({ mapImageSrc, mapSettingsSrc })
    const { gridSize } = this.tileMap
    this.topBar.miniMap.assignBackgroundTexture({ texture: this.tileMap.background.texture })
    this.tileMap.goTo({ x: startGridX * gridSize, y: startGridY * gridSize })
    this.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
  }

  endGame (options: Parameters<StartModal['showModal']>[0]): void {
    this.gameEnded = true
    this.startModal.showModal(options)
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    const { width: bgWidth, height: bgHeight } = this.tileMap.background
    const maxWidth = viewWidth > bgWidth ? bgWidth : viewWidth
    const leftHeight = viewHeight - this.topBar.height
    this.camera.handleResize({
      viewWidth: maxWidth,
      viewHeight: leftHeight > bgHeight ? bgHeight : leftHeight
    })
    const { x: pX, y: pY } = this.tileMap.pivot
    this.tileMap.handleResize({ viewWidth: maxWidth, viewHeight: leftHeight })
    this.topBar.handleResize({ viewWidth: maxWidth, viewHeight: leftHeight, camX: pX, camY: pY })

    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const totalWidth = bgWidth
    const totalHeight = this.topBar.height + bgHeight
    const occupiedWidth = totalWidth
    const occupiedHeight = totalHeight
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.x = x
    this.y = y
    logLayout(`x=${x} y=${y}`)

    const calcWidth = availableWidth > occupiedWidth ? occupiedWidth : availableWidth
    const calcHeight = availableHeight > occupiedHeight ? occupiedHeight : availableHeight
    this.startModal.position.set(calcWidth / 2 - this.startModal.width / 2, calcHeight / 2 - this.startModal.height / 2)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      if (this.startModal.visible) {
        this.startModal.handleUpdate(deltaMS)
      }
      return
    }
    this.time += deltaMS
    const { x: pX, y: pY } = this.tileMap.pivot
    this.topBar.handleUpdate({ deltaMS, camX: pX, camY: pY })
    this.sideBar.handleUpdate(deltaMS)
    this.tileMap.handleUpdate(deltaMS)
    this.camera.handleUpdate(deltaMS)

    this.drawOrders()
  }

  drawOrders (): void {
    this.selectedItems.forEach(selectedItem => {
      if (selectedItem.type === EItemType.vehicles || selectedItem.type === EItemType.airVehicles) {
        let order = this.tileMap.orders.children.find(o => o.item === selectedItem)
        if (order == null) {
          order = new Order({ item: selectedItem })
          this.tileMap.orders.addChild(order)
        }
        order.drawOrderLine({
          selectedItem,
          tileMap: this.tileMap
        })
      }
    })
  }

  runLevel ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void {
    this.tileMap.cleanFromAll()
    this.topBar.statusBar.cleanFromAll()
    this.startModal.cleanFromAll()

    this.tileMap.initLevel({ mapImageSrc, mapSettingsSrc, viewWidth: this.camera.width, viewHeight: this.camera.height })
  }

  clearSelection (toggleSideBar = false): void {
    if (toggleSideBar) {
      this.sideBar.handleSelectedItems([])
    }
    for (let i = 0; i < this.selectedItems.length; i++) {
      const selectedItem = this.selectedItems[i]
      this.deselectItem(selectedItem)
      i--
    }
  }

  prepareTextures (): void {
    const spritesheet: Spritesheet = Assets.get('spritesheet')
    const { animations, textures } = spritesheet
    Base.prepareTextures({
      blueTextures: {
        healthyTextures: animations['base-blue-healthy'],
        damagedTextures: [textures['base-blue-damaged.png']],
        constructingTextures: animations['base-blue-contructing']
      },
      greenTextures: {
        healthyTextures: animations['base-green-healthy'],
        damagedTextures: [textures['base-green-damaged.png']],
        constructingTextures: animations['base-green-contructing']
      }
    })

    GroundTurret.prepareTextures({
      blueTextures: {
        healthyTextures: [textures['ground-turret-blue-healthy-up.png']],
        upTextures: [textures['ground-turret-blue-healthy-up.png']],
        upRightTextures: [textures['ground-turret-blue-healthy-up-right.png']],
        rightTextures: [textures['ground-turret-blue-healthy-right.png']],
        downRightTextures: [textures['ground-turret-blue-healthy-down-right.png']],
        downTextures: [textures['ground-turret-blue-healthy-down.png']],
        downLeftTextures: [textures['ground-turret-blue-healthy-down-left.png']],
        leftTextures: [textures['ground-turret-blue-healthy-left.png']],
        upLeftTextures: [textures['ground-turret-blue-healthy-up-left.png']],
        damagedTextures: [textures['ground-turret-blue-damaged.png']],
        teleportTextures: animations['ground-turret-blue-teleport']
      },
      greenTextures: {
        healthyTextures: [textures['ground-turret-green-healthy-up.png']],
        upTextures: [textures['ground-turret-green-healthy-up.png']],
        upRightTextures: [textures['ground-turret-green-healthy-up-right.png']],
        rightTextures: [textures['ground-turret-green-healthy-right.png']],
        downRightTextures: [textures['ground-turret-green-healthy-down-right.png']],
        downTextures: [textures['ground-turret-green-healthy-down.png']],
        downLeftTextures: [textures['ground-turret-green-healthy-down-left.png']],
        leftTextures: [textures['ground-turret-green-healthy-left.png']],
        upLeftTextures: [textures['ground-turret-green-healthy-up-left.png']],
        damagedTextures: [textures['ground-turret-green-damaged.png']],
        teleportTextures: animations['ground-turret-green-teleport']
      }
    })

    OilDerrick.prepareTextures({
      blueTextures: {
        healthyTextures: animations['oil-derrick-blue-healthy'],
        damagedTextures: [textures['oil-derrick-blue-damaged.png']],
        deployTextures: animations['oil-derrick-blue-deploy']
      },
      greenTextures: {
        healthyTextures: animations['oil-derrick-green-healthy'],
        damagedTextures: [textures['oil-derrick-green-damaged.png']],
        deployTextures: animations['oil-derrick-green-deploy']
      }
    })

    Starport.prepareTextures({
      blueTextures: {
        healthyTextures: animations['starport-blue-healthy'],
        damagedTextures: [textures['starport-blue-damaged.png']],
        teleportTextures: animations['starport-blue-teleport'],
        closingTextures: animations['starport-blue-closing'],
        openingTextures: animations['starport-blue-opening']
      },
      greenTextures: {
        healthyTextures: animations['starport-green-healthy'],
        damagedTextures: [textures['starport-green-damaged.png']],
        teleportTextures: animations['starport-green-teleport'],
        closingTextures: animations['starport-green-closing'],
        openingTextures: animations['starport-green-opening']
      }
    })

    Harvester.prepareTextures({
      blueTextures: {
        upTextures: [textures['harvester-blue-up.png']],
        upRightTextures: [textures['harvester-blue-up-right.png']],
        rightTextures: [textures['harvester-blue-right.png']],
        downRightTextures: [textures['harvester-blue-down-right.png']],
        downTextures: [textures['harvester-blue-down.png']],
        downLeftTextures: [textures['harvester-blue-down-left.png']],
        leftTextures: [textures['harvester-blue-left.png']],
        upLeftTextures: [textures['harvester-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['harvester-green-up.png']],
        upRightTextures: [textures['harvester-green-up-right.png']],
        rightTextures: [textures['harvester-green-right.png']],
        downRightTextures: [textures['harvester-green-down-right.png']],
        downTextures: [textures['harvester-green-down.png']],
        downLeftTextures: [textures['harvester-green-down-left.png']],
        leftTextures: [textures['harvester-green-left.png']],
        upLeftTextures: [textures['harvester-green-up-left.png']]
      }
    })

    HeavyTank.prepareTextures({
      blueTextures: {
        upTextures: [textures['heavy-tank-blue-up.png']],
        upRightTextures: [textures['heavy-tank-blue-up-right.png']],
        rightTextures: [textures['heavy-tank-blue-right.png']],
        downRightTextures: [textures['heavy-tank-blue-down-right.png']],
        downTextures: [textures['heavy-tank-blue-down.png']],
        downLeftTextures: [textures['heavy-tank-blue-down-left.png']],
        leftTextures: [textures['heavy-tank-blue-left.png']],
        upLeftTextures: [textures['heavy-tank-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['heavy-tank-green-up.png']],
        upRightTextures: [textures['heavy-tank-green-up-right.png']],
        rightTextures: [textures['heavy-tank-green-right.png']],
        downRightTextures: [textures['heavy-tank-green-down-right.png']],
        downTextures: [textures['heavy-tank-green-down.png']],
        downLeftTextures: [textures['heavy-tank-green-down-left.png']],
        leftTextures: [textures['heavy-tank-green-left.png']],
        upLeftTextures: [textures['heavy-tank-green-up-left.png']]
      }
    })

    ScoutTank.prepareTextures({
      blueTextures: {
        upTextures: [textures['scout-tank-blue-up.png']],
        upRightTextures: [textures['scout-tank-blue-up-right.png']],
        rightTextures: [textures['scout-tank-blue-right.png']],
        downRightTextures: [textures['scout-tank-blue-down-right.png']],
        downTextures: [textures['scout-tank-blue-down.png']],
        downLeftTextures: [textures['scout-tank-blue-down-left.png']],
        leftTextures: [textures['scout-tank-blue-left.png']],
        upLeftTextures: [textures['scout-tank-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['scout-tank-green-up.png']],
        upRightTextures: [textures['scout-tank-green-up-right.png']],
        rightTextures: [textures['scout-tank-green-right.png']],
        downRightTextures: [textures['scout-tank-green-down-right.png']],
        downTextures: [textures['scout-tank-green-down.png']],
        downLeftTextures: [textures['scout-tank-green-down-left.png']],
        leftTextures: [textures['scout-tank-green-left.png']],
        upLeftTextures: [textures['scout-tank-green-up-left.png']]
      }
    })

    Transport.prepareTextures({
      blueTextures: {
        upTextures: [textures['transport-blue-up.png']],
        upRightTextures: [textures['transport-blue-up-right.png']],
        rightTextures: [textures['transport-blue-right.png']],
        downRightTextures: [textures['transport-blue-down-right.png']],
        downTextures: [textures['transport-blue-down.png']],
        downLeftTextures: [textures['transport-blue-down-left.png']],
        leftTextures: [textures['transport-blue-left.png']],
        upLeftTextures: [textures['transport-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['transport-green-up.png']],
        upRightTextures: [textures['transport-green-up-right.png']],
        rightTextures: [textures['transport-green-right.png']],
        downRightTextures: [textures['transport-green-down-right.png']],
        downTextures: [textures['transport-green-down.png']],
        downLeftTextures: [textures['transport-green-down-left.png']],
        leftTextures: [textures['transport-green-left.png']],
        upLeftTextures: [textures['transport-green-up-left.png']]
      }
    })

    Bullet.prepareTextures({
      textures: {
        upTextures: [textures['bullet-up.png']],
        upRightTextures: [textures['bullet-up-right.png']],
        rightTextures: [textures['bullet-right.png']],
        downRightTextures: [textures['bullet-down-right.png']],
        downTextures: [textures['bullet-down.png']],
        downLeftTextures: [textures['bullet-down-left.png']],
        leftTextures: [textures['bullet-left.png']],
        upLeftTextures: [textures['bullet-up-left.png']],
        explodeTextures: animations['bullet-explode']
      }
    })

    CannonBall.prepareTextures({
      textures: {
        upTextures: [textures['cannon-ball-up.png']],
        upRightTextures: [textures['cannon-ball-up-right.png']],
        rightTextures: [textures['cannon-ball-right.png']],
        downRightTextures: [textures['cannon-ball-down-right.png']],
        downTextures: [textures['cannon-ball-down.png']],
        downLeftTextures: [textures['cannon-ball-down-left.png']],
        leftTextures: [textures['cannon-ball-left.png']],
        upLeftTextures: [textures['cannon-ball-up-left.png']],
        explodeTextures: animations['cannon-ball-explode']
      }
    })

    Laser.prepareTextures({
      textures: {
        upTextures: [textures['fireball-up.png']],
        upRightTextures: [textures['fireball-up-right.png']],
        rightTextures: [textures['fireball-right.png']],
        downRightTextures: [textures['fireball-down-right.png']],
        downTextures: [textures['fireball-down.png']],
        downLeftTextures: [textures['fireball-down-left.png']],
        leftTextures: [textures['fireball-left.png']],
        upLeftTextures: [textures['fireball-up-left.png']],
        explodeTextures: animations['fireball-explode']
      }
    })

    Rocket.prepareTextures({
      textures: {
        upTextures: [textures['heatseeker-up.png']],
        upRightTextures: [textures['heatseeker-up-right.png']],
        rightTextures: [textures['heatseeker-right.png']],
        downRightTextures: [textures['heatseeker-down-right.png']],
        downTextures: [textures['heatseeker-down.png']],
        downLeftTextures: [textures['heatseeker-down-left.png']],
        leftTextures: [textures['heatseeker-left.png']],
        upLeftTextures: [textures['heatseeker-up-left.png']],
        explodeTextures: animations['heatseeker-explode']
      }
    })

    StatusBar.prepareTextures({
      textures: {
        girl1Texture: textures['character-girl1.png'],
        girl2Texture: textures['character-girl2.png'],
        man1Texture: textures['character-man1.png'],
        systemTexture: textures['character-system.png']
      }
    })

    StartModal.prepareTextures({
      textures: {
        iconHomeTexture: textures['icon-home.png'],
        iconRepeatTexture: textures['icon-repeat.png'],
        iconNextTexture: textures['icon-next.png']
      }
    })

    Firework.prepareTextures({
      textures: {
        texture: SceneManager.app.renderer.generateTexture(Firework.prepareGraphics())
      }
    })

    Chopper.prepareTextures({
      blueTextures: {
        upTextures: animations['chopper-blue-up'],
        upRightTextures: animations['chopper-blue-up-right'],
        rightTextures: animations['chopper-blue-right'],
        downRightTextures: animations['chopper-blue-down-right'],
        downTextures: animations['chopper-blue-down'],
        downLeftTextures: animations['chopper-blue-down-left'],
        leftTextures: animations['chopper-blue-left'],
        upLeftTextures: animations['chopper-blue-up-left']
      },
      greenTextures: {
        upTextures: animations['chopper-green-up'],
        upRightTextures: animations['chopper-green-up-right'],
        rightTextures: animations['chopper-green-right'],
        downRightTextures: animations['chopper-green-down-right'],
        downTextures: animations['chopper-green-down'],
        downLeftTextures: animations['chopper-green-down-left'],
        leftTextures: animations['chopper-green-left'],
        upLeftTextures: animations['chopper-green-up-left']
      },
      shadowTextures: {
        upTextures: animations['chopper-shadow-up'],
        upRightTextures: animations['chopper-shadow-up-right'],
        rightTextures: animations['chopper-shadow-right'],
        downRightTextures: animations['chopper-shadow-down-right'],
        downTextures: animations['chopper-shadow-down'],
        downLeftTextures: animations['chopper-shadow-down-left'],
        leftTextures: animations['chopper-shadow-left'],
        upLeftTextures: animations['chopper-shadow-up-left']
      }
    })

    Wraith.prepareTextures({
      blueTextures: {
        upTextures: [textures['wraith-blue-up.png']],
        upRightTextures: [textures['wraith-blue-up-right.png']],
        rightTextures: [textures['wraith-blue-right.png']],
        downRightTextures: [textures['wraith-blue-down-right.png']],
        downTextures: [textures['wraith-blue-down.png']],
        downLeftTextures: [textures['wraith-blue-down-left.png']],
        leftTextures: [textures['wraith-blue-left.png']],
        upLeftTextures: [textures['wraith-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['wraith-green-up.png']],
        upRightTextures: [textures['wraith-green-up-right.png']],
        rightTextures: [textures['wraith-green-right.png']],
        downRightTextures: [textures['wraith-green-down-right.png']],
        downTextures: [textures['wraith-green-down.png']],
        downLeftTextures: [textures['wraith-green-down-left.png']],
        leftTextures: [textures['wraith-green-left.png']],
        upLeftTextures: [textures['wraith-green-up-left.png']]
      },
      shadowTextures: {
        upTextures: [textures['wraith-shadow-up.png']],
        upRightTextures: [textures['wraith-shadow-up-right.png']],
        rightTextures: [textures['wraith-shadow-right.png']],
        downRightTextures: [textures['wraith-shadow-down-right.png']],
        downTextures: [textures['wraith-shadow-down.png']],
        downLeftTextures: [textures['wraith-shadow-down-left.png']],
        leftTextures: [textures['wraith-shadow-left.png']],
        upLeftTextures: [textures['wraith-shadow-up-left.png']]
      }
    })

    CommandsBar.prepareTextures({
      textures: {
        iconMoveFollowTexture: textures['icon-command-move-follow.png'],
        iconAttackGuardTexture: textures['icon-command-attack-guard.png'],
        iconPatrolTexture: textures['icon-command-patrol.png'],
        iconDeselectTexture: textures['icon-deselect.png']
      }
    })
  }

  // Receive command from singleplayer or multiplayer object and send it to units
  processCommand ({ uids, order, toUid, orderType }: { uids: number[], order?: IOrder, orderType?: OrderTypes, toUid?: number }): boolean {
    // In case the target "to" object is in terms of uid, fetch the target object
    let toObject
    let unitOrder: IOrder | undefined
    if (orderType === 'attack' || orderType === 'guard' || orderType === 'follow') {
      if (typeof toUid === 'number') {
        toObject = this.tileMap.getItemByUid(toUid)
        if ((toObject == null) || toObject.isDead()) {
          // To object no longer exists. Invalid command
          return false
        } else {
          unitOrder = { type: orderType, to: toObject }
        }
      }
    }

    for (const uid of uids) {
      const item = this.tileMap.getItemByUid(uid)
      // if uid is a valid item, set the order for the item
      if (item != null && ((order != null) || (unitOrder != null))) {
        item.order = (order ?? unitOrder) as IOrder
        if (['move', 'follow', 'guard', 'patrol'].includes(item.order.type)) {
          if (item.itemName === EItemName.ScoutTank) {
            AUDIO.play('scout-tank-yes')
          } else if (item.itemName === EItemName.HeavyTank) {
            AUDIO.play('heavy-tank-yes')
          } else if (item.itemName === EItemName.Chopper) {
            AUDIO.play('chopper-yes')
          } else if (item.itemName === EItemName.Wraith) {
            AUDIO.play('wraith-yes')
          } else {
            AUDIO.play('acknowledge-moving')
          }
        } else if (['attack', 'move-and-attack'].includes(item.order.type)) {
          if (item.itemName === EItemName.ScoutTank) {
            AUDIO.play('scout-tank-attack')
          } else if (item.itemName === EItemName.HeavyTank) {
            AUDIO.play('heavy-tank-attack')
          } else if (item.itemName === EItemName.Chopper) {
            AUDIO.play('chopper-attack')
          } else if (item.itemName === EItemName.Wraith) {
            AUDIO.play('wraith-attack')
          } else {
            AUDIO.play('acknowledge-attacking')
          }
        }
        if (toObject != null && (item.order.type === 'attack' || item.order.type === 'guard')) {
          item.order.to = toObject
        }
      }
    }
    return true
  }

  showMessage ({ character, message, playSound = true }: { character: EMessageCharacter, message: string, playSound?: boolean }): void {
    if (playSound) {
      AUDIO.play('message-received')
    }
    this.topBar.statusBar.appendMessage({ character, message, time: this.time })
  }

  getItemCost (name: EItemName): number | undefined {
    switch (name) {
      case EItemName.OilDerrick:
        return OilDerrick.cost
      case EItemName.Starport:
        return Starport.cost
      case EItemName.GroundTurret:
        return GroundTurret.cost
      case EItemName.Transport:
        return Transport.cost
      case EItemName.Harvester:
        return Harvester.cost
      case EItemName.HeavyTank:
        return HeavyTank.cost
      case EItemName.ScoutTank:
        return ScoutTank.cost
    }
  }

  getReloadTime (name: EItemName): number | undefined {
    switch (name) {
      case EItemName.Bullet:
        return Bullet.reloadTime
      case EItemName.CannonBall:
        return CannonBall.reloadTime
      case EItemName.Rocket:
        return Rocket.reloadTime
      case EItemName.Laser:
        return Laser.reloadTime
    }
  }

  createItem (options: {
    name: EItemNames
    initGridX?: number
    initGridY?: number
    initX?: number
    initY?: number
    initCenter?: boolean
    team: Team
    direction?: EVectorDirection
    uid?: number
    life?: number
    selectable?: boolean
    commands?: ECommandName[]
    order?: IOrder
    teleport?: boolean
  }): Base | OilDerrick | Starport | GroundTurret
    | Transport | Harvester | ScoutTank | HeavyTank
    | Chopper | Wraith
    | undefined {
    let { initX = 0, initY = 0 } = options
    const { name, initGridX, initGridY } = options
    const { gridSize } = this.tileMap
    initX = initGridX != null ? gridSize * initGridX : initX
    initY = initGridY != null ? gridSize * initGridY : initY
    switch (name) {
      case EItemName.Base:
        return new Base({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.OilDerrick:
        return new OilDerrick({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Starport:
        return new Starport({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.GroundTurret:
        return new GroundTurret({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Transport:
        return new Transport({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Harvester:
        return new Harvester({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.HeavyTank:
        return new HeavyTank({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.ScoutTank:
        return new ScoutTank({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Chopper:
        return new Chopper({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Wraith:
        return new Wraith({
          ...options,
          game: this,
          initX,
          initY
        })
    }
  }

  createProjectile (options: {
    name: EItemName
    initGridX?: number
    initGridY?: number
    initX?: number
    initY?: number
    direction: EVectorDirection
    target: BaseActiveItem
  }): Bullet | CannonBall | Rocket | Laser
    | undefined {
    let { initX = 0, initY = 0 } = options
    const { name, initGridX, initGridY } = options
    const { gridSize } = this.tileMap
    initX = initGridX != null ? gridSize * initGridX : initX
    initY = initGridY != null ? gridSize * initGridY : initY
    switch (name) {
      case EItemName.Bullet:
        return new Bullet({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.CannonBall:
        return new CannonBall({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Rocket:
        return new Rocket({
          ...options,
          game: this,
          initX,
          initY
        })
      case EItemName.Laser:
        return new Laser({
          ...options,
          game: this,
          initX,
          initY
        })
    }
  }
}
