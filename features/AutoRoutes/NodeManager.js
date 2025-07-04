import Vector3 from "../../utils/Vector3"
import RenderLibV2 from "../../../RenderLibV2J"
import Settings from "../../config"
import Dungeons from "../../utils/Dungeons"
import Editable from "../../utils/ObjectEditor";

import { drawLine3d } from "../../../BloomCore/utils/Utils";
import { scheduleTask, debugMessage, chat, playerCoords, getDistance3DSq } from "../../utils/utils";
import { registerSubCommand } from "../../utils/commands";

const RoomEnterEvent = Java.type("me.odinmain.events.impl.RoomEnterEvent");

class NodeManager {
    constructor() {
        try {
            this.data = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/AutoRoutesConfig.json"), (key, value) => value?.x && value?.y && value?.z ? new Vector3(value.x, value.y, value.z) : value)
            if (!this.data) {
                this.data = {};
            }
        } catch (e) {
            this.data = {}
            console.log(`Error loading: ${e}`)
        }
        this.nodeType = {};
        this.activeNodes = [];
        this.active = false;
        this.subcommands = []

        scheduleTask(1, () => {
            this._normalizeData();
            this._updateActive(Dungeons.getRoomName());
            let currentRoomName
            register("tick", () => {
                if (Dungeons.getRoomName() === currentRoomName) return
                currentRoomName = Dungeons.getRoomName()
                this._updateActive(Dungeons.getRoomName())
            });
        });

        registerSubCommand(["autoroutes", "autoroute", "ar"], args => {
            const action = args.shift()
            for (let listener of this.subcommands) {
                if (listener.args.some(arg => arg === action)) return listener.listener(args)
            }
            chat("Unknown subcommand!")
        })

        this.registerAutoRouteCommand(["createnode", "cn", "addnode", "an"], (args) => {
            this._handleCreateNode(args);
        })

        this.registerAutoRouteCommand(["removenode", "rn"], (args) => {
            this._handleRemoveNode(args);
        })

        this.registerAutoRouteCommand(["edit", "e"], (args) => {
            this._handleEdit(args);
        });

        register("renderWorld", () => {
            this._render();
        });
    }

    getNodeClass(type) {
        return this.nodeType[type];
    }

    registerNode(clazz) {
        this.nodeType[clazz.identifier] = clazz;
    }

    saveConfig() {
        try {
            FileLib.write("./config/ChatTriggers/modules/CarbonaraAddons/AutoRoutesConfig.json", JSON.stringify(this.data, null, "\t"), true)
        } catch (e) {
            chat("Error saving config!")
            console.log(e)
        }
    }

    _newNode(type, args) {
        let clazz = this.nodeType[type];
        if (!clazz) {
            debugMessage(`&7Invalid node type: &a${type}`);
            return null;
        }

        let obj = new clazz(args);

        if (!obj.validate()) {
            debugMessage(`Could not add ${obj.nodeName} node.`);
            return null;
        }

        return obj;
    }

    _normalizeData() {
        for (let key in this.data) {
            this.data[key] = this.data[key].reduce((acc, node) => {
                let clazz = this.getNodeClass(node.nodeName);
                if (!clazz) {
                    return acc;
                }

                const newNode = Object.assign(Object.create(clazz.prototype), node);
                acc.push(newNode);
                newNode.lastTriggered = 0;
                return acc;
            }, []);
        }
    }

