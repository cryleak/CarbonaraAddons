
// this is literally just skidded from soshimee
import Settings from "../../config"
import { isValidEtherwarpBlock } from "../../../BloomCore/utils/Utils"
import Vector3 from "../../../BloomCore/utils/Vector3"
import { setPlayerPositionNoInterpolation, setVelocity, debugMessage, scheduleTask, swapFromName } from "../../utils/utils"
import { CancellableEvent } from "../../events/CustomEvents";
import manager from "./NodeManager"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook");
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
    }

    teleport(toBlock, yaw, pitch, onResult) {
        if (!this._isTeleportItem()) {
            return;
        }

        if (Date.now() - this.lastTPed >= this.noRotateFor) {
            Rotations.rotate(this.yaw, this.pitch, () => {
                Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack()));
                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, packet.func_149465_i()));
                this.lastTPed = Date.now();

                onResult(toBlock);
            });
            return;
        }

        if (!this.lastBlock) {
            Rotations.rotate(this.yaw, this.pitch, () => {
                Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack()));
                this.lastBlock = toBlock;
                this.lastTPed = Date.now();

                scheduleTask(0, () => {
                    if (this.lastBlock) {
                        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, packet.func_149465_i()));
                        this.lastBlock = null;
                    }
                });

                onResult(toBlock);
            });

            // something went wrong...
            return;
        }

        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, packet.func_149465_i()));
        Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack()));

        this.lastTPed = Date.now();
        this.lastBlock = toBlock;

        onResult(toBlock);
    }

    measureTeleport(fromEther = false, yaw, pitch, onResult) {
        if (!this._isTeleportItem()) {
            return;
        }

        Rotations.rotate(yaw, pitch, () => {
            const trigger = OnUpdateWalkingPlayerPre.register(event => {
                trigger.unregister();
                event.cancelled = true;
                event.break = true;

                let replacementPacket = null;
                if (fromEther) replacementPacket = new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, Player.y + 0.05, Player.z, this.yaw, this.pitch, true);
                else replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, packet.func_149465_i())

                Client.sendPacket(replacementPacket);
                Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack()));

                const resultTrigger = register("packetReceived", packet => {
                    resultTrigger.unregister();

                    onResult(new Vector3(packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e()))
                }).setFilteredClass(S08PacketPlayerPosLook);
            }, 1000000);
        });

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
    static identifier = "nop";
    static priority = 0;

    constructor(args) {
        super(this.constructor.identifier, args);

        this.previousEther = args.prevEther;
        this.toBlock = null;
    }

    _trigger(execer) {
        const onResult = (pos) => {
            execer.execute(this, (node) => {
                return pos.x === node.z && pos.y - node.y <= 0.06 && pos.z === node.z;
            });
        };

        if (!this.toBlock) {
            tpManager.measureTeleport(this.previousEther, this.yaw, this.pitch, onResult);
        } else {
            tpManager.teleport(this.toBlock, this.previousEther, this.yaw, this.pitch, onResult);
        }
    }
});
