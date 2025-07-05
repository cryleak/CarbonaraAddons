import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"

import { sendAirClick, swapFromName, itemSwapSuccess, debugMessage } from "../../../utils/utils"
import { Node } from "../Node"

NodeManager.registerNode(class UseItemNode extends Node {
    static identifier = "useitem"
    static priority = 12340
    constructor(args) {
        super(this.constructor.identifier, args)
        this.itemName = args.itemName
        this.freeze = args.freeze;
    }

    _trigger(execer) {
        swapFromName(this.itemName, result => {
            if (result === itemSwapSuccess.FAIL) return execer.execute(this)
            // Rotations.rotate(this.realYaw, this.pitch, () => {
                Rotations.rotate(this.realYaw, this.pitch, () => {
                    debugMessage(`Using item ${this.itemName} at ${this.realYaw}, ${this.pitch}`)
                    sendAirClick()
                    execer.execute(this)
                }, this.freeze)
            // })
        })
    }

    _handleRotate() {
        return
    }
})