    _render() {
        const settings = Settings();
        const slices = isNaN(settings.nodeSlices) ? 2 : settings.nodeSlices;
        for (let i = 0; i < this.activeNodes.length; i++) {
            let node = this.activeNodes[i]
            let pos = node.realPosition
            let color
            let radius = node.radius
            if (node.radius === 0) {
                radius = settings.smallNodeRadius;
            }

            if (node.triggered || Date.now() - node.lastTriggered < 1000) color = [1, 0, 0, 1]
            else if (node.radius === 0) color = [settings.smallNodeColor[0] / 255, settings.smallNodeColor[1] / 255, settings.smallNodeColor[2] / 255, settings.smallNodeColor[3] / 255];
            else color = [settings.nodeColor[0] / 255, settings.nodeColor[1] / 255, settings.nodeColor[2] / 255, settings.nodeColor[3] / 255]

            RenderLibV2.drawCyl(pos.x, pos.y + 0.01, pos.z, node.radius, radius, 0, slices, 1, 90, 45, 0, ...color, true, true);
            if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${node.nodeName}`, pos.x, pos.y + 0.01, pos.z, 16777215, true, 0.02, false)
        }
    }

    deactivateFor(ticks) {
        if (!this.active) {
            return;
        }

        this.active = false;
        scheduleTask(ticks, () => {
            this._updateActive(Dungeons.getRoomName());
        });
    }

    _updateActive(room) {
        if (!room) {
            this.active = false;
            this.activeNodes = [];
            return;
        }

        const roomNodes = this.data[room]
        if (!roomNodes || !roomNodes.length) {
            this.data[room] = [];
            this.activeNodes = this.data[room]
            this.active = true
            return debugMessage(`No routes found for room: ${room}`)
        }

        this.activeNodes = roomNodes
        for (let node of this.activeNodes) {
            node.defineTransientProperties()
        }

        debugMessage(`&aActive nodes updated for room: ${room} (${this.activeNodes.length} nodes)`);
        this.active = true;
    }

    _handleCreateNode(args) {
        if (!this.active || Dungeons.getRoomName() === "Unknown") {
            chat("You're not in a room right now");
            return;
        }

        if (!args.length || !args[0]) return chat([
            `\n§0-§r /createnode §0<§rtype§0> §0<§rargs§0>`,
            `§0-§r List of node types: look, etherwarp, useitem, walk, superboom, pearlclip, command`,
            `§0-§r For pearlclip you need to specify the clip distance as the first argument after type.`,
            `§0-§r By default, Etherwarp uses yaw pitch mode when you make it using commands, unless you use the block arg or change it using the ethercoordmode argument.`,
            `§0-§r List of args you can use:`,
            `§0-§r §rdelay §0<§fnumber§0>`,
            `§0-§r awaitsecret/await`,
            `§0-§r awaitbatspawn/awaitbat (can't be used at the same time as awaitsecret)`,
            `§0-§r stop`,
            `§0-§r center`,
            `§0-§r radius §0<§rnumber§0>`,
            `§0-§r height §0<§rnumber§0>`,
            `§0-§r yaw §0<§rnumber§0>`,
            `§0-§r pitch §0<§rnumber§0>`,
            `§0-§r chained/chain (makes the node chained)`,
            `§0-§r block (for use in etherwarp only, waits for the block you want to etherwarp to to actually be etherwarpable to)`,
            `§0-§r ethercoordmode §0<§rraytrace/yawpitch/calcyawpitch§0>`
        ].join("\n"))

        const type = args.shift()
        const ringCoords = playerCoords().camera
        const argsObject = {
            type,
            // etherCoordMode: 1,
            // etherBlock: Dungeons.rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch())?.toString() ?? "0,0,0",
            position: new Vector3(Math.floor(ringCoords[0]), ringCoords[1], Math.floor(ringCoords[2])),
            yaw: Player.getYaw().toFixed(3),
            pitch: Player.getPitch().toFixed(3),
            radius: 0.5,
            height: 0.1,
            awaitSecret: false,
            awaitBatSpawn: false,
            delay: 0,
            stop: false,
            center: false,
            pearlClipDistance: 0,
            chained: false,
            itemName: Player?.getHeldItem()?.getName()?.removeFormatting(),
            lineOfSight: false,
            prevEther: false
        }

        for (let i = 0; i < args.length; i++) {
            switch (args[i].toLowerCase()) {
                case "delay":
                    argsObject.delay = parseInt(args[i + 1])
                    break
                case "await":
                case "awaitsecret":
                    const amount = parseInt(args[i + 1]) || 1
                    argsObject.awaitSecret = amount
                    argsObject.awaitBat = false
                    break
                case "awaitbatspawn":
                case "awaitbat":
                    argsObject.awaitSecret = 0
                    argsObject.awaitBat = true
                    break
                case "stop":
                    argsObject.stop = true
                    break
                case "center":
                    argsObject.center = true
                    break
                case "radius":
                    argsObject.radius = parseFloat(args[i + 1])
                    break
                case "height":
                    argsObject.height = parseFloat(args[i + 1])
                    break
                case "yaw":
                    argsObject.yaw = parseFloat(args[i + 1])
                    break
                case "pitch":
                    argsObject.pitch = parseFloat(args[i + 1])
                    break
                case "chained":
                case "chain":
                    argsObject.chained = true
                    break
                case "block":
                    if (!args.includes("ethercoordmode")) argsObject.etherCoordMode = 2
                    argsObject.block = true
                    break
                case "prevether":
                    argsObject.prevEther = true
                    break
                case "distance":
                    argsObject.pearlClipDistance = parseFloat(args[i + 1])
                    break
            }
        }

        this.createNodeFromArgs(argsObject);
    }

