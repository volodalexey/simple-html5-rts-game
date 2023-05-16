import { Assets, Container, type IPointData, Sprite, type Texture, Text, Graphics, BlurFilter } from 'pixi.js'
import { MapSettings, type IMapSettings } from '../utils/MapSettings'
import { Hitbox } from '../utils/Hitbox'
import { manifest } from '../scenes/LoaderScene'
import { type Building } from '../buildings/Building'
import { type Vehicle } from '../vehicles/Vehicle'
import { type Team, type BaseActiveItem, type BaseItem, type BaseMoveableItem } from '../utils/helpers'
import { type Projectile } from '../projectiles/Projectile'
import { type Order } from '../utils/Order'
import { type Game } from '../Game'
import { EItemType } from '../interfaces/IItem'
import { logGrid, logHitboxes, logNoFog, logNoSightHide } from '../utils/logger'
import { type AirVehicle } from '../air-vehicles/AirVehicle'
import { ECommandName } from '../interfaces/ICommand'
import { GroundTurret } from '../buildings/GroundTurret'
import { Starport } from '../buildings/Starport'
import { OilDerrick } from '../buildings/OilDerrick'
import { SceneManager } from '../scenes/SceneManager'

export interface ITileMapOptions {
  game: Game
  initX?: number
  initY?: number
}

type GridArray = Array<Array<1 | 0>>

class ActiveItems extends Container<BaseActiveItem> {}
class Orders extends Container<Order> {}
class Projectiles extends Container<Projectile> {}
class SightOuter extends Graphics {}
class SightInner extends Graphics {}
class Background extends Sprite {}
class Hitboxes extends Container<Hitbox> {}

export class TileMap extends Container {
  public game !: Game
  public gridSize !: number
  public mapGridWidth !: number
  public mapGridHeight !: number
  public rebuildPassableRequired = false
  private _initialMapTerrainGrid: GridArray = []
  private _currentMapPassableGrid: GridArray = []
  private _currentMapBuildableGrid: GridArray = []
  private _initialMapDeployableGrid: GridArray = []
  private _currentMapDeployableGrid: GridArray = []
  private readonly _currentCopyMapPassableGrid: GridArray = []
  public hitboxes = new Hitboxes()
  public activeItems = new ActiveItems()
  public orders = new Orders()
  public projectiles = new Projectiles()
  public sightBlurred = new SightOuter()
  public sight = new SightInner()
  public background = new Background()
  public background2 = new Background()
  public background3 = new Background()
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
    this.addChild(this.background2)
    this.addChild(this.background3)
    this.addChild(this.activeItems)
    this.addChild(this.hitboxes)
    this.addChild(this.orders)
    this.addChild(this.projectiles)
    this.addChild(this.sightBlurred)
    this.addChild(this.sight)
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
    if (!logNoFog.enabled) {
      this.background2.texture = background
      this.background3.texture = background
      this.background2.alpha = 0.5
    }
    this.scale.set(1, 1)
    this.pivot.set(0, 0)

    const hitboxesPoints = MapSettings.mapTilesToPositions({
      mapSettings: settings,
      layerName: 'Water,Clay,Lava,Rock-Fence'
    })

    this.gridSize = settings.tilewidth
    this.mapGridWidth = settings.width
    this.mapGridHeight = settings.height

    this._initialMapTerrainGrid = []

    for (let y = 0; y < this.mapGridHeight; y++) {
      this._initialMapTerrainGrid[y] = []
      for (let x = 0; x < this.mapGridWidth; x++) {
        const initX = x * settings.tilewidth
        const initY = y * settings.tileheight
        const foundInPoints = hitboxesPoints.some(hp => hp.x === initX && hp.y === initY)
        // Create a grid that stores all obstructed tiles as 1 and unobstructed as 0
        this._initialMapTerrainGrid[y][x] = foundInPoints ? 1 : 0
      }
    }
    this.hitboxes.alpha = 0.3

