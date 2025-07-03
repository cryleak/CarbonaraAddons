import Vector3 from "../../../utils/Vector3"
import ServerTeleport from "../../../events/ServerTeleport";
import manager from "../NodeManager";
import OnUpdateWalkingPlayerPre from "../../../events/OnUpdateWalkingPlayerPre"
import Rotations from "../../../utils/Rotations"
import Dungeons from "../../../utils/Dungeons"
import execer from "../NodeExecutor"
import bind from "../../../utils/bind"

import { setPlayerPosition, setVelocity, debugMessage, scheduleTask, swapFromName, isWithinTolerence, sendAirClick, chat, removeCameraInterpolation, setSneaking, itemSwapSuccess, clampYaw, releaseMovementKeys, setTimer } from "../../../utils/utils"
import { Node } from "../Node"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C07PacketPlayerDigging = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging")
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

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
                manager.deactivateFor(40);
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
        if (Player.getHeldItem().getName() !== itemName) {
            result = swapFromName(itemName)
            if (result === itemSwapSuccess.FAIL) return
        }

        const shouldWait = result !== "ALREADY_HOLDING" || sneaking !== Player.isSneaking()
        setSneaking(sneaking)

        this.counter++;
        if (Date.now() - this.lastTPed >= this.noRotateFor) {
            const exec = () => {
                Rotations.rotate(yaw, pitch, () => {
                    sendAirClick();

                    // response to the airClick
                    Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(toBlock.x, toBlock.y, toBlock.z, yaw, pitch, Player.asPlayerMP().isOnGround()));
                    this.recentlyPushedC06s.push({ x: toBlock.x, y: toBlock.y, z: toBlock.z, yaw, pitch });
                    setPlayerPosition(toBlock.x, toBlock.y, toBlock.z)

                    this.lastTPed = Date.now();
                    execer._updateCoords(toBlock);
                    if (shouldWait) onResult(null)
                    else onResult(toBlock);
                });
            };

            if (!isWithinTolerence(clampYaw(Player.yaw), yaw) || !isWithinTolerence(clampYaw(Player.pitch), pitch)) {
                Rotations.rotate(yaw, pitch, () => {
                    exec();
                });
            } else {
                exec();
            }
            return;
        }

        if (!this.lastBlock || shouldWait) {
            if (shouldWait) this.sync(yaw, pitch, false)
            Rotations.rotate(yaw, pitch, () => {
                sendAirClick();
                this.lastBlock = toBlock;
                this.lastTPed = Date.now();

                // In case something fails just update everything the next tick.
                scheduleTask(5, () => {
                    this.sync(yaw, pitch, true);
                });

                execer._updateCoords(toBlock);
                if (shouldWait) onResult(null)
                else onResult(toBlock);
            });
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

class TeleportNode extends Node {

    constructor(identifier, args) {
        super(identifier, args);

        this.previousEther = args.prevEther;
        this.toBlock = null;
    }

    _trigger(execer) {
        const onResult = (pos) => {
            const result = execer.execute(this, (node) => {
                return (pos?.x === node?.realPosition?.x && pos?.y - node?.realPosition?.y <= 0.06 && pos?.y - node?.realPosition?.y >= 0 && pos?.z === node?.realPosition?.z)
            });

            if (result) {
                tpManager.sync(this.realYaw, this.pitch, true);
            }
        };

        if (!this.toBlock) {
            tpManager.measureTeleport(this.previousEther, this.realYaw, this.pitch, this.sneaking, this.itemName, (pos) => {
                this.toBlock = Dungeons.convertToRelative(pos);
                manager.saveConfig();
                onResult(pos);
            });
        } else {
            tpManager.teleport(Dungeons.convertFromRelative(this.toBlock).add([0.5, 0, 0.5]), this.realYaw, this.pitch, this.sneaking, this.itemName, onResult);
        }
    }

    _preArgumentTrigger(execer) {
        releaseMovementKeys();
        setVelocity(0, null, 0);
        if (this.awaitSecret || this.awaitBat) {
            tpManager.sync(clampYaw(this.realYaw), clampYaw(this.pitch), false);
            super._handleRotate();
        }
        return true;
    }

    _handleRotate() {
        return
    }
}

manager.registerNode(class EtherwarpNode extends TeleportNode {
    static identifier = "etherwarp"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = true
        this.itemName = "Aspect of the Void"
    }
})