    createNodeFromArgs(args) {
        try {
            const node = this._newNode(args.type, args);
            if (!node) return chat(`Failed to create node of type ${args.type}. Make sure you specified the arguments correctly.`);

            debugMessage(`&aNode created: ${JSON.stringify(node)}`);
            if (!this.data[Dungeons.getRoomName()]) this.data[Dungeons.getRoomName()] = [];
            this.data[Dungeons.getRoomName()].push(node);
            this.saveConfig();
            return node;
        } catch (e) {
            chat(`Failed to create node. Reason: ${e}`)
        }
    }

    _getClosest() {
        const playerVec = Dungeons.convertToRelative(new Vector3(Player.x, Player.y, Player.z))
        let closestNodeDistance = Number.MAX_SAFE_INTEGER;
        let closestNodeIndex = null;
        for (let i = 0; i < this.activeNodes.length; i++) {
            let node = this.activeNodes[i];
            let distance = getDistance3DSq(node.position.x, node.position.y, node.position.z, playerVec.x, playerVec.y, playerVec.z);
            if (distance < closestNodeDistance) {
                closestNodeDistance = distance
                closestNodeIndex = i
            }

        }
        return closestNodeIndex;
    }

    _handleRemoveNode(args) {
        if (!this.activeNodes.length) return chat("No nodes found in this room!")
        let deleteIndex = null
        if (!isNaN(args?.[0])) {
            deleteIndex = parseInt(args[0])
            if (!this.activeNodes[deleteIndex]) return chat("Index not found!")
        } else {
            deleteIndex = this._getClosest();
        }
        if (deleteIndex !== null) {
            const node = this.data[Dungeons.getRoomName()].splice(deleteIndex, 1)[0]
            this.saveConfig()
            chat(`Deleted: ${JSON.stringify(node)}`)
        }
    }

    _handleEdit(args) {
        let editIndex = null;
        if (!isNaN(args?.[0])) {
            editIndex = parseInt(args[0]);
            if (!this.activeNodes[editIndex]) return chat("Index not found!");
        } else {
            editIndex = this._getClosest();
            if (editIndex === null) return chat("No nodes found in this room!");
        }

        this.activeNodes[editIndex].openEditor();
    }

    registerAutoRouteCommand(args, listener, tabCompletions) {
        if (!Array.isArray(args)) args = [args]
        const subCommand = { args, listener }
        if (tabCompletions) subCommand.tabCompletions = tabCompletions
        this.subcommands.push(subCommand)
    }
}

export default new NodeManager();
