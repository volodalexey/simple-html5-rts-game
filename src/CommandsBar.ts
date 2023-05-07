import { Container, type FederatedPointerEvent, type Texture } from 'pixi.js'
import { compareArrays, type BaseActiveItem, type SelectableItem } from './common'
import { EItemName, EItemType } from './interfaces/IItem'
import { ECommandName } from './Command'
import { type Game } from './Game'
import { Button, type IButtonOptions } from './Button'
import { SCV } from './vehicles/SCV'
import { Harvester } from './vehicles/Harvester'
import { GroundTurret } from './buildings/GroundTurret'
import { Starport } from './buildings/Starport'

export interface ICommandBarOptions {
  game: Game
}

export interface ICommandsBarTextures {
  iconAttackTexture: Texture
  iconMoveFollowTexture: Texture
  iconAttackGuardTexture: Texture
  iconPatrolTexture: Texture
  iconDeselectTexture: Texture
  iconBuildTurretTexture: Texture
  iconBuildStarportTexture: Texture
  iconConstructSCVTexture: Texture
  iconConstructHarvesterTexture: Texture
}

interface ICommandDescription {
  iconTexture: Texture
  text: string
  iconWidth: number
  iconHeight: number
  iconPaddingTop: number
  iconPaddingLeft: number
}

type CommandsDic = Record<ECommandName, ICommandDescription>

export class CommandsBar extends Container {
  static textures: ICommandsBarTextures
  static prepareTextures ({ textures }: { textures: ICommandsBarTextures }): void {
    CommandsBar.textures = textures

    CommandsBar.commandsDic = {
      [ECommandName.deselect]: {
        iconTexture: textures.iconDeselectTexture,
        text: 'deselect',
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.moveFollow]: {
        iconTexture: textures.iconMoveFollowTexture,
        text: 'move\nfollow',
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.attack]: {
        iconTexture: textures.iconAttackTexture,
        text: 'attack',
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.attackGuard]: {
        iconTexture: textures.iconAttackGuardTexture,
        text: 'attack\nguard',
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.patrol]: {
        iconTexture: textures.iconPatrolTexture,
        text: 'patrol',
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.buildTurret]: {
        iconTexture: textures.iconBuildTurretTexture,
        text: `Turret\n${GroundTurret.cost}`,
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.buildStarport]: {
        iconTexture: textures.iconBuildStarportTexture,
        text: `Starport\n${Starport.cost}`,
        iconWidth: 36,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 10
      },
      [ECommandName.constructSCV]: {
        iconTexture: textures.iconConstructSCVTexture,
        text: `SCV\n${SCV.cost}`,
        iconWidth: 40,
        iconHeight: 40,
        iconPaddingTop: 8,
        iconPaddingLeft: 8
      },
      [ECommandName.constructHarvester]: {
        iconTexture: textures.iconConstructHarvesterTexture,
        text: `Harvester\n${Harvester.cost}`,
        iconWidth: 30,
        iconHeight: 30,
        iconPaddingTop: 12,
        iconPaddingLeft: 12
      }
    }
  }

  static commandsDic: CommandsDic = {} as unknown as CommandsDic

  public game!: Game
  public commandTiles = new Container<CommandTile>()
  public commandNames: ECommandName[] = []
  constructor (options: ICommandBarOptions) {
    super()

    this.game = options.game
    this.setup()
  }

  setup (): void {
    this.addChild(this.commandTiles)
  }

  prepareCommands (selectedItems: SelectableItem[]): boolean {
    const commandNames = new Set<ECommandName>([ECommandName.deselect])
    if (selectedItems.length === 1) {
      const selectedItem = selectedItems[0]
      if (selectedItem.team === this.game.team) {
        selectedItem.commands.forEach(commandName => commandNames.add(commandName))
      }
      return this.drawCommands([...commandNames.values()])
    }
    // multiple units/buildings
    const hasMoveable = selectedItems.some(selectedItem => selectedItem.type === EItemType.vehicles || selectedItem.type === EItemType.airVehicles);
    (selectedItems as BaseActiveItem[]).forEach((selectedItem: BaseActiveItem) => {
      if (selectedItem.team !== this.game.team) {
        return
      }
      if (hasMoveable && (selectedItem.type === EItemType.vehicles || selectedItem.type === EItemType.airVehicles)) {
        selectedItem.commands.forEach(commandName => commandNames.add(commandName))
      } else if (selectedItem.type === EItemType.buildings) {
        selectedItem.commands.forEach(commandName => commandNames.add(commandName))
      }
    })
    return this.drawCommands([...commandNames.values()])
  }

