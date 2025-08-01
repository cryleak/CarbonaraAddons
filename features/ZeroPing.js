import Settings from "../config"
import Vector3 from "../utils/Vector3";
import ServerTeleport from "../events/ServerTeleport";
import MouseEvent from "../events/MouseEvent";
import { PostUseItem, UpdateWalkingPlayer } from "../events/JavaEvents"

import { getEtherwarpBlock } from "../../BloomCore/utils/Utils"
import { isWithinTolerence, rotate, sendAirClick, setPlayerPosition, setVelocity } from "../utils/utils";
import { getTeleportInfo } from "../utils/TeleportItem";
import Dungeons from "../utils/Dungeons";
import Module, { modules, registerModule } from "./PhoenixModule";

const Vec3 = Java.type("net.minecraft.util.Vec3");

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

registerModule(class Teleport extends Module {
    constructor(phoenix) {
        super("Teleport", phoenix)
        this._tryLoadConfig();

        register("packetReceived", (packet, event) => {
            if (!this.isToggled()) return
            const enumflags = Object.values(packet.func_179834_f())
            if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.X)) {
                cancel(event)
                setVelocity(0, 0, 0)
                const [x, y, z] = [packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e()]
                setPlayerPosition(x, y, z, false)
                if (!enumflags.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) rotate(packet.func_148931_f(), packet.func_148930_g())

                this._phoenix.customPayload("carbonara-zpew-acknowledge-force-teleport", { x, y, z })
            }
        }).setFilteredClass(S08PacketPlayerPosLook)

        this.recentFails = []
        this.playerState = {
            x: null,
            y: null,
            z: null,
            yaw: null,
            pitch: null,
            sneaking: false
        };

        this.sent = [];
        this.updatePosition = true;
        this.desyncedTps = [];
        this.lastTPed = 0;
        this.disallowedBlockIDS = [ // Block IDs we can't teleport if we are looking at them
            54,
            69,
            118,
            146,
            154
        ]

        PostUseItem.register(() => {
            const objectMouseOver = Client.getMinecraft().field_71476_x
            const type = objectMouseOver.field_72313_a.toString()
            if (type === "ENTITY") return
            else if (type === "BLOCK") {
                const position = new Vector3(objectMouseOver.func_178782_a())
                const blockID = World.getBlockAt(...position.getPosition()).type.getID()
                if (this.disallowedBlockIDS.includes(blockID)) return
            }
            if (Dungeons.isIn7Boss() || !Settings().zpewEnabled || !this.isToggled()) return
            this.doZeroPing()
        })

        MouseEvent.register(event => {
            if (!Settings().zpewEnabled) return;

            this._handleMouseEvent(event);
        }, 99)

        ServerTeleport.register(event => {
            this._handleServerTeleport(event);
        }, 9999);

        register("packetSent", packet => {
            this._handleClientPlayerPacket(packet);
        }).setFilteredClass(C03PacketPlayer);

        register("packetSent", packet => {
            this._handleClientEntityAction(packet);
        }).setFilteredClass(C0BPacketEntityAction);
    }

    isSynced() {
        while (this.desyncedTps.length && Date.now() - this.desyncedTps[0] > 1000) this.desyncedTps.shift()
        return this.sent.length === 0 && this.desyncedTps.length === 0;
    }

    updateLastTPed() {
        this.lastTPed = Date.now();
    }

    _handleMouseEvent(event) {
        const { button, state } = event.data;
        if (!state) return

        if (button === 0) {
            this.doRegularTeleport(event);
        }
    }

    _handleServerTeleport(event) {
        if (!this.sent.length) {
            if (this.desyncedTps.length) {
                this.desyncedTps.shift();
            }
            return;
        }

        const { pitch, yaw, x, y, z } = this.sent.shift();
        const { pitch: newPitch, yaw: newYaw, x: newX, y: newY, z: newZ } = event.data;

        const lastPresetPacketComparison = {
            x: x == newX,
            y: y == newY,
            z: z == newZ,
            yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
            pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0
        };

        const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a);

        if (wasPredictionCorrect) {
            event.cancelled = true;
            return;
        }
        else {
            this.recentFails.push(Date.now());
            while (this.recentFails.length && Date.now() - this.recentFails[0] > 20 * 1000) this.recentFails.shift();
            ChatLib.chat(`§4Zero ping tp failed! ${this.recentFails.length} fails last 20 seconds`);
        }

        while (this.sent.length) this.sent.shift();
    }

    _handleClientPlayerPacket(packet) {
        if (!this.updatePosition) return;
        const x = packet.func_149464_c();
        const y = packet.func_149467_d();
        const z = packet.func_149472_e();
        const yaw = packet.func_149462_g();
        const pitch = packet.func_149470_h();
        if (packet.func_149466_j()) {
            this.playerState.x = x;
            this.playerState.y = y;
            this.playerState.z = z;
        }
        if (packet.func_149463_k()) {
            this.playerState.yaw = yaw;
            this.playerState.pitch = pitch;
        }
    }

    _handleClientEntityAction(packet) {
        const action = packet.func_180764_b();
        if (action == C0BPacketEntityAction.Action.START_SNEAKING) this.playerState.sneaking = true;
        if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) this.playerState.sneaking = false;
    }

    doRegularTeleport(event) {
        const info = getTeleportInfo(Player.getHeldItem(), this.playerState);
        if (!info || info.type !== "etherwarp" || !Settings().etherLeftClick) {
            return;
        }

        event.cancelled = true;
        event.breakChain = true;

        sendAirClick();
        this.desyncedTps.push(Date.now());
        this.updateLastTPed();
    }

    doZeroPing() {
        const info = getTeleportInfo(Player.getHeldItem(), this.playerState);
        if (!info) {
            return;
        }

        switch (info.type) {
            case "etherwarp":
                if (!Settings().ether) {
                    return;
                }
                break;
            case "aotv":
                if (!Settings().aotv) {
                    return;
                }
                break;
            case "hype":
                if (!Settings().hype) {
                    return;
                }
                break;
        }

        while (this.recentFails.length && Date.now() - this.recentFails[0] > 20 * 1000) {
            this.recentFails.shift()
        }

        if (this.recentFails.length >= Settings().maxFails && !Settings().singleplayer) {
            return ChatLib.chat(`§c Zero Ping TP cancelled. ${this.recentFails.length} fails last 20 seconds.`)
        }

        if (this.sent.length >= 5 && !Settings().singleplayer) {
            return ChatLib.chat(`§c Zero Ping TP cancelled. ${this.sent.length} packets queued.`)
        }

        if (Object.values(this.playerState).includes(null)) {
            return;
        }

        let prediction;
        if (info.ether) {
            // prediction = raytraceBlocks([this.playerState.x, this.playerState.y + 1.5399999618530273, this.playerState.z], Vector3.fromPitchYaw(this.playerState.pitch, this.playerState.yaw), info.distance, isValidEtherwarpBlock, true, true);
            prediction = getEtherwarpBlock(true, info.distance)

            if (prediction) {
                prediction[0] += 0.5;
                prediction[1] += 1.05;
                prediction[2] += 0.5;
            }
        } else {
            prediction = predictTeleport(info.distance, this.playerState.x, this.playerState.y, this.playerState.z, this.playerState.yaw, this.playerState.pitch);
        }
        if (!prediction) return

        const [x, y, z] = prediction;
        const yaw = info.ether ? (this.playerState.yaw % 360 + 360) % 360 : this.playerState.yaw % 360; // wtf hypixel
        const pitch = this.playerState.pitch;

        this.playerState.x = x;
        this.playerState.y = y;
        this.playerState.z = z;
        this.updatePosition = false;

        // this.sent.push({ x, y, z, yaw, pitch });

        this._phoenix.customPayload("carbonara-zpew-teleport-prediction", { x, y, z, yaw, pitch })

        /*
        const PlayerUpdateListener = UpdateWalkingPlayer.Pre.register(event => {
            event.cancelled = true
            event.breakChain = true
        }, 2147483647)
        Client.scheduleTask(0, () => {
            PlayerUpdateListener.unregister()
            */
        setVelocity(0, 0, 0)
        setPlayerPosition(x, y, z, true)
        // })
        // Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(x, y, z, yaw, pitch, false))

        this.updateLastTPed();
        this.updatePosition = true;
    }
})

