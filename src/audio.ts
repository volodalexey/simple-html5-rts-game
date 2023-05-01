import { Howl } from 'howler'
import bullet1Audio from './assets/audio/bullet1.mp3'
import bullet2Audio from './assets/audio/bullet2.mp3'
import bulletHit0Audio from './assets/audio/bullet-hit-0.mp3'
import bulletHit1Audio from './assets/audio/bullet-hit-1.mp3'
import bulletHit2Audio from './assets/audio/bullet-hit-2.mp3'
import bulletHit3Audio from './assets/audio/bullet-hit-3.mp3'
import bulletHit4Audio from './assets/audio/bullet-hit-4.mp3'
import bulletHit5Audio from './assets/audio/bullet-hit-5.mp3'
import cannon1Audio from './assets/audio/cannon1.mp3'
import cannon2Audio from './assets/audio/cannon2.mp3'
import cannonHitAudio from './assets/audio/cannon-hit.mp3'
import clickAudio from './assets/audio/click.mp3'
import engagingAudio from './assets/audio/engaging.mp3'
import gunAudio from './assets/audio/gun.mp3'
import heatseeker1Audio from './assets/audio/heatseeker1.mp3'
import heatseeker2Audio from './assets/audio/heatseeker2.mp3'
import laser1Audio from './assets/audio/laser1.mp3'
import laser2Audio from './assets/audio/laser2.mp3'
import messageAudio from './assets/audio/message.mp3'
import roger1Audio from './assets/audio/roger1.mp3'
import roger2Audio from './assets/audio/roger2.mp3'
import yupAudio from './assets/audio/yup.mp3'
import vultureAttack0Audio from './assets/audio/vulture-attack-0.mp3'
import vultureYes0Audio from './assets/audio/vulture-yes-0.mp3'
import vultureYes1Audio from './assets/audio/vulture-yes-1.mp3'
import vultureYes2Audio from './assets/audio/vulture-yes-2.mp3'
import vultureYes3Audio from './assets/audio/vulture-yes-3.mp3'
import tankAttack0Audio from './assets/audio/tank-attack-0.mp3'
import tankAttack1Audio from './assets/audio/tank-attack-1.mp3'
import tankAttack2Audio from './assets/audio/tank-attack-2.mp3'
import tankYes0Audio from './assets/audio/tank-yes-0.mp3'
import tankYes1Audio from './assets/audio/tank-yes-1.mp3'
import tankYes2Audio from './assets/audio/tank-yes-2.mp3'
import tankYes3Audio from './assets/audio/tank-yes-3.mp3'

export const AUDIO = {
  bullet1: new Howl({
    src: bullet1Audio
  }),
  bullet2: new Howl({
    src: bullet2Audio
  }),
  bulletHit0: new Howl({
    src: bulletHit0Audio
  }),
  bulletHit1: new Howl({
    src: bulletHit1Audio
  }),
  bulletHit2: new Howl({
    src: bulletHit2Audio
  }),
  bulletHit3: new Howl({
    src: bulletHit3Audio
  }),
  bulletHit4: new Howl({
    src: bulletHit4Audio
  }),
  bulletHit5: new Howl({
    src: bulletHit5Audio
  }),
  cannon1: new Howl({
    src: cannon1Audio
  }),
  cannon2: new Howl({
    src: cannon2Audio
  }),
  cannonHit: new Howl({
    src: cannonHitAudio
  }),
  click: new Howl({
    src: clickAudio
  }),
  engaging: new Howl({
    src: engagingAudio
  }),
  gun: new Howl({
    src: gunAudio
  }),
  heatseeker1: new Howl({
    src: heatseeker1Audio
  }),
  heatseeker2: new Howl({
    src: heatseeker2Audio
  }),
  laser1: new Howl({
    src: laser1Audio
  }),
  laser2: new Howl({
    src: laser2Audio
  }),
  message: new Howl({
    src: messageAudio
  }),
  roger1: new Howl({
    src: roger1Audio
  }),
  roger2: new Howl({
    src: roger2Audio
  }),
  yup: new Howl({
    src: yupAudio
  }),
  vultureAttack0: new Howl({
    src: vultureAttack0Audio
  }),
  vultureYes0: new Howl({
    src: vultureYes0Audio
  }),
  vultureYes1: new Howl({
    src: vultureYes1Audio
  }),
  vultureYes2: new Howl({
    src: vultureYes2Audio
  }),
  vultureYes3: new Howl({
    src: vultureYes3Audio
  }),
  tankAttack0: new Howl({
    src: tankAttack0Audio
  }),
  tankAttack1: new Howl({
    src: tankAttack1Audio
  }),
  tankAttack2: new Howl({
    src: tankAttack2Audio
  }),
  tankYes0: new Howl({
    src: tankYes0Audio
  }),
  tankYes1: new Howl({
    src: tankYes1Audio
  }),
  tankYes2: new Howl({
    src: tankYes2Audio
  }),
  tankYes3: new Howl({
    src: tankYes3Audio
  }),
  play (name: '' | 'acknowledge-attacking' | 'acknowledge-moving'
  | 'bullet' | 'bullet-hit' | 'rocket' | 'laser' | 'cannon-ball' | 'cannon-hit'
  | 'message-received' | 'scout-tank-attack' | 'scout-tank-yes'
  | 'heavy-tank-attack' | 'heavy-tank-yes'): void {
    let stopPrevious = false
    let sounds: Howl[] = []
    if (name === 'acknowledge-attacking') {
      stopPrevious = true
      sounds = [this.engaging]
    } else if (name === 'acknowledge-moving') {
      stopPrevious = true
      sounds = [this.yup, this.roger1, this.roger2]
    } else if (name === 'bullet') {
      sounds = [this.bullet1, this.bullet2]
    } else if (name === 'bullet-hit') {
      sounds = [this.bulletHit0, this.bulletHit1, this.bulletHit2, this.bulletHit3, this.bulletHit4, this.bulletHit5]
    } else if (name === 'rocket') {
      sounds = [this.heatseeker1, this.heatseeker2]
    } else if (name === 'laser') {
      sounds = [this.laser1, this.laser2]
    } else if (name === 'cannon-ball') {
      sounds = [this.cannon1, this.cannon2]
    } else if (name === 'cannon-hit') {
      sounds = [this.cannonHit]
    } else if (name === 'message-received') {
      sounds = [this.message]
    } else if (name === 'scout-tank-attack') {
      stopPrevious = true
      sounds = [this.vultureAttack0]
    } else if (name === 'scout-tank-yes') {
      stopPrevious = true
      sounds = [this.vultureYes0, this.vultureYes1, this.vultureYes2, this.vultureYes3]
    } else if (name === 'heavy-tank-attack') {
      stopPrevious = true
      sounds = [this.tankAttack0, this.tankAttack1, this.tankAttack2]
    } else if (name === 'heavy-tank-yes') {
      stopPrevious = true
      sounds = [this.tankYes0, this.tankYes1, this.tankYes2, this.tankYes3]
    }
    if (sounds.length > 0) {
      if (stopPrevious) {
        sounds.forEach(s => s.stop())
      }
      const sound = sounds[Math.floor(Math.random() * sounds.length)]
      sound.play()
    }
  }
}
