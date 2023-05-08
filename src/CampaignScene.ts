import { type Application, Container } from 'pixi.js'
import { SceneManager, type IScene } from './SceneManager'
import { Game } from './Game'
import { EVectorDirection } from './Vector'
import { Team } from './common'
import { HeavyTank } from './vehicles/HeavyTank'
import { ScoutTank } from './vehicles/ScoutTank'
import { EMessageCharacter } from './StatusBar'
import { type IOrder } from './interfaces/IOrder'
import { type Trigger, type ITrigger, createTrigger, ETriggerType, type TimedTrigger, type ConditionalTrigger, type IntervalTrigger } from './Trigger'
import { EItemName, type EItemNames } from './interfaces/IItem'
import { Chopper } from './air-vehicles/Chopper'
import { ECommandName } from './Command'
import { Transport } from './vehicles/Transport'
import { Wraith } from './air-vehicles/Wraith'

interface IMissionItem {
  name: EItemNames
  initGridX: number
  initGridY: number
  initCenter?: boolean
  team: Team
  direction?: EVectorDirection
  uid?: number
  life?: number
  selectable?: boolean
  commands?: ECommandName[]
  order?: IOrder
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
  triggers: ITrigger[]
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
  public triggers: Trigger[] = []

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

    for (let i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i]
      switch (trigger.type) {
        case ETriggerType.timed: {
          if (this.game.time >= (trigger as TimedTrigger).time) {
            trigger.action()
            this.triggers.splice(i, 1)
            i--
          }
          break
        }
        case ETriggerType.conditional: {
          if ((trigger as ConditionalTrigger).condition()) {
            trigger.action()
            this.triggers.splice(i, 1)
            i--
          }
          break
        }
        case ETriggerType.interval: {
          if ((trigger as IntervalTrigger).isElapsed(deltaMS)) {
            trigger.action()
          }
          break
        }
      }
    }
  }

  startCurrentLevel (): void {
    this.missionStarted = true
    const mission = this.missions[this.currentMissionIdx]
    this.triggers = mission.triggers.map(triggerDescription => createTrigger(triggerDescription))

    this.game.startGame(mission)

    mission.items.forEach((itemOptions) => {
      const item = this.game.createItem(itemOptions)
      if (item != null) {
        this.game.tileMap.addItem(item)
      }
    })
    this.game.tileMap.rebuildBuildableGrid()

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
          { name: 'base', initGridX: 55, initGridY: 6, team: Team.blue, commands: [], life: 100 },
          /* Player heavy tank */
          { name: 'heavy-tank', initGridX: 57, initGridY: 12, direction: EVectorDirection.downRight, team: Team.blue, uid: -1 },
          /* Two transport vehicles waiting just outside the visible map */
          { name: 'transport', initGridX: -3, initGridY: 2, direction: EVectorDirection.right, team: Team.blue, uid: -3, commands: [] },
          { name: 'transport', initGridX: -3, initGridY: 4, direction: EVectorDirection.left, team: Team.blue, uid: -4, commands: [] },
          /* Two damaged enemy scout-tanks patroling the area */
          { name: 'scout-tank', initGridX: 40, initGridY: 20, direction: EVectorDirection.up, team: Team.green, uid: -2, life: 21, order: { type: 'patrol', fromPoint: { gridX: 34, gridY: 20 }, toPoint: { gridX: 42, gridY: 26 } } },
          { name: 'scout-tank', initGridX: 14, initGridY: 0, direction: EVectorDirection.down, team: Team.green, uid: -5, life: 21, order: { type: 'patrol', fromPoint: { gridX: 14, gridY: 0 }, toPoint: { gridX: 14, gridY: 14 } } }
        ],
        triggers: [
          {
            type: ETriggerType.timed,
            time: 3000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: "Commander!! We haven't heard from the last convoy in over two hours. They should have arrived by now."
              })
            }
          },
          {
            type: ETriggerType.timed,
            time: 10000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'They were last seen in the North West Sector. Could you investigate?'
              })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              return this.game.tileMap.isItemsDead([-1, -3, -4])
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: ETriggerType.conditional,
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
            type: ETriggerType.conditional,
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
            type: ETriggerType.conditional,
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
                this.game.processOrder({ uids: [-3, -4], order: { type: 'follow', to: hero } })
              }
            }
          },
          {
            type: ETriggerType.conditional,
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
          { name: 'base', initGridX: 55, initGridY: 6, team: Team.blue, commands: [ECommandName.constructSCV], uid: -1 },
          { name: 'ground-turret', initGridX: 53, initGridY: 17, direction: EVectorDirection.up, team: Team.blue },
          { name: 'heavy-tank', initGridX: 55, initGridY: 16, direction: EVectorDirection.upLeft, team: Team.blue, uid: -2, order: { type: 'sentry' } },
          /* The first wave of attacks */
          { name: 'scout-tank', initGridX: 55, initGridY: 36, direction: EVectorDirection.down, team: Team.green, order: { type: 'hunt' } },
          { name: 'scout-tank', initGridX: 53, initGridY: 36, direction: EVectorDirection.down, team: Team.green, order: { type: 'hunt' } },
          /* Enemies patrolling the area */
          { name: 'scout-tank', initGridX: 5, initGridY: 5, direction: EVectorDirection.down, team: Team.green, order: { type: 'patrol', fromPoint: { gridX: 5, gridY: 5 }, toPoint: { gridX: 20, gridY: 20 } } },
          { name: 'scout-tank', initGridX: 5, initGridY: 15, direction: EVectorDirection.down, team: Team.green, order: { type: 'patrol', fromPoint: { gridX: 5, gridY: 15 }, toPoint: { gridX: 20, gridY: 30 } } },
          { name: 'scout-tank', initGridX: 25, initGridY: 5, direction: EVectorDirection.down, team: Team.green, order: { type: 'patrol', fromPoint: { gridX: 25, gridY: 5 }, toPoint: { gridX: 25, gridY: 20 } } },
          { name: 'scout-tank', initGridX: 35, initGridY: 5, direction: EVectorDirection.down, team: Team.green, order: { type: 'patrol', fromPoint: { gridX: 35, gridY: 5 }, toPoint: { gridX: 35, gridY: 30 } } },
          /* The Enemy Rebel Base */
          { name: 'base', initGridX: 5, initGridY: 36, team: Team.green, uid: -11 },
          { name: 'starport', initGridX: 1, initGridY: 30, team: Team.green, uid: -12 },
          { name: 'starport', initGridX: 4, initGridY: 32, team: Team.green, uid: -13 },
          { name: 'harvester', initGridX: 1, initGridY: 38, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 1, gridY: 38 } } },
          { name: 'harvester', initGridX: 10, initGridY: 38, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 10, gridY: 38 } } },
          { name: 'ground-turret', initGridX: 5, initGridY: 28, direction: EVectorDirection.up, team: Team.green },
          { name: 'ground-turret', initGridX: 7, initGridY: 33, direction: EVectorDirection.upLeft, team: Team.green },
          { name: 'ground-turret', initGridX: 8, initGridY: 37, direction: EVectorDirection.upRight, team: Team.green }
        ],
        triggers: [
          {
            type: ETriggerType.timed,
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
                  game: this.game, initX: tileMap.gridSize * 58, initY: tileMap.gridSize * 22, team: Team.blue, order: { type: 'guard', to: hero }
                }))
                tileMap.addItem(new ScoutTank({
                  game: this.game, initX: tileMap.gridSize * 60, initY: tileMap.gridSize * 21, team: Team.blue, order: { type: 'guard', to: hero }
                }))
              }
            }
          },
          {
            type: ETriggerType.timed,
            time: 25000,
            action: () => {
              // Supply extra cash
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander!! We have enough resources for another ground turret.\nSet up the turret to keep the base safe from any more attacks.'
              })
              this.game.cash[Team.blue] += 1900
            }
          },
          {
            type: ETriggerType.interval,
            interval: 1000,
            action: () => {
              // Construct a couple of bad guys to hunt the player every time enemy has enough money
              if (this.game.cash[Team.green] > 1000 && this.game.tileMap.getTeamMoveableItems(Team.green).length < 10) {
                this.game.processOrder({ uids: [-12], order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'hunt' } } })
                this.game.processOrder({ uids: [-13], order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'hunt' } } })
              }
            }
          },
          {
            type: ETriggerType.interval,
            interval: 180000,
            action: () => {
              // Send in some reinforcements every three minutes
              if (this.game.tileMap.getTeamMoveableItems(Team.blue).length < 15) {
                this.game.showMessage({
                  character: EMessageCharacter.op,
                  message: 'Commander!! More Reinforcments have arrived.'
                })
                const { tileMap } = this.game
                tileMap.addItem(new ScoutTank({
                  game: this.game, initX: tileMap.gridSize * 62, initY: tileMap.gridSize * 22, team: Team.blue, order: { type: 'move-and-attack', toPoint: { gridX: 55, gridY: 21 } }
                }))
                tileMap.addItem(new HeavyTank({
                  game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 23, team: Team.blue, order: { type: 'move-and-attack', toPoint: { gridX: 56, gridY: 23 } }
                }))
              }
            }
          },
          {
            type: ETriggerType.timed,
            time: 300000,
            action: () => {
              // Send in air support after 5 minutes
              this.game.showMessage({
                character: EMessageCharacter.pilot,
                message: 'Close Air Support en route. Will try to do what I can.'
              })
              const { tileMap } = this.game
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 22, commands: [], team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * 61, initY: tileMap.gridSize * 20, team: Team.blue, order: { type: 'hunt' }
              }))
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              //  Lose if our base gets destroyed
              return this.game.tileMap.isItemsDead(-1)
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              // Win if enemy base gets destroyed
              return this.game.tileMap.isItemsDead(-11)
            },
            action: () => {
              this.endMission({ success: true })
            }
          }
        ]
      },
      {
        name: 'Under Siege',
        briefing: 'Thanks to the attack led by you, we now have control of the rebel base. We can expect the rebels to try to retaliate.\n The colony is sending in aircraft to help us evacuate back to the main camp. All we need to do is hang tight until the choppers get here. \n Luckily, we have some supplies and ammunition to defend ourselves with until they get here. \nProtect the transports at all costs.',
        mapImageSrc: 'level1Background',
        mapSettingsSrc: 'level1Settings',
        startGridX: 0,
        startGridY: 20,
        cash: {
          blue: 0,
          green: 0
        },
        items: [
          /* The Rebel Base now in our hands */
          { name: 'base', initGridX: 5, initGridY: 36, team: Team.blue, uid: -11 },
          { name: 'starport', initGridX: 1, initGridY: 28, team: Team.blue, uid: -12 },
          { name: 'starport', initGridX: 4, initGridY: 32, team: Team.blue, uid: -13 },
          { name: 'harvester', initGridX: 1.5, initGridY: 38.5, initCenter: true, team: Team.blue, order: { type: 'deploy', toPoint: { gridX: 1, gridY: 38 } } },
          { name: 'ground-turret', initGridX: 7, initGridY: 28, team: Team.blue },
          { name: 'ground-turret', initGridX: 8, initGridY: 32, team: Team.blue },
          { name: 'ground-turret', initGridX: 11, initGridY: 37, team: Team.blue },
          /* The transports that need to be protected */
          { name: 'transport', initGridX: 2, initGridY: 33, team: Team.blue, commands: [], uid: -1 },
          { name: 'transport', initGridX: 1, initGridY: 34, team: Team.blue, commands: [], uid: -2 },
          { name: 'transport', initGridX: 2, initGridY: 35, team: Team.blue, commands: [], uid: -3 },
          { name: 'transport', initGridX: 1, initGridY: 36, team: Team.blue, commands: [], uid: -4 },
          /* The chopper pilot from the last mission */
          { name: 'chopper', initGridX: 15, initGridY: 40, team: Team.blue, commands: [], uid: -5, order: { type: 'patrol', fromPoint: { gridX: 15, gridY: 40 }, toPoint: { gridX: 0, gridY: 25 } } },
          /* The first wave of attacks */
          { name: 'scout-tank', initGridX: 15, initGridY: 16, team: Team.green, order: { type: 'hunt' } },
          { name: 'scout-tank', initGridX: 17, initGridY: 16, team: Team.green, order: { type: 'hunt' } },
          /* Secret Rebel bases */
          { name: 'starport', initGridX: 35, initGridY: 37, team: Team.green, uid: -23 },
          { name: 'starport', initGridX: 33, initGridY: 37, team: Team.green, uid: -24 },
          { name: 'harvester', initGridX: 28.5, initGridY: 39.5, initCenter: true, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 28, gridY: 39 } } },
          { name: 'harvester', initGridX: 30.5, initGridY: 39.5, initCenter: true, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 30, gridY: 39 } } },
          { name: 'starport', initGridX: 3, initGridY: 0, team: Team.green, uid: -21 },
          { name: 'starport', initGridX: 6, initGridY: 0, team: Team.green, uid: -22 },
          { name: 'harvester', initGridX: 0, initGridY: 2, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 0, gridY: 2 } } },
          { name: 'harvester', initGridX: 0, initGridY: 4, team: Team.green, order: { type: 'deploy', toPoint: { gridX: 0, gridY: 4 } } }
        ],
        triggers: [
          {
            type: ETriggerType.conditional,
            condition: () => {
              return this.game.tileMap.isItemsDead([-1, -2, -3, -4])
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: ETriggerType.timed,
            time: 5000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.driver,
                message: 'Commander!! The rebels have started attacking. We need to protect the base at any cost.'
              })
            }
          },
          {
            type: ETriggerType.timed,
            time: 20000,
            action: () => {
              const { tileMap } = this.game
              tileMap.addItem(new Transport({
                game: this.game, initX: tileMap.gridSize * 57, initY: tileMap.gridSize * 3, commands: [], team: Team.blue, uid: -6
              }))
              this.game.processOrder({ uids: [-5], orderType: 'guard', toUid: -6 })
              this.game.showMessage({
                character: EMessageCharacter.driver,
                message: 'Commander!! The colony has sent some extra supplies. We are coming in from the North East sector through rebel territory. We could use a little protection.'
              })
            }
          },
          {
            type: ETriggerType.timed,
            time: 28000,
            action: () => {
              // Have the pilot offer to assist and get some villains in to make it interesting
              const { tileMap } = this.game
              tileMap.addItem(new ScoutTank({
                game: this.game, initX: tileMap.gridSize * 57, initY: tileMap.gridSize * 28, team: Team.green, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * 55, initY: tileMap.gridSize * 33, team: Team.green, order: { type: 'sentry' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * 53, initY: tileMap.gridSize * 33, team: Team.green, order: { type: 'sentry' }
              }))
              tileMap.addItem(new ScoutTank({
                game: this.game, initX: tileMap.gridSize * 35, initY: tileMap.gridSize * 25, team: Team.green, order: { type: 'patrol', fromPoint: { gridX: 35, gridY: 25 }, toPoint: { gridX: 35, gridY: 30 } }
              }))
              this.game.showMessage({
                character: EMessageCharacter.pilot,
                message: "I'm on my way."
              })
            }
          },
          {
            type: ETriggerType.timed,
            time: 48000,
            action: () => {
              // Start moving the transport
              this.game.processOrder({ uids: [-6], order: { type: 'move', toPoint: { gridX: 1.5, gridY: 38.5 } } })
              this.game.showMessage({
                character: EMessageCharacter.driver,
                message: 'Thanks! Appreciate the backup. All right. Off we go.'
              })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              // Pilot asks for help when attacked
              const pilot = this.game.tileMap.getItemByUid(-5)
              if (pilot != null) {
                return pilot.life < pilot.hitPoints * 0.8
              }
              return false
            },
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.pilot,
                message: "We are under attack! Need assistance. This doesn't look good."
              })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              // Extra supplies from new transport
              const transport = this.game.tileMap.getItemByUid(-6)
              if (transport != null) {
                const transportGrid = transport.getGridXY({ center: true })
                return transportGrid.gridX < 5 && transportGrid.gridY > 37
              }
              return false
            },
            action: () => {
              this.game.cash[Team.blue] += 2000
              this.game.showMessage({
                character: EMessageCharacter.driver,
                message: 'The rebels came out of nowhere. There was nothing we could do. She saved our lives. Hope these supplies were worth it.'
              })
            }
          },
          {
            // Send in waves of enemies every 150 seconds
            type: ETriggerType.interval,
            interval: 150000,
            action: () => {
              // Count aircraft and tanks already available to bad guys
              let wraithCount = 0
              let heavyTankCount = 0
              const { moveableItems } = this.game.tileMap
              for (let i = 0; i < moveableItems.length; i++) {
                const item = moveableItems[i]
                if (item.team === Team.green) {
                  switch (item.itemName) {
                    case 'wraith':
                      wraithCount++
                      break
                    case 'heavy-tank':
                      heavyTankCount++
                      break
                  }
                }
              }

              // Make sure enemy has atleast two wraiths and two heavy tanks, and use the remaining starports to build choppers and scouts
              if (wraithCount === 0) {
                // No wraiths alive. Ask both starports to make wraiths
                this.game.processOrder({ uids: [-23, -24], order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'hunt' } } })
              } else if (wraithCount === 1) {
                // One wraith alive. Ask starports to make one wraith and one chopper
                this.game.processOrder({ uids: [-23], order: { type: 'construct-unit', name: EItemName.Wraith, unitOrder: { type: 'hunt' } } })
                this.game.processOrder({ uids: [-24], order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'hunt' } } })
              } else {
                // Two wraiths alive. Ask both starports to make choppers
                this.game.processOrder({ uids: [-23, -24], order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'hunt' } } })
              }

              if (heavyTankCount === 0) {
                // No heavy-tanks alive. Ask both starports to make heavy-tanks
                this.game.processOrder({ uids: [-21, -22], order: { type: 'construct-unit', name: EItemName.HeavyTank, unitOrder: { type: 'hunt' } } })
              } else if (heavyTankCount === 1) {
                // One heavy-tank alive. Ask starports to make one heavy-tank and one scout-tank
                this.game.processOrder({ uids: [-21], order: { type: 'construct-unit', name: EItemName.HeavyTank, unitOrder: { type: 'hunt' } } })
                this.game.processOrder({ uids: [-22], order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'hunt' } } })
              } else {
                // Two heavy-tanks alive. Ask both starports to make scout-tanks
                this.game.processOrder({ uids: [-21, -22], order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'hunt' } } })
              }
              // Ask any units on the field to attack
              const uids = []
              for (let i = 0; i < moveableItems.length; i++) {
                const item = moveableItems[i]
                if (item.team === Team.green) {
                  uids.push(item.uid)
                }
              };
              this.game.processOrder({ uids, order: { type: 'hunt' } })
            }
          },
          {
            type: ETriggerType.timed,
            time: 480000,
            action: () => {
              // After 8 minutes, start waiting for the end
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander! The colony air fleet is just a few minutes away.'
              })
            }
          },
          {
            type: ETriggerType.timed,
            time: 600000,
            action: () => {
              // After 10 minutes send in reinforcements
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander! The colony air fleet is approaching'
              })
              const { tileMap } = this.game
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 20, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 22, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 24, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 26, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 28, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 30, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 32, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 34, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Wraith({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 36, team: Team.blue, order: { type: 'hunt' }
              }))
              tileMap.addItem(new Chopper({
                game: this.game, initX: tileMap.gridSize * -1, initY: tileMap.gridSize * 38, team: Team.blue, order: { type: 'hunt' }
              }))
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              return this.game.tileMap.getTeamStaticItems(Team.green).length <= 0
            },
            action: () => {
              this.endMission({ success: true })
            }
          }
        ]
      },
      {
        name: 'Entitties',
        briefing: 'In this level, you will start to learn how to build oil derrick to increase our income.',
        mapImageSrc: 'level2Background',
        mapSettingsSrc: 'level2Settings',
        startGridX: 0,
        startGridY: 30,
        cash: {
          blue: 16000,
          green: 0
        },
        items: [
          /* The Rebel Base now in our hands */
          { name: 'base', initGridX: 2, initGridY: 36, team: Team.blue, commands: [ECommandName.constructHarvester], uid: -1 },
          { name: 'base', initGridX: 56, initGridY: 2, team: Team.green, uid: -2 }
        ],
        triggers: [
          {
            type: ETriggerType.timed,
            time: 2000,
            action: () => {
              this.game.showMessage({
                character: EMessageCharacter.op,
                message: 'Commander! Please build harvester truck and deplot it on some oil field to become oil derrick.'
              })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              return this.game.tileMap.isItemsDead([-1])
            },
            action: () => {
              this.endMission({ success: false })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              return this.game.tileMap.isItemsDead([-2])
            },
            action: () => {
              this.endMission({ success: true })
            }
          },
          {
            type: ETriggerType.conditional,
            condition: () => {
              return Boolean(this.game.tileMap.staticItems.find(item => item.itemName === EItemName.OilDerrick))
            },
            action: () => {
              // now base can construct scv
              const base = this.game.tileMap.getItemByUid(-1)
              if (base != null) {
                this.game.clearSelection()
                base.commands = [ECommandName.constructSCV]
              }
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