manager.registerNode(class AOTVNode extends TeleportNode {
    static identifier = "aotv"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = false
        this.itemName = "Aspect of the Void"
    }
})

manager.registerNode(class HyperionNode extends TeleportNode {
    static identifier = "hype"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = false
        this.itemName = "Astraea"
    }
})

class TeleportRecorder {
    constructor() {
        this.inTP = false;
        this.nodes = [];
        this.lastYaw = Player.yaw;
        this.lastPitch = Player.pitch;

        this.trigger = bind(
            OnUpdateWalkingPlayerPre.register((event) => {
                replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, Player.pitch, event.data.packet.func_149465_i());
                this.lastYaw = Player.yaw;
                this.lastPitch = Player.pitch;
                Client.sendPacket(replacementPacket);
                const {x, y, z} = this.nodes[this.length - 1].position;
                setPlayerPosition(x, y, z);
                event.cancelled = true;
            }),
            register("hitBlock", (block, event) => cancel(event)),
            register(net.minecraftforge.client.event.MouseEvent, (event) => { // Trigger await secret on left click
                const button = event.button
                const state = event.buttonstate
                if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

                const item = Player.getHeldItem()
                let type = tpManager.isTeleportItem(item)
                if (!type) {
                    return;
                }

                if (this.inTP) {
                    cancel(event);
                    return;
                }

                if (type === "aotv" && Player.isSneaking()) {
                    type = "etherwarp";
                }

                sendAirClick();
                this.tped(type);
            })
        ).unregister();

        manager.registerAutoRouteCommand(["starttps", "stp"], args => {
            this.start();
        });

        manager.registerAutoRouteCommand(["endtps", "etp"], args => {
            this.end();
        });
    }

    start() {
        this.trigger.register();
        this.nodes = [{ position: new Vector3(Math.floor(Player.x), Player.y, Math.floor(Player.y)) }];
        manager.active = false;
    }

    end() {
        this.trigger.unregister();
        manager._updateActive(Dungeons.getRoomName());
        this.flushNodes();
    }

    tped(type) {
        const serverTeleportTrigger = ServerTeleport.register((event) => {
            serverTeleportTrigger.unregister();

            if (!this.trigger.registered) {
                return;
            }

            const packet = event.data.packet;

            const coords = [Math.floor(packet.func_148932_c()), packet.func_148928_d(), Math.floor(packet.func_148933_e())];

            this.nodes.push({
                type,
                position: new Vector3(coords),
                yaw: this.lastYaw,
                pitch: this.lastPitch,
                radius: 0.0,
                height: 0.0,
                awaitSecret: false,
                awaitBatSpawn: false,
                delay: 0,
                stop: false,
                center: false,
                pearlClipDistance: 0,
                chained: false,
                itemName: Player?.getHeldItem()?.getName()?.removeFormatting(),
                block: false,
                prevEther: false
            });

            this.lastTP = true;
            Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(coords[0], coords[1], coords[2], Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));

            setPlayerPosition(coords[0], coords[1], coords[2]);

            event.cancelled = true;
            event.break = true;
        }, 1349239234);
    }

    flushNodes() {
        for (let i = this.nodes.length - 1; i > 0; i--) {
            let curr = this.nodes[i];
            let old = this.nodes[i - 1];
            let toBlock = Dungeons.convertToRelative(curr.position);
            curr.position = old.position;
            let node = manager.createNodeFromArgs(curr);
            node.toBlock = toBlock;
        }
        this.nodes = [];
    }
}

const Teleport = new TeleportRecorder();
