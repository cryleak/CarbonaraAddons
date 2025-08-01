import Settings from "../config"
import Vector3 from "../utils/Vector3";
import ServerTeleport from "../events/ServerTeleport";
import MouseEvent from "../events/MouseEvent";
import { PostPacketReceive, PostPacketSend, PostUseItem, UpdateWalkingPlayer } from "../events/JavaEvents"

import { getEtherwarpBlock } from "../../BloomCore/utils/Utils"
import { isWithinTolerence, rotate, sendAirClick, setPlayerPosition, setVelocity } from "../utils/utils";
import { getTeleportInfo } from "../utils/TeleportItem";
import Dungeons from "../utils/Dungeons";
import Module, { modules, registerModule } from "./PhoenixModule";
import Tick from "../events/Tick";
import { registerSubCommand } from "../utils/commands";

const Vec3 = Java.type("net.minecraft.util.Vec3");
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

const NetHandlerPLayClient = Java.type("net.minecraft.client.network.NetHandlerPlayClient");
const doneLoadingTerrainField = NetHandlerPLayClient.class.getDeclaredField("field_147309_h")
doneLoadingTerrainField.setAccessible(true)

registerModule(class Teleport extends Module {
    constructor(phoenix) {
        super("Teleport", phoenix)
        this._tryLoadConfig();

        register("packetReceived", (packet, event) => {
            if (!this.isToggled()) return
            const enumFlags = Object.values(packet.func_179834_f())
            if (!enumFlags.includes(S08PacketPlayerPosLook.EnumFlags.X)) return
            cancel(event)
            const [x, y, z, yaw, pitch] = [packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e(), packet.func_148931_f(), packet.func_148930_g()]
            this._phoenix.customPayload("carbonara-zpew-acknowledge-force-teleport", { x, y, z })
            if (ServerTeleport.trigger({ packet, x, y, z, yaw, pitch, enumFlags }).cancelled) return


            setVelocity(0, 0, 0)
            setPlayerPosition(x, y, z, false)
            if (!enumFlags.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) rotate(yaw, pitch)

            PostPacketReceive.trigger(packet) // Simulate this for stuff to work properly
            Client.getMinecraft().func_152343_a(() => {
                const netHandler = Client.getConnection()
                const doneLoadingTerrain = doneLoadingTerrainField.get(netHandler)
                if (!doneLoadingTerrain) { // Recreate S08 handling from MC's source
                    setPlayerPosition(x, y, z, true)
                    doneLoadingTerrainField.set(netHandler, true)
                    Client.getMinecraft().func_147108_a(null)
                }
            })
        }).setFilteredClass(S08PacketPlayerPosLook).setPriority(Priority.HIGHEST)

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
            if (Settings().listenForC08) return
            const objectMouseOver = Client.getMinecraft().field_71476_x
            const type = objectMouseOver.field_72313_a.toString()
            if (type === "ENTITY") return
            else if (type === "BLOCK") {
                const position = new Vector3(objectMouseOver.func_178782_a())
                const blockID = World.getBlockAt(...position.getPosition()).type.getID()
                if (this.disallowedBlockIDS.includes(blockID)) return
            }
            this.doZeroPing()
        })

        PostPacketSend.register(packet => {
            if (!(packet instanceof C08PacketPlayerBlockPlacement) || packet.func_149568_f() !== 255 || !Settings().listenForC08) return
            this.doZeroPing()
        })

        MouseEvent.register(event => {
            if (!Settings().zpewEnabled) return;

            this._handleMouseEvent(event);
        }, 99)

        register("packetSent", packet => {
            this._handleClientPlayerPacket(packet);
        }).setFilteredClass(C03PacketPlayer);

        register("packetSent", packet => {
            this._handleClientEntityAction(packet);
        }).setFilteredClass(C0BPacketEntityAction);

        register("packetReceived", packet => {
            const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
            if (["[BOSS] Maxor:", "[BOSS] Storm:", "[BOSS] Goldor:", "[BOSS] Necron:"].some(bossname => message.startsWith(bossname))) {
                this._phoenix.customPayload("carbonara-stop-responding", {});
            } else if (message.startsWith("Sending to server")) {
                this._phoenix.customPayload("carbonara-start-responding", {});
            }
        }).setFilteredClass(S02PacketChat);

        registerSubCommand("startstuff", () => {
            this._phoenix.customPayload("carbonara-start-responding", {});
        });
    }

    isSynced() {
        return true
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
        if (Dungeons.isIn7Boss() || !Settings().zpewEnabled || !this.isToggled()) return
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

        this._phoenix.customPayload("carbonara-zpew-teleport-prediction", { x, y, z, yaw: Number(yaw.toFixed(5)), pitch: Number(pitch.toFixed(5)), playerX: Number(Player.x.toFixed(3)), playerY: Number(Player.y.toFixed(3)), playerZ: Number(Player.z.toFixed(3)), })

        const PlayerUpdateListener = UpdateWalkingPlayer.Pre.register(event => {
            event.cancelled = true
            event.breakChain = true
        }, 2147483647)
        const exec = () => {
            PlayerUpdateListener.unregister()
            setVelocity(0, 0, 0)
            setPlayerPosition(x, y - (Settings().zpewOffset && info.ether ? 0.05 : 0), z, true)
        }
        if (Settings().zpewDelay) Tick.Pre.scheduleTask(Settings().zpewDelay - 1, exec)
        else exec()

        this.updateLastTPed();
        this.updatePosition = true;
    }

    _defaultConfig() {
        return {
            blink: false
        }
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
