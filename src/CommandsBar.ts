import { Container, type Texture } from 'pixi.js'
import { compareArrays, type BaseActiveItem, type SelectableItem } from './common'
import { EItemType } from './interfaces/IItem'
import { ECommandName } from './Command'
import { type Game } from './Game'
import { Button, type IButtonOptions } from './Button'

export interface ICommandBarOptions {
  game: Game
}

export interface ICommandsBarTextures {
  iconMoveFollowTexture: Texture
  iconAttackGuardTexture: Texture
  iconPatrolTexture: Texture
  iconDeselectTexture: Texture
}

interface ICommandDescription {
  iconTexture: Texture
  text: string
}

type CommandsDic = Record<ECommandName, ICommandDescription>

export class CommandsBar extends Container {
  static textures: ICommandsBarTextures
  static prepareTextures ({ textures }: { textures: ICommandsBarTextures }): void {
    CommandsBar.textures = textures

    CommandsBar.commandsDic = {
      [ECommandName.deselect]: {
        iconTexture: textures.iconDeselectTexture,
        text: 'deselect'
      },
      [ECommandName.moveFollow]: {
        iconTexture: textures.iconMoveFollowTexture,
        text: 'move\nfollow'
      },
      [ECommandName.attackGuard]: {
        iconTexture: textures.iconAttackGuardTexture,
        text: 'attack\nguard'
      },
      [ECommandName.patrol]: {
        iconTexture: textures.iconPatrolTexture,
        text: 'patrol'
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
    const commandNames = [ECommandName.deselect]
    if (selectedItems.length === 1) {
      const selectedItem = selectedItems[0]
      if (selectedItem.team === this.game.team) {
        Array.prototype.push.apply(commandNames, selectedItem.commands)
      }
      return this.drawCommands(commandNames)
    }
    let hasMoveable = false
    let hasBuilding = false
    let hasMoveFollow = false
    let hasAttackGuard = false
    let hasPatrol = false;
    (selectedItems as BaseActiveItem[]).forEach((selectedItem: BaseActiveItem) => {
      if (selectedItem.team !== this.game.team) {
        return
      }
      if (selectedItem.type === EItemType.vehicles || selectedItem.type === EItemType.airVehicles) {
        hasMoveable = true
      } else if (selectedItem.type === EItemType.buildings) {
        hasBuilding = true
      }
      if (selectedItem.commands.includes(ECommandName.moveFollow)) {
        hasMoveFollow = true
      }
      if (selectedItem.commands.includes(ECommandName.attackGuard)) {
        hasAttackGuard = true
      }
      if (selectedItem.commands.includes(ECommandName.patrol)) {
        hasPatrol = true
      }
    })
    if (hasMoveable) {
      if (hasMoveFollow) {
        commandNames.push(ECommandName.moveFollow)
      }
      if (hasAttackGuard) {
        commandNames.push(ECommandName.attackGuard)
      }
      if (hasPatrol) {
        commandNames.push(ECommandName.patrol)
      }
    } else if (hasBuilding) {
      if (hasAttackGuard) {
        commandNames.push(ECommandName.attackGuard)
      }
    }
    return this.drawCommands(commandNames)
  }

  clearCommandTiles (): void {
    while (this.commandTiles.children.length > 0) {
      this.commandTiles.children[0].removeFromParent()
    }
  }

  deselectButtons (exceptCommandName?: ECommandName): void {
    this.commandTiles.children.forEach(commandTile => {
      if (commandTile.commandName !== exceptCommandName) {
        commandTile.setSelected(false)
      }
    })
  }

  getSelectedCommandName (): ECommandName | undefined {
    const selectedCommandTile = this.commandTiles.children.find(commandTile => commandTile.selected)
    return (selectedCommandTile != null) ? selectedCommandTile.commandName : undefined
  }

  calcClickHandler = (commandName: ECommandName): (attackBtn: Button) => void => {
    switch (commandName) {
      case ECommandName.moveFollow:
        return () => {
          this.deselectButtons(ECommandName.moveFollow)
        }
      case ECommandName.attackGuard:
        return () => {
          this.deselectButtons(ECommandName.attackGuard)
        }
      case ECommandName.patrol:
        return () => {
          this.deselectButtons(ECommandName.patrol)
        }
      case ECommandName.deselect:
        return () => {
          this.deselectButtons()
          this.game.clearSelection(true)
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
        iconPaddingTop: 6,
        iconPaddingLeft: 6,
        iconIdleAlpha: 0.5,
        iconHoverAlpha: 0.5,
        textPaddingLeft: 0,
        textPaddingTop: 6,
        buttonWidth: 56,
        fontSize: 10,
        textColor: 0xffffff,
        textColorHover: 0xffff00,
        iconColor: 0xffffff,
        iconColorHover: 0xffff00,
        iconScale: 0.8,
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