    if (logGrid.enabled) {
      for (let x = 0; x < this.mapGridWidth; x++) {
        for (let y = 0; y < this.mapGridHeight; y++) {
          const gr = new Graphics()
          gr.beginFill(0xffffff)
          gr.position.set(x * this.gridSize, y * this.gridSize)
          gr.drawRect(0, 0, this.gridSize, this.gridSize)
          gr.endFill()
          gr.beginHole()
          gr.drawRect(1, 1, this.gridSize - 1 * 2, this.gridSize - 1 * 2)
          gr.endHole()
          const text = new Text(`x=${x}\ny=${y}`, {
            fontSize: 20,
            fill: 0xffff00,
            align: 'center'
          })
          text.anchor.set(0.5, 0.5)
          text.position.set(this.gridSize / 2, this.gridSize / 2)
          text.scale.set(0.4)
          gr.addChild(text)
          gr.alpha = 0.3
          this.background3.addChild(gr)
        }
      }
    }
    Hitbox.prepareTextures({
      texture: SceneManager.app.renderer.generateTexture(Hitbox.prepareGraphics({
        mapGridWidth: this.mapGridWidth,
        mapGridHeight: this.mapGridHeight,
        tileWidth: settings.tilewidth,
        tileHeight: settings.tileheight,
        borderWidth: 2
      }))
    })
    for (let x = 0; x < this.mapGridWidth; x++) {
      for (let y = 0; y < this.mapGridHeight; y++) {
        const initX = settings.tilewidth * x
        const initY = settings.tileheight * y
        const hitbox = new Hitbox({ initGridX: x, initGridY: y })
        hitbox.position.set(initX, initY)
        this.hitboxes.addChild(hitbox)
      }
    }

