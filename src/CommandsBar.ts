import { Container, type Texture } from 'pixi.js'
import { compareNumericArrays, type BaseActiveItem, type SelectableItem } from './common'
import { EItemType } from './interfaces/IItem'
import { ECommandName } from './Command'
import { type Game } from './Game'
import { Button } from './Button'

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
  public commands = new Container()
  public commandNames: ECommandName[] = []
  constructor (options: ICommandBarOptions) {
    super()

    this.game = options.game
    this.setup()
  }

  setup (): void {
    this.addChild(this.commands)
  }

  prepareCommands (selectedItems: SelectableItem[]): boolean {
    if (selectedItems.length === 1) {
      const selectedItem = selectedItems[0]
      return this.drawCommands([ECommandName.deselect, ...selectedItem.commands])
    }
    let hasMoveable = false
    let hasBuilding = false
    let hasMoveFollow = false
    let hasAttackGuard = false
    let hasPatrol = false;
    (selectedItems as BaseActiveItem[]).forEach((selectedItem: BaseActiveItem) => {
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
    const commandNames = [ECommandName.deselect]
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

    return true
  }

  clearCommands (): void {
    while (this.commands.children.length > 0) {
      this.commands.children[0].removeFromParent()
    }
  }

  calcClickHandler = (commandName: ECommandName): (attackBtn: Button) => void => {
    switch (commandName) {
      case ECommandName.moveFollow:
        return () => {}
      case ECommandName.attackGuard:
        return () => {}
      case ECommandName.patrol:
        return () => {}
      case ECommandName.deselect:
        return () => {
          this.game.clearSelection(true)
        }
    }
  }

  drawCommands (commandNames: ECommandName[]): boolean {
    if (compareNumericArrays(this.commandNames, commandNames)) {
      return false
    }
    this.clearCommands()
    this.commandNames = commandNames
    this.commandNames.forEach(commandName => {
      const commandDescription = CommandsBar.commandsDic[commandName]
      const button = new Button({
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
      button.position.set(0, this.commands.height)
      this.commands.addChild(button)
    })
    return true
  }
}
