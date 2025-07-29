import Settings from "../../../config"
import Motion from "../../../utils/Motion"
import NodeManager from "../NodeManager"

import { releaseMovementKeys, setVelocity } from "../../../utils/utils"
import { Node } from "../Node"
import { UpdateWalkingPlayer } from "../../../events/JavaEvents"
import tpManager from "../TeleportManager"
NodeManager.registerNode(class MotionNode extends Node {
    static identifier = "motion"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)
    }

    _trigger(execer) {
        ChatLib.chat(`&aExecuting motion node &e${this.nodeName}&a!`)
        tpManager.sync(this.realYaw, this.pitch, false);
        releaseMovementKeys()
        Motion.running = true
        Motion.yaw = this.realYaw
        Motion.lastX = 0
        Motion.lastZ = 0
        Motion.airTicks = Settings().goonMotion ? -1 : 0 // Dumb fix to let you regain velocity midair with retard motion

        if (!Player.getPlayer().field_70122_E) {
            Motion.running = false
            setVelocity(0, null, 0)
            UpdateWalkingPlayer.Pre.scheduleTask(1, () => {
                Motion.running = true
            })
        }
        execer.execute(this)
    }
})

NodeManager.registerNode(class StopMotionNode extends Node {
    static identifier = "stopmotion"
    static priority = 100
    constructor(args) {
        super(this.constructor.identifier, args)
    }

    _trigger(execer) {
        releaseMovementKeys()
        Motion.running = false
        setVelocity(0, null, 0)
        execer.execute(this)
    }

    _handleRotate() {
        return
    }
})