  clearCommandTiles (): void {
    while (this.commandTiles.children.length > 0) {
      this.commandTiles.children[0].removeFromParent()
    }
  }

  deselectTiles (exceptCommandName?: ECommandName): void {
    this.commandTiles.children.forEach(commandTile => {
      if (commandTile.commandName === exceptCommandName) {
        commandTile.setSelected(true)
      } else {
        commandTile.setSelected(false)
      }
    })
  }

  getSelectedCommandName (): ECommandName | undefined {
    const selectedCommandTile = this.commandTiles.children.find(commandTile => commandTile.selected)
    return (selectedCommandTile != null) ? selectedCommandTile.commandName : undefined
  }

  calcClickHandler = (commandName: ECommandName): (e: FederatedPointerEvent) => void => {
    switch (commandName) {
      case ECommandName.moveFollow:
        return () => {
          this.deselectTiles(ECommandName.moveFollow)
        }
      case ECommandName.attack:
        return () => {
          this.deselectTiles(ECommandName.attack)
        }
      case ECommandName.attackGuard:
        return () => {
          this.deselectTiles(ECommandName.attackGuard)
        }
      case ECommandName.patrol:
        return () => {
          this.deselectTiles(ECommandName.patrol)
        }
      case ECommandName.deselect:
        return () => {
          this.deselectTiles()
          this.game.clearSelection(true)
        }
      case ECommandName.buildTurret:
        return (e: FederatedPointerEvent) => {
          this.deselectTiles(ECommandName.buildTurret)
          this.game.tileMap.toggleBuildableGrid(true)
        }
      case ECommandName.buildStarport:
        return (e: FederatedPointerEvent) => {
          this.deselectTiles(ECommandName.buildStarport)
          this.game.tileMap.toggleBuildableGrid(true)
        }
      case ECommandName.constructSCV:
        return () => {
          this.deselectTiles(ECommandName.constructSCV)
          this.game.selectedItems.forEach(selectedItem => {
            if (selectedItem.commands.includes(ECommandName.constructSCV)) {
              selectedItem.order = { type: 'construct-unit', name: EItemName.SCV }
            }
          })
        }
      case ECommandName.constructHarvester:
        return () => {
          this.deselectTiles(ECommandName.constructHarvester)
          this.game.selectedItems.forEach(selectedItem => {
            if (selectedItem.commands.includes(ECommandName.constructHarvester)) {
              selectedItem.order = { type: 'construct-unit', name: EItemName.Harvester }
            }
          })
        }
    }
  }

  drawCommands (commandNames: ECommandName[]): boolean {
    if (compareArrays(this.commandNames, commandNames)) {
      return false
    }
    this.clearCommandTiles()
    this.commandNames = commandNames
    this.commandNames.forEach(commandName => {
      const commandDescription = CommandsBar.commandsDic[commandName]
      const tile = new CommandTile({
        commandName,
        buttonRadius: 3,
        iconIdleAlpha: 0.3,
        iconHoverAlpha: 0.4,
        textPaddingLeft: 0,
        textPaddingTop: 8,
        buttonWidth: 60,
        fontSize: 10,
        textColor: 0xffffff,
        textColorHover: 0xffff00,
        iconColor: 0xffffff,
        iconColorHover: 0xffff00,
        shadowTextColor: 0x800080,
        shadowThickness: 1,
        buttonHoverColor: 0x454545,
        buttonIdleColor: 0x454545,
        flexDirection: 'col-center',
        buttonBorderWidth: 2,
        buttonBorderColor: 0x181716,
        buttonBorderHoverColor: 0xffff00,
        ...commandDescription,
        onClick: this.calcClickHandler(commandName)
      })
      tile.position.set(0, this.commandTiles.height)
      this.commandTiles.addChild(tile)
    })
    return true
  }
}

interface ICommandTileOptions extends IButtonOptions {
  commandName: ECommandName
}

class CommandTile extends Button {
  public commandName!: ECommandName
  constructor (options: ICommandTileOptions) {
    super(options)
    this.commandName = options.commandName
  }
}
