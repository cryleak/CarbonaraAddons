import Vector3 from "../../utils/Vector3"
import Tick from "../../events/Tick"
import Settings from "../../config"
import manager from "./NodeManager"

import { releaseMovementKeys, movementKeys } from "../../utils/utils"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")

// This one is for autop3 it's somewhat copied over from the autoroutes.
class NodeExecutor {
    constructor() {
        this._updateCoords(); // just so we have an initial value although it might be wrong...

        this.consumed = 0;

        register("packetReceived", (packet, _) => { // Avoid checking for intersections when you get teleported by the server.
            this._updateCoords({
                x: packet.func_148932_c(),
                y: packet.func_148928_d(),
                z: packet.func_148933_e()
            })
        }).setFilteredClass(S08PacketPlayerPosLook);

        Tick.Pre.register(() => {
            if (!Settings().autoP3Enabled) return
            this.execute();
            this._updateCoords();
        }, 0);

        register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
            if (this.consumed === 0) return
            if (Client.isInGui() || !World.isLoaded()) return
            if (!Keyboard.getEventKeyState()) return
            const keyCode = Keyboard.getEventKey()
            if (!keyCode) return

            if (!movementKeys.includes(keyCode)) return

            releaseMovementKeys();
        })
    }

    execute(by = null) {
        if (by) this.lowerConsumed();

        if (!manager.active) return;


        if (this.consumed > 0) {
            return;
        }

        const toExec = manager.getActiveNodes().filter(node => {
            if (node.chained && !by) {
                return false;
            }

            if (false/* TODO: intersection checks */) {
                if (!by) {
                    node.triggered = false;
                }
                return false;
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

        const node = toExec[0]
        this.consumed++;
        node.execute(this);
    }

    lowerConsumed() {
        this.consumed--;
        if (this.consumed < 0) {
            this.consumed = 0;
        }
    }

    _updateCoords(updated = Player) {
        this.previousCoords = new Vector3(updated);
    }
}

export default new NodeExecutor();
