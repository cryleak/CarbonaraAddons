import OnUpdateWalkingPlayerPre from "../../events/OnUpdateWalkingPlayerPre"
import Vector3 from "../../utils/Vector3"
import { setVelocity, setPosition, removeCameraInterpolation } from "../../utils/utils"

export default new class FreezeManager {
    constructor() {
        this.freezing = false

        this.position = new Vector3(Player);
        this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()]
        OnUpdateWalkingPlayerPre.register(event => {
            if (!this.freezing) return

            removeCameraInterpolation()
            setPosition(this.position.x, this.position.y, this.position.z);
            setVelocity(0, 0, 0)
            event.cancelled = true
            event.break = true
        }, 1000000000000)
    }

    setFreezing(state) {
        if (state) {
            this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()]
            setVelocity(0, 0, 0)
            this.position = new Vector3(Player);
        }
        else {
            setVelocity(...this.previousVelocity)
        }
        this.freezing = state
    }

}
