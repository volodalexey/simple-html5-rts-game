interface ITimedTrigger {
  type: ETriggerType.timed
  time: number
  action: () => void
  insertTrigger?: ITrigger
}

interface IIntervalTrigger {
  type: ETriggerType.interval
  interval: number
  action: () => void
  insertTrigger?: ITrigger
}

interface IConditionalTrigger {
  type: ETriggerType.conditional
  action: () => void
  condition: () => boolean
  insertTrigger?: ITrigger
}

export type ITrigger = ITimedTrigger | IConditionalTrigger | IIntervalTrigger

export enum ETriggerType {
  timed = 'timed',
  interval = 'interval',
  conditional = 'conditional'
}

export class TimedTrigger {
  public type = ETriggerType.timed
  public time!: number
  public action!: () => void
  public insertTrigger?: ITrigger
  constructor ({ time, action, insertTrigger }: ITimedTrigger) {
    this.time = time
    this.action = action
    this.insertTrigger = insertTrigger
  }
}

export class IntervalTrigger {
  public type = ETriggerType.interval
  public interval!: number
  public action!: () => void
  public elapsedTime = 0
  public insertTrigger?: ITrigger
  constructor ({ interval, action, insertTrigger }: IIntervalTrigger) {
    this.interval = interval
    this.action = action
    this.insertTrigger = insertTrigger
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

export class ConditionalTrigger {
  public type = ETriggerType.conditional
  public action!: () => void
  public condition!: () => boolean
  public insertTrigger?: ITrigger
  constructor ({ action, condition, insertTrigger }: IConditionalTrigger) {
    this.action = action
    this.condition = condition
    this.insertTrigger = insertTrigger
  }
}

export type Trigger = TimedTrigger | ConditionalTrigger | IntervalTrigger

export function createTrigger (triggerDescription: ITrigger): Trigger {
  switch (triggerDescription.type) {
    case ETriggerType.timed:
      return new TimedTrigger(triggerDescription)
    case ETriggerType.interval:
      return new IntervalTrigger(triggerDescription)
    case ETriggerType.conditional:
      return new ConditionalTrigger(triggerDescription)
  }
}
