import { Howl } from 'howler'
import bullet1Audio from '../assets/audio/bullet1.mp3'
import bullet2Audio from '../assets/audio/bullet2.mp3'
import bulletHit0Audio from '../assets/audio/bullet-hit-0.mp3'
import bulletHit1Audio from '../assets/audio/bullet-hit-1.mp3'
import bulletHit2Audio from '../assets/audio/bullet-hit-2.mp3'
import bulletHit3Audio from '../assets/audio/bullet-hit-3.mp3'
import bulletHit4Audio from '../assets/audio/bullet-hit-4.mp3'
import bulletHit5Audio from '../assets/audio/bullet-hit-5.mp3'
import cannon1Audio from '../assets/audio/cannon1.mp3'
import cannon2Audio from '../assets/audio/cannon2.mp3'
import cannonHitAudio from '../assets/audio/cannon-hit.mp3'
import clickAudio from '../assets/audio/click.mp3'
import engagingAudio from '../assets/audio/engaging.mp3'
import gunAudio from '../assets/audio/gun.mp3'
import heatseeker1Audio from '../assets/audio/heatseeker1.mp3'
import heatseeker2Audio from '../assets/audio/heatseeker2.mp3'
import rocketHit0Audio from '../assets/audio/rocket-hit-0.mp3'
import rocketHit1Audio from '../assets/audio/rocket-hit-1.mp3'
import rocketHit2Audio from '../assets/audio/rocket-hit-2.mp3'
import laser1Audio from '../assets/audio/laser1.mp3'
import laser2Audio from '../assets/audio/laser2.mp3'
import laserHit0Audio from '../assets/audio/laser-hit-0.mp3'
import message0Audio from '../assets/audio/message-0.mp3'
import message1Audio from '../assets/audio/message-1.mp3'
import messageError0Audio from '../assets/audio/message-error-0.mp3'
import roger1Audio from '../assets/audio/roger1.mp3'
import roger2Audio from '../assets/audio/roger2.mp3'
import yupAudio from '../assets/audio/yup.mp3'
import vultureAttack0Audio from '../assets/audio/vulture-attack-0.mp3'
import vultureYes0Audio from '../assets/audio/vulture-yes-0.mp3'
import vultureYes1Audio from '../assets/audio/vulture-yes-1.mp3'
import vultureYes2Audio from '../assets/audio/vulture-yes-2.mp3'
import vultureYes3Audio from '../assets/audio/vulture-yes-3.mp3'
import tankAttack0Audio from '../assets/audio/tank-attack-0.mp3'
import tankAttack1Audio from '../assets/audio/tank-attack-1.mp3'
import tankAttack2Audio from '../assets/audio/tank-attack-2.mp3'
import tankYes0Audio from '../assets/audio/tank-yes-0.mp3'
import tankYes1Audio from '../assets/audio/tank-yes-1.mp3'
import tankYes2Audio from '../assets/audio/tank-yes-2.mp3'
import tankYes3Audio from '../assets/audio/tank-yes-3.mp3'
import chopperAttack0Audio from '../assets/audio/chopper-attack-0.mp3'
import chopperAttack1Audio from '../assets/audio/chopper-attack-1.mp3'
import chopperAttack2Audio from '../assets/audio/chopper-attack-2.mp3'
import chopperYes0Audio from '../assets/audio/chopper-yes-0.mp3'
import chopperYes1Audio from '../assets/audio/chopper-yes-1.mp3'
import chopperYes2Audio from '../assets/audio/chopper-yes-2.mp3'
import chopperYes3Audio from '../assets/audio/chopper-yes-3.mp3'
import chopperYes4Audio from '../assets/audio/chopper-yes-4.mp3'
import chopperYes5Audio from '../assets/audio/chopper-yes-5.mp3'
import wraithAttack0Audio from '../assets/audio/wraith-attack-0.mp3'
import wraithAttack1Audio from '../assets/audio/wraith-attack-1.mp3'
import wraithAttack2Audio from '../assets/audio/wraith-attack-2.mp3'
import wraithAttack3Audio from '../assets/audio/wraith-attack-3.mp3'
import wraithYes0Audio from '../assets/audio/wraith-yes-0.mp3'
import wraithYes1Audio from '../assets/audio/wraith-yes-1.mp3'
import wraithYes2Audio from '../assets/audio/wraith-yes-2.mp3'
import wraithYes3Audio from '../assets/audio/wraith-yes-3.mp3'
import scvYes0Audio from '../assets/audio/scv-yes-0.mp3'
import scvYes1Audio from '../assets/audio/scv-yes-1.mp3'
import scvYes2Audio from '../assets/audio/scv-yes-2.mp3'
import scvYes3Audio from '../assets/audio/scv-yes-3.mp3'
import scvYes4Audio from '../assets/audio/scv-yes-4.mp3'
import scvYes5Audio from '../assets/audio/scv-yes-5.mp3'
import scvYes6Audio from '../assets/audio/scv-yes-6.mp3'
import scvError0Audio from '../assets/audio/scv-error-0.mp3'
import harvesterYes0Audio from '../assets/audio/harvester-yes-0.mp3'
import harvesterYes1Audio from '../assets/audio/harvester-yes-1.mp3'
import harvesterYes2Audio from '../assets/audio/harvester-yes-2.mp3'
import harvesterYes3Audio from '../assets/audio/harvester-yes-3.mp3'
import harvesterYes4Audio from '../assets/audio/harvester-yes-4.mp3'
import harvesterYes5Audio from '../assets/audio/harvester-yes-5.mp3'
import harvesterYes6Audio from '../assets/audio/harvester-yes-6.mp3'
import harvesterYes7Audio from '../assets/audio/harvester-yes-7.mp3'
import harvesterError0Audio from '../assets/audio/harvester-error-0.mp3'
import { EItemName } from '../interfaces/IItem'

