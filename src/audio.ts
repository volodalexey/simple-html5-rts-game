import { Howl } from 'howler'
import arrowAudio from './assets/audio/arrow.wav'
import swordAudio from './assets/audio/sword.wav'
import hitAudio from './assets/audio/hit.wav'

export const AUDIO = {
  arrow: new Howl({
    src: arrowAudio
    // volume: 0.1,
  }),
  sword: new Howl({
    src: swordAudio
    // volume: 0.05
  }),
  hit: new Howl({
    src: hitAudio
    // volume: 0.05
  })
}