const IGNORED = [0, 51, 8, 9, 10, 11, 171, 331, 39, 40, 115, 132, 77, 143, 66, 27, 28, 157];
const IGNORED2 = [44, 182, 126]; // ignored blocks for selbox raycast
const SPECIAL = [65, 106, 111]; // blocks for exclusive selbox raycast

const steps = 100;

function predictTeleport(distance, x, y, z, yaw, pitch) {
    const forward = Vector3.fromPitchYaw(pitch, yaw).multiply(1 / steps);
    const cur = new Vector3(x, y + Player.getPlayer().func_70047_e(), z);
    let i = 0;
    for (; i < distance * steps; ++i) {
        if (i % steps === 0 && !isSpecial(cur.getX(), cur.getY(), cur.getZ()) && !isSpecial(cur.getX(), cur.getY() + 1, cur.getZ())) {
            if (!isIgnored(cur.getX(), cur.getY(), cur.getZ()) || !isIgnored(cur.getX(), cur.getY() + 1, cur.getZ())) {
                cur.add(forward.multiply(-steps));
                if (i === 0 || !isIgnored(cur.getX(), cur.getY(), cur.getZ()) || !isIgnored(cur.getX(), cur.getY() + 1, cur.getZ())) return false;
                return [Math.floor(cur.getX()) + 0.5, Math.floor(cur.getY()), Math.floor(cur.getZ()) + 0.5];
            }
        }
        if ((!isIgnored2(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored2(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) {
            cur.add(forward.multiply(-steps));
            if (i === 0 || (!isIgnored(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) return false;
            break;
        }
        cur.add(forward);
    }
    const pos = new Vector3(x, y + Player.getPlayer().func_70047_e(), z).add(Vector3.fromPitchYaw(pitch, yaw).multiply(Math.floor(i / steps)));
    if ((!isIgnored(cur.getX(), cur.getY(), cur.getZ()) && inBB(cur.getX(), cur.getY(), cur.getZ())) || (!isIgnored(cur.getX(), cur.getY() + 1, cur.getZ()) && inBB(cur.getX(), cur.getY() + 1, cur.getZ()))) return false;
    return [Math.floor(pos.getX()) + 0.5, Math.floor(pos.getY()), Math.floor(pos.getZ()) + 0.5];
}

function isIgnored(x, y, z) {
    return IGNORED.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function isIgnored2(x, y, z) {
    return isIgnored(x, y, z) || IGNORED2.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function isSpecial(x, y, z) {
    return SPECIAL.includes(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).type.getID());
}

function inBB(x, y, z) {
    const block = World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z));
    const mcBlock = block.type.mcBlock;
    const bb = mcBlock.func_180646_a(World.getWorld(), block.pos.toMCBlock());
    const vec = new Vec3(x, y, z);
    return bb.func_72318_a(vec);
}
