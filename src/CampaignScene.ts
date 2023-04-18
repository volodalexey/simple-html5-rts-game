import { type Application, Container, Assets, type Spritesheet } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { EVectorDirection } from './Vector'
import { Base } from './Building'
import { Team } from './common'

interface IMissionItem {
  type: string
  name: string
  initX: number
  initY: number
  team: Team
  direction?: EVectorDirection
  uid?: number
  life?: number
  selectable?: boolean
  orders?: {
    type: 'patrol'
    from: { x: number, y: number }
    to: { x: number, y: number }
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
  startX: number
  startY: number
  cash: {
    blue: number
    green: number
  }
  items: IMissionItem[]
  triggers: Array<ITimedTrigger | IConditionalTrigger>
}

const missions: IMission[] = [
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
      { type: 'buildings', name: 'base', initX: 1100, initY: 120, team: Team.blue, life: 100 },

      /* Player heavy tank */
      { type: 'vehicles', name: 'heavy-tank', initX: 1140, initY: 240, direction: EVectorDirection.down, team: Team.blue, uid: -1 },

      /* Two transport vehicles waiting just outside the visible map */
      { type: 'vehicles', name: 'transport', initX: -60, initY: 40, direction: EVectorDirection.right, team: Team.blue, uid: -3, selectable: false },
      { type: 'vehicles', name: 'transport', initX: -60, initY: 160, direction: EVectorDirection.right, team: Team.blue, uid: -4, selectable: false },

      /* Two damaged enemy scout-tanks patroling the area */
      { type: 'vehicles', name: 'scout-tank', initX: 800, initY: 400, direction: EVectorDirection.down, team: Team.blue, uid: -2, life: 20, orders: { type: 'patrol', from: { x: 34, y: 20 }, to: { x: 42, y: 25 } } },
      { type: 'vehicles', name: 'scout-tank', initX: 280, initY: 0, direction: EVectorDirection.down, team: Team.blue, uid: -5, life: 20, orders: { type: 'patrol', from: { x: 14, y: 0 }, to: { x: 14, y: 14 } } }
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

interface ICampaignSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
}

export class CampaignScene extends Container implements IScene {
  public missionStarted = false

  public game!: Game
  static options = {
    startMission: 0
  }

  public currentMission = CampaignScene.options.startMission

  constructor (options: ICampaignSceneOptions) {
    super()

    this.setup(options)

    this.prepareTextures()
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
    const mission = missions[this.currentMission]

    this.game.startGame({ mapImageSrc: mission.mapImageSrc, mapSettingsSrc: mission.mapSettingsSrc })
    this.game.handleResize({ viewWidth: SceneManager.width, viewHeight: SceneManager.height })
    this.game.camera.goTo({ x: mission.startX, y: mission.startY })

    mission.items.forEach(item => {
      if (item.type === 'buildings' && item.name === 'base') {
        this.game.tileMap.addBaseBuilding(item)
      }
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
  }
}
