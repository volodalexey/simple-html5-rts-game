import { Assets, Container, type IPointData, Sprite, type Texture } from 'pixi.js'
import { MapSettings, type IMapSettings } from './MapSettings'
import { Hitbox } from './Hitbox'
import { manifest } from './LoaderScene'
import { Building } from './buildings/Building'
import { Vehicle } from './vehicles/Vehicle'
import { type BaseMoveableItem, type BaseActiveItem, type BaseItem } from './common'
import { Projectile } from './projectiles/Projectile'
import { type Order } from './Order'
import { type Game } from './Game'

export interface ITileMapOptions {
  game: Game
  initX?: number
  initY?: number
}

type GridArray = Array<Array<1 | 0>>

export class TileMap extends Container {
  public game !: Game
  public gridSize !: number
  public mapGridWidth !: number
  public mapGridHeight !: number
  public currentMapTerrainGrid: GridArray = []
  public rebuildRequired = false
  private _currentMapPassableGrid: GridArray = []
  private readonly _currentCopyMapPassableGrid: GridArray = []
  public hitboxes = new Container<Hitbox>()
  public buildings = new Container<Building>()
  public vehicles = new Container<Vehicle>()
  public orders = new Container<Order>()
  public projectiles = new Container<Projectile>()
  public background = new Sprite()
  public minXPivot = 0
  public maxXPivot = 0
  public minYPivot = 0
  public maxYPivot = 0
  public minScale = 0
  public maxScale = 0

  static options = {
    maxScaleRatio: 5
  }

  constructor (options: ITileMapOptions) {
    super()
    this.game = options.game
    this.setup()

    if (typeof options.initX === 'number') {
      this.position.x = options.initX
    }
    if (typeof options.initY === 'number') {
      this.position.y = options.initY
    }
  }

  setup (): void {
    this.addChild(this.background)
    this.addChild(this.hitboxes)
    this.addChild(this.buildings)
    this.addChild(this.orders)
    this.addChild(this.vehicles)
    this.addChild(this.projectiles)
  }

  static async idleLoad (): Promise<void> {
    await Assets.loadBundle(manifest.bundles
      .map(b => b.name)
      .filter((_, idx) => {
        return idx > 0
      }))
  }

  initLevel ({ mapImageSrc, mapSettingsSrc, viewWidth, viewHeight }: {
    mapImageSrc: string
    mapSettingsSrc: string
    viewWidth: number
    viewHeight: number
  }): void {
    const background: Texture = Assets.get(mapImageSrc)
    const settings: IMapSettings = Assets.get(mapSettingsSrc)

    this.background.texture = background
    this.background.scale.set(1, 1)

    const hitboxesPoints = MapSettings.mapTilesToPositions({
      mapSettings: settings,
      layerName: 'Water,Clay,Lava,Rock-Fence'
    })

    hitboxesPoints.forEach(cp => {
      this.hitboxes.addChild(new Hitbox({
        initX: cp.x,
        initY: cp.y,
        initGridX: Math.floor(cp.x / settings.tilewidth),
        initGridY: Math.floor(cp.y / settings.tileheight),
        initWidth: cp.width,
        initHeight: cp.height
      }))
    })

    this.gridSize = settings.tilewidth
    this.mapGridWidth = settings.width
    this.mapGridHeight = settings.height

    // Create a grid that stores all obstructed tiles as 1 and unobstructed as 0
    this.currentMapTerrainGrid = []
    for (let y = 0; y < settings.height; y++) {
      this.currentMapTerrainGrid[y] = []
      for (let x = 0; x < settings.width; x++) {
        this.currentMapTerrainGrid[y][x] = 0
      }
    }
    for (let i = this.hitboxes.children.length - 1; i >= 0; i--) {
      const obstruction = this.hitboxes.children[i]
      this.currentMapTerrainGrid[obstruction.initGridY][obstruction.initGridX] = 1
    }
    this._currentMapPassableGrid = []

    this.rebuildRequired = true
    this.calcScaleLimits()
    this.calcPivotLimits()
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.calcScaleLimits()
    this.checkScaleLimits()
    this.calcPivotLimits()
    this.checkPivotLimits()
  }

