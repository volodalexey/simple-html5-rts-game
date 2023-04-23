import { type Application, Container } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { EVectorDirection } from './Vector'
import { Base } from './buildings/Base'
import { Team } from './common'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'

interface IMissionItem {
  Constructor: typeof Base | typeof HeavyTank | typeof ScoutTank | typeof Transport
  initGridX: number
  initGridY: number
  team: Team
  direction?: EVectorDirection
  uid?: number
  life?: number
  selectable?: boolean
  orders?: {
    type: 'patrol'
    from: { gridX: number, gridY: number }
    to: { gridX: number, gridY: number }
  }
}

interface ITimedTrigger {
  type: 'timed'
  time: number
  action: () => void
}

interface IConditionalTrigger {
  type: 'conditional'
  action: () => void
  condition: () => void
}

interface IMission {
  name: string
  briefing: string
  mapImageSrc: string
  mapSettingsSrc: string
  startGridX: number
  startGridY: number
  cash: {
    blue: number
    green: number
  }
  items: IMissionItem[]
  triggers: Array<ITimedTrigger | IConditionalTrigger>
}

interface ICampaignSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
}

export class CampaignScene extends Container implements IScene {
  public missionStarted = false

  public game!: Game
  public missions: IMission[] = []
  static options = {
    startMission: 0
  }

  public currentMission = CampaignScene.options.startMission

  constructor (options: ICampaignSceneOptions) {
    super()

    this.setup(options)
  }

  setup ({ viewWidth, viewHeight }: ICampaignSceneOptions): void {
    const game = new Game({
      viewWidth,
      viewHeight,
      team: Team.blue,
      type: 'campaign'
    })
    this.addChild(game)
    this.game = game
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.game.handleResize(options)
  }

  handleUpdate (deltaMS: number): void {
    this.game.handleUpdate(deltaMS)
  }

  startCurrentLevel (): void {
    this.missionStarted = true
    const mission = this.missions[this.currentMission]

    this.game.startGame({ mapImageSrc: mission.mapImageSrc, mapSettingsSrc: mission.mapSettingsSrc })
    this.game.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
    this.game.camera.goTo({ x: mission.startGridX * this.game.tileMap.gridSize, y: mission.startGridY * this.game.tileMap.gridSize })

    mission.items.forEach(({ Constructor, initGridX, initGridY, team, direction, uid, life, selectable, orders }) => {
      this.game.tileMap.addItem(new Constructor({
        game: this.game,
        initX: this.game.tileMap.gridSize * initGridX,
        initY: this.game.tileMap.gridSize * initGridY,
        team,
        uid,
        direction,
        life,
        selectable,
        orders
      }))
    })

    this.game.cash = mission.cash.blue
  }

  mountedHandler (): void {
    this.prepareMissions()
    this.startCurrentLevel()
  }

  prepareMissions (): void {
    this.missions = [
      {
        name: 'Rescue',
        briefing: 'In the months since the great war, mankind has fallen into chaos. Billions are dead with cities in ruins.\nSmall groups of survivors band together to try and survive as best as they can.\nWe are trying to reach out to all the survivors in this sector before we join back with the main colony.',

        mapImageSrc: 'level1Background',
        mapSettingsSrc: 'level1Settings',
        startGridX: 36,
        startGridY: 0,

        cash: {
          blue: 0,
          green: 0
        },

        items: [
          /* Slightly damaged base */
          { Constructor: Base, initGridX: 55, initGridY: 6, team: Team.blue, life: 100 },

          /* Player heavy tank */
          { Constructor: HeavyTank, initGridX: 40, initGridY: 27, direction: EVectorDirection.up, team: Team.blue, uid: -1 },
          // { Constructor: HeavyTank, initGridX: 57, initGridY: 12, direction: EVectorDirection.downRight, team: Team.blue, uid: -1 },

          /* Two transport vehicles waiting just outside the visible map */
          { Constructor: Transport, initGridX: -3, initGridY: 2, direction: EVectorDirection.right, team: Team.blue, uid: -3, selectable: false },
          { Constructor: Transport, initGridX: -3, initGridY: 4, direction: EVectorDirection.left, team: Team.blue, uid: -4, selectable: false },

          /* Two damaged enemy scout-tanks patroling the area */
          { Constructor: ScoutTank, initGridX: 40, initGridY: 20, direction: EVectorDirection.up, team: Team.green, uid: -2, life: 20, orders: { type: 'patrol', from: { gridX: 34, gridY: 20 }, to: { gridX: 42, gridY: 25 } } },
          { Constructor: ScoutTank, initGridX: 14, initGridY: 0, direction: EVectorDirection.down, team: Team.green, uid: -5, life: 20, orders: { type: 'patrol', from: { gridX: 14, gridY: 0 }, to: { gridX: 14, gridY: 14 } } }
        ],

        triggers: [
          {
            type: 'timed',
            time: 3000,
            action: function () {
              // game.showMessage('op', "Commander!! We haven't heard from the last convoy in over two hours. They should have arrived by now.")
            }
          },
          {
            type: 'timed',
            time: 10000,
            action: function () {
              // game.showMessage('op', 'They were last seen in the North West Sector. Could you investigate?')
            }
          },
          {
            type: 'conditional',
            condition: function () {
              // return (isItemDead(-1) || isItemDead(-3) || isItemDead(-4))
            },
            action: function () {
              // singleplayer.endLevel(false)
            }
          },
          {
            type: 'conditional',
            condition: function () {
              // Check if first enemy is dead
              // return isItemDead(-2)
            },
            action: function () {
              // game.showMessage('op', 'The rebels have been getting very aggressive lately. I hope the convoy is safe. Find them and escort them back to the base.')
            }
          },
          {
            type: 'conditional',
            condition: function () {
              // const hero = game.getItemByUid(-1)
              // return (hero && hero.x < 30 && hero.y < 30)
            },
            action: function () {
              // game.showMessage('driver', 'Can anyone hear us? Our convoy has been pinned down by rebel tanks. We need help.')
            }
          },
          {
            type: 'conditional',
            condition: function () {
              // const hero = game.getItemByUid(-1)
              // return (hero && hero.x < 10 && hero.y < 10)
            },
            action: function () {
              // const hero = game.getItemByUid(-1)
              // game.showMessage('driver', 'Thank you. We thought we would never get out of here alive.')
              // game.sendCommand([-3, -4], { type: 'guard', to: hero })
            }
          },
          {
            type: 'conditional',
            condition: function () {
              // const transport1 = game.getItemByUid(-3)
              // const transport2 = game.getItemByUid(-4)
              // return (transport1 && transport2 && transport1.x > 52 && transport2.x > 52 && transport2.y < 18 && transport1.y < 18)
            },
            action: function () {
              // singleplayer.endLevel(true)
            }
          }

        ]
      }
    ]
  }
}
