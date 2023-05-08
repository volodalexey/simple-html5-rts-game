import { type Game } from './Game'
import { Chopper } from './air-vehicles/Chopper'
import { Wraith } from './air-vehicles/Wraith'
import { type Base } from './buildings/Base'
import { GroundTurret } from './buildings/GroundTurret'
import { Starport } from './buildings/Starport'
import { type BaseActiveItem, type Team } from './common'
import { EItemName } from './interfaces/IItem'
import { logAI } from './logger'
import { Harvester } from './vehicles/Harvester'
import { HeavyTank } from './vehicles/HeavyTank'
import { SCV } from './vehicles/SCV'
import { ScoutTank } from './vehicles/ScoutTank'

export interface IAIOptions {
  game: Game
  team: Team
}

interface IItemStat {
  count: number
  uids: number[]
  pickedUids: number[]
  items: BaseActiveItem[]
  idDic: Record<number, BaseActiveItem>
  account: (item: BaseActiveItem) => void
  one: () => BaseActiveItem[]
  other: (strict?: boolean) => BaseActiveItem[]
}

interface IStat {
  buildings: {
    [EItemName.Base]: IItemStat
    [EItemName.OilDerrick]: IItemStat
    [EItemName.Starport]: IItemStat
    [EItemName.GroundTurret]: IItemStat
  }
  groundVehicles: {
    [EItemName.SCV]: IItemStat
    [EItemName.Harvester]: IItemStat
    [EItemName.ScoutTank]: IItemStat
    [EItemName.HeavyTank]: IItemStat
  }
  airVehicles: {
    [EItemName.Chopper]: IItemStat
    [EItemName.Wraith]: IItemStat
  }
}

class ItemStat implements IItemStat {
  public count = 0
  public uids: number[] = []
  public items: BaseActiveItem[] = []
  public idDic: Record<number, BaseActiveItem> = {}
  public pickedUids: number[] = []

  account (item: BaseActiveItem): void {
    this.count++
    this.uids.push(item.uid)
    this.items.push(item)
    this.idDic[item.uid] = item
  }

  one (): [BaseActiveItem] {
    return [this.items[Math.floor(Math.random() * this.items.length)]]
  }

  other (strict = false): BaseActiveItem[] {
    const leftItems = this.items.filter(item => !this.pickedUids.includes(item.uid))
    if (leftItems.length > 0) {
      const picked = leftItems[Math.floor(Math.random() * leftItems.length)]
      this.pickedUids.push(picked.uid)
      return [picked]
    }
    return strict ? [] : this.one()
  }
}

class BaseItemStat extends ItemStat {
  public override items: Base[] = []
  override one (): [Base] {
    const leftItems = this.items.filter(item => !item.isConstructing())
    if (leftItems.length > 0) {
      return [leftItems[Math.floor(Math.random() * leftItems.length)]]
    }
    return [this.items[Math.floor(Math.random() * this.items.length)]]
  }

  override other (strict = false): Base[] {
    const leftItems = this.items.filter(item => !item.isConstructing() && !this.pickedUids.includes(item.uid))
    if (leftItems.length > 0) {
      const picked = leftItems[Math.floor(Math.random() * leftItems.length)]
      this.pickedUids.push(picked.uid)
      return [picked]
    }
    return strict ? [] : this.one()
  }
}

class StarportItemStat extends ItemStat {
  public override items: Starport[] = []
  override one (): [Starport] {
    const leftItems = this.items.filter(item => item.isIdle())
    if (leftItems.length > 0) {
      return [leftItems[Math.floor(Math.random() * leftItems.length)]]
    }
    return [this.items[Math.floor(Math.random() * this.items.length)]]
  }

  override other (strict = false): Starport[] {
    const leftItems = this.items.filter(item => item.isIdle() && !this.pickedUids.includes(item.uid))
    if (leftItems.length > 0) {
      const picked = leftItems[Math.floor(Math.random() * leftItems.length)]
      this.pickedUids.push(picked.uid)
      return [picked]
    }
    return strict ? [] : this.one()
  }
}

export class AI {
  public game!: Game
  public team!: Team
  public stat!: IStat
  public elapsedFrames = 0
  public calcOrdersEachFrame = 100

