import Rotations from "../../../utils/Rotations"
import NodeManager from "../NodeManager"
import tpManager from "../TeleportManager";
import OnUpdateWalkingPlayerPre from "../../../events/onUpdateWalkingPlayerPre"
import LivingUpdate from "../../../events/LivingUpdate"

import { chat, findAirOpening, itemSwapSuccess, scheduleTask, sendAirClick, setPlayerPosition, swapFromName } from "../../../utils/utils"
import { Node } from "../Node"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

NodeManager.registerNode(class PearlClipNode extends Node {
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
        const soundListener = register("soundPlay", (pos, name, vol) => {
            if (name !== "mob.endermen.portal" || vol !== 1) return
            listening = false
            soundListener.unregister()
            if (!yPosition) {
                chat("Couldn't find an air opening!")
                execer.execute(this)
                return
            }
            chat(`Pearlclipped ${Math.round(((Player.getY() - yPosition - 1) * 10)) / 10} blocks down.`)
            const trigger = OnUpdateWalkingPlayerPre.register(event => {
                trigger.unregister();
                event.break = true;
                event.cancelled = true;

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, yPosition, Player.z, Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));
                setPlayerPosition(Player.x, yPosition, Player.z)
                execer.execute(this)
            }, 2934285349853);
        })

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
            LivingUpdate.scheduleTask(0, () => {
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

    _preArgumentTrigger(execer) {
        tpManager.sync(this.realYaw, this.pitch, true);
        return true;
    }

    createConfigValues() {
        // updating to contain the distance setting
        const values = super.createConfigValues();
        values.push({
            type: "addTextInput",
            configName: "pearl Clip Distance",
            registerListener: (obj, prev, next) => {
                const newDistance = parseFloat(next);
                if (isNaN(newDistance) || newDistance < 0) {
                    chat("Invalid distance! Please enter a valid number greater than or equal to 0.");
                    return;
                }

                this.distance = newDistance;
            },
            updator: (config, obj) => {
                config.settings.getConfig().setConfigValue("Object Editor", "pearl Clip Distance", obj.distance);
            }
        });
        return values;
    }

    _handleRotate() {
        return
    }
})
