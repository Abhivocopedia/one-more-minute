import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Sparkles, Text } from '@react-three/drei'
import * as THREE from 'three'
import { TemporalRecorder } from './TemporalRecorder'

type WorldProps = {
  phase: 'menu' | 'playing' | 'paused'
  rewinding: boolean
  onRewindAmount: (value: number) => void
  onNearPhone: (value: boolean) => void
  onPhone: () => void
  phoneAnswered: boolean
}

function Rain() {
  const points = useRef<THREE.Points>(null)
  const count = 1250
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      values[i * 3] = (Math.random() - 0.5) * 42
      values[i * 3 + 1] = Math.random() * 18
      values[i * 3 + 2] = (Math.random() - 0.5) * 42
    }
    return values
  }, [])

  useFrame((_, delta) => {
    if (!points.current) return
    const values = points.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      values[i * 3 + 1] -= delta * 17
      if (values[i * 3 + 1] < 0) values[i * 3 + 1] = 18
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#a9c5d6" size={0.045} transparent opacity={0.42} sizeAttenuation />
  </points>
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 3.7, 0]}><cylinderGeometry args={[0.045, 0.07, 7.4, 8]} /><meshStandardMaterial color="#202b31" metalness={0.78} roughness={0.38} /></mesh>
    <mesh position={[0.42, 7.35, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[1.2, 0.12, 0.3]} /><meshStandardMaterial color="#1b252b" metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0.9, 7.25, 0]}><boxGeometry args={[0.38, 0.12, 0.23]} /><meshStandardMaterial color="#f2bc76" emissive="#d88a40" emissiveIntensity={2.4} /></mesh>
    <pointLight position={[0.9, 7.1, 0]} color="#e4a96d" intensity={24} distance={15} decay={2} />
  </group>
}

function Building({ position, size, tone = '#171f25' }: { position: [number, number, number]; size: [number, number, number]; tone?: string }) {
  const rows = Math.max(1, Math.floor(size[1] / 2.5))
  const columns = Math.max(1, Math.floor(size[0] / 2.8))
  return <group position={position}>
    <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={tone} roughness={0.92} /></mesh>
    {Array.from({ length: rows }).map((_, row) => Array.from({ length: columns }).map((__, col) => {
      const lit = row % 3 === 0 && col % 4 === 1
      return <mesh key={`${row}-${col}`} position={[-size[0] / 2 + 1.35 + col * 2.8, 1.3 + row * 2.5, size[2] / 2 + 0.012]}>
        <planeGeometry args={[0.78, 1.05]} />
        <meshStandardMaterial color="#2a3942" emissive={lit ? '#d58d53' : '#111a20'} emissiveIntensity={lit ? 0.6 : 0.05} />
      </mesh>
    }))}
  </group>
}

function RewindableBottle({ rewinding, phase, onRewindAmount }: { rewinding: boolean; phase: WorldProps['phase']; onRewindAmount: (value: number) => void }) {
  const bottle = useRef<THREE.Group>(null)
  const recorder = useRef(new TemporalRecorder())
  const timeline = useRef(0)
  const rewindDistance = useRef(0)
  const wasRewinding = useRef(false)
  const lastUiUpdate = useRef(0)
  const origin = useMemo(() => new THREE.Vector3(-2.2, 0.58, -7.2), [])

  useEffect(() => {
    recorder.current.clear()
    timeline.current = 0
    rewindDistance.current = 0
    wasRewinding.current = false
    if (bottle.current) bottle.current.position.copy(origin)
  }, [origin])

  useFrame((_, delta) => {
    if (!bottle.current || phase !== 'playing') return
    const object = bottle.current
    const step = Math.min(delta, 0.05)

    if (rewinding) {
      wasRewinding.current = true
      rewindDistance.current = Math.min(60, rewindDistance.current + step * 2.2, recorder.current.duration)
      const targetTime = Math.max(0, timeline.current - rewindDistance.current)
      recorder.current.apply(object, targetTime)
      if (performance.now() - lastUiUpdate.current > 50) {
        onRewindAmount(rewindDistance.current)
        lastUiUpdate.current = performance.now()
      }
      return
    }

    if (wasRewinding.current) {
      timeline.current = Math.max(0, timeline.current - rewindDistance.current)
      recorder.current.branchAt(timeline.current)
      rewindDistance.current = 0
      wasRewinding.current = false
      onRewindAmount(0)
    }

    timeline.current += step
    const cycle = timeline.current % 8
    if (cycle < 3) {
      object.position.copy(origin)
      object.rotation.set(0, Math.sin(timeline.current * 1.2) * 0.06, 0)
    } else {
      const fall = THREE.MathUtils.clamp((cycle - 3) / 0.75, 0, 1)
      object.position.set(origin.x + fall * 1.15, Math.max(0.2, origin.y + 0.42 - fall * 0.72), origin.z)
      object.rotation.set(fall * 0.25, 0, fall * 1.25)
    }
    recorder.current.record(object, timeline.current)
  })

  return <group ref={bottle} position={[-2.2, 0.58, -7.2]}>
    <mesh castShadow><cylinderGeometry args={[0.16, 0.13, 0.65, 14]} /><meshPhysicalMaterial color="#7b9d91" roughness={0.12} transmission={0.28} thickness={0.35} /></mesh>
    <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.055, 0.055, 0.12, 10]} /><meshStandardMaterial color="#9b8261" metalness={0.35} roughness={0.4} /></mesh>
    <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.12, 0.12, 0.035, 12]} /><meshStandardMaterial color="#9caa9f" roughness={0.2} /></mesh>
  </group>
}

