import Vector3 from "../../../BloomCore/utils/Vector3"
import LivingUpdate from "../../events/LivingUpdate"
import { checkIntersection, debugMessage } from "../../utils/utils"
import manager from "./NodeManager"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")

class NodeExecutor {
    constructor() {
        this._updateCoords(); // just so we have an initial value although it might be wrong...

        this.consumed = 0;

        register("packetReceived", (packet, event) => { // Avoid checking for intersections when you get teleported by the server.
            this._updateCoords({
                x: packet.func_148932_c(),
                y: packet.func_148928_d(),
                z: packet.func_148933_e()
            })
        }).setFilteredClass(S08PacketPlayerPosLook);

        LivingUpdate.register(() => {
            this.execute();
            this._updateCoords();
        });
    }

    execute(by = null, intersectionMethod = null) {
        if (!manager.active) return;

        if (by) {
            this.lowerConsumed();
        }

        if (this.consumed > 0) {
            return;
        }

        const toExec = manager.activeNodes.filter(node => {
            if (node.chained && !by) {
                return false;
            }

            if ((intersectionMethod && !intersectionMethod(node)) || (!intersectionMethod && !this._defaultIntersectionMethod(node))) {
                node.triggered = false;
                return false;
            }

            if (intersectionMethod) {
                debugMessage(`Custom intersection success`);
            }

            if (node.lastTriggered && Date.now() - node.lastTriggered < 1000 || node.triggered) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            return (b.constructor.priority || 0) - (a.constructor.priority || 0);
        });

        if (toExec.length === 0) {
            return true;
        }

        debugMessage(`Executing ${toExec.length} nodes`);
        toExec.forEach(node => {
            this.consumed++;
            node.execute(this);
        });
    }

    lowerConsumed() {
        this.consumed--;
        if (this.consumed < 0) {
            this.consumed = 0;
        }
    }

    _defaultIntersectionMethod(node) {
        const playerVec = new Vector3(Player.x, Player.y, Player.z);
        return checkIntersection(this.previousCoords, playerVec, node.realPosition, node.radius, node.height);
    }

    _updateCoords(updated = Player) {
        this.previousCoords = new Vector3(updated.x, updated.y, updated.z);
    }
}

export default new NodeExecutor();
