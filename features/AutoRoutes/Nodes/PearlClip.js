import Rotations from "../../../utils/Rotations";
import { Node } from "../Node";
import NodeManager from "../NodeManager";

NodeManager.registerNode(class PearlClipNode extends Node {
    static identifier = "pearlclip"
    static priority = 547589437589
    constructor(args) {
        super(this.constructor.identifier, args)
        this.distance = args.pearlClipDistancea
    }

    _trigger(execer) {
        Rotations.rotate(0, 90, () => { })
        execer.execute(this)
    }

    _handleRotate() {
        return
    }
})