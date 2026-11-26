import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
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

function Player({ phase, rewinding }: Pick<Props, 'phase' | 'rewinding'>) {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const direction = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.code] = true }
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((_, delta) => {
    if (phase !== 'playing' || rewinding) return
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? 5.1 : 3.15
    direction.current.set(Number(keys.current.KeyD) - Number(keys.current.KeyA), 0, Number(keys.current.KeyS) - Number(keys.current.KeyW)).normalize()
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).negate().normalize()
    camera.position.addScaledVector(forward.current, -direction.current.z * speed * Math.min(delta, 0.05))
    camera.position.addScaledVector(right.current, direction.current.x * speed * Math.min(delta, 0.05))
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -10, 10)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -22, 5)
    camera.position.y = 1.72
  })

  return <PointerLockControls enabled={phase === 'playing'} />
}

export default function GameCanvas(props: Props) {
  return <Canvas
    shadows
    dpr={[1, 1.5]}
    camera={{ fov: 68, near: 0.1, far: 140, position: [0, 1.72, 3.5] }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ camera }) => {
      camera.position.set(0, 1.72, 3.5)
      camera.lookAt(0, 0.15, -6.5)
      camera.updateProjectionMatrix()
    }}
  >
    <Player phase={props.phase} rewinding={props.rewinding} />
    <World {...props} />
  </Canvas>
}
