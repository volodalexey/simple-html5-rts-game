import { Graphics } from 'pixi.js'

export class Hitboxes extends Graphics {
  draw ({
    currentMapGrid: currentMapBuildableGrid, tileWidth, tileHeight, borderWidth
  }: {
    currentMapGrid: Array<Array<1 | 0>>
    tileWidth: number
    tileHeight: number
    borderWidth: number
  }): void {
    this.clear()
    for (let y = 0; y < currentMapBuildableGrid.length; y++) {
      for (let x = 0; x < currentMapBuildableGrid[y].length; x++) {
        const initX = tileWidth * x
        const initY = tileWidth * y
        this.beginFill(currentMapBuildableGrid[y][x] === 1 ? 0xff0000 : 0x00ff00)
        this.drawRect(initX, initY, tileWidth, tileHeight)
        this.endFill()
        this.beginHole()
        this.drawRect(initX + borderWidth, initY + borderWidth, tileWidth - borderWidth * 2, tileHeight - borderWidth * 2)
        this.endHole()
      }
    }
  }

  toggleBuildableGrid ({
    toggle,
    currentMapBuildableGrid,
    tileWidth,
    tileHeight,
    borderWidth
  }: {
    toggle: boolean
    currentMapBuildableGrid: Array<Array<1 | 0>>
    tileWidth: number
    tileHeight: number
    borderWidth: number
  }): void {
    if (toggle) {
      this.draw({
        currentMapGrid: currentMapBuildableGrid,
        tileWidth,
        tileHeight,
        borderWidth
      })
      this.visible = true
    } else {
      this.visible = false
    }
  }
}
