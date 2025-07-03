import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"

import { chat, findAirOpening, itemSwapSuccess, scheduleTask, sendAirClick, setPlayerPosition, swapFromName } from "../../../utils/utils"
import { Node } from "../Node"

NodeManager.registerNode(class PearlClipNode extends Node {
    static identifier = "pearlclip"
    static priority = 10
    constructor(args) {
        super(this.constructor.identifier, args)
        this.distance = args.pearlClipDistance
    }

    _trigger(execer) {
        const result = swapFromName("Ender Pearl")
        if (result === itemSwapSuccess.FAIL) return execer.execute(this)
        Rotations.rotate(this.yaw, this.pitch, () => {
            sendAirClick()
            let listening = true
            let yPosition = this.distance === 0 ? findAirOpening() : Player.getY() - this.distance
            const soundListener = register("soundPlay", (pos, name, vol) => {
                if (name !== "mob.endermen.portal" || vol !== 1) return
                listening = false
                soundListener.unregister()
                if (!yPosition) {
                    chat("Couldn't find an air opening!")
                    execer.execute(this)
                    return
                }
                chat(`Pearlclipped ${Math.round(((Player.getY() - yPosition) * 10)) / 10} blocks down.`)
                setPlayerPosition(Player.getX(), yPosition, Player.getZ())
                execer.execute(this)
            })

            scheduleTask(60, () => {
                if (!listening) return
                chat("Pearlclip timed out.")
                execer.execute(this)
            })
        })
    }

    _handleRotate() {
        return
    }
})