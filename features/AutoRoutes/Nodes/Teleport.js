import Vector3 from "../../../utils/Vector3"
import ServerTeleport from "../../../events/ServerTeleport";
import manager from "../NodeManager";
import OnUpdateWalkingPlayerPre from "../../../events/OnUpdateWalkingPlayerPre"
import Dungeons from "../../../utils/Dungeons"
import bind from "../../../utils/bind"
import tpManager from "../TeleportManager";


import { setPlayerPosition, setVelocity, debugMessage, scheduleTask, swapFromName, isWithinTolerence, sendAirClick, chat, removeCameraInterpolation, setSneaking, itemSwapSuccess, clampYaw, releaseMovementKeys } from "../../../utils/utils"
import { Node } from "../Node"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");

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
                const { x, y, z } = this.nodes[this.length - 1].position;
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
