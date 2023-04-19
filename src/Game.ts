import { Container, type FederatedPointerEvent } from 'pixi.js'
import { StatusBar } from './StatusBar'
import { TileMap } from './TileMap'
import { Camera } from './Camera'
import { logLayout } from './logger'
import { type ISelectable } from './common/ISelectable'

export interface IGameOptions {
  viewWidth: number
  viewHeight: number
}

export class Game extends Container {
  public gameEnded = false
  public time = 0

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
    this.setup(options)

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
}
