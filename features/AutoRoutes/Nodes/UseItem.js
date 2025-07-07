import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"
import tpManager from "../TeleportManager"

import { sendAirClick, swapFromName, itemSwapSuccess, debugMessage } from "../../../utils/utils"
import { Node } from "../Node"

NodeManager.registerNode(class UseItemNode extends Node {
    static identifier = "useitem"
    static priority = 12340
    constructor(args) {
        super(this.constructor.identifier, args)
        this.itemName = args.itemName
        this.freeze = args.freeze;
        this.withoutRotate = args.withoutRotate;
    }

    executeClick(execer) {
        Rotations.rotate(this.realYaw, this.pitch, () => {
            debugMessage(`Using item ${this.itemName} at ${this.realYaw}, ${this.pitch}`)
            sendAirClick()
            execer.execute(this)
        });
    }

    _trigger(execer) {
        let rotated = tpManager.sync(this.realYaw, this.pitch, false);
        swapFromName(this.itemName, result => {
            if (result === itemSwapSuccess.FAIL) return execer.execute(this)
            if (this.rotated || this.withoutRotate) {
                this.executeClick(execer);
            } else {
                Rotations.rotate(this.realYaw, this.pitch, () => {
                    this.executeClick(execer);
                }, this.freeze);
            }
        })
    }
})
