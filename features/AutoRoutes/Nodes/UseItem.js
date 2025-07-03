import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"

import { sendAirClick, swapFromName, itemSwapSuccess } from "../../../utils/utils"
import { Node } from "../Node"

NodeManager.registerNode(class UseItemNode extends Node {
    static identifier = "useitem"
    static priority = 1
    constructor(args) {
        super(this.constructor.identifier, args)
        this.itemName = args.itemName
    }

    _trigger(execer) {
        const result = swapFromName()
        if (result === itemSwapSuccess.FAIL) return
        Rotations.rotate(this.realYaw, this.pitch, () => {
            Rotations.rotate(this.realYaw, this.pitch, () => {
                sendAirClick()
                execer.execute(this)
            })
        })
    }

    _handleRotate() {
        return
    }
})
