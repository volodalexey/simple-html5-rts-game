import { Assets, Container, type IPointData, Sprite, type Texture } from 'pixi.js'
import { MapSettings, type IMapSettings } from './MapSettings'
import { Hitbox } from './Hitbox'
import { manifest } from './LoaderScene'
import { BaseBuilding } from './buildings/BaseBuilding'
import { BaseVehicle } from './vehicles/BaseVehicle'
import { type BaseMoveableItem, type BaseActiveItem, type BaseItem } from './common'
import { BaseProjectile } from './projectiles/BaseProjectile'
import { type Order } from './Order'

export interface ITileMapOptions {
  viewWidth: number
  viewHeight: number
  initX?: number
  initY?: number
}

type GridArray = Array<Array<1 | 0>>

export class TileMap extends Container {
  public gridSize !: number
  public mapGridWidth !: number
  public mapGridHeight !: number
  public currentMapTerrainGrid: GridArray = []
  public rebuildRequired = false
  private _currentMapPassableGrid: GridArray = []
  private readonly _currentCopyMapPassableGrid: GridArray = []
  public hitboxes = new Container<Hitbox>()
  public buildings = new Container<BaseBuilding>()
  public vehicles = new Container<BaseVehicle>()
  public orders = new Container<Order>()
  public projectiles = new Container<BaseProjectile>()
  public background = new Sprite()
  public maxXPivot = 0
  public maxYPivot = 0
  constructor (options: ITileMapOptions) {
    super()
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

  initLevel ({ mapImageSrc, mapSettingsSrc }: { mapImageSrc: string, mapSettingsSrc: string }): void {
    const background: Texture = Assets.get(mapImageSrc)
    const settings: IMapSettings = Assets.get(mapSettingsSrc)

    this.background.texture = background

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
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.calcMaxPivot({ viewWidth, viewHeight })
    this.checkMaxPivot()
  }

  calcMaxPivot ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    const { width, height, scale } = this.background
    if (width > viewWidth) {
      this.maxXPivot = (width - viewWidth) / scale.x
    } else {
      this.maxXPivot = 0
    }
    if (height > viewHeight) {
      this.maxYPivot = (height - viewHeight) / scale.y
    } else {
      this.maxYPivot = 0
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
    if (item instanceof BaseBuilding) {
      this.buildings.addChild(item)
    } else if (item instanceof BaseVehicle) {
      this.vehicles.addChild(item)
    } else if (item instanceof BaseProjectile) {
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
    this.checkMaxPivot()
  }

  goDiff ({ diffX, diffY }: { diffX: number, diffY: number }): void {
    const { pivot } = this
    pivot.x += diffX
    pivot.y += diffY
    this.checkMaxPivot()
  }

  checkMaxPivot (): void {
    const { pivot } = this
    if (pivot.x < 0) {
      pivot.x = 0
    } else if (pivot.x > this.maxXPivot) {
      pivot.x = this.maxXPivot
    }
    if (pivot.y < 0) {
      pivot.y = 0
    } else if (pivot.y > this.maxYPivot) {
      pivot.y = this.maxYPivot
    }
  }
}
