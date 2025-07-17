import Vector3 from "../../../utils/Vector3"
import ServerTeleport from "../../../events/ServerTeleport";
import manager from "../NodeManager";
import Dungeons from "../../../utils/Dungeons"
import bind from "../../../utils/bind"
import tpManager from "../TeleportManager";
import SecretAuraClick from "../../../events/SecretAuraClick"

import { setPlayerPosition, setVelocity, debugMessage, scheduleTask, swapFromName, isWithinTolerence, sendAirClick, chat, setSneaking, itemSwapSuccess, clampYaw, releaseMovementKeys } from "../../../utils/utils"
import { Node } from "../Node"
import { UpdateWalkingPlayer } from "../../../events/JavaEvents";

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

class TeleportNode extends Node {

    constructor(identifier, args) {
        super(identifier, args);

        this.previousEther = args.prevEther;
        this.toBlock = null;
        this.chained = args.chained;
    }

    customInNodeCheck(node) {
        return (Player.x === this.realPosition?.x && Player.y === this.realPosition?.y && Player.z === this.realPosition?.z);
    }

    _trigger(execer) {
        const onResult = (pos) => {
            const result = execer.execute(this, (node) => {
                return (pos?.x === node?.realPosition?.x && pos?.y - node?.realPosition?.y <= 0.06 && pos?.y - node?.realPosition?.y >= 0 && pos?.z === node?.realPosition?.z);
            });

            if (result) {
                // Couldn't find next
                tpManager.sync(this.realYaw, this.pitch, true);
            }
        };

        if (!this.toBlock) {
            debugMessage("Measuring");
            tpManager.measureTeleport(this.previousEther, this.realYaw, this.pitch, this.sneaking, this.itemName, (pos) => {
                this.toBlock = manager.currentRoom.type === "dungeons" ? Dungeons.convertToRelative(pos) : pos;
                manager.saveConfig();
                onResult(pos);
            });
        } else {
            const toBlock = manager.currentRoom.type === "dungeons" ? Dungeons.convertFromRelative(this.toBlock) : this.toBlock.copy();
            tpManager.teleport(toBlock.add([0.5, 0, 0.5]), this.realYaw, this.pitch, this.sneaking, this.itemName, onResult);
        }
    }

    createConfigValues() {
        // Make sure that we sete toBlock to null every time we change yaw or pitch
        const values = super.createConfigValues();
        values.forEach(v => {
            if (v.configName !== "yaw" && v.configName !== "pitch") return;

            const rl = v.registerListener;
            v.registerListener = (obj, prev, next) => {
                rl(obj, prev, next);
            };
        });

        values.push({
            type: "addSwitch",
            configName: "from Ether",
            registerListener: (obj, prev, next) => {
                obj.previousEther = next;
            },
            updator: (config, obj) => {
                config.settings.getConfig().setConfigValue("Object Editor", "from Ether", obj.previousEther);
            }
        });

        values.push({
            type: "addSwitch",
            configName: "chained",
            registerListener: (obj, prev, next) => {
                obj.chained = next;
            },
            updator: (config, obj) => {
                config.settings.getConfig().setConfigValue("Object Editor", "chained", obj.chained);
            }
        });

        values.push({
            type: "addButton",
            configName: "recalculate Teleport",
            onClick(obj) {
                debugMessage("Recalculating teleport position...");
                obj.toBlock = null;
            }
        });

        return values;
    }

    _preArgumentTrigger(execer) {
        releaseMovementKeys();
        setVelocity(0, 0, 0);
        if (this.awaitSecret || this.awaitBat) {
            tpManager.sync(clampYaw(this.realYaw), this.pitch, false);
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
        this.awaitingTP = false;
        this.nodes = [];
        this.lastYaw = Player.yaw;
        this.lastPitch = Player.pitch;
        this.lastPacket = null;

        this.trigger = bind(
            UpdateWalkingPlayer.Pre.register((event) => {
                // Client.sendPacket(replacementPacket);
                const { x, y, z } = this.nodes[this.nodes.length - 1].position;
                setPlayerPosition(x, y, z, true);
                setVelocity(0, 0, 0);
                event.cancelled = true;
            }),
            register("packetSent", (packet, event) => {
                if (!this.awaitingTP) {
                    cancel(event);
                }

                this.awaitingTP = false;
            }).setFilteredClass(C08PacketPlayerBlockPlacement),
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

                this.awaitingTP = true;
                this.lastYaw = Player.yaw;
                this.lastPitch = Player.pitch;

                Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, Player.pitch, Player.getPlayer().field_70122_E));
                Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, Player.pitch, Player.getPlayer().field_70122_E));
                sendAirClick();
                this.tped(type);
            }),
            ServerTeleport.register((event) => {
                debugMessage("Server Forced your rotation. This is really bad.");
                this.end(false);
                event.breakChain = true;
            }, 1349239233),
            SecretAuraClick.Post.register((data) => {
                this.nodes[this.nodes.length - 1].awaitSecret++;
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
        this.nodes = [{ position: new Vector3(Player) }];
        this.trigger.register();
        this.lastPacket = new Vector3(Player);
        this.lastYaw = Player.yaw;
        this.lastPitch = Player.pitch;
        manager.active = false;
    }

    end(withFlush = true) {
        this.trigger.unregister();
        manager._updateActive(Dungeons.getRoomName());
        if (withFlush) {
            this.flushNodes();
        } else {
            this.nodes = [];
        }
    }

    tped(type) {
        this.inTP = false
        const serverTeleportTrigger = ServerTeleport.register((event) => {
            serverTeleportTrigger.unregister();

            if (!this.trigger.registered) {
                return;
            }

            const data = event.data

            const coords = [data.x, data.y, data.z];

            this.nodes.push({
                type,
                position: new Vector3(coords),
                yaw: this.lastYaw,
                pitch: this.lastPitch,
                radius: 0.0,
                height: 0.0,
                awaitSecret: 0,
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
            this.lastPacket = new Vector3(coords);

            setPlayerPosition(coords[0], coords[1], coords[2], true);
            event.breakChain = true;
        }, 1349239234);
    }

    flushNodes() {
        for (let i = this.nodes.length - 1; i > 0; i--) {
            let curr = this.nodes[i];
            let old = this.nodes[i - 1];
            let afterAdd = curr.position.copy().floor2D();
            let toBlock = Dungeons.convertToRelative(afterAdd);
            // curr.chained = i !== 1;
            curr.position = old.position.copy().floor2D();
            curr.awaitSecret = old.awaitSecret;
            old.awaitSecret = 0;
            let node = manager.createNodeFromArgs(curr);
            node.toBlock = toBlock;
        }
        this.nodes = [];
    }
}

const Teleport = new TeleportRecorder();
