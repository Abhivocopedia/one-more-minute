import * as THREE from 'three'

export interface TemporalSample {
  time: number
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: THREE.Vector3
}

/** Rolling 60-second transform history for a rewindable world entity. */
export class TemporalRecorder {
  private samples: TemporalSample[] = []
  private readonly maxAge = 60
  private readonly sampleInterval = 1 / 20
  private nextSampleAt = 0

  record(object: THREE.Object3D, time: number) {
    if (time < this.nextSampleAt) return
    this.nextSampleAt = time + this.sampleInterval
    this.samples.push({
      time,
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      scale: object.scale.clone(),
    })
    const cutoff = time - this.maxAge
    while (this.samples.length > 1 && this.samples[1].time < cutoff) this.samples.shift()
  }

  get duration() {
    if (this.samples.length < 2) return 0
    return this.samples[this.samples.length - 1].time - this.samples[0].time
  }

  sampleAt(time: number): TemporalSample | null {
    if (!this.samples.length) return null
    if (time <= this.samples[0].time) return this.samples[0]
    const last = this.samples[this.samples.length - 1]
    if (time >= last.time) return last
    let right = 1
    while (right < this.samples.length && this.samples[right].time < time) right++
    const a = this.samples[right - 1]
    const b = this.samples[right]
    const alpha = THREE.MathUtils.clamp((time - a.time) / (b.time - a.time), 0, 1)
    return {
      time,
      position: a.position.clone().lerp(b.position, alpha),
      quaternion: a.quaternion.clone().slerp(b.quaternion, alpha),
      scale: a.scale.clone().lerp(b.scale, alpha),
    }
  }

  apply(object: THREE.Object3D, time: number) {
    const sample = this.sampleAt(time)
    if (!sample) return false
    object.position.copy(sample.position)
    object.quaternion.copy(sample.quaternion)
    object.scale.copy(sample.scale)
    return true
  }

  /** Discard the future after rewind release: the player creates a new branch. */
  branchAt(time: number) {
    this.samples = this.samples.filter((sample) => sample.time <= time)
    this.nextSampleAt = time
  }

  clear() {
    this.samples = []
    this.nextSampleAt = 0
  }
}
