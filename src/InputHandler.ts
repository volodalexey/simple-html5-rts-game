import { type FederatedPointerEvent, type Container, type IPointData } from 'pixi.js'

import { logInputDirection, logKeydown, logKeyup, logPointerEvent } from './logger'

interface IInputHandlerOptions {
  interactiveChildren?: boolean
  eventTarget: Container
}

export class InputHandler {
  public pointerXDown: number | null = null
  public pointerYDown: number | null = null
  public pointerSpecial = false
  public eventTarget!: Container
  public relativeToTarget!: Container & {
    getCollisionShapeBounds: (relativePoint?: IPointData) => {
      top: number
      right: number
      bottom: number
      left: number
    }
  }

  public interactiveChildren!: boolean
  constructor ({ eventTarget, interactiveChildren = false }: IInputHandlerOptions) {
    this.eventTarget = eventTarget
    this.interactiveChildren = interactiveChildren

    this.addEventLesteners()
  }

  addEventLesteners (): void {
    this.eventTarget.interactive = true
    this.eventTarget.on('pointerdown', this.handlePointerDown)
    this.eventTarget.on('pointermove', this.handlePointerMove)
    this.eventTarget.on('pointerup', this.handlePointerUp)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  private handlePlayerMove (pressed: boolean | undefined, e: FederatedPointerEvent): void {
    const point = e.global
    logPointerEvent(`${e.type} px=${point.x} py=${point.y}`)
    this.applyPointerToDirection(pressed, point.x, point.y)
  }

  private readonly handlePointerDown = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(true, e)
  }

  private readonly handlePointerMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(undefined, e)
  }

  private readonly handlePointerUp = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(false, e)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    logKeydown(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this.applyUpDirection(true)
        break
      case 'KeyA': case 'ArrowLeft':
        this.applyLeftDirection(true)
        break
      case 'KeyD':case 'ArrowRight':
        this.applyRightDirection(true)
        break
      case 'KeyS':case 'ArrowDown':
        this.applyDownDirection(true)
        break
      case 'ShiftLeft': case 'ControlLeft': case 'Space':
        this.pointerSpecial = true
        break
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    logKeyup(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this.applyUpDirection(false)
        break
      case 'KeyA': case 'ArrowLeft':
        this.applyLeftDirection(false)
        break
      case 'KeyD':case 'ArrowRight':
        this.applyRightDirection(false)
        break
      case 'KeyS':case 'ArrowDown':
        this.applyDownDirection(false)
        break
      case 'ShiftLeft': case 'ControlLeft': case 'Space':
        this.pointerSpecial = false
        break
    }
  }

  private applyUpDirection (pressed: boolean): void {
    if (pressed) {
      this.pointerXDown = this.pointerXDown != null ? 0 : null
    }
    this.pointerYDown = pressed
      ? -1
      : (this.pointerYDown === -1 ? null : this.pointerYDown)
    logInputDirection(`UP px=${this.pointerXDown} py=${this.pointerYDown}`)
  }

  private applyDownDirection (pressed: boolean): void {
    if (pressed) {
      this.pointerXDown = this.pointerXDown != null ? 0 : null
    }
    this.pointerYDown = pressed
      ? 1
      : (this.pointerYDown === 1 ? null : this.pointerYDown)
    logInputDirection(`DOWN px=${this.pointerXDown} py=${this.pointerYDown}`)
  }

  private applyLeftDirection (pressed: boolean): void {
    if (pressed) {
      this.pointerYDown = this.pointerYDown != null ? 0 : null
    }
    this.pointerXDown = pressed
      ? -1
      : (this.pointerXDown === -1 ? null : this.pointerXDown)
    logInputDirection(`LEFT px=${this.pointerXDown} py=${this.pointerYDown}`)
  }

  private applyRightDirection (pressed: boolean): void {
    if (pressed) {
      this.pointerYDown = this.pointerYDown != null ? 0 : null
    }
    this.pointerXDown = pressed
      ? 1
      : (this.pointerXDown === 1 ? null : this.pointerXDown)
    logInputDirection(`RIGHT px=${this.pointerXDown} py=${this.pointerYDown}`)
  }

  private isPointerDown (): boolean {
    return this.pointerXDown !== null || this.pointerYDown !== null
  }

  hasDirectionLeft (): boolean {
    return this.pointerXDown !== null && this.pointerXDown < 0
  }

  hasDirectionRight (): boolean {
    return this.pointerXDown !== null && this.pointerXDown > 0
  }

  hasDirectionUp (): boolean {
    return this.pointerYDown !== null && this.pointerYDown < 0
  }

  hasDirectionDown (): boolean {
    return this.pointerYDown !== null && this.pointerYDown > 0
  }

  hasSpecial (): boolean {
    return this.pointerSpecial
  }

  private applyPointerToDirection (pressed: boolean | undefined, x: number, y: number): void {
    const { relativeToTarget } = this
    this.pointerSpecial = false
    if (pressed === true || (pressed === undefined && this.isPointerDown())) {
      // const position = relativeToTarget.getGlobalPosition()
      // const bounds = relativeToTarget.getCollisionShapeBounds(position)
      // const absDiffX = Math.abs(x - position.x)
      // const absDiffY = Math.abs(y - position.y)
      // if (x >= bounds.left && x <= bounds.right) {
      //   // pure vertical line, no horizontal
      //   this.pointerXDown = null
      //   if (y >= bounds.bottom) {
      //     this.pointerYDown = 1
      //   } else if (y <= bounds.top) {
      //     this.pointerYDown = -1
      //   } else {
      //     this.pointerSpecial = true
      //   }
      // } else if (y >= bounds.top && y <= bounds.bottom) {
      //   // pure horizontal line, no vertical
      //   this.pointerYDown = null
      //   if (x > bounds.right) {
      //     this.pointerXDown = 1
      //   } else if (x < bounds.left) {
      //     this.pointerXDown = -1
      //   } else {
      //     this.pointerSpecial = true
      //   }
      // } else {
      //   if (absDiffX >= absDiffY) {
      //     this.pointerYDown = 0
      //     // more pressure by X than by Y
      //     if (x > bounds.right) {
      //       this.pointerXDown = 1
      //     } else if (x < bounds.left) {
      //       this.pointerXDown = -1
      //     }
      //   } else {
      //     this.pointerXDown = 0
      //     // more pressure by Y than by X
      //     if (y > bounds.bottom) {
      //       this.pointerYDown = 1
      //     } else if (y < bounds.top) {
      //       this.pointerYDown = -1
      //     }
      //   }
      // }
      logInputDirection(`MOVE|START px=${this.pointerXDown} py=${this.pointerYDown} rt=${Boolean(relativeToTarget)}`)
    } else if (pressed === false) {
      this.pointerXDown = null
      this.pointerYDown = null
      logInputDirection(`END px=${this.pointerXDown} py=${this.pointerYDown}`)
    }
  }

  restart (): void {
    this.pointerXDown = null
    this.pointerYDown = null
  }
}
