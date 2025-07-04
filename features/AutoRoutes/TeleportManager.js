import Vector3 from "../../utils/Vector3"
import ServerTeleport from "../../events/ServerTeleport";
import manager from "./NodeManager";
import OnUpdateWalkingPlayerPre from "../../events/OnUpdateWalkingPlayerPre"
import Rotations from "../../utils/Rotations"
import execer from "./NodeExecutor"

import { setPlayerPosition, setVelocity, debugMessage, scheduleTask, swapFromName, isWithinTolerence, sendAirClick, chat, removeCameraInterpolation, setSneaking, itemSwapSuccess, clampYaw, releaseMovementKeys } from "../../utils/utils"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");


class TeleportManager {
    constructor() {
        this.lastTPed = 0;
        this.noRotateFor = 900;

        this.yaw = Player.getYaw();
        this.pitch = Player.getPitch();
        this.lastBlock = null;
        this.counter = 0;

        this.recentlyPushedC06s = [];

        ServerTeleport.register((event) => {
            if (!this.recentlyPushedC06s.length) return
            const packet = event.data.packet;

            const newPitch = packet.func_148930_g();
            const newYaw = packet.func_148931_f();
            const newX = packet.func_148932_c();
            const newY = packet.func_148928_d();
            const newZ = packet.func_148933_e();

            const compare = (p) => {
                const { x, y, z, yaw, pitch } = p;
                const lastPresetPacketComparison = {
                    x: x == newX,
                    y: y == newY,
                    z: z == newZ,
                    yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
                    pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0
                };
                const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a);
                return wasPredictionCorrect
            };

            let found = null;
            for (let i = this.recentlyPushedC06s.length - 1; i >= 0; i--) {
                if (compare(this.recentlyPushedC06s[i])) {
                    found = i;
                    break;
                }
            }

            if (found === null) {
                manager.deactivateFor(40);
                while (this.recentlyPushedC06s.length) this.recentlyPushedC06s.pop()
                 debugMessage(`§4Teleport failed: ${newX}, ${newY}, ${newZ} | ${newYaw}, ${newPitch}`);
            } else {
                this.recentlyPushedC06s.splice(found, 1);
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
        if (Player.getHeldItem().getName() !== itemName) {
            result = swapFromName(itemName)
            if (result === itemSwapSuccess.FAIL) return
        }

        const shouldWait = result !== "ALREADY_HOLDING" || sneaking !== Player.isSneaking()
        setSneaking(sneaking)
        setVelocity(0, 0, 0);

        this.counter++;
        if (Date.now() - this.lastTPed >= this.noRotateFor) {
            const exec = () => {
                Rotations.rotate(yaw, pitch, () => {
                    setVelocity(0, 0, 0);
                    sendAirClick();

                    // response to the airClick
                    Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
                    this.recentlyPushedC06s.push({ x: toBlock.x, y: toBlock.y, z: toBlock.z, yaw, pitch });
                    setPlayerPosition(toBlock.x, toBlock.y, toBlock.z)

                    this.lastTPed = Date.now();
                    execer._updateCoords(toBlock);
                    onResult(toBlock);
                });
            };

            if (!isWithinTolerence(clampYaw(Player.yaw), yaw) || !isWithinTolerence(clampYaw(Player.pitch), pitch)) {
                Rotations.rotate(yaw, pitch, () => {
                    setVelocity(0, 0, 0);
                    exec();
                });
            } else {
                exec();
            }
            return;
        }

        if (!this.lastBlock || shouldWait) {
            const exec = () => {
                Rotations.rotate(yaw, pitch, () => {
                    setVelocity(0, 0, 0);
                    sendAirClick();
                    this.lastBlock = toBlock;
                    this.lastTPed = Date.now();

                    execer._updateCoords(toBlock);
                    onResult(toBlock);
                }, true);
            }
            if (shouldWait) this.sync(yaw, pitch, false);
            exec();
            return;
        }

        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        this.recentlyPushedC06s.push({ x: this.lastBlock.x, y: this.lastBlock.y, z: this.lastBlock.z, yaw, pitch });
        setPlayerPosition(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z)

        sendAirClick();

        this.lastTPed = Date.now();
        this.lastBlock = toBlock;
        execer._updateCoords(toBlock);

        onResult(toBlock);
    }

    sync(yaw, pitch, final) {
        if (final) {
            if (this.counter) {
                debugMessage(`Executed a chilly route with: ${this.counter} teleports`)
                this.counter = 0;
            }
            setSneaking(false)
        }
        if (!this.lastBlock) {
            return;
        }

        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        this.recentlyPushedC06s.push({ x: this.lastBlock.x, y: this.lastBlock.y, z: this.lastBlock.z, yaw, pitch });
        setPlayerPosition(this.lastBlock.x, this.lastBlock.y, this.lastBlock.z)

        if (this.final) {
            this.lastTPed = 0;
        }

        this.lastBlock = null;
    }

    measureTeleport(fromEther = false, yaw, pitch, sneaking, itemName, onResult) {
        if (!this.isTeleportItem()) {
            return;
        }

        let packetsReceived = 0
        const doTp = () => {
            let result = itemSwapSuccess.ALREADY_HOLDING
            if (Player.getHeldItem().getName() !== itemName) {
                result = swapFromName(itemName)
                ChatLib.chat(result)
                if (result === itemSwapSuccess.FAIL) {
                    onResult(null)
                    return
                }
            }
            setSneaking(sneaking)
            const playerUpdateListener = OnUpdateWalkingPlayerPre.register((event) => {
                event.cancelled = true
                event.break = true
                Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, false))
                playerUpdateListener.unregister()
                sendAirClick();

                let awaiting = true
                const listener = ServerTeleport.register((event) => {
                    if (packetsReceived-- !== 0) return
                    awaiting = false
                    const packet = event.data.packet;
                    event.break = true
                    listener.unregister()

                    const block = new Vector3(Math.floor(packet.func_148932_c()), packet.func_148928_d(), Math.floor(packet.func_148933_e()));
                    onResult(block);
                }, 10001);
                scheduleTask(100, () => {
                    if (!awaiting) return
                    onResult(null)
                    listener.unregister()
                    awaiting = false
                });
            })
        }

        if (fromEther) {
            const name = "Aspect of the Void"
            let result = "ALREADY_HOLDING"
            if (Player.getHeldItem().getName() !== name) {
                result = swapFromName(name)
                if (result === itemSwapSuccess.FAIL) {
                    onResult(null)
                    return
                }
            }

            setSneaking(true)

            Rotations.rotate(0, 90, () => {
                sendAirClick();
                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Math.floor(Player.x) + 0.5, Math.floor(Player.y) + 0.05, Math.floor(Player.z) + 0.5, 0, 90, Player.asPlayerMP().isOnGround()));
                this.recentlyPushedC06s.push({ x: Math.floor(Player.x) + 0.5, y: Math.floor(Player.y) + 0.05, z: Math.floor(Player.z) + 0.5, yaw: 0, pitch: 90 });
                setPlayerPosition(Math.floor(Player.x) + 0.5, Math.floor(Player.y) + 0.05, Math.floor(Player.z) + 0.5)

                packetsReceived++
                doTp()
            });
        } else {
            doTp();
        }

        this.lastTPed = Date.now();
    }

    isTeleportItem(item = Player.getHeldItem()) {
        const sbId = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.id;
        if (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) {
            return "aotv";
        } else if (["NECRON_BLADE", "HYPERION", "VALKYRIE", "ASTRAEA", "SCYLLA"].includes(sbId)) {
            if (!["IMPLOSION_SCROLL", "WITHER_SHIELD_SCROLL", "SHADOW_WARP_SCROLL"].every(value => item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll?.includes(value))) {
                return false;
            }

            return "hype";
        }

        return false;
    }
}

const tpManager = new TeleportManager();
export default tpManager
