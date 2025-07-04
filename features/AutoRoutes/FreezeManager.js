import OnUpdateWalkingPlayerPre from "../../events/OnUpdateWalkingPlayerPre"
import { setVelocity } from "../../utils/utils"

export default new class FreezeManager {
    constructor() {
        this.freezing = false

        this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()]
        OnUpdateWalkingPlayerPre.register(event => {
            if (!this.freezing) return

            setVelocity(0, 0, 0)
            event.cancelled = true
            event.break = true
        }, 1000000000000)
    }

    setFreezing(state) {
        if (state) {
            this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()]
            setVelocity(0, 0, 0)
        }
        else {
            setVelocity(...this.previousVelocity)
        }
        this.freezing = state
    }

}