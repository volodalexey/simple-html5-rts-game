import { Container, type Spritesheet, type FederatedPointerEvent, Assets } from 'pixi.js'
import { StatusBar } from './StatusBar'
import { TileMap } from './TileMap'
import { Camera } from './Camera'
import { logLayout } from './logger'
import { type ISelectable } from './interfaces/ISelectable'
import { type Team } from './common'
import { Base } from './buildings/Base'
import { Harvester } from './vehicles/Harvester'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'

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
  public speedAdjustmentFactor = 1 / 64
  public turnSpeedAdjustmentFactor = 1 / 8

  public viewWidth: number
  public viewHeight: number
  public tileMap!: TileMap
  public statusBar!: StatusBar
  public camera!: Camera
  public selectedItems: ISelectable[] = []

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

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.camera = new Camera({ tileMap: this.tileMap })
  }

  addEventLesteners (): void {
    this.tileMap.interactive = true
    this.tileMap.on('pointertap', this.handlePointerTap)
  }

  handlePointerTap = (e: FederatedPointerEvent): void => {
    const underPointerItem = this.tileMap.itemUnderPointer(this.tileMap.toLocal(e))
    if (underPointerItem != null) {
      // Pressing shift adds to existing selection. If shift is not pressed, clear existing selection
      if (!e.shiftKey) {
        this.clearSelection()
      }
      this.selectItem(underPointerItem, e.shiftKey)
    }
  }

  selectItem (item: ISelectable, shiftPressed: boolean): void {
    // Pressing shift and clicking on a selected item will deselect it
    if (shiftPressed && item.selected) {
      // deselect item
      item.selected = false
      for (let i = this.selectedItems.length - 1; i >= 0; i--) {
        if (this.selectedItems[i] === item) {
          this.selectedItems.splice(i, 1)
          break
        }
      }
      return
    }

    if (item.selectable && !item.selected) {
      item.setSelected(true)
      this.selectedItems.push(item)
    }
  }

  startGame = ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void => {
    this.gameEnded = false
    this.time = 0
    this.runLevel({ mapImageSrc, mapSettingsSrc })
  }

  endGame (): void {
    this.gameEnded = true
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
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
    this.statusBar.updateTime(this.time)
    this.tileMap.handleUpdate(deltaMS)
    this.camera.handleUpdate(deltaMS)
  }

  runLevel ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void {
    this.tileMap.restart()
    this.tileMap.cleanFromAll()

    this.tileMap.initLevel({ mapImageSrc, mapSettingsSrc })

    this.statusBar.updateLevel(0)
  }

  clearSelection (): void {
    while (this.selectedItems.length > 0) {
      this.selectedItems.pop()?.setSelected(false)
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
  }
}
