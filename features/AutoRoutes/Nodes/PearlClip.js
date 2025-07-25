import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"
import tpManager from "../TeleportManager";

import { chat, findAirOpening, itemSwapSuccess, scheduleTask, sendAirClick, setPlayerPosition, swapFromName } from "../../../utils/utils"
import { Node } from "../Node"
import { PostPacketReceive, UpdateWalkingPlayer } from "../../../events/JavaEvents";
import FreezeManager from "../FreezeManager";

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")

export default class PearlClipNode extends Node {
    static identifier = "pearlclip"
    static priority = 10
    constructor(args) {
        super(this.constructor.identifier, args)
        this.distance = args.pearlClipDistance
    }

    doTeleport(execer) {
        sendAirClick()
        let listening = true
        let yPosition = this.distance === 0 ? findAirOpening() : Player.getY() - this.distance
        const originalY = Player.y
        FreezeManager.setFreezing(true);
        const pearlListener = PostPacketReceive.register(packet => {
            if (!(packet instanceof S08PacketPlayerPosLook)) return
            listening = false
            pearlListener.unregister()
            FreezeManager.setFreezing(false);
            if (!yPosition) {
                chat("Couldn't find an air opening!")
                execer.execute(this)
                return
            }
            chat(`Pearlclipped ${(originalY - yPosition).toFixed(2)} blocks down.`)
            const trigger = UpdateWalkingPlayer.Pre.register(event => {
                trigger.unregister();
                event.breakChain = true;
                event.cancelled = true;

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, yPosition, Player.z, Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));
                setPlayerPosition(Player.x, yPosition, Player.z, true)

                execer.execute(this)
            }, 2934285);
        }, 0)

        scheduleTask(60, () => {
            if (!listening) return
            chat("Pearlclip timed out.")
            execer.execute(this)
        });
    }

    _trigger(execer) {
        swapFromName("Ender Pearl", result => {
            if (result === itemSwapSuccess.FAIL) return execer.execute(this)
            const rotated = tpManager.sync(this.realYaw, this.pitch, false);
            UpdateWalkingPlayer.Pre.scheduleTask(0, () => {
                if (rotated) {
                    this.doTeleport(execer);
                } else {
                    Rotations.rotate(this.realYaw, this.pitch, () => {
                        this.doTeleport(execer);
                    }, true);
                }
            });
        })
    }

    _preArgumentTrigger(_) {
        tpManager.sync(this.realYaw, this.pitch, true);
        return true;
    }

    createConfigValues() {
        // updating to contain the distance setting
        const values = super.createConfigValues();
        values.push({
            type: "addTextInput",
            configName: "pearl Clip Distance",
            registerListener: (obj, _, next) => {
                const newDistance = parseFloat(next);
                if (isNaN(newDistance) || newDistance < 0) {
                    chat("Invalid distance! Please enter a valid number greater than or equal to 0.");
                    return;
                }

                obj.distance = newDistance;
            },
            updator: (setter, obj) => {
                setter("pearl Clip Distance", obj.distance);
            }
        });
        return values;
    }

    _handleRotate() {
        return
    }
}

NodeManager.registerNode(PearlClipNode)