type SoundName = 'acknowledge-attacking' | 'acknowledge-moving'
| 'bullet' | 'bullet-hit'
| 'rocket' | 'rocket-hit'
| 'laser' | 'laser-hit'
| 'cannon-ball' | 'cannon-hit'
| 'message-received' | 'message-error'
| 'scv-yes' | 'scv-error'
| 'harvester-yes' | 'harvester-error'
| 'scout-tank-attack' | 'scout-tank-yes'
| 'heavy-tank-attack' | 'heavy-tank-yes'
| 'chopper-attack' | 'chopper-yes'
| 'wraith-attack' | 'wraith-yes'

export class Audio {
  static keys = {
    voice: 'voice',
    shoot: 'shoot',
    hit: 'hit',
    message: 'message'
  }

  static defaultVolume = 0.5

  constructor () {
    this.load()
  }

  parse (key: string): number {
    const strValue = localStorage.getItem(key)
    if (strValue != null) {
      const value = Number.parseFloat(strValue)
      if (Number.isFinite(value)) {
        return value
      }
    }
    return Audio.defaultVolume
  }

  load (): void {
    const { voice, shoot, hit, message } = Audio.keys
    this.initialVoiceVolume = this.voiceVolume = this.parse(voice)
    this.initialShootVolume = this.shootVolume = this.parse(shoot)
    this.initialHitVolume = this.hitVolume = this.parse(hit)
    this.initialMessageVolume = this.messageVolume = this.parse(message)
  }

  save (key: string, value: number): void {
    localStorage.setItem(key, String(value))
  }

  resetAll (): void {
    this.voiceVolume = this.initialVoiceVolume
    this.shootVolume = this.initialShootVolume
    this.hitVolume = this.initialHitVolume
    this.messageVolume = this.initialMessageVolume
  }

  saveAll (): void {
    this.save(Audio.keys.voice, this.voiceVolume)
    this.save(Audio.keys.shoot, this.shootVolume)
    this.save(Audio.keys.hit, this.hitVolume)
    this.save(Audio.keys.message, this.messageVolume)
    this.initialVoiceVolume = this.voiceVolume
    this.initialShootVolume = this.shootVolume
    this.initialHitVolume = this.hitVolume
    this.initialMessageVolume = this.messageVolume
  }

  public initialVoiceVolume = 1
  public initialShootVolume = 1
  public initialHitVolume = 1
  public initialMessageVolume = 1
  public voiceVolume = 1
  public shootVolume = 1
  public hitVolume = 1
  public messageVolume = 1

  public bullet1 = new Howl({
    src: bullet1Audio
  })

  public bullet2 = new Howl({
    src: bullet2Audio
  })

  public bulletHit0 = new Howl({
    src: bulletHit0Audio
  })