function Payphone({ near, answered }: { near: boolean; answered: boolean }) {
  return <group position={[2.8, 0, -5]}>
    <mesh position={[0, 1.35, 0]} castShadow><boxGeometry args={[0.85, 1.8, 0.55]} /><meshStandardMaterial color="#18262b" metalness={0.58} roughness={0.35} /></mesh>
    <mesh position={[0, 2.28, 0.02]}><boxGeometry args={[0.92, 0.14, 0.62]} /><meshStandardMaterial color="#b18a5f" emissive="#a05b2d" emissiveIntensity={0.35} /></mesh>
    <mesh position={[0, 1.5, 0.29]}><planeGeometry args={[0.62, 0.8]} /><meshBasicMaterial color="#dca66f" /></mesh>
    <Text position={[0, 1.86, 0.31]} fontSize={0.105} color="#1d2526" anchorX="center">GREYHAVEN</Text>
    {near && !answered && <Billboard position={[0, 2.8, 0]}><Text fontSize={0.16} color="#f2c48c" outlineWidth={0.012} outlineColor="#101820">E  ANSWER</Text></Billboard>}
    {answered && <Billboard position={[0, 2.8, 0]}><Text fontSize={0.13} color="#a5c6b5">CALL CONNECTED</Text></Billboard>}
  </group>
}

export default function World(props: WorldProps) {
  const { camera } = useThree()
  const { phase, rewinding, onRewindAmount, onNearPhone, onPhone, phoneAnswered } = props
  const nearPhone = useRef(false)
  const checkTimer = useRef(0)
  const phonePosition = useMemo(() => new THREE.Vector3(2.8, 0, -5), [])

  useFrame((_, delta) => {
    checkTimer.current += delta
    if (checkTimer.current < 0.12) return
    checkTimer.current = 0
    const near = camera.position.distanceTo(phonePosition) < 4.1
    if (near !== nearPhone.current) {
      nearPhone.current = near
      onNearPhone(near)
    }
  })

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (event.code === 'KeyE' && phase === 'playing' && nearPhone.current && !phoneAnswered) onPhone()
    }
    window.addEventListener('keydown', interact)
    return () => window.removeEventListener('keydown', interact)
  }, [phase, phoneAnswered, onPhone])

  return <>
    <color attach="background" args={['#080e14']} />
    <fog attach="fog" args={['#101a22', 11, 43]} />
    <ambientLight intensity={0.5} color="#91aabc" />
    <directionalLight position={[-8, 14, 5]} intensity={0.55} color="#8da9c3" />
    <Rain />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -5]} receiveShadow><planeGeometry args={[34, 42]} /><meshStandardMaterial color="#19252b" roughness={0.22} metalness={0.38} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, -5]}><planeGeometry args={[5.5, 42]} /><meshStandardMaterial color="#202b30" roughness={0.3} metalness={0.22} /></mesh>
    {[-5, 5].map((x) => <Building key={x} position={[x * 1.5, 0, -13]} size={[9, 15, 8]} tone="#111a20" />)}
    {[-1, 1].map((z) => <group key={z}><StreetLamp position={[-6, 0, z * 8 - 4]} /><StreetLamp position={[6, 0, z * 8 - 4]} /></group>)}
    {Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[-1.9 + (i % 2) * 3.8, 0.012, -19 + i * 2.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.07, 0.9]} /><meshBasicMaterial color="#a6a99c" transparent opacity={0.35} /></mesh>)}
    <mesh position={[-2.5, 0.06, -7]}><boxGeometry args={[1.1, 0.12, 0.9]} /><meshStandardMaterial color="#253039" roughness={0.72} /></mesh>
    <RewindableBottle rewinding={rewinding} phase={phase} onRewindAmount={onRewindAmount} />
    <Payphone near={nearPhone.current} answered={phoneAnswered} />
    <Text position={[0, 10.5, -20]} fontSize={0.65} color="#b7c3c4" anchorX="center" fillOpacity={0.75}>GREYHAVEN</Text>
    <Sparkles count={35} scale={[22, 5, 25]} size={1.1} speed={0.16} opacity={0.22} color="#9cb7c5" />
  </>
}
