import { Howl } from 'howler'
import bullet1Audio from './assets/audio/bullet1.mp3'
import bullet2Audio from './assets/audio/bullet2.mp3'
import bulletHitAudio from './assets/audio/bullet-hit.mp3'
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

export const AUDIO = {
  bullet1: new Howl({
    src: bullet1Audio
  }),
  bullet2: new Howl({
    src: bullet2Audio
  }),
  bulletHit: new Howl({
    src: bulletHitAudio
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
  play (name: 'acknowledge-attacking' | 'acknowledge-moving'): void {
    if (name === 'acknowledge-attacking') {
      this.engaging.play()
    } else if (name === 'acknowledge-moving') {
      const sounds = [this.yup, this.roger1, this.roger2]
      sounds[Math.floor(Math.random() * sounds.length)].play()
    }
  }
}