  calcPivotLimits (): void {
    const { width: viewWidth, height: viewHeight } = this.game.camera
    const { scale } = this
    const { width: bgWidth, height: bgHeight } = this.background
    const width = bgWidth * scale.x
    const height = bgHeight * scale.y
    if (width > viewWidth) {
      this.maxXPivot = (width - viewWidth) / scale.x
    } else {
      this.maxXPivot = 0
    }
    this.minXPivot = 0
    if (height > viewHeight) {
      this.maxYPivot = (height - viewHeight) / scale.y
    } else {
      this.maxYPivot = 0
    }
    this.minYPivot = 0
  }

  calcScaleLimits (): void {
    const { width: viewWidth, height: viewHeight } = this.game.camera
    const { maxScaleRatio } = TileMap.options
    const { width, height } = this.background
    this.minScale = 1
    this.maxScale = maxScaleRatio * Math.min(width / viewWidth, height / viewHeight)
  }

  checkScaleLimits (): void {
    const { scale } = this
    if (scale.x < this.minScale) {
      scale.x = this.minScale
    } else if (scale.x > this.maxScale) {
      scale.x = this.maxScale
    }
    if (scale.y < this.minScale) {
      scale.y = this.minScale
    } else if (scale.y > this.maxScale) {
      scale.y = this.maxScale
    }
  }

  cleanFromAll (): void {
    this.pivot.set(0, 0)
    while (this.hitboxes.children[0] != null) {
      this.hitboxes.children[0].removeFromParent()
    }
    while (this.vehicles.children[0] != null) {
      this.vehicles.children[0].removeFromParent()
    }
    while (this.buildings.children[0] != null) {
      this.buildings.children[0].removeFromParent()
    }
    while (this.projectiles.children[0] != null) {
      this.projectiles.children[0].removeFromParent()
    }
    while (this.orders.children[0] != null) {
      this.orders.children[0].removeFromParent()
    }
  }

  handleUpdate (deltaMS: number): void {
    const items = this.allItems
    for (const item of items) {
      item.handleUpdate(deltaMS)
    }
  }

  addItem (item: BaseItem): void {
    if (item instanceof Building) {
      this.buildings.addChild(item)
    } else if (item instanceof Vehicle) {
      this.vehicles.addChild(item)
    } else if (item instanceof Projectile) {
      this.projectiles.addChild(item)
    }
  }

  get activeItems (): BaseActiveItem[] {
    return [...this.buildings.children, ...this.vehicles.children]
  }

  get moveableItems (): BaseMoveableItem[] {
    return [...this.vehicles.children]
  }

  get allItems (): BaseItem[] {
    return [...this.buildings.children, ...this.vehicles.children, ...this.projectiles.children]
  }

  itemUnderPointer (point: IPointData): BaseActiveItem | undefined {
    // if (fog.isPointOverFog(mouse.gameX, mouse.gameY)) {
    //   return;
    // }
    return this.activeItems.find(activeItem => {
      const itemBounds = activeItem.getSelectionBounds()
      if (activeItem.isAlive() &&
        point.x >= itemBounds.left &&
        point.x <= itemBounds.right &&
        point.y >= itemBounds.top &&
        point.y <= itemBounds.bottom
      ) {
        return true
      }
      return false
    })
  }

  get currentMapPassableGrid (): GridArray {
    if (this.rebuildRequired) {
      this.rebuildPassableGrid()
      this.rebuildRequired = false
    }
    return this._currentMapPassableGrid
  }

