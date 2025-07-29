import Vector3 from "../../../utils/Vector3"
import RenderLibV2 from "../../../../RenderLibV2J"
import Settings from "../../../config"
import ServerTeleport from "../../../events/ServerTeleport";
import manager from "../NodeManager";
import Dungeons from "../../../utils/Dungeons"
import bind from "../../../utils/bind"
import tpManager from "../TeleportManager";
import SecretAuraClick from "../../../events/SecretAuraClick"

import { setPlayerPosition, setVelocity, debugMessage, sendAirClick, clampYaw, releaseMovementKeys } from "../../../utils/utils"
import { aotvFinder, etherwarpFinder, hypeFinder } from "../../../utils/TeleportItem"
import { Node } from "../Node"
import { UpdateWalkingPlayer } from "../../../events/JavaEvents";
import MouseEvent from "../../../events/MouseEvent";

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

class TeleportNode extends Node {

    constructor(identifier, args) {
        super(identifier, args);

        this.previousEther = args.prevEther;
        this.toBlock = null;
        this.chained = args.chained;
    }

    customInNodeCheck() {
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
            tpManager.measureTeleport(this.previousEther, this.realYaw, this.pitch, this.sneaking, this.itemFinder, (pos) => {
                if (pos === null) return onResult(null)
                this.toBlock = manager.currentRoom.type === "dungeons" ? Dungeons.convertToRelative(pos) : pos;
                manager.saveConfig();
                onResult(pos);
            });
        } else {
            const toBlock = manager.currentRoom.type === "dungeons" ? Dungeons.convertFromRelative(this.toBlock) : this.toBlock.copy();
            tpManager.teleport(toBlock.add([0.5, 0, 0.5]), this.realYaw, this.pitch, this.sneaking, this.itemFinder, onResult);
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
            registerListener: (obj, _, next) => {
                obj.previousEther = next;
            },
            updator: (setter, obj) => {
                setter("from Ether", obj.previousEther);
            }
        });

        values.push({
            type: "addSwitch",
            configName: "chained",
            registerListener: (obj, _, next) => {
                obj.chained = next;
            },
            updator: (setter, obj) => {
                setter("chained", obj.chained);
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

    _preArgumentTrigger(_) {
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
    static renderItem = new Item(277).itemStack;
    static sneaking = true;

    static identifier = "etherwarp"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = true
        this.defineTransientProperties(manager.currentRoom)
    }

    defineTransientProperties(room) {
        super.defineTransientProperties(room)
        Object.defineProperties(this, {
            itemFinder: {
                value: etherwarpFinder(4),
                enumerable: false,
                writable: true,
                configurable: true
            },
        })
    }
})

manager.registerNode(class AOTVNode extends TeleportNode {
    static renderItem = new Item(277).itemStack;

    static identifier = "aotv"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = false
        this.defineTransientProperties(manager.currentRoom)
    }

    defineTransientProperties(room) {
        super.defineTransientProperties(room)
        Object.defineProperties(this, {
            itemFinder: {
                value: aotvFinder(4),
                enumerable: false,
                writable: true,
                configurable: true
            },
        })
    }
})