    this._initialMapDeployableGrid = []
    const oilFieldsPoints = MapSettings.mapObjectToPositions({
      mapSettings: settings,
      layerName: 'Oilfields'
    })
    for (let y = 0; y < this.mapGridHeight; y++) {
      this._initialMapDeployableGrid[y] = []
      for (let x = 0; x < this.mapGridWidth; x++) {
        this._initialMapDeployableGrid[y][x] = 1 // init all grid as not possible to deploy
      }
    }
    const { buildableGrid } = OilDerrick
    oilFieldsPoints.forEach(oilFieldsPoint => {
      for (let y = buildableGrid.length - 1; y >= 0; y--) {
        for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
          this._initialMapDeployableGrid[oilFieldsPoint.y / this.gridSize + y][oilFieldsPoint.x / this.gridSize + x] = 0
        }
      }
    })

    this._currentMapPassableGrid = []
    this._currentMapBuildableGrid = []

    this.rebuildPassableRequired = true
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
    const { width: camWidth, height: camHeight } = this.game.camera
    const { scale, gridSize } = this
    const { width: bgWidth, height: bgHeight } = this.background
    const maxBgWidth = (bgWidth + gridSize) * scale.x
    const maxBgHeight = (bgHeight + gridSize) * scale.y
    const viewWidth = camWidth
    const viewHeight = camHeight
    if (maxBgWidth > viewWidth) {
      this.maxXPivot = (maxBgWidth - viewWidth) / scale.x
      this.minXPivot = -gridSize
    } else {
      this.maxXPivot = -gridSize
      this.minXPivot = -gridSize
    }
    if (maxBgHeight > viewHeight) {
      this.maxYPivot = (maxBgHeight - viewHeight) / scale.y
      this.minYPivot = -gridSize
    } else {
      this.maxYPivot = -gridSize
      this.minYPivot = -gridSize
    }
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
    this.scale.set(1, 1)
    while (this.activeItems.children[0] != null) {
      this.activeItems.children[0].removeFromParent()
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
    const selectedCommandName = this.game.sideBar.commandsBar.getSelectedCommandName()
    const cash = this.game.cash[this.game.team]
    if ((selectedCommandName === ECommandName.buildTurret && cash >= GroundTurret.cost) ||
      (selectedCommandName === ECommandName.buildStarport && cash >= Starport.cost) ||
      logHitboxes.enabled) {
      this.rebuildBuildableGrid()
      Hitbox.updateColor({
        currentMapGrid: this.currentMapBuildableGrid,
        hitboxes: this.hitboxes,
        cameraGridBounds: this.game.camera.getCameraGridBounds()
      })
      this.hitboxes.visible = true
    } else if (selectedCommandName === ECommandName.deploy || logHitboxes.enabled) {
      this.rebuildBuildableGrid()
      this.mergeBuildableGridIntoDeployable()
      Hitbox.updateColor({
        currentMapGrid: this._currentMapDeployableGrid,
        hitboxes: this.hitboxes,
        cameraGridBounds: this.game.camera.getCameraGridBounds()
      })
      this.hitboxes.visible = true
    } else {
      this.hitboxes.visible = false
    }
    this.game.tileMap.activeItems.sortChildren()
    this.updateFog()
  }

  addItem (item: BaseItem): void {
    if (item.type === EItemType.buildings || item.type === EItemType.vehicles || item.type === EItemType.airVehicles) {
      this.activeItems.addChild(item as BaseActiveItem)
    } else if (item.type === EItemType.projectiles) {
      this.projectiles.addChild(item as Projectile)
    }
  }

  get moveableItems (): BaseMoveableItem[] {
    return [...this.activeItems.children.filter(
      (item): item is BaseMoveableItem => item.type === EItemType.vehicles || item.type === EItemType.airVehicles)]
  }

  get groundMoveableItems (): Vehicle[] {
    return [...this.activeItems.children.filter(
      (item): item is Vehicle => item.type === EItemType.vehicles)]
  }

  get airMoveableItems (): AirVehicle[] {
    return [...this.activeItems.children.filter(
      (item): item is AirVehicle => item.type === EItemType.airVehicles)]
  }

  get staticItems (): Building[] {
    return [...this.activeItems.children.filter((item): item is Building => item.type === EItemType.buildings)]
  }

  get allItems (): BaseItem[] {
    return [...this.activeItems.children, ...this.projectiles.children]
  }

  getTeamMoveableItems (team: Team): BaseMoveableItem[] {
    return this.moveableItems.filter(item => item.team === team)
  }

  getTeamStaticItems (team: Team): Building[] {
    return this.staticItems.filter(item => item.team === team)
  }

  itemUnderPointer (point: IPointData): BaseActiveItem | undefined {
    const detect = (activeItem: BaseActiveItem): boolean => {
      if (activeItem.renderable) {
        const itemBounds = activeItem.getCollisionBounds()
        if (activeItem.isAlive() &&
          point.x >= itemBounds.left &&
          point.x <= itemBounds.right &&
          point.y >= itemBounds.top &&
          point.y <= itemBounds.bottom
        ) {
          return true
        }
      }
      return false
    }
    const activeItem = this.moveableItems.find(detect)
    if (activeItem != null) {
      return activeItem
    }
    return this.staticItems.find(detect)
  }

  get currentMapPassableGrid (): GridArray {
    if (this.rebuildPassableRequired) {
      this.rebuildPassableGrid()
      this.rebuildPassableRequired = false
    }
    return this._currentMapPassableGrid
  }

  get currentMapBuildableGrid (): GridArray {
    return this._currentMapBuildableGrid
  }

  get initialMapDeployableGrid (): GridArray {
    return this._initialMapDeployableGrid
  }

  get currentMapDeployableGrid (): GridArray {
    return this._currentMapDeployableGrid
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
    if (this._currentMapPassableGrid.length !== this._initialMapTerrainGrid.length) {
      this._currentMapPassableGrid = this._initialMapTerrainGrid.map(g => g.slice())
    }
    const { staticItems } = this
    for (let i = staticItems.length - 1; i >= 0; i--) {
      const item = staticItems[i]
      const itemGrid = item.getGridXY({ floor: true })
      const passablePoints = item.calcPassablePoints(itemGrid)
      passablePoints.forEach(({ gridX, gridY }) => {
        this._currentMapPassableGrid[gridY][gridX] = 1
      })
    }
  }

  rebuildBuildableGrid (exceptItem?: Vehicle): void {
    if (this._currentMapBuildableGrid.length !== this._initialMapTerrainGrid.length) {
      this._currentMapBuildableGrid = this._initialMapTerrainGrid.map(g => g.slice())
    }
    for (let x = 0; x < this.mapGridWidth; x++) {
      for (let y = 0; y < this.mapGridHeight; y++) {
        this._currentMapBuildableGrid[y][x] = this._initialMapTerrainGrid[y][x]
      }
    }
    const { activeItems } = this
    const { tileMap: { mapGridWidth, mapGridHeight } } = this.game
    for (let i = activeItems.children.length - 1; i >= 0; i--) {
      const item = activeItems.children[i]
      if (item.type === EItemType.buildings || item.type === EItemType.terrain) {
        const itemGrid = item.getGridXY()
        const { buildableGrid } = item as Building
        for (let y = buildableGrid.length - 1; y >= 0; y--) {
          for (let x = buildableGrid[y].length - 1; x >= 0; x--) {
            if (buildableGrid[y][x] === 1) {
              this._currentMapBuildableGrid[itemGrid.gridY + y][itemGrid.gridX + x] = 1
            }
          }
        }
      } else if (item.type === EItemType.vehicles && item !== exceptItem) {
        // Mark all squares under or near the vehicle as unbuildable
        const itemBounds = item.getGridCollisionBounds()
        const x1 = itemBounds.leftGridX
        const x2 = itemBounds.rightGridX
        const y1 = itemBounds.topGridY
        const y2 = itemBounds.bottomGridY
        for (let x = x1; x <= x2; x++) {
          for (let y = y1; y <= y2; y++) {
            if (x < 0 || x >= mapGridWidth || y < 0 || y >= mapGridHeight) {
              continue
            } else {
              this._currentMapBuildableGrid[y][x] = 1
            }
          }
        }
      }
    }
  }

  mergeBuildableGridIntoDeployable (): void {
    if (this._currentMapDeployableGrid.length !== this._initialMapDeployableGrid.length) {
      this._currentMapDeployableGrid = this._initialMapDeployableGrid.map(g => g.slice())
    }
    for (let y = this._currentMapDeployableGrid.length - 1; y >= 0; y--) {
      for (let x = this._currentMapDeployableGrid[y].length - 1; x >= 0; x--) {
        this._currentMapDeployableGrid[y][x] = this._initialMapDeployableGrid[y][x]
        if (this._currentMapDeployableGrid[y][x] === 0) {
          this._currentMapDeployableGrid[y][x] = this._currentMapBuildableGrid[y][x]
        }
      }
    }
  }

  getItemByUid (uid: number, activeItems?: BaseActiveItem[]): BaseActiveItem | undefined {
    return (activeItems ?? this.activeItems.children).find(item => item.uid === uid)
  }

  isItemsDead (uids: number[] | number): boolean {
    if (!Array.isArray(uids)) {
      uids = [uids]
    }
    const { activeItems } = this
    return uids.some(uid => {
      const activeItem = this.getItemByUid(uid, activeItems.children)
      return activeItem == null || activeItem.isDead()
    })
  }

  goTo ({ x, y, center = true }: { x: number, y: number, center?: boolean }): void {
    const { cameraRect } = this.game.topBar.miniMap
    const { pivot } = this
    const goX = center ? x - cameraRect.width * 0.5 : x
    const goY = center ? y - cameraRect.height * 0.5 : y
    pivot.x = goX
    pivot.y = goY
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

  updateFog (): void {
    const { activeItems, gridSize, sight, sightBlurred, background, background3, projectiles } = this
    const bgBounds = {
      top: background.y,
      right: background.x + background.width,
      bottom: background.y + background.height,
      left: background.x
    }
    sight.clear()
    sightBlurred.clear()
    const processedVisibleUids: number[] = []
    const blurFactor = 1.3
    for (let i = 0; i < activeItems.children.length; i++) {
      const activeItem = activeItems.children[i]
      if (activeItem.team === this.game.team) {
        const itemBounds = activeItem.getCollisionBounds()
        if ((itemBounds.left < bgBounds.left && itemBounds.right < bgBounds.left) ||
          (itemBounds.left > bgBounds.right && itemBounds.right > bgBounds.right) ||
          (itemBounds.top < bgBounds.top && itemBounds.bottom < bgBounds.top) ||
          (itemBounds.top > bgBounds.bottom && itemBounds.bottom > bgBounds.bottom)) {
          // item outside of map bounds
          // skip draw sight circle
          activeItem.renderable = false
          continue
        }
        activeItem.renderable = true
        const itemCenter = activeItem.getCollisionPosition({ center: true })
        if (!logNoFog.enabled) {
          sight.beginFill(0xffffff)
          sight.drawCircle(itemCenter.x, itemCenter.y, activeItem.sightRadius * gridSize)
          sight.endFill()
          sightBlurred.beginFill(0xffffff)
          sightBlurred.drawCircle(itemCenter.x, itemCenter.y, activeItem.sightRadius * gridSize * blurFactor)
          sightBlurred.endFill()
        }
        if (logNoSightHide.enabled) {
          continue
        }
        for (let j = 0; j < activeItems.children.length; j++) {
          const activeItemJ = activeItems.children[j]
          if (activeItemJ.team !== this.game.team && !processedVisibleUids.includes(activeItemJ.uid)) {
            const itemCenterJ = activeItemJ.getCollisionPosition({ center: true })
            if (Math.hypot(itemCenter.y - itemCenterJ.y, itemCenter.x - itemCenterJ.x) < activeItem.sightRadius * gridSize * blurFactor) {
              activeItemJ.renderable = true
              processedVisibleUids.push(activeItemJ.uid)
            } else {
              activeItemJ.renderable = false
            }
          }
        }
      }
    }
    if (!logNoFog.enabled) {
      background.mask = sightBlurred
      activeItems.mask = sightBlurred
      projectiles.mask = sightBlurred
      background.filters = [new BlurFilter()]
      background3.mask = sight
    }
  }
}