  get currentCopyMapPassableGrid (): GridArray {
    const { currentMapPassableGrid } = this
    this._currentCopyMapPassableGrid.length = currentMapPassableGrid.length
    for (let i = 0; i < currentMapPassableGrid.length; i++) {
      if (!Array.isArray(this._currentCopyMapPassableGrid[i])) {
        this._currentCopyMapPassableGrid[i] = new Array(currentMapPassableGrid[i].length)
      } else {
        this._currentCopyMapPassableGrid[i].length = currentMapPassableGrid[i].length
      }
      for (let j = 0; j < currentMapPassableGrid[i].length; j++) {
        this._currentCopyMapPassableGrid[i][j] = currentMapPassableGrid[i][j]
      }
    }
    return this._currentCopyMapPassableGrid
  }

  rebuildPassableGrid (): void {
    this._currentMapPassableGrid = this.currentMapTerrainGrid.map(g => g.slice())
    for (let i = this.buildings.children.length - 1; i >= 0; i--) {
      const item = this.buildings.children[i]
      const { passableGrid } = item
      const itemGrid = item.getGridXY()
      for (let y = passableGrid.length - 1; y >= 0; y--) {
        for (let x = passableGrid[y].length - 1; x >= 0; x--) {
          if (passableGrid[y][x] !== 0) {
            this._currentMapPassableGrid[itemGrid.gridY + y][itemGrid.gridX + x] = 1
          }
        }
      }
    }
  }

  getItemByUid (uid: number, activeItems?: BaseActiveItem[]): BaseActiveItem | undefined {
    return (activeItems ?? this.activeItems).find(item => item.uid === uid)
  }

  isItemsDead (uids: number[] | number): boolean {
    if (!Array.isArray(uids)) {
      uids = [uids]
    }
    const { activeItems } = this
    return uids.some(uid => {
      const activeItem = this.getItemByUid(uid, activeItems)
      return activeItem == null || activeItem.isDead()
    })
  }

  goTo ({ x, y }: { x: number, y: number }): void {
    const { pivot } = this
    pivot.x = x
    pivot.y = y
    this.checkPivotLimits()
  }

  goDiff ({ diffX, diffY }: { diffX: number, diffY: number }): void {
    const { pivot } = this
    pivot.x += diffX
    pivot.y += diffY
    this.checkPivotLimits()
  }

  checkPivotLimits (): void {
    const { pivot } = this
    if (pivot.x < this.minXPivot) {
      pivot.x = this.minXPivot
    } else if (pivot.x > this.maxXPivot) {
      pivot.x = this.maxXPivot
    }
    if (pivot.y < this.minYPivot) {
      pivot.y = this.minYPivot
    } else if (pivot.y > this.maxYPivot) {
      pivot.y = this.maxYPivot
    }
  }

  zoom ({ scaleFactor, sX = 0, sY = 0 }: { scaleFactor: number, sX?: number, sY?: number }): void {
    const absScaleFactor = Math.abs(scaleFactor)
    const { pivot: { x: curPivotX, y: curPivotY }, scale: { x: curScaleX } } = this
    const curDiffX = sX - curPivotX
    const curDiffY = sY - curPivotY
    let newScale
    if (scaleFactor >= 0) {
      newScale = curScaleX * absScaleFactor
    } else {
      newScale = curScaleX / absScaleFactor
    }
    if (newScale < this.minScale) {
      newScale = this.minScale
    } else if (newScale > this.maxScale) {
      newScale = this.maxScale
    }
    const scaleDiff = curScaleX / newScale
    let newDiffX, newDiffY
    if (scaleFactor >= 0) {
      newDiffX = curDiffX * scaleDiff
      newDiffY = curDiffY * scaleDiff
    } else {
      newDiffX = curDiffX * scaleDiff
      newDiffY = curDiffY * scaleDiff
    }
    // new-pivot = old-pivot + old-camera-to-point - new-camera-top-point
    const newPivotX = curPivotX + (scaleFactor >= 0 ? 1 : -1) * Math.abs(curDiffX - newDiffX)
    const newPivotY = curPivotY + (scaleFactor >= 0 ? 1 : -1) * Math.abs(curDiffY - newDiffY)
    this.scale.set(newScale, newScale)
    this.pivot.set(newPivotX, newPivotY)
    this.checkScaleLimits()
    this.calcPivotLimits()
    this.checkPivotLimits()
  }
}
