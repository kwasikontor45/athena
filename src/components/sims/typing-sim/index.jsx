import './typing-sim.css'

export default function TypingSim({ onClose }) {
  return (
    <div className="placeholder-sim">
      <div className="placeholder-sim__titlebar">
        <div className="placeholder-sim__dots">
          <button className="placeholder-sim__dot placeholder-sim__dot--red" onClick={onClose} aria-label="Close" />
          <span className="placeholder-sim__dot placeholder-sim__dot--yellow" />
          <span className="placeholder-sim__dot placeholder-sim__dot--green" />
        </div>
        <span className="placeholder-sim__title">Typing Practice</span>
        <span />
      </div>
      <div className="placeholder-sim__body">
        <span className="placeholder-sim__icon">⌨️</span>
        <p className="placeholder-sim__heading">Coming Soon</p>
        <p className="placeholder-sim__sub">This one's almost ready — practice your other lessons while you wait!</p>
      </div>
    </div>
  )
}
