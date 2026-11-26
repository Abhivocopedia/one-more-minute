import { useEffect, useState } from 'react'
import { AudioLines, Clock3, Pause, Play, RotateCcw, X } from 'lucide-react'
import GameCanvas from './game/GameCanvas'

type Phase = 'menu' | 'playing' | 'paused'

export default function App() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [rewinding, setRewinding] = useState(false)
  const [rewindAmount, setRewindAmount] = useState(0)
  const [phoneAnswered, setPhoneAnswered] = useState(false)
  const [nearPhone, setNearPhone] = useState(false)
  const [dialogue, setDialogue] = useState(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'KeyQ' && phase === 'playing') setRewinding(true)
      if (event.code === 'Escape' && phase === 'playing') setPhase('paused')
    }
    const up = (event: KeyboardEvent) => { if (event.code === 'KeyQ') setRewinding(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); setRewinding(false) }
  }, [phase])

  useEffect(() => { if (phoneAnswered) setDialogue(true) }, [phoneAnswered])

  const start = () => {
    setPhase('playing')
    void document.querySelector('canvas')?.requestPointerLock()
  }

  const resume = () => {
    setPhase('playing')
    void document.querySelector('canvas')?.requestPointerLock()
  }

  return <main className="game-shell">
    <div className="scene">
      <GameCanvas phase={phase} rewinding={rewinding} phoneAnswered={phoneAnswered} onRewindAmount={setRewindAmount} onNearPhone={setNearPhone} onPhone={() => setPhoneAnswered(true)} />
      <div className="film-grain" /><div className="letterbox letterbox-top" /><div className="letterbox letterbox-bottom" />

      {phase === 'menu' && <section className="title-screen">
        <div className="title-meta"><span>AN INTERACTIVE STORY</span><span>GREYHAVEN · 11:59 PM</span></div>
        <div className="title-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A STORY ABOUT THE MOMENTS WE KEEP</div>
          <h1>ONE MORE<br /><em>MINUTE.</em></h1>
          <p className="tagline">Every second you take leaves something behind.</p>
          <button className="primary-button" onClick={start}><Play size={15} fill="currentColor" /> BEGIN EXPERIENCE</button>
          <p className="micro-copy">BEST EXPERIENCED WITH HEADPHONES</p>
        </div>
        <div className="title-footer"><span>W / A / S / D TO MOVE</span><span>Q TO REWIND TIME</span><span>© GREYHAVEN ARCHIVES</span></div>
      </section>}

      {phase === 'playing' && <>
        <header className="hud-top"><div className="chapter-mark"><span className="chapter-dot" /> CHAPTER 01 <b>— THE FIRST REWIND</b></div><div className="clock-readout"><Clock3 size={13} /> 11:59 PM</div></header>
        <div className="objective"><span>OBJECTIVE</span><p>{phoneAnswered ? 'Listen to the voice.' : 'Find the ringing payphone.'}</p></div>
        {nearPhone && !phoneAnswered && <div className="interact-hint"><kbd>E</kbd> ANSWER THE PHONE</div>}
        <div className={`watch-hud ${rewinding ? 'is-rewinding' : ''}`}>
          <div className="watch-icon"><Clock3 size={22} /></div><div className="watch-info"><span>CHRONO-60</span><strong>{rewinding ? 'RECONSTRUCTING' : 'STANDBY'}</strong></div>
          <div className="watch-meter"><div style={{ width: `${Math.min(100, (rewindAmount / 60) * 100)}%` }} /></div>
          <span className="watch-time">{rewinding ? `−${rewindAmount.toFixed(1)}s` : 'MAX 60s'}</span>
        </div>
        <div className="crosshair"><i /><i /></div>
        <div className="control-hint"><kbd>W A S D</kbd> MOVE <span /> <kbd>SHIFT</kbd> SPRINT <span /> <kbd>Q</kbd> HOLD TO REWIND</div>
        <div className="hud-actions"><button aria-label="Pause" onClick={() => { setPhase('paused'); document.exitPointerLock?.() }}><Pause size={16} /></button></div>
      </>}

      {phase === 'paused' && <section className="overlay-panel"><div className="panel-kicker">GREYHAVEN · PAUSED</div><h2>Take a breath.</h2><p>The rain is still falling.</p><button className="primary-button" onClick={resume}><Play size={15} fill="currentColor" /> RESUME</button><button className="text-button" onClick={() => { setPhase('menu'); document.exitPointerLock?.() }}><RotateCcw size={14} /> RETURN TO TITLE</button></section>}

      {dialogue && phase === 'playing' && <section className="dialogue-card">
        <div className="dialogue-label"><AudioLines size={13} /> INCOMING TRANSMISSION <button onClick={() => setDialogue(false)} aria-label="Close dialogue"><X size={14} /></button></div>
        <p className="speaker">MIRA <span>· UNKNOWN LOCATION</span></p>
        <blockquote>“Ari? Can you hear me? ...You're late again.”</blockquote>
        <p className="dialogue-note">The line fills with a low, familiar static.</p>
      </section>}
      <div className="scene-caption">GREYHAVEN, COASTAL DISTRICT <span>·</span> NOVEMBER 14, 11:59 PM</div>
    </div>
  </main>
}
