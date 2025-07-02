import LivingUpdate from "../../events/LivingUpdate"
import { checkIntersection } from "../../utils/utils"
import manager from "./NodeManager"

class NodeExecutor {
    constructor() {
        this._updateCoords(); // just so we have an initial value although it might be wrong...

        this.active = false;
        this.consumed = 0;

        register("packetReceived", (packet, event) => { // Avoid checking for intersections when you get teleported by the server.
            this._updateCoords({
                x: packet.func_148932_c(),
                y: packet.func_148928_d(),
                z: packet.func_148933_e()
            })
        }).setFilteredClass(S08PacketPlayerPosLook)

        LivingUpdate.register(() => {
            this.execute();
            this._updateCoords();
        })
    }

    execute(by = null, intersectionMethod = this._defaultIntersectionMethod) {
        if (!this.active) return;

        if (by) this.consumed--;
        if (this.consumed < 0)

        const toExec = manager.activeNodes.filter(n => {
            if (n.chained && !by) {
                return false;
            }

            if (!intersectionMethod(n.loc, n.radius, n.height)) {
                return false;
            }

            if (Date.now() - node.lastTriggered < 1000) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            return (b.constructor.priority || 0) - (a.constructor.priority || 0);
        });

        toExec.forEach(n => {
            this.consumed++;
            found.execute(this);
        });
    }

    _defaultIntersectionMethod(loc, radius, height) {
        return checkIntersection(this.previousCoords, Player, loc, radius, height);
    }

    _updateCoords(coords = Player) {
        this.previousCoords = {
            x: coords.x,
            y: coords.y,
            z: coords.z
        };
    }
}

export default new NodeExecutor();
