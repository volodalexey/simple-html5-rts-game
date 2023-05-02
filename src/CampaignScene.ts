import { type Application, Container } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { EVectorDirection } from './Vector'
import { Base } from './buildings/Base'
import { Team } from './common'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { Transport } from './vehicles/Transport'
import { EMessageCharacter } from './StatusBar'
import { type IOrder } from './interfaces/IOrder'
import { GroundTurret } from './buildings/GroundTurret'
import { type OilDerrick } from './buildings/OilDerrick'
import { Starport } from './buildings/Starport'
import { Harvester } from './vehicles/Harvester'

interface IMissionItem {
  Constructor: typeof Base | typeof GroundTurret | typeof OilDerrick | typeof Starport |
    typeof HeavyTank | typeof ScoutTank | typeof Transport
  initGridX: number
  initGridY: number
  team: Team
  direction?: EVectorDirection
  uid?: number
  life?: number
  selectable?: boolean
  ordersable?: boolean
  orders?: IOrder
}

interface ITimedTrigger {
  type: 'timed'
  time: number
  action: () => void
}

interface IIntervalTrigger {
  type: 'interval'
  interval: number
  action: () => void
}

interface IConditionalTrigger {
  type: 'conditional'
  action: () => void
  condition: () => boolean
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
  triggers: Array<ITimedTrigger | IConditionalTrigger | IIntervalTrigger>
}

interface ICampaignSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  missionIdx?: number
}

export class CampaignScene extends Container implements IScene {
  public missionStarted = false

  public game!: Game
  public missions: IMission[] = []
  static options = {
    startMission: 0
  }

  public currentMissionIdx = CampaignScene.options.startMission
  public currentMission!: IMission

  constructor (options: ICampaignSceneOptions) {
    super()
    if (typeof options.missionIdx === 'number') {
      this.currentMissionIdx = options.missionIdx
    }

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

    if (this.game.gameEnded) {
      return
    }

    const mission = this.currentMission
    for (let i = 0; i < mission.triggers.length; i++) {
      const trigger = mission.triggers[i]
      if (trigger.type === 'timed' && this.game.time >= trigger.time) {
        trigger.action()
        mission.triggers.splice(i, 1)
        i--
      } else if (trigger.type === 'conditional') {
        if (trigger.condition()) {
          trigger.action()
          mission.triggers.splice(i, 1)
          i--
        }
      }
    }
  }

