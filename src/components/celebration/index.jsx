import { useEffect, useRef } from 'react'
import './celebration.css'

const COLORS = ['#d4af37', '#e5c04a', '#f0d060', '#c9a828', '#fff8dc', '#ffd700', '#fffacd']

function useConfetti(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width  = canvas.offsetWidth  || window.innerWidth
    const H = canvas.height = canvas.offsetHeight || window.innerHeight

    const particles = Array.from({ length: 75 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H - H * 0.6,
      w:     Math.random() * 9 + 4,
      h:     Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.18,
      vx:    (Math.random() - 0.5) * 2.5,
      vy:    Math.random() * 2.5 + 1.5,
    }))

    let rafId
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.85
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafId)
  }, [canvasRef])
}

export default function CelebrationOverlay({ lesson, onDismiss }) {
  const canvasRef = useRef(null)
  useConfetti(canvasRef)

  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="cel" onClick={onDismiss}>
      <canvas ref={canvasRef} className="cel__canvas" />
      <div className="cel__card" onClick={e => e.stopPropagation()}>
        <div className="cel__icon">{lesson.icon}</div>
        <div className="cel__badge-label">lesson complete</div>
        <div className="cel__title">{lesson.title}</div>
        <div className="cel__xp">+50 XP</div>
        <button className="cel__continue" onClick={onDismiss}>continue →</button>
      </div>
    </div>
  )
}
