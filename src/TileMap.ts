import { Assets, Container, type IPointData, Sprite, type Texture } from 'pixi.js'
import { MapSettings, type IMapSettings } from './MapSettings'
import { Hitbox } from './Hitbox'
import { logLayout } from './logger'
import { manifest } from './LoaderScene'
import { BaseBuilding } from './buildings/BaseBuilding'
import { BaseVehicle } from './vehicles/BaseVehicle'
import { type BaseItem } from './common'

export interface ITileMapOptions {
  viewWidth: number
  viewHeight: number
}

interface IBoundsData {
  top: number
  right: number
  bottom: number
  left: number
}

export class TileMap extends Container {
  public gridSize !: number
  public mapGridWidth !: number
  public mapGridHeight !: number
  public currentMapTerrainGrid: Array<Array<1 | 0>> = []
  public currentMapPassableGrid: Array<Array<1 | 0>> = []
  public hitboxes = new Container<Hitbox>()
  public buildings = new Container<BaseBuilding>()
  public vehicles = new Container<BaseVehicle>()
  public background = new Sprite()
  public viewWidth!: number
  public viewHeight!: number
  public maxXPivot = 0
  public maxYPivot = 0
  constructor (options: ITileMapOptions) {
    super()
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup()
  }

  setup (): void {
    this.addChild(this.background)
    this.addChild(this.hitboxes)
    this.addChild(this.buildings)
    this.addChild(this.vehicles)
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
    this.currentMapPassableGrid = []
  }

  getViewportBounds (): IBoundsData {
    const { viewWidth, viewHeight } = this
    const { pivot: { x, y } } = this
    const bounds = {
      top: y,
      right: x + viewWidth,
      bottom: y + viewHeight,
      left: x
    }
    return bounds
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
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
    logLayout(`x=${this.x} y=${this.y} w=${width} h=${height}`)
  }

  restart (): void {
    this.pivot.set(0, 0)
  }

  cleanFromAll (): void {
    while (this.hitboxes.children[0] != null) {
      this.hitboxes.children[0].removeFromParent()
    }
  }

  handleUpdate (deltaMS: number): void {
    const items = this.items
    for (const item of items) {
      item.processOrders()
    }
  }

  addItem (item: BaseItem): void {
    if (item instanceof BaseBuilding) {
      this.buildings.addChild(item)
    } else if (item instanceof BaseVehicle) {
      this.vehicles.addChild(item)
    }
  }

  get items (): BaseItem[] {
    return [...this.buildings.children, ...this.vehicles.children]
  }

  itemUnderPointer (point: IPointData): BaseVehicle | BaseBuilding | undefined {
    // if (fog.isPointOverFog(mouse.gameX, mouse.gameY)) {
    //   return;
    // }
    const vehicle = this.vehicles.children.find(vehicle => {
      if (vehicle.isAlive() &&
        point.x >= vehicle.x &&
        point.x <= vehicle.x + vehicle.width &&
        point.y >= vehicle.y &&
        point.y <= vehicle.y + vehicle.height
      ) {
        return true
      }
      return false
    })
    if (vehicle != null) {
      return vehicle
    }
    return this.buildings.children.find(building => {
      if (building.isAlive() &&
        point.x >= building.x &&
        point.x <= building.x + building.width &&
        point.y >= building.y &&
        point.y <= building.y + building.height
      ) {
        return true
      }
      return false
    })

    // for (const item of this.buildings.children) {
    //   if (item.type === 'buildings' || item.type == 'terrain') {
    //     if (item.lifeCode != 'dead' &&
    //       item.x <= mouse.gameX / game.gridSize &&
    //       item.x >= (mouse.gameX - item.baseWidth) / game.gridSize &&
    //       item.y <= mouse.gameY / game.gridSize &&
    //       item.y >= (mouse.gameY - item.baseHeight) / game.gridSize
    //     ) {
    //       _c.log(item.uid)
    //       return item
    //     }
    //   } else if (item.type == 'aircraft') {
    //     if (item.lifeCode != 'dead' &&
    //       Math.pow(item.x - mouse.gameX / game.gridSize, 2) + Math.pow(item.y - (mouse.gameY + item.pixelShadowHeight) / game.gridSize, 2) < Math.pow((item.radius) / game.gridSize, 2)) {
    //       return item
    //     }
    //   } else {
    //     if (item.lifeCode != 'dead' && Math.pow(item.x - mouse.gameX / game.gridSize, 2) + Math.pow(item.y - mouse.gameY / game.gridSize, 2) < Math.pow((item.radius) / game.gridSize, 2)) {
    //       return item
    //     }
    //   }
    // }
  }

  rebuildPassableGrid (): void {
    this.currentMapPassableGrid = this.currentMapTerrainGrid.map(g => g.slice())
    for (let i = this.buildings.children.length - 1; i >= 0; i--) {
      const item = this.buildings.children[i]
      const { passableGrid } = item
      const itemGrid = item.getGridXY()
      for (let y = passableGrid.length - 1; y >= 0; y--) {
        for (let x = passableGrid[y].length - 1; x >= 0; x--) {
          if (passableGrid[y][x] !== 0) {
            this.currentMapPassableGrid[itemGrid.gridY + y][itemGrid.gridX + x] = 1
          }
        }
      }
    }
  }
}