  startCurrentLevel (): void {
    this.missionStarted = true
    const mission = this.currentMission = Object.assign({}, this.missions[this.currentMissionIdx], {
      triggers: this.missions[this.currentMissionIdx].triggers.slice()
    })

    this.game.startGame(mission)

    mission.items.forEach(({ Constructor, initGridX, initGridY, ...rest }) => {
      this.game.tileMap.addItem(new Constructor({
        game: this.game,
        initX: this.game.tileMap.gridSize * initGridX,
        initY: this.game.tileMap.gridSize * initGridY,
        ...rest
      }))
    })

    this.game.cash[Team.blue] = mission.cash.blue
    this.game.cash[Team.green] = mission.cash.green

    this.game.showMessage({
      character: EMessageCharacter.system,
      message: `Mission: ${mission.name}\n${mission.briefing}`,
      playSound: false
    })
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
          { Constructor: HeavyTank, initGridX: 57, initGridY: 12, direction: EVectorDirection.downRight, team: Team.blue, uid: -1 },

          /* Two transport vehicles waiting just outside the visible map */
          { Constructor: Transport, initGridX: -3, initGridY: 2, direction: EVectorDirection.right, team: Team.blue, uid: -3, ordersable: false },
          { Constructor: Transport, initGridX: -3, initGridY: 4, direction: EVectorDirection.left, team: Team.blue, uid: -4, ordersable: false },

          /* Two damaged enemy scout-tanks patroling the area */
          { Constructor: ScoutTank, initGridX: 40, initGridY: 20, direction: EVectorDirection.up, team: Team.green, uid: -2, life: 21, orders: { type: 'patrol', fromPoint: { gridX: 34, gridY: 20 }, toPoint: { gridX: 42, gridY: 26 } } },
          { Constructor: ScoutTank, initGridX: 14, initGridY: 0, direction: EVectorDirection.down, team: Team.green, uid: -5, life: 21, orders: { type: 'patrol', fromPoint: { gridX: 14, gridY: 0 }, toPoint: { gridX: 14, gridY: 14 } } }
        ],
        triggers: [
          {
            type: 'timed',
            time: 3000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: "Commander!! We haven't heard from the last convoy in over two hours. They should have arrived by now."
              })
            }
          },
          {
            type: 'timed',
            time: 10000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'They were last seen in the North West Sector. Could you investigate?'
              })
            }
          },
          {
            type: 'conditional',
            condition: () => {
              return this.game.tileMap.isItemsDead([-1, -3, -4])
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: 'conditional',
            condition: () => {
              // Check if first enemy is dead
              return this.game.tileMap.isItemsDead(-2)
            },
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'The rebels have been getting very aggressive lately. I hope the convoy is safe. Find them and escort them back to the base.'
              })
            }
          },
          {
            type: 'conditional',
            condition: () => {
              const hero = this.game.tileMap.getItemByUid(-1)
              if (hero != null) {
                const heroGrid = hero.getGridXY({ center: true })
                return heroGrid.gridX < 30 && heroGrid.gridY < 30
              }
              return false
            },
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.driver,
                message: 'Can anyone hear us? Our convoy has been pinned down by rebel tanks. We need help.'
              })
            }
          },
          {
            type: 'conditional',
            condition: () => {
              const hero = this.game.tileMap.getItemByUid(-1)
              if (hero != null) {
                const heroGrid = hero.getGridXY({ center: true })
                return heroGrid.gridX < 10 && heroGrid.gridY < 10
              }
              return false
            },
            action: () => {
              const hero = this.game.tileMap.getItemByUid(-1)
              if (hero != null) {
                this.game.showMessage({
                  character: EMessageCharacter.driver,
                  message: 'Thank you. We thought we would never get out of here alive.'
                })
                this.game.processCommand([-3, -4], { type: 'follow', to: hero })
              }
            }
          },
          {
            type: 'conditional',
            condition: () => {
              const transport1 = this.game.tileMap.getItemByUid(-3)
              const transport2 = this.game.tileMap.getItemByUid(-4)
              if (transport1 != null && transport2 != null) {
                const transport1Grid = transport1.getGridXY({ center: true })
                const transport2Grid = transport2.getGridXY({ center: true })
                return transport1Grid.gridX > 52 && transport1Grid.gridY < 18 && transport2Grid.gridX > 52 && transport2Grid.gridY < 18
              }
              return false
            },
            action: () => {
              this.endMission({ success: true })
            }
          }
        ]
      },
      {
        name: 'Assault',
        briefing: 'Thanks to the supplies from the convoy, we now have the base up and running.\nThe rebels nearby are proving to be a problem. We need to take them out. \nFirst set up the base defences. Then find and destroy all rebels in the area.\nThe colony will be sending us reinforcements to help us out.',
        mapImageSrc: 'level1Background',
        mapSettingsSrc: 'level1Settings',
        startGridX: 36,
        startGridY: 0,
        cash: {
          blue: 0,
          green: 0
        },
        items: [
          { Constructor: Base, initGridX: 55, initGridY: 6, team: Team.blue, uid: -1 },
          { Constructor: GroundTurret, initGridX: 53, initGridY: 17, direction: EVectorDirection.up, team: Team.blue },
          { Constructor: HeavyTank, initGridX: 55, initGridY: 16, direction: EVectorDirection.upLeft, team: Team.blue, uid: -2, orders: { type: 'sentry' } },
          /* The first wave of attacks */
          { Constructor: ScoutTank, initGridX: 55, initGridY: 36, direction: EVectorDirection.down, team: Team.green, orders: { type: 'hunt' } },
          { Constructor: ScoutTank, initGridX: 53, initGridY: 36, direction: EVectorDirection.down, team: Team.green, orders: { type: 'hunt' } },
          /* Enemies patrolling the area */
          { Constructor: ScoutTank, initGridX: 5, initGridY: 5, direction: EVectorDirection.down, team: Team.green, orders: { type: 'patrol', fromPoint: { gridX: 5, gridY: 5 }, toPoint: { gridX: 20, gridY: 20 } } },
          { Constructor: ScoutTank, initGridX: 5, initGridY: 15, direction: EVectorDirection.down, team: Team.green, orders: { type: 'patrol', fromPoint: { gridX: 5, gridY: 15 }, toPoint: { gridX: 20, gridY: 30 } } },
          { Constructor: ScoutTank, initGridX: 25, initGridY: 5, direction: EVectorDirection.down, team: Team.green, orders: { type: 'patrol', fromPoint: { gridX: 25, gridY: 5 }, toPoint: { gridX: 25, gridY: 20 } } },
          { Constructor: ScoutTank, initGridX: 35, initGridY: 5, direction: EVectorDirection.down, team: Team.green, orders: { type: 'patrol', fromPoint: { gridX: 35, gridY: 5 }, toPoint: { gridX: 35, gridY: 30 } } },
          /* The Enemy Rebel Base */
          { Constructor: Base, initGridX: 5, initGridY: 36, team: Team.green, uid: -11 },
          { Constructor: Starport, initGridX: 1, initGridY: 30, team: Team.green, uid: -12 },
          { Constructor: Starport, initGridX: 4, initGridY: 32, team: Team.green, uid: -13 },
          { Constructor: Harvester, initGridX: 1, initGridY: 38, team: Team.green, orders: { type: 'deploy', toPoint: { gridX: 16, gridY: 7 } } },
          { Constructor: Harvester, initGridX: 10, initGridY: 38, team: Team.green, orders: { type: 'deploy', toPoint: { gridX: 20, gridY: 7 } } },
          { Constructor: GroundTurret, initGridX: 5, initGridY: 28, team: Team.green },
          { Constructor: GroundTurret, initGridX: 7, initGridY: 33, team: Team.green },
          { Constructor: GroundTurret, initGridX: 8, initGridY: 37, team: Team.green }
        ],
        triggers: [
          {
            type: 'timed',
            time: 8000,
            action: () => {
              const { tileMap } = this.game
              const hero = tileMap.getItemByUid(-2)
              if (hero != null) {
                // Send in reinforcements to defend the base from the first wave
                this.game.showMessage({
                  character: EMessageCharacter.op,
                  message: 'Commander!! Reinforcements have arrived from the colony.'
                })
                tileMap.addItem(new ScoutTank({
                  game: this.game, initX: tileMap.gridSize * 58, initY: tileMap.gridSize * 22, team: Team.blue, orders: { type: 'guard', to: hero }
                }))
                tileMap.addItem(new ScoutTank({
                  game: this.game, initX: tileMap.gridSize * 60, initY: tileMap.gridSize * 21, team: Team.blue, orders: { type: 'guard', to: hero }
                }))
              }
            }
          },
          {
            type: 'timed',
            time: 25000,
            action: () => {
              // Supply extra cash
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander!! We have enough resources for another ground turret.\nSet up the turret to keep the base safe from any more attacks.'
              })
              this.game.cash[Team.blue] = 1500
            }
          },
          {
            type: 'interval',
            interval: 1000,
            action: () => {
              // Construct a couple of bad guys to hunt the player every time enemy has enough money
              if (this.game.cash[Team.green] > 1000) {
                // game.sendCommand([-12, -13], { type: 'construct-unit', details: { type: 'vehicles', name: 'scout-tank', orders: { type: 'hunt' } } })
              }
            }
          },
          {
            type: 'interval',
            interval: 180000,
            action: () => {
              // Send in some reinforcements every three minutes
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander!! More Reinforcments have arrived.'
              })
              const { tileMap } = this.game
              tileMap.addItem(new ScoutTank({
                game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 22, team: Team.blue, orders: { type: 'move', toPoint: { gridX: 55, gridY: 21 } }
              }))
              tileMap.addItem(new HeavyTank({
                game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 23, team: Team.blue, orders: { type: 'move', toPoint: { gridX: 56, gridY: 23 } }
              }))
            }
          },
          {
            type: 'timed',
            time: 300000,
            action: () => {
              // Send in air support after 5 minutes
              this.game.showMessage({
                character: EMessageCharacter.pilot,
                message: 'Close Air Support en route. Will try to do what I can.'
              })
              const { tileMap } = this.game
              tileMap.addItem(new HeavyTank({
                game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 22, ordersable: false, team: Team.blue, orders: { type: 'hunt' }
              }))
            }
          },
          {
            type: 'conditional',
            condition: () => {
              //  Lose if our base gets destroyed
              return this.game.tileMap.isItemsDead(-1)
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: 'conditional',
            condition: () => {
              // Win if enemy base gets destroyed
              return this.game.tileMap.isItemsDead(-11)
            },
            action: () => {
              this.endMission({ success: true })
            }
          }
        ]
      }
    ]
  }

  endMission ({ success }: { success: boolean }): void {
    const isLastMission = this.currentMissionIdx === this.missions.length - 1
    this.game.endGame({
      success,
      message: success
        ? (isLastMission
            ? 'Mission Accomplished!\nThis was the last mission in the campaign.\nThank You for playing.'
            : 'Mission Accomplished!\nReady for new mission?')
        : 'Mission Failed.\nTry again?',
      view: success ? (isLastMission ? 'home' : 'home-next') : 'home-repeat',
      onLeftClick: () => {
        SceneManager.changeScene({ name: 'menu' }).catch(console.error)
      },
      onRightClick: () => {
        if (success && !isLastMission) {
          this.currentMissionIdx++
        }
        this.startCurrentLevel()
      }
    })
  }
}
