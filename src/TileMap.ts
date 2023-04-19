import { Assets, Container, type IPointData, Sprite, type Texture } from 'pixi.js'
import { MapSettings, type IMapSettings } from './MapSettings'
import { Hitbox } from './Hitbox'
import { logLayout } from './logger'
import { manifest } from './LoaderScene'
import { BaseBuilding } from './buildings/BaseBuilding'
import { Base, type IBaseOptions } from './buildings/Base'
import { HeavyTank, type IHeavyTankOptions } from './vehicles/HeavyTank'
import { BaseVehicle } from './vehicles/BaseVehicle'

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
        initWidth: cp.width,
        initHeight: cp.height
      }))
    })
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

  }

  addItem (item: BaseBuilding | BaseVehicle): void {
    if (item instanceof BaseBuilding) {
      this.buildings.addChild(item)
    } else if (item instanceof BaseVehicle) {
      this.vehicles.addChild(item)
    }
  }

  addBaseBuilding (options: IBaseOptions): void {
    this.addItem(new Base(options))
  }

  addHeavyTankVehicle (options: IHeavyTankOptions): void {
    this.addItem(new HeavyTank(options))
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
}
