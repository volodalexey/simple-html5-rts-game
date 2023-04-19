import { type Application, Container, Assets, type Spritesheet } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { EVectorDirection } from './Vector'
import { Base } from './buildings/Base'
import { Team } from './common'
import { Harvester } from './vehicles/Harvester'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'

// interface IMissionItem {
//   type: string
//   name: string
//   initX: number
//   initY: number
//   team: Team
//   direction?: EVectorDirection
//   uid?: number
//   life?: number
//   selectable?: boolean
//   orders?: {
//     type: 'patrol'
//     from: { x: number, y: number }
//     to: { x: number, y: number }
//   }
// }

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
  startX: number
  startY: number
  cash: {
    blue: number
    green: number
  }
  items: Array<Base | HeavyTank>
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

    this.prepareTextures()
    this.prepareMissions()
  }

  setup ({ viewWidth, viewHeight }: ICampaignSceneOptions): void {
    const game = new Game({
      viewWidth,
      viewHeight
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
    this.game.camera.goTo({ x: mission.startX, y: mission.startY })

    mission.items.forEach(item => {
      this.game.tileMap.addItem(item)
    })
  }

  mountedHandler (): void {
    this.startCurrentLevel()
  }

  prepareTextures (): void {
    const spritesheet: Spritesheet = Assets.get('spritesheet')
    const { animations, textures } = spritesheet
    Base.prepareTextures({
      blueTextures: {
        healthyTextures: animations['base-blue-healthy'],
        damagedTextures: [textures['base-blue-damaged.png']],
        constructingTextures: animations['base-blue-contructing']
      },
      greenTextures: {
        healthyTextures: animations['base-green-healthy'],
        damagedTextures: [textures['base-green-damaged.png']],
        constructingTextures: animations['base-green-contructing']
      }
    })

    Harvester.prepareTextures({
      blueTextures: {
        upTextures: [textures['harvester-blue-up.png']],
        upRightTextures: [textures['harvester-blue-up-right.png']],
        rightTextures: [textures['harvester-blue-right.png']],
        downRightTextures: [textures['harvester-blue-down-right.png']],
        downTextures: [textures['harvester-blue-down.png']],
        downLeftTextures: [textures['harvester-blue-down-left.png']],
        leftTextures: [textures['harvester-blue-left.png']],
        upLeftTextures: [textures['harvester-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['harvester-green-up.png']],
        upRightTextures: [textures['harvester-green-up-right.png']],
        rightTextures: [textures['harvester-green-right.png']],
        downRightTextures: [textures['harvester-green-down-right.png']],
        downTextures: [textures['harvester-green-down.png']],
        downLeftTextures: [textures['harvester-green-down-left.png']],
        leftTextures: [textures['harvester-green-left.png']],
        upLeftTextures: [textures['harvester-green-up-left.png']]
      }
    })

    HeavyTank.prepareTextures({
      blueTextures: {
        upTextures: [textures['heavy-tank-blue-up.png']],
        upRightTextures: [textures['heavy-tank-blue-up-right.png']],
        rightTextures: [textures['heavy-tank-blue-right.png']],
        downRightTextures: [textures['heavy-tank-blue-down-right.png']],
        downTextures: [textures['heavy-tank-blue-down.png']],
        downLeftTextures: [textures['heavy-tank-blue-down-left.png']],
        leftTextures: [textures['heavy-tank-blue-left.png']],
        upLeftTextures: [textures['heavy-tank-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['heavy-tank-green-up.png']],
        upRightTextures: [textures['heavy-tank-green-up-right.png']],
        rightTextures: [textures['heavy-tank-green-right.png']],
        downRightTextures: [textures['heavy-tank-green-down-right.png']],
        downTextures: [textures['heavy-tank-green-down.png']],
        downLeftTextures: [textures['heavy-tank-green-down-left.png']],
        leftTextures: [textures['heavy-tank-green-left.png']],
        upLeftTextures: [textures['heavy-tank-green-up-left.png']]
      }
    })

    ScoutTank.prepareTextures({
      blueTextures: {
        upTextures: [textures['scout-tank-blue-up.png']],
        upRightTextures: [textures['scout-tank-blue-up-right.png']],
        rightTextures: [textures['scout-tank-blue-right.png']],
        downRightTextures: [textures['scout-tank-blue-down-right.png']],
        downTextures: [textures['scout-tank-blue-down.png']],
        downLeftTextures: [textures['scout-tank-blue-down-left.png']],
        leftTextures: [textures['scout-tank-blue-left.png']],
        upLeftTextures: [textures['scout-tank-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['scout-tank-green-up.png']],
        upRightTextures: [textures['scout-tank-green-up-right.png']],
        rightTextures: [textures['scout-tank-green-right.png']],
        downRightTextures: [textures['scout-tank-green-down-right.png']],
        downTextures: [textures['scout-tank-green-down.png']],
        downLeftTextures: [textures['scout-tank-green-down-left.png']],
        leftTextures: [textures['scout-tank-green-left.png']],
        upLeftTextures: [textures['scout-tank-green-up-left.png']]
      }
    })

    Transport.prepareTextures({
      blueTextures: {
        upTextures: [textures['transport-blue-up.png']],
        upRightTextures: [textures['transport-blue-up-right.png']],
        rightTextures: [textures['transport-blue-right.png']],
        downRightTextures: [textures['transport-blue-down-right.png']],
        downTextures: [textures['transport-blue-down.png']],
        downLeftTextures: [textures['transport-blue-down-left.png']],
        leftTextures: [textures['transport-blue-left.png']],
        upLeftTextures: [textures['transport-blue-up-left.png']]
      },
      greenTextures: {
        upTextures: [textures['transport-green-up.png']],
        upRightTextures: [textures['transport-green-up-right.png']],
        rightTextures: [textures['transport-green-right.png']],
        downRightTextures: [textures['transport-green-down-right.png']],
        downTextures: [textures['transport-green-down.png']],
        downLeftTextures: [textures['transport-green-down-left.png']],
        leftTextures: [textures['transport-green-left.png']],
        upLeftTextures: [textures['transport-green-up-left.png']]
      }
    })
  }

  prepareMissions (): void {
    this.missions = [
      {
        name: 'Rescue',
        briefing: 'In the months since the great war, mankind has fallen into chaos. Billions are dead with cities in ruins.\nSmall groups of survivors band together to try and survive as best as they can.\nWe are trying to reach out to all the survivors in this sector before we join back with the main colony.',

        mapImageSrc: 'level1Background',
        mapSettingsSrc: 'level1Settings',
        startX: 720,
        startY: 0,

        cash: {
          blue: 0,
          green: 0
        },

        items: [
          /* Slightly damaged base */
          new Base({
            initX: 1100, initY: 120, team: Team.blue, life: 100
          }),

          /* Player heavy tank */
          new HeavyTank({
            initX: 1140, initY: 240, direction: EVectorDirection.downRight, team: Team.blue, uid: -1
          }),

          /* Two transport vehicles waiting just outside the visible map */
          new Transport({
            initX: -60, initY: 40, direction: EVectorDirection.right, team: Team.blue, uid: -3, selectable: false
          }),
          new Transport({
            initX: -60, initY: 160, direction: EVectorDirection.right, team: Team.blue, uid: -4, selectable: false
          }),

          /* Two damaged enemy scout-tanks patroling the area */
          new ScoutTank({
            initX: 800, initY: 400, direction: EVectorDirection.up, team: Team.blue, uid: -2, life: 20, orders: { type: 'patrol', from: { x: 34, y: 20 }, to: { x: 42, y: 25 } }
          }),
          new ScoutTank({
            initX: 280, initY: 0, direction: EVectorDirection.down, team: Team.blue, uid: -5, life: 20, orders: { type: 'patrol', from: { x: 14, y: 0 }, to: { x: 14, y: 14 } }
          })
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
