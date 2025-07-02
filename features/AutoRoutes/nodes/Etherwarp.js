import Vector3 from "../../../../BloomCore/utils/Vector3"
import ServerTeleport from "../../../events/ServerTeleport";
import manager from "../NodeManager";
import OnUpdateWalkingPlayerPre from "../../../events/OnUpdateWalkingPlayerPre"
import Rotations from "../../../utils/Rotations"
import Dungeons from "../../../utils/Dungeons"

import { setPlayerPosition, setVelocity, debugMessage, scheduleTask, swapFromName, isWithinTolerence, sendAirClick, chat, removeCameraInterpolation, setSneaking } from "../../../utils/utils"
import { Node } from "../Node"
import { removeUnicode } from "../../../../BloomCore/utils/Utils";


const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

class TeleportManager {
    constructor() {
        this.lastTPed = 0;
        this.noRotateFor = 900;

        this.yaw = Player.getYaw();
        this.pitch = Player.getPitch();
        this.lastBlock = null;

        this.recentlyPushedC06s = [];

        ServerTeleport.register((event) => {
            if (!this.recentlyPushedC06s.length) return
            const packet = event.data.packet;

            const { x, y, z, yaw, pitch } = this.recentlyPushedC06s.shift()
            const newPitch = packet.func_148930_g();
            const newYaw = packet.func_148931_f();
            const newX = packet.func_148932_c();
            const newY = packet.func_148928_d();
            const newZ = packet.func_148933_e();

            const lastPresetPacketComparison = {
                x: x == newX,
                y: y == newY,
                z: z == newZ,
                yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
                pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0
            };
            const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a);

            if (!wasPredictionCorrect) {
                chat("§4Teleport failed")
                manager.deactivateFor(100);
                while (this.recentlyPushedC06s.length) this.recentlyPushedC06s.pop()
                debugMessage(`§4Teleport failed: ${newX}, ${newY}, ${newZ} | ${newYaw}, ${newPitch} | ${x}, ${y}, ${z} | ${yaw}, ${pitch} | ` + JSON.stringify(lastPresetPacketComparison));
            } else {
                event.cancelled = true
                event.break = true
            }
        }, 10000);
    }

    teleport(toBlock, yaw, pitch, sneaking, itemName, onResult) {
        if (!this.isTeleportItem()) {
            return;
        }
        let result = "ALREADY_HOLDING"
        if (Player.getHeldItem().getName() !== itemName) result = swapFromName(itemName)[0]
        if (result === "CANT_FIND") return result

        if (Date.now() - this.lastTPed >= this.noRotateFor) {
            setSneaking(sneaking)
            Rotations.rotate(yaw, pitch, () => {
                sendAirClick();

                // response to the airClick
                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
                this.recentlyPushedC06s.push({ x: toBlock.x, y: toBlock.y, z: toBlock.z, yaw, pitch });
                setPlayerPosition(toBlock.x, toBlock.y, toBlock.z)

                this.lastTPed = Date.now();

                onResult(toBlock);
            });
            return;
        }

        if (!this.lastBlock || sneaking !== Player.isSneaking() || result !== "ALREADY_HOLDING") {
            setSneaking(sneaking)
            Rotations.rotate(yaw, pitch, () => {
                sendAirClick();
                this.lastBlock = toBlock;
                this.lastTPed = Date.now();

                // In case something fails just update everything the next tick.
                scheduleTask(0, () => {
                    this.sync(yaw, pitch);
                });

                onResult(toBlock);
            });
            return;
        }

        debugMessage(`Using method 3`);
        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        this.recentlyPushedC06s.push({ x: this.lastBlock.x, y: this.lastBlock.y, z: this.lastBlock.z, yaw, pitch });
        setPlayerPosition(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z)

        sendAirClick();

        this.lastTPed = Date.now();
        this.lastBlock = toBlock;

        onResult(toBlock);
    }

    sync(yaw, pitch) {
        if (!this.lastBlock) {
            return;
        }

        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        this.recentlyPushedC06s.push({ x: this.lastBlock.x, y: this.lastBlock.y, z: this.lastBlock.z, yaw, pitch });
        setPlayerPosition(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z)

        this.lastBlock = null;
    }

    measureTeleport(fromEther = false, yaw, pitch, onResult) {
        if (!this.isTeleportItem()) {
            return;
        }

        let doneOnce = false;
        const trigger = OnUpdateWalkingPlayerPre.register(event => {
            if (doneOnce) {
                trigger.unregister();
            }

            event.cancelled = true;
            event.break = true;

            const pos = {
                x: Math.floor(Player.x) + 0.5,
                y: Player.y + (fromEther ? 0.05 : 0),
                z: Math.floor(Player.z) + 0.5,
            };

            let replacementPacket = null;
            if (Player.x != pos.x || Player.y != pos.y || Player.z != pos.z) replacementPacket = new C03PacketPlayer.C06PacketPlayerPosLook(pos.x, pos.y, pos.z, yaw, pitch, true);
            else replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, Player.asPlayerMP().isOnGround())

            if (!doneOnce) {
                doneOnce = true;
                return;
            }

            Client.sendPacket(replacementPacket);
            sendAirClick();

            let awaiting = true
            const listener = ServerTeleport.register((event) => {
                awaiting = false
                listener.unregister()

                event.break = true
                const packet = event.data.packet;

                const block = new Vector3(Math.floor(packet.func_148932_c()), packet.func_148928_d(), Math.floor(packet.func_148933_e()));
                // this.recentlyPushedC06s.push({ x: block.x, y: block.y, z: block.z, yaw, pitch });
                onResult(block);
            }, 10001);
            scheduleTask(100, () => {
                if (!awaiting) return
                onResult(null)
                listener.unregister()
                awaiting = false
            })
        }, 1000000);

        this.lastTPed = Date.now();
    }

    isTeleportItem(item = Player.getHeldItem()) {
        const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
        if (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) {
            return true;
        } else if (["NECRON_BLADE", "HYPERION", "VALKYRIE", "ASTRAEA", "SCYLLA"].includes(sbId)) {
            if (!["IMPLOSION_SCROLL", "WITHER_SHIELD_SCROLL", "SHADOW_WARP_SCROLL"].every(value => item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll?.includes(value))) {
                return false;
            }

            return true;
        }

        return false;
    }
}

const tpManager = new TeleportManager();

manager.registerNode(class EtherwarpNode extends Node {
    static identifier = "etherwarp";
    static priority = 0;

    constructor(args) {
        super(this.constructor.identifier, args);

        this.previousEther = args.prevEther;
        this.toBlock = null;
    }

    _trigger(execer) {
        const onResult = (pos) => {
            const result = execer.execute(this, (node) => {
                const found = (pos?.x === node?.realPosition?.x && pos?.y - node?.realPosition?.y <= 0.06 && pos?.y - node?.realPosition?.y >= 0 && pos?.z === node?.realPosition?.z)
                if (found) {
                    debugMessage(`Actually found the next node`);
                }
                return found
            });

            if (result) {
                debugMessage(`syncing`);
                tpManager.sync(this.realYaw, this.pitch);
            }
        };

        if (!this.toBlock) {
            tpManager.measureTeleport(this.previousEther, this.realYaw, this.pitch, (pos) => {
                this.toBlock = Dungeons.convertToRelative(pos);
                manager.saveConfig();
                onResult(pos);
            });
        } else {
            tpManager.teleport(Dungeons.convertFromRelative(this.toBlock).add([0.5, 0, 0.5]), this.realYaw, this.pitch, onResult);
        }
    }

    _handleRotate() {
        return
    }
});
