import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import World from './World'

type Props = {
  phase: 'menu' | 'playing' | 'paused'
  rewinding: boolean
  phoneAnswered: boolean
  onRewindAmount: (value: number) => void
  onNearPhone: (value: boolean) => void
  onPhone: () => void
}

/**
 * Explicit first-person controller.
 * We own yaw/pitch and reset them on each gameplay entry, avoiding a
 * controls hand-off changing the camera between the title and game states.
 */
function Player({ phase, rewinding }: Pick<Props, 'phase' | 'rewinding'>) {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(0)
  const pitch = useRef(-0.16)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.code] = true }
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false }
    const mouseMove = (event: MouseEvent) => {
      if (phase !== 'playing' || document.pointerLockElement == null) return
      yaw.current -= event.movementX * 0.0022
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0022, -1.05, 0.65)
    }

    if (phase === 'playing') {
      // Start every session looking down the actual playable street.
      camera.position.set(0, 1.72, 3.5)
      yaw.current = 0
      pitch.current = -0.16
      camera.rotation.order = 'YXZ'
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
      camera.updateMatrixWorld()
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('mousemove', mouseMove)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mousemove', mouseMove)
      keys.current = {}
    }
  }, [camera, phase])

  useFrame((_, delta) => {
    if (phase !== 'playing') return

    camera.rotation.order = 'YXZ'
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    if (rewinding) return
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? 5.1 : 3.15
    const moveX = Number(keys.current.KeyD) - Number(keys.current.KeyA)
    const moveZ = Number(keys.current.KeyS) - Number(keys.current.KeyW)
    const length = Math.hypot(moveX, moveZ) || 1
    const step = speed * Math.min(delta, 0.05)

    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    camera.position.addScaledVector(forward.current, (-moveZ / length) * step)
    camera.position.addScaledVector(right.current, (moveX / length) * step)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -10, 10)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -22, 5)
    camera.position.y = 1.72
  })

  return null
}

export default function GameCanvas(props: Props) {
  return <Canvas
    shadows
    dpr={[1, 1.5]}
    camera={{ fov: 68, near: 0.1, far: 140, position: [0, 1.72, 3.5] }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ camera }) => {
      camera.position.set(0, 1.72, 3.5)
      camera.rotation.order = 'YXZ'
      camera.rotation.set(-0.16, 0, 0, 'YXZ')
      camera.updateProjectionMatrix()
    }}
    onPointerDown={() => {
      if (props.phase === 'playing' && document.pointerLockElement == null) {
        const canvas = document.querySelector('canvas')
        void canvas?.requestPointerLock()
      }
    }}
  >
    <Player phase={props.phase} rewinding={props.rewinding} />
    <World {...props} />
  </Canvas>
}