  constructor ({ game, team }: IAIOptions) {
    this.game = game
    this.team = team
  }

  static getNewStat (): IStat {
    return {
      buildings: {
        [EItemName.Base]: new BaseItemStat(),
        [EItemName.OilDerrick]: new ItemStat(),
        [EItemName.Starport]: new StarportItemStat(),
        [EItemName.GroundTurret]: new ItemStat()
      },
      groundVehicles: {
        [EItemName.SCV]: new ItemStat(),
        [EItemName.Harvester]: new ItemStat(),
        [EItemName.ScoutTank]: new ItemStat(),
        [EItemName.HeavyTank]: new ItemStat()
      },
      airVehicles: {
        [EItemName.Chopper]: new ItemStat(),
        [EItemName.Wraith]: new ItemStat()
      }
    }
  }

  collectStat (): void {
    this.stat = AI.getNewStat()
    const { activeItems } = this.game.tileMap
    for (let i = 0; i < activeItems.children.length; i++) {
      const item = activeItems.children[i]
      if (item.team === this.team) {
        switch (item.itemName) {
          case 'base':
            this.stat.buildings.base.account(item)
            break
          case 'oil-derrick':
            this.stat.buildings['oil-derrick'].account(item)
            break
          case 'ground-turret':
            this.stat.buildings['ground-turret'].account(item)
            break
          case 'starport':
            this.stat.buildings.starport.account(item)
            break
          case 'harvester':
            this.stat.groundVehicles.harvester.account(item)
            break
          case 'scv':
            this.stat.groundVehicles.scv.account(item)
            break
          case 'scout-tank':
            this.stat.groundVehicles['scout-tank'].account(item)
            break
          case 'heavy-tank':
            this.stat.groundVehicles['heavy-tank'].account(item)
            break
          case 'chopper':
            this.stat.airVehicles.chopper.account(item)
            break
          case 'wraith':
            this.stat.airVehicles.wraith.account(item)
            break
        }
      }
    }
  }

  get attackableUnitCount (): number {
    const { stat } = this
    return stat.groundVehicles['scout-tank'].count + stat.groundVehicles['heavy-tank'].count +
      stat.airVehicles.chopper.count + stat.airVehicles.wraith.count
  }

  get cash (): number {
    return this.game.cash[this.team]
  }

  handleUpdate (deltaMS: number): void {
    if (this.elapsedFrames >= this.calcOrdersEachFrame) {
      this.elapsedFrames = 0
      this.calcOrders()
    } else {
      this.elapsedFrames += 1
    }
  }

  calcMainOrders (): boolean {
    const {
      stat: {
        buildings: {
          base, 'oil-derrick': oilDerrick
        }, groundVehicles: {
          harvester
        }
      },
      attackableUnitCount,
      cash
    } = this
    const maxAU1 = 10
    const factor1 = 1.2
    const factor2 = 1.4
    const factor3 = 2
    if (oilDerrick.count === 0 && harvester.count === 0 && cash >= Harvester.cost) {
      this.game.processOrder({ items: base.one(), order: { type: 'construct-unit', name: EItemName.Harvester, unitOrder: { type: 'deploy', toPoint: { gridX: 51, gridY: 2 } } } })
      logAI(`calcMainOrders(${cash}) 1`)
      return true
    } else if (oilDerrick.count === 1 && harvester.count === 0 && cash >= Harvester.cost * factor1 && attackableUnitCount > maxAU1) {
      this.game.processOrder({ items: base.one(), order: { type: 'construct-unit', name: EItemName.Harvester, unitOrder: { type: 'deploy', toPoint: { gridX: 51, gridY: 29 } } } })
      logAI(`calcMainOrders(${cash}) 2`)
      return true
    } else if (oilDerrick.count === 2 && harvester.count === 0 && cash >= Harvester.cost * factor2 && attackableUnitCount > maxAU1) {
      this.game.processOrder({ items: base.one(), order: { type: 'construct-unit', name: EItemName.Harvester, unitOrder: { type: 'deploy', toPoint: { gridX: 31, gridY: 38 } } } })
      logAI(`calcMainOrders(${cash}) 3`)
      return true
    } else if (oilDerrick.count === 3 && harvester.count === 0 && cash >= Harvester.cost * factor3 && attackableUnitCount > maxAU1) {
      this.game.processOrder({ items: base.one(), order: { type: 'construct-unit', name: EItemName.Harvester, unitOrder: { type: 'deploy', toPoint: { gridX: 30, gridY: 17 } } } })
      logAI(`calcMainOrders(${cash}) 4`)
      return true
    }
    return false
  }

