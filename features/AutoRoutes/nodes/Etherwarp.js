
// this is literally just skidded from soshimee
import Settings from "../../config"
import { isValidEtherwarpBlock } from "../../../BloomCore/utils/Utils"
import Vector3 from "../../../BloomCore/utils/Vector3"
import { setPlayerPositionNoInterpolation, setVelocity, debugMessage, scheduleTask, swapFromName } from "../../utils/utils"
import ServerTeleport from "../../events/ServerTeleport";
import manager from "./NodeManager"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
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

        this.recentlyPushedC06s = [];

        ServerTeleport.register((event) => {
            const packet = event.data.packet;
            const block = new Vector3(packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e());

            let found = false;
            for (let i = 0; i < this.recentlyPushedC06s.length; i++) {
                if (this.recentlyPushedC06s[i].equals(block)) {
                    found = true;
                    this.recentlyPushedC06s.splice(i, 1);
                    break;
                }
            }

            if (!found) {
                manager.deactivateFor(100);
            }
        }, 10000);
    }

    teleport(toBlock, yaw, pitch, onResult) {
        if (!this._isTeleportItem()) {
            return;
        }

        if (Date.now() - this.lastTPed >= this.noRotateFor) {
            Rotations.rotate(this.yaw, this.pitch, () => {
                sendAirClick();

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, packet.func_149465_i()));
                this.recentlyPushedC06s.push(toBlock);

                this.lastTPed = Date.now();

                onResult(toBlock);
            });
            return;
        }

        if (!this.lastBlock) {
            Rotations.rotate(this.yaw, this.pitch, () => {
                sendAirClick();
                this.lastBlock = toBlock;
                this.lastTPed = Date.now();

                scheduleTask(0, () => {
                    if (!this.lastBlock) {
                        return;
                    }

                    Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, packet.func_149465_i()));
                    this.recentlyPushedC06s.push(this.lastBlock);

                    this.lastBlock = null;
                });

                onResult(toBlock);
            });
            return;
        }

        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, packet.func_149465_i()));
        this.recentlyPushedC06s.push(this.lastBlock);

        sendAirClick();

        this.lastTPed = Date.now();
        this.lastBlock = toBlock;

        onResult(toBlock);
    }

    measureTeleport(fromEther = false, yaw, pitch, onResult) {
        if (!this._isTeleportItem()) {
            return;
        }

        const doneOnce = false;
        const trigger = OnUpdateWalkingPlayerPre.register(event => {
            if (doneOnce) {
                trigger.unregister();
            }

            event.cancelled = true;
            event.break = true;

            const pos = {
                x = Math.floor(Player.x) + 0.5,
                y = Math.floor(Player.y) + fromEther ? 0.05 : 0,
                z = Math.floor(Player.z) + 0.5,
            };

            let replacementPacket = null;
            if (Player.x != pos.x || Player.y != pos.y || Player.z != pos.z) replacementPacket = new C03PacketPlayer.C06PacketPlayerPosLook(pos.x, pos.y, pos.z, this.yaw, this.pitch, true);
            else replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, packet.func_149465_i())

            if (!doneOnce) {
                doneOnce = true;
                return;
            }

            Client.sendPacket(replacementPacket);
            sendAirClick();

            ServerTeleport.scheduleTask(0, (data) => {
                const packet = data.packet;

                const block = new Vector3(packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e());
                recentlyPushedC06s.push(block);
                onResult(block);
            });
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
            tpManager.measureTeleport(this.previousEther, this.yaw, this.pitch, (pos) => {
                this.toBlock(pos);
                onResult(pos);
            });
        } else {
            tpManager.teleport(this.toBlock, this.previousEther, this.yaw, this.pitch, onResult);
        }
    }
});
