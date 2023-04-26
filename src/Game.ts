import { Container, type Spritesheet, type FederatedPointerEvent, Assets, Graphics, type IPointData } from 'pixi.js'
import { type EMessageCharacter, StatusBar } from './StatusBar'
import { TileMap } from './TileMap'
import { Camera } from './Camera'
import { logLayout, logPointerEvent } from './logger'
import { type SelectableItem, type Team } from './common'
import { Base } from './buildings/Base'
import { Harvester } from './vehicles/Harvester'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'
import { EItemType } from './interfaces/IItem'
import { type IAttackable } from './interfaces/IAttackable'
import { type IOrder } from './interfaces/IOrder'
import { AUDIO } from './audio'
import { Bullet } from './projectiles/Bullet'
import { CannonBall } from './projectiles/CannonBall'
import { Laser } from './projectiles/Laser'
import { Rocket } from './projectiles/HeatSeeker'
import { Order } from './Order'

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
  public cash = 0
  public speedAdjustmentFactor = 1 / 512
  public turnSpeedAdjustmentFactor = 1 / 64
  public speedAdjustmentWhileTurningFactor = 0.4
  public reloadAdjustmentFactor = 1 / 8
  public deployBuilding = false
  public canDeployBuilding = false

  public viewWidth: number
  public viewHeight: number
  public tileMap!: TileMap
  public statusBar!: StatusBar
  public camera!: Camera
  public selectedItems: SelectableItem[] = []
  public dragSelectThreshold = 5
  public dragSelect = new Graphics()
  public doubleTapMaxTime = 300
  public pointerDownX = -1
  public pointerDownY = -1
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
    this.tileMap = new TileMap({
      viewWidth,
      viewHeight
    })
    this.addChild(this.tileMap)
    this.addChild(this.dragSelect)

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.camera = new Camera({ tileMap: this.tileMap })
  }

  addEventLesteners (): void {
    this.tileMap.interactive = true
    this.tileMap.on('pointerdown', this.handlePointerDown)
    this.tileMap.on('pointerup', this.handlePointerUp)
    this.tileMap.on('pointermove', this.handlePointerMove)
    this.tileMap.on('pointerleave', this.handlePointerLeave)
  }

  handlePointerTap = (e: FederatedPointerEvent): void => {
    logPointerEvent('Game pointertap')
    if (this.gameEnded) {
      return
    }
    const point = this.tileMap.toLocal(e)
    const underPointerItem = this.tileMap.itemUnderPointer(point)
    const { previousPointerTapEvent } = this
    if (previousPointerTapEvent != null && underPointerItem != null &&
      (underPointerItem.type === EItemType.vehicles || underPointerItem.type === EItemType.aircraft)) {
      const isPreviousMouse = previousPointerTapEvent.pointerType === 'mouse' && e.pointerType === 'mouse' && previousPointerTapEvent.pointerId === e.pointerId
      const isPreviousTouch = previousPointerTapEvent.pointerType === 'touch' && e.pointerType === 'touch' && previousPointerTapEvent.pointerId + 1 === e.pointerId
      if ((isPreviousMouse || isPreviousTouch) && e.timeStamp - previousPointerTapEvent.timeStamp < this.doubleTapMaxTime) {
        if (Math.abs(e.globalX - previousPointerTapEvent.globalX) < 10 && Math.abs(e.globalY - previousPointerTapEvent.globalY) < 10) {
          logPointerEvent('Game pointerdoubletap')
          this.clearSelection()
          const { activeItems } = this.tileMap
          for (let i = 0; i < activeItems.length; i++) {
            const item = activeItems[i]
            if (underPointerItem.constructor === item.constructor && item.team === underPointerItem.team) {
              // select all the same items include under pointer item
              this.selectItem(item, false)
            }
          }
          return
        }
      }
    }
    const uids: number[] = []
    if (underPointerItem != null) {
      if (underPointerItem.team === this.team) {
        // Pressing shift adds to existing selection. If shift is not pressed, clear existing selection
        if (!e.shiftKey) {
          this.clearSelection()
        }
        this.selectItem(underPointerItem, e.shiftKey)
      } else if (underPointerItem.type !== EItemType.terrain) {
        // Player right clicked on an enemy item
        // identify selected items from players team that can attack
        for (let i = this.selectedItems.length - 1; i >= 0; i--) {
          const item = this.selectedItems[i]
          if (item.team === this.team && (item as unknown as IAttackable).canAttack) {
            if (item.uid != null) {
              uids.push(item.uid)
            }
          }
        }
        // then command them to attack the clicked item
        if (uids.length > 0) {
          this.processCommand(uids, { type: 'attack', toUid: underPointerItem.uid })
          AUDIO.play('acknowledge-attacking')
        }
      }
    } else {
      // Player right clicked on the ground
      // identify selected items from players team that can move
      for (let i = this.selectedItems.length - 1; i >= 0; i--) {
        const item = this.selectedItems[i]
        if (item.team === this.team && (item.type === EItemType.vehicles || item.type === EItemType.aircraft)) {
          if (item.uid != null) {
            uids.push(item.uid)
          }
        }
      }
      // then command them to move to the clicked location
      if (uids.length > 0) {
        const { gridSize } = this.tileMap
        this.processCommand(uids, { type: 'move', to: { gridX: point.x / gridSize, gridY: point.y / gridSize }, collisionCount: 0 })
        AUDIO.play('acknowledge-moving')
      }
    }

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
    const localPosition = this.toLocal(e)
    this.pointerDownX = localPosition.x
    this.pointerDownY = localPosition.y
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} down`)
  }

  handlePointerUp = (e: FederatedPointerEvent): void => {
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} up`)
    if (this.dragSelect.width === 0) {
      this.handlePointerTap(e)
    } else {
      this.clearSelection()
      const dragSelectBounds = this.dragSelect.getBounds()
      const startPoint = this.tileMap.toLocal({ x: dragSelectBounds.left, y: dragSelectBounds.top })
      const endPoint = this.tileMap.toLocal({ x: dragSelectBounds.right, y: dragSelectBounds.bottom })
      const left = startPoint.x
      const right = endPoint.x
      const top = startPoint.y
      const bottom = endPoint.y
      const { activeItems } = this.tileMap
      const toSelectItems = activeItems.filter((activeItem) => {
        if (!activeItem.selectable || activeItem.isDead()) {
          return false
        }

        const itemBounds = activeItem.getSelectionBounds()

        if (itemBounds.left >= left &&
          itemBounds.right <= right &&
          itemBounds.top >= top &&
          itemBounds.bottom <= bottom
        ) {
          return true
        }
        return false
      })
      const enemyItemsCount = toSelectItems.filter(item => item.team !== this.team).length
      toSelectItems.forEach(item => {
        if (enemyItemsCount > 0 && enemyItemsCount !== toSelectItems.length) {
          if (item.team === this.team) {
            // if at leat one enemy item is selection => select only ours items
            this.selectItem(item, true)
          }
        } else {
          // otherwise select all our items
          this.selectItem(item, true)
        }
      })
    }
    this.dragSelect.clear()
  }

  handlePointerLeave = (): void => {
    this.pointerDownX = this.pointerDownY = -1
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} leave`)
    this.dragSelect.clear()
  }

  handlePointerMove = (e: FederatedPointerEvent): void => {
    const localPosition = this.toLocal(e)
    logPointerEvent(`Game pdX=${this.pointerDownX} pdX=${this.pointerDownY} mX=${e.x} mY=${e.y}`)
    if (this.pointerDownX > -1 && this.pointerDownY > -1 &&
      Math.abs(localPosition.x - this.pointerDownX) > this.dragSelectThreshold &&
      Math.abs(localPosition.y - this.pointerDownY) > this.dragSelectThreshold) {
      this.drawDragSelect(localPosition)
    }
  }

  drawDragSelect (currentPosition: IPointData): void {
    this.dragSelect.clear()
    const width = Math.abs(currentPosition.x - this.pointerDownX)
    const height = Math.abs(currentPosition.y - this.pointerDownY)
    if (width > 0 && height > 0) {
      this.dragSelect.lineStyle({
        width: 1,
        color: 0xffff00
      })
      const x = Math.min(currentPosition.x, this.pointerDownX)
      const y = Math.min(currentPosition.y, this.pointerDownY)
      this.dragSelect.position.set(x, y)
      this.dragSelect.drawRect(0, 0, width, height)
      this.dragSelect.endFill()
    }
  }

  isItemSelected (item: SelectableItem): boolean {
    return this.selectedItems.includes(item)
  }

  selectItem (item: SelectableItem, shiftPressed: boolean): void {
    // Pressing shift and clicking on a selected item will deselect it
    if (shiftPressed && item.selected) {
      this.deselectItem(item)
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

  startGame = ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void => {
    this.gameEnded = false
    this.time = 0
    this.runLevel({ mapImageSrc, mapSettingsSrc })
  }

  endGame (message: string): void {
    this.gameEnded = true
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.statusBar.handleResize({ viewWidth, viewHeight })
    this.tileMap.handleResize({ viewWidth, viewHeight })

    const availableWidth = viewWidth
    const availableHeight = viewHeight
    const totalWidth = this.tileMap.background.width
    const totalHeight = this.tileMap.background.height
    const occupiedWidth = totalWidth
    const occupiedHeight = totalHeight
    const x = availableWidth > occupiedWidth ? (availableWidth - occupiedWidth) / 2 : 0
    const y = availableHeight > occupiedHeight ? (availableHeight - occupiedHeight) / 2 : 0
    logLayout(`aw=${availableWidth} (ow=${occupiedWidth}) x=${x} ah=${availableHeight} (oh=${occupiedHeight}) y=${y}`)
    this.statusBar.visible = false
    this.x = x
    this.y = y
    logLayout(`x=${x} y=${y}`)
    this.statusBar.visible = true

    const calcWidth = availableWidth > occupiedWidth ? occupiedWidth : availableWidth
    this.statusBar.position.set(calcWidth / 2 - this.statusBar.width / 2, 0)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      return
    }
    this.time += deltaMS
    this.statusBar.handleUpdate(deltaMS)
    this.tileMap.handleUpdate(deltaMS)
    this.camera.handleUpdate(deltaMS)

    this.drawOrders()
  }

  drawOrders (): void {
    this.selectedItems.forEach(selectedItem => {
      if (selectedItem.type === EItemType.vehicles || selectedItem.type === EItemType.aircraft) {
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
    this.tileMap.restart()
    this.tileMap.cleanFromAll()

    this.tileMap.initLevel({ mapImageSrc, mapSettingsSrc })
  }

  clearSelection (): void {
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
        upTextures: [textures['fire-ball-up.png']],
        upRightTextures: [textures['fire-ball-up-right.png']],
        rightTextures: [textures['fire-ball-right.png']],
        downRightTextures: [textures['fire-ball-down-right.png']],
        downTextures: [textures['fire-ball-down.png']],
        downLeftTextures: [textures['fire-ball-down-left.png']],
        leftTextures: [textures['fire-ball-left.png']],
        upLeftTextures: [textures['fire-ball-up-left.png']],
        explodeTextures: animations['fire-ball-explode']
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
  }

  // Receive command from singleplayer or multiplayer object and send it to units
  processCommand (uids: number[], orders: IOrder): void {
    // In case the target "to" object is in terms of uid, fetch the target object
    let toObject
    if (orders.type === 'attack' || orders.type === 'guard') {
      if (typeof orders.toUid === 'number') {
        toObject = this.tileMap.getItemByUid(orders.toUid)
        if ((toObject == null) || toObject.isDead()) {
          // To object no longer exists. Invalid command
          return
        }
      }
    }

    for (const uid of uids) {
      const item = this.tileMap.getItemByUid(uid)
      // if uid is a valid item, set the order for the item
      if (item != null) {
        item.orders = Object.assign({}, orders)
        if (toObject != null && item.orders.type !== 'stand') {
          item.orders.to = toObject
        }
      }
    }
  }

  showMessage ({ character, message, playSound = true }: { character: EMessageCharacter, message: string, playSound?: boolean }): void {
    if (playSound) {
      AUDIO.play('message-received')
    }
    this.statusBar.appendMessage({ character, message, time: this.time })
  }
}