  public bulletHit1 = new Howl({
    src: bulletHit1Audio
  })

  public bulletHit2 = new Howl({
    src: bulletHit2Audio
  })

  public bulletHit3 = new Howl({
    src: bulletHit3Audio
  })

  public bulletHit4 = new Howl({
    src: bulletHit4Audio
  })

  public bulletHit5 = new Howl({
    src: bulletHit5Audio
  })

  public cannon1 = new Howl({
    src: cannon1Audio
  })

  public cannon2 = new Howl({
    src: cannon2Audio
  })

  public cannonHit = new Howl({
    src: cannonHitAudio
  })

  public click = new Howl({
    src: clickAudio
  })

  public engaging = new Howl({
    src: engagingAudio
  })

  public gun = new Howl({
    src: gunAudio
  })

  public heatseeker1 = new Howl({
    src: heatseeker1Audio
  })

  public heatseeker2 = new Howl({
    src: heatseeker2Audio
  })

  public rocketHit0 = new Howl({
    src: rocketHit0Audio
  })

  public rocketHit1 = new Howl({
    src: rocketHit1Audio
  })

  public rocketHit2 = new Howl({
    src: rocketHit2Audio
  })

  public laser1 = new Howl({
    src: laser1Audio
  })

  public laser2 = new Howl({
    src: laser2Audio
  })

  public laserHit0 = new Howl({
    src: laserHit0Audio
  })

  public message0 = new Howl({
    src: message0Audio
  })

  public message1 = new Howl({
    src: message1Audio
  })

  public messageError0 = new Howl({
    src: messageError0Audio
  })

  public roger1 = new Howl({
    src: roger1Audio
  })

  public roger2 = new Howl({
    src: roger2Audio
  })

  public yup = new Howl({
    src: yupAudio
  })

  public vultureAttack0 = new Howl({
    src: vultureAttack0Audio
  })

  public vultureYes0 = new Howl({
    src: vultureYes0Audio
  })

  public vultureYes1 = new Howl({
    src: vultureYes1Audio
  })

  public vultureYes2 = new Howl({
    src: vultureYes2Audio
  })

  public vultureYes3 = new Howl({
    src: vultureYes3Audio
  })

  public tankAttack0 = new Howl({
    src: tankAttack0Audio
  })

  public tankAttack1 = new Howl({
    src: tankAttack1Audio
  })

  public tankAttack2 = new Howl({
    src: tankAttack2Audio
  })

  public tankYes0 = new Howl({
    src: tankYes0Audio
  })

  public tankYes1 = new Howl({
    src: tankYes1Audio
  })

  public tankYes2 = new Howl({
    src: tankYes2Audio
  })

  public tankYes3 = new Howl({
    src: tankYes3Audio
  })

  public chopperYes0 = new Howl({
    src: chopperYes0Audio
  })

  public chopperYes1 = new Howl({
    src: chopperYes1Audio
  })

  public chopperYes2 = new Howl({
    src: chopperYes2Audio
  })

  public chopperYes3 = new Howl({
    src: chopperYes3Audio
  })

  public chopperYes4 = new Howl({
    src: chopperYes4Audio
  })

  public chopperYes5 = new Howl({
    src: chopperYes5Audio
  })

  public chopperAttack0 = new Howl({
    src: chopperAttack0Audio
  })

  public chopperAttack1 = new Howl({
    src: chopperAttack1Audio
  })

  public chopperAttack2 = new Howl({
    src: chopperAttack2Audio
  })

  public wraithYes0 = new Howl({
    src: wraithYes0Audio
  })

  public wraithYes1 = new Howl({
    src: wraithYes1Audio
  })

  public wraithYes2 = new Howl({
    src: wraithYes2Audio
  })

  public wraithYes3 = new Howl({
    src: wraithYes3Audio
  })

  public wraithAttack0 = new Howl({
    src: wraithAttack0Audio
  })

  public wraithAttack1 = new Howl({
    src: wraithAttack1Audio
  })

  public wraithAttack2 = new Howl({
    src: wraithAttack2Audio
  })

  public wraithAttack3 = new Howl({
    src: wraithAttack3Audio
  })

  public scvYes0 = new Howl({
    src: scvYes0Audio
  })

  public scvYes1 = new Howl({
    src: scvYes1Audio
  })

  public scvYes2 = new Howl({
    src: scvYes2Audio
  })