manager.registerNode(class HyperionNode extends TeleportNode {
    static renderItem = new Item(267).itemStack;

    static identifier = "hype"
    static priority = 0
    constructor(args) {
        super(this.constructor.identifier, args)

        this.sneaking = false
        this.defineTransientProperties(manager.currentRoom)
    }

    defineTransientProperties(room) {
        super.defineTransientProperties(room)
        Object.defineProperties(this, {
            itemFinder: {
                value: hypeFinder(),
                enumerable: false,
                writable: true,
                configurable: true
            },
        })
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
            register("renderWorld", () => {
                this._render();
            }),
            register("renderOverlay", () => {
                this._renderOverlay();
            }),
            UpdateWalkingPlayer.Pre.register((event) => {
                // Client.sendPacket(replacementPacket);
                const { x, y, z } = this.nodes[this.nodes.length - 1].position;
                setPlayerPosition(x, y, z, true);
                setVelocity(0, 0, 0);
                event.cancelled = true;
            }),
            register("packetSent", (_, event) => {
                if (!this.awaitingTP) {
                    cancel(event);
                }

                this.awaitingTP = false;
            }).setFilteredClass(C08PacketPlayerBlockPlacement),
            MouseEvent.register(event => {
                const button = event.data.button
                const state = event.data.state
                if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

                const item = Player.getHeldItem()
                let type = tpManager.isTeleportItem(item)
                if (!type) {
                    return;
                }

                if (this.inTP) {
                    event.cancelled = true
                    event.breakChain = true
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
                event.cancelled = true
                event.breakChain = true
            }, 2147483646),
            ServerTeleport.register((event) => {
                debugMessage("Server Forced your rotation. This is really bad.");
                this.end(false);
                event.breakChain = true;
            }, 1349239233),
            SecretAuraClick.Post.register((_) => {
                this.nodes[this.nodes.length - 1].awaitSecret++;
            })
        ).unregister();

        manager.registerAutoRouteCommand(["starttps", "stp"], _ => {
            this.start();
        });

        manager.registerAutoRouteCommand(["endtps", "etp"], _ => {
            this.end();
        });
    }

    start() {
        this.nodes = [this._nodeFromVec()];
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

            this.nodes.push(this._nodeFromVec(type, new Vector3(coords)));

            this.lastTP = true;
            this.lastPacket = new Vector3(coords);

            setPlayerPosition(coords[0], coords[1], coords[2], true);
            event.breakChain = true;
        }, 1349239234);
    }

    _renderOverlay() {
        Renderer.scale(1);
        Renderer.drawString("Teleport Recorder", Renderer.screen.getWidth() / 4, Renderer.screen.getHeight() / 2);
        Renderer.drawString(`Location: &a${manager.currentRoom.name}`, Renderer.screen.getWidth() / 4, Renderer.screen.getHeight() / 2 + 10);
        Renderer.drawString(`Count: &a${this.nodes.length - 1}`, Renderer.screen.getWidth() / 4, Renderer.screen.getHeight() / 2 + 20);
    }

    _render() {
        const settings = Settings();
        for (let i = 0; i < this.nodes.length - 1; i++) {
            let curr = this.nodes[i];
            let next = this.nodes[i + 1];
            let color = [settings.nodeColor[0] / 255, settings.nodeColor[1] / 255, settings.nodeColor[2] / 255, settings.nodeColor[3] / 255]
            RenderLibV2.drawLine(curr.position.x, curr.position.y + 0.01, curr.position.z, next.position.x, next.position.y, next.position.z, ...color, false, settings.lineWidth)
        }
    }

    _nodeFromVec(type, coords = new Vector3(Player)) {
        return {
            type,
            position: new Vector3(coords),
            yaw: this.lastYaw,
            pitch: this.lastPitch,
            awaitSecret: 0,
            awaitBatSpawn: false,
            delay: 0,
            stop: false,
            center: false,
            pearlClipDistance: 0,
            chained: false,
            itemName: Player?.getHeldItem()?.getName()?.removeFormatting(),
            block: false,
            prevEther: type === "etherwarp",
        };
    }

    flushNodes() {
        for (let i = 0; i < this.nodes.length - 1; i++) {
            let curr = this.nodes[i];
            let next = this.nodes[i + 1];
            curr.type = next.type;
            curr.position.floor2D();
            curr.yaw = next.yaw;
            curr.pitch = next.pitch;
            curr.radius = 0.0;
            curr.height = 0.0;
            let afterAdd = next.position.copy().floor2D();
            let toBlock = Dungeons.convertToRelative(afterAdd);
            // curr.chained = i !== 1;
            let node = manager.createNodeFromArgs(curr);
            node.toBlock = toBlock;
        }

        this.nodes = [];
        /*
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
        */
    }
}

export const Teleport = new TeleportRecorder();
