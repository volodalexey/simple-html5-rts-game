export interface ITrigger {
  type: ETriggerType
  action: () => void
  insertTrigger?: TriggerUnion
  interval?: number
  remove?: boolean
}

export interface ITimedTrigger extends ITrigger {
  type: ETriggerType.timed
  time: number
}

export interface IIntervalTrigger extends ITrigger {
  interval: number
  type: ETriggerType.interval
}

export interface IConditionalTrigger extends ITrigger {
  type: ETriggerType.conditional
  condition: () => boolean
}

export type TriggerUnion = ITimedTrigger | IConditionalTrigger | IIntervalTrigger

export enum ETriggerType {
  timed = 'timed',
  interval = 'interval',
  conditional = 'conditional'
}

export class Trigger {
  public type !: ETriggerType
  public action!: () => void
  public insertTrigger?: TriggerUnion
  public elapsedTime = 0
  public interval!: number
  public remove!: boolean

  constructor ({ type, action, insertTrigger, interval, remove }: ITrigger) {
    this.type = type
    this.action = action
    this.insertTrigger = insertTrigger
    this.interval = interval ?? 0
    this.remove = remove ?? false
  }

  isElapsed (deltaMS: number): boolean {
    if (this.elapsedTime >= this.interval) {
      this.elapsedTime = 0
      return true
    }
    this.elapsedTime += deltaMS
    return false
  }
}

export class TimedTrigger extends Trigger {
  public time!: number
  constructor ({ time, action, insertTrigger, remove }: ITimedTrigger) {
    super({ type: ETriggerType.timed, interval: time, action, insertTrigger, remove: remove ?? true })
    this.time = time
  }
}

export class IntervalTrigger extends Trigger {
  constructor ({ interval, action, insertTrigger, remove }: IIntervalTrigger) {
    super({ type: ETriggerType.interval, interval, action, insertTrigger, remove })
  }
}

export class ConditionalTrigger extends Trigger {
  public condition!: () => boolean
  constructor ({ interval, condition, action, insertTrigger, remove }: IConditionalTrigger) {
    super({ type: ETriggerType.conditional, interval, action, insertTrigger, remove: remove ?? true })
    this.condition = condition
  }
}

export function createTrigger (triggerDescription: TriggerUnion): Trigger {
  switch (triggerDescription.type) {
    case ETriggerType.timed:
      return new TimedTrigger(triggerDescription)
    case ETriggerType.interval:
      return new IntervalTrigger(triggerDescription)
    case ETriggerType.conditional:
      return new ConditionalTrigger(triggerDescription)
  }
}

export function handleTiggers ({ deltaMS, triggers }: { deltaMS: number, triggers: Trigger[] }): void {
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i]
    let triggered = false
    switch (trigger.type) {
      case ETriggerType.timed: {
        if (trigger.isElapsed(deltaMS)) {
          trigger.action()
          triggered = true
        }
        break
      }
      case ETriggerType.conditional: {
        if (trigger.isElapsed(deltaMS) && (trigger as ConditionalTrigger).condition()) {
          trigger.action()
          triggered = true
        }
        break
      }
      case ETriggerType.interval: {
        if (trigger.isElapsed(deltaMS)) {
          trigger.action()
          triggered = true
        }
        break
      }
    }
    if (triggered && trigger.remove) {
      triggers.splice(i, 1)
      i--
    }
    if (triggered && trigger.insertTrigger != null) {
      const newTrigger = createTrigger(trigger.insertTrigger)
      triggers.push(newTrigger)
    }
  }
}