  public scvYes3 = new Howl({
    src: scvYes3Audio
  })

  public scvYes4 = new Howl({
    src: scvYes4Audio
  })

  public scvYes5 = new Howl({
    src: scvYes5Audio
  })

  public scvYes6 = new Howl({
    src: scvYes6Audio
  })

  public scvError0 = new Howl({
    src: scvError0Audio
  })

  public harvesterYes0 = new Howl({
    src: harvesterYes0Audio
  })

  public harvesterYes1 = new Howl({
    src: harvesterYes1Audio
  })

  public harvesterYes2 = new Howl({
    src: harvesterYes2Audio
  })

  public harvesterYes3 = new Howl({
    src: harvesterYes3Audio
  })

  public harvesterYes4 = new Howl({
    src: harvesterYes4Audio
  })

  public harvesterYes5 = new Howl({
    src: harvesterYes5Audio
  })

  public harvesterYes6 = new Howl({
    src: harvesterYes6Audio
  })

  public harvesterYes7 = new Howl({
    src: harvesterYes7Audio
  })

  public harvesterError0 = new Howl({
    src: harvesterError0Audio
  })

  getSounds (name: SoundName): Howl[] {
    switch (name) {
      case 'acknowledge-moving':
        return [this.yup, this.roger1, this.roger2]
      case 'acknowledge-attacking':
        return [this.engaging]
      case 'bullet':
        return [this.bullet1, this.bullet2]
      case 'bullet-hit':
        return [this.bulletHit0, this.bulletHit1, this.bulletHit2, this.bulletHit3, this.bulletHit4, this.bulletHit5]
      case 'rocket':
        return [this.heatseeker1, this.heatseeker2]
      case 'rocket-hit':
        return [this.rocketHit0, this.rocketHit1, this.rocketHit2]
      case 'laser':
        return [this.laser1, this.laser2]
      case 'laser-hit':
        return [this.laserHit0]
      case 'cannon-ball':
        return [this.cannon1, this.cannon2]
      case 'cannon-hit':
        return [this.cannonHit]
      case 'message-received':
        return [this.message0, this.message1]
      case 'message-error':
        return [this.messageError0]
      case 'scout-tank-attack':
        return [this.vultureAttack0]
      case 'scout-tank-yes':
        return [this.vultureYes0, this.vultureYes1, this.vultureYes2, this.vultureYes3]
      case 'heavy-tank-attack':
        return [this.tankAttack0, this.tankAttack1, this.tankAttack2]
      case 'heavy-tank-yes':
        return [this.tankYes0, this.tankYes1, this.tankYes2, this.tankYes3]
      case 'chopper-attack':
        return [this.chopperAttack0, this.chopperAttack1, this.chopperAttack2]
      case 'chopper-yes':
        return [this.chopperYes0, this.chopperYes1, this.chopperYes2, this.chopperYes3, this.chopperYes4, this.chopperYes5]
      case 'wraith-attack':
        return [this.wraithAttack0, this.wraithAttack1, this.wraithAttack2, this.wraithAttack3]
      case 'wraith-yes':
        return [this.wraithYes0, this.wraithYes1, this.wraithYes2, this.wraithYes3]
      case 'scv-yes':
        return [this.scvYes0, this.scvYes1, this.scvYes2, this.scvYes3, this.scvYes4, this.scvYes5, this.scvYes6]
      case 'scv-error':
        return [this.scvError0]
      case 'harvester-yes':
        return [this.harvesterYes0, this.harvesterYes1, this.harvesterYes2, this.harvesterYes3, this.harvesterYes4, this.harvesterYes5, this.harvesterYes6, this.harvesterYes7]
      case 'harvester-error':
        return [this.harvesterError0]
    }
    return []
  }

  private play ({ name, volume, stop = [] }: { name: SoundName, volume: number, stop?: SoundName[] }): void {
    const sounds = this.getSounds(name)
    if (sounds.length > 0) {
      stop.map(sn => this.getSounds(sn)).forEach(stopSounds => {
        stopSounds.forEach(s => s.stop())
      })
      const sound = sounds[Math.floor(Math.random() * sounds.length)]
      sound.volume(volume)
      sound.play()
    }
  }