  calcSecondaryOrders (): boolean {
    const {
      stat: {
        buildings: {
          base, starport
        }, groundVehicles: {
          scv
        }
      },
      attackableUnitCount,
      cash
    } = this
    const maxAU2 = 8
    const factor1 = 1.5
    if (scv.count === 0 && cash >= SCV.cost) {
      this.game.processOrder({ items: base.one(), order: { type: 'construct-unit', name: EItemName.SCV, unitOrder: { type: 'move', toPoint: { gridX: 59, gridY: 4 } } } })
      logAI(`calcSecondaryOrders(${cash}) 1`)
      return true
    } else if (scv.count === 1 && starport.count === 0 && cash >= Starport.cost) {
      this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.Starport, toPoint: { gridX: 53, gridY: 6 } } })
      logAI(`calcSecondaryOrders(${cash}) 2`)
      return true
    } else if (scv.count === 1 && starport.count === 1 && cash >= Starport.cost * factor1 && attackableUnitCount > maxAU2) {
      this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.Starport, toPoint: { gridX: 58, gridY: 6 } } })
      logAI(`calcSecondaryOrders(${cash}) 3`)
      return true
    }
    return false
  }

  calcAttackableOrders (): boolean {
    const {
      stat: {
        buildings: {
          starport
        }, groundVehicles: {
          'scout-tank': scoutTank, 'heavy-tank': heavyTank
        }, airVehicles: {
          chopper, wraith
        }
      },
      cash
    } = this
    const maxST1 = 3
    if (chopper.count === 0) {
      this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'patrol', fromPoint: { gridX: 57, gridY: 9 }, toPoint: { gridX: 52, gridY: 12 } } } })
      logAI(`calcAttackableOrders(${cash}) 1`)
      return true
    } else if (wraith.count === 0) {
      this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.Wraith, unitOrder: { type: 'patrol', fromPoint: { gridX: 58, gridY: 10 }, toPoint: { gridX: 51, gridY: 10 } } } })
      logAI(`calcAttackableOrders(${cash}) 2`)
      return true
    } else if (chopper.count === 1 && wraith.count === 1) {
      this.game.processOrder({ items: starport.other(), order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 51, gridY: 3 } } } })
      this.game.processOrder({ items: starport.other(), order: { type: 'construct-unit', name: EItemName.Wraith, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 50, gridY: 4 } } } })
      logAI(`calcAttackableOrders(${cash}) 3`)
      return true
    } else if (heavyTank.count === 0) {
      this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.HeavyTank, unitOrder: { type: 'patrol', fromPoint: { gridX: 54, gridY: 12 }, toPoint: { gridX: 54, gridY: 14 } } } })
      logAI(`calcAttackableOrders(${cash}) 4`)
      return true
    } else if (heavyTank.count === 1) {
      this.game.processOrder({ items: starport.other(), order: { type: 'construct-unit', name: EItemName.HeavyTank, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 50, gridY: 14 } } } })
      logAI(`calcAttackableOrders(${cash}) 5`)
      return true
    } else if (scoutTank.count < maxST1 && cash >= ScoutTank.cost) {
      this.game.processOrder({ items: starport.other(true), order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 51, gridY: 15 } } } })
      logAI(`calcAttackableOrders(${cash}) 6`)
      return true
    }
    return false
  }

  calcFortificationOrders (): boolean {
    const {
      stat: {
        buildings: {
          'ground-turret': groundTurret
        }, groundVehicles: {
          scv
        }
      },
      cash
    } = this

    const maxC1 = 250
    const factor1 = 1.2
    const factor2 = 1.4
    const factor3 = 2
    if (scv.count === 1 && cash > maxC1) {
      if (groundTurret.count === 0) {
        this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.GroundTurret, toPoint: { gridX: 50, gridY: 9 } } })
        logAI(`calcFortificationOrders(${cash}) 1`)
        return true
      } else if (groundTurret.count === 1 && cash >= GroundTurret.cost * factor1) {
        this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.GroundTurret, toPoint: { gridX: 52, gridY: 11 } } })
        logAI(`calcFortificationOrders(${cash}) 2`)
        return true
      } else if (groundTurret.count === 2 && cash >= GroundTurret.cost * factor2) {
        this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.GroundTurret, toPoint: { gridX: 55, gridY: 11 } } })
        logAI(`calcFortificationOrders(${cash}) 3`)
        return true
      } else if (groundTurret.count === 3 && cash >= GroundTurret.cost * factor3) {
        this.game.processOrder({ items: scv.one(), order: { type: 'build', name: EItemName.GroundTurret, toPoint: { gridX: 58, gridY: 11 } } })
        logAI(`calcFortificationOrders(${cash}) 4`)
        return true
      }
    }
    return false
  }

  calcWaveOrders (): boolean {
    const {
      stat: {
        buildings: {
          'ground-turret': groundTurret
        },
        groundVehicles: {
          'scout-tank': scoutTank, 'heavy-tank': heavyTank
        },
        airVehicles: {
          chopper, wraith
        }
      },
      cash
    } = this
    const fST1 = 4
    const fHT1 = 3
    const fC1 = 100
    const fGT1 = 4
    if (scoutTank.count >= fST1 && heavyTank.count >= fHT1 && cash > fC1 && groundTurret.count >= fGT1) {
      this.game.processOrder({ items: scoutTank.items, order: { type: 'move-and-attack', toPoint: { gridX: 0, gridY: 39 } } })
      this.game.processOrder({ items: heavyTank.items, order: { type: 'move-and-attack', toPoint: { gridX: 0, gridY: 39 } } })
      logAI(`calcWaveOrders(${cash}) 1`)
      return true
    } else if (chopper.count >= 5 && wraith.count >= 5) {
      this.game.processOrder({ items: chopper.items, order: { type: 'move-and-attack', toPoint: { gridX: 0, gridY: 39 } } })
      this.game.processOrder({ items: wraith.items, order: { type: 'move-and-attack', toPoint: { gridX: 0, gridY: 39 } } })
      logAI(`calcWaveOrders(${cash}) 2`)
      return true
    }
    return false
  }

  calcRandomOrders (): boolean {
    const {
      stat: {
        buildings: {
          starport
        }
      },
      cash
    } = this
    const seed1 = Math.random()
    const seed2 = 1 + Math.random() * 3
    if (seed1 < 0.1) {
      if (cash >= Chopper.cost * seed2) {
        this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.Chopper, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 51, gridY: 3 } } } })
        logAI(`calcRandomOrders(${cash}) 1`)
        return true
      }
    } else if (seed1 < 0.3) {
      if (cash >= Wraith.cost * seed2) {
        this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.Wraith, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 51, gridY: 3 } } } })
        logAI(`calcRandomOrders(${cash}) 2`)
        return true
      }
    } else if (seed1 < 0.6) {
      if (cash >= HeavyTank.cost * seed2) {
        this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.HeavyTank, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 55, gridY: 17 } } } })
        logAI(`calcRandomOrders(${cash}) 3`)
        return true
      }
    } else if (seed1 < 0.9) {
      if (cash >= ScoutTank.cost * seed2) {
        this.game.processOrder({ items: starport.one(), order: { type: 'construct-unit', name: EItemName.ScoutTank, unitOrder: { type: 'move-and-attack', toPoint: { gridX: 52, gridY: 18 } } } })
        logAI(`calcRandomOrders(${cash}) 4`)
        return true
      }
    }
    return false
  }

  calcOrders (): void {
    this.collectStat()
    if (this.calcMainOrders()) {
      return
    }
    if (this.calcSecondaryOrders()) {
      return
    }
    if (this.calcAttackableOrders()) {
      return
    }
    if (this.calcFortificationOrders()) {
      return
    }
    if (this.calcWaveOrders()) {
      return
    }
    if (this.calcRandomOrders()) {
      return
    }

    logAI(`calcOrders(${this.cash})`)
  }
}
