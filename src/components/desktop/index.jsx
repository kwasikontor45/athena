import Taskbar from '../taskbar'
import AthenaAssistant from '../athena-assistant'
import LessonPanel from '../lesson-panel'
import ProgressTracker from '../progress-tracker'

export default function Desktop() {
  return (
    <div className="desktop">
      <div className="desktop__workspace">
        <LessonPanel />
        <AthenaAssistant />
        <ProgressTracker />
      </div>
      <Taskbar />
    </div>
  )
}