  playYes (name: EItemName): void {
    if (name === EItemName.SCV) {
      this.play({ name: 'scv-yes', volume: this.voiceVolume, stop: ['scv-yes', 'scv-error'] })
    } else if (name === EItemName.Harvester) {
      this.play({ name: 'harvester-yes', volume: this.voiceVolume, stop: ['harvester-yes', 'harvester-error'] })
    } else if (name === EItemName.ScoutTank) {
      this.play({ name: 'scout-tank-yes', volume: this.voiceVolume, stop: ['scout-tank-yes', 'scout-tank-attack'] })
    } else if (name === EItemName.HeavyTank) {
      this.play({ name: 'heavy-tank-yes', volume: this.voiceVolume, stop: ['heavy-tank-yes', 'heavy-tank-attack'] })
    } else if (name === EItemName.Chopper) {
      this.play({ name: 'chopper-yes', volume: this.voiceVolume, stop: ['chopper-yes', 'chopper-attack'] })
    } else if (name === EItemName.Wraith) {
      this.play({ name: 'wraith-yes', volume: this.voiceVolume, stop: ['wraith-yes', 'wraith-attack'] })
    } else {
      this.play({ name: 'acknowledge-moving', volume: this.voiceVolume, stop: ['acknowledge-moving', 'acknowledge-attacking'] })
    }
  }

  playAttack (name: EItemName): void {
    if (name === EItemName.ScoutTank) {
      this.play({ name: 'scout-tank-attack', volume: this.voiceVolume, stop: ['scout-tank-attack', 'scout-tank-yes'] })
    } else if (name === EItemName.HeavyTank) {
      this.play({ name: 'heavy-tank-attack', volume: this.voiceVolume, stop: ['heavy-tank-attack', 'heavy-tank-yes'] })
    } else if (name === EItemName.Chopper) {
      this.play({ name: 'chopper-attack', volume: this.voiceVolume, stop: ['chopper-attack', 'chopper-yes'] })
    } else if (name === EItemName.Wraith) {
      this.play({ name: 'wraith-attack', volume: this.voiceVolume, stop: ['wraith-attack', 'wraith-yes'] })
    } else {
      this.play({ name: 'acknowledge-attacking', volume: this.voiceVolume, stop: ['acknowledge-attacking', 'acknowledge-moving'] })
    }
  }

  playRandomVoice (): void {
    const names: SoundName[] = [
      'acknowledge-attacking', 'acknowledge-moving',
      'harvester-yes', 'harvester-error',
      'scv-yes', 'scv-error',
      'scout-tank-yes', 'scout-tank-attack',
      'heavy-tank-yes', 'heavy-tank-attack',
      'chopper-yes', 'chopper-attack',
      'wraith-yes', 'wraith-attack'
    ]
    const name = names[Math.floor(Math.random() * names.length)]
    this.play({ name, volume: this.voiceVolume, stop: names })
  }

  playRandomShoot (): void {
    const names: SoundName[] = ['bullet', 'cannon-ball', 'laser', 'rocket']
    const name = names[Math.floor(Math.random() * names.length)]
    this.play({ name, volume: this.shootVolume, stop: names })
  }

  playRandomHit (): void {
    const names: SoundName[] = ['bullet-hit', 'cannon-hit', 'laser-hit', 'rocket-hit']
    const name = names[Math.floor(Math.random() * names.length)]
    this.play({ name, volume: this.hitVolume, stop: names })
  }

  playRandomMessage (): void {
    const names: SoundName[] = ['message-received', 'message-error']
    const name = names[Math.floor(Math.random() * names.length)]
    this.play({ name, volume: this.messageVolume, stop: names })
  }

  playMessage (): void {
    this.play({ name: 'message-received', volume: this.messageVolume, stop: ['message-received', 'message-error'] })
  }

  playError (): void {
    this.play({ name: 'message-error', volume: this.messageVolume, stop: ['message-error', 'message-received'] })
  }

  playShoot (name: SoundName): void {
    this.play({ name, volume: this.shootVolume })
  }

  playHit (name: SoundName): void {
    this.play({ name, volume: this.hitVolume })
  }

  playSCVError (): void {
    this.play({ name: 'scv-error', volume: this.voiceVolume, stop: ['scv-yes', 'scv-error'] })
  }

  playHarvesterError (): void {
    this.play({ name: 'harvester-error', volume: this.voiceVolume, stop: ['harvester-error', 'harvester-yes'] })
  }
}
