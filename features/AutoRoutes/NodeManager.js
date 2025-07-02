import PogObject from "../../PogData"
import { scheduleTask, debugMessage, chat } from "../../utils/utils"
import Dungeons from "../../utils/Dungeons"

const RoomEnterEvent = Java.type("me.odinmain.events.impl.RoomEnterEvent");

class NodeManager {
    constructor() {
        this.data = new PogObject("carbonaraaddons", { nodes: {} }, "RoutesConfig.json")

        this._updateActive(Dungeons.getCurrentRoom());
        register(RoomEnterEvent, (room) => this._updateActive(room));
        register("command", (...args) => { // this is terrible - I agree.
            this._handleCommand(...args);
        }).setName("createnode").setAliases("cn")
    }

    getNodeClass(type) {
        return this.nodeType[type];
    }

    _registerNode(clazz) {
        this.nodeType[clazz.identifier] = clazz;
    }

    _newNode(type, args) {
        let clazz = nodeType[type];
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

    _updateActive(room) {
        const roomNodes = data.nodes[room]
        if (!roomNodes || !roomNodes.length) {
            return debugMessage("No routes found for this room!")
        }

        this.activeNodes = roomNodes
        this.activeNodesCoords = []
        for (let i = 0; i < activeNodes.length; i++) {
            let nodeToPush = {}
            let node = activeNodes[i]
            node.type = node.type?.toLowerCase()
            try {
                let [x, y, z] = Dungeons.convertFromRelative(node.position)
                x += 0.5
                y += node.yOffset
                z += 0.5
                nodeToPush.position = [x, y, z]
                nodeToPush.triggered = false
                nodeToPush.lastTriggered = 0
                if (node.type === "etherwarp") {
                    if (node.etherCoordMode === 0 || node.etherCoordMode === 2) nodeToPush.etherBlockCoord = Dungeons.convertFromRelative(node.etherBlock)
                    else nodeToPush.etherBlockCoord = Dungeons.rayTraceEtherBlock([x, y, z], Dungeons.convertToRealYaw(node.yaw), node.pitch)
                }
                activeNodesCoords.push(nodeToPush)
            } catch (e) {
                chat(`update your fucking odin`)
                console.log(e)
                return scheduleTask(5, () => this._updateActive()) // try again, surely this fixes it
            }
        }
    }

    _handleCommand(...args) {
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
        const argsObject = {
            type: nodeTypes.indexOf(type),
            etherCoordMode: 1,
            etherBlock: rayTraceEtherBlock([Player.getX(), Player.getY(), Player.getZ()], Player.getYaw(), Player.getPitch())?.toString() ?? "0,0,0",
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
            itemName: Player?.getHeldItem()?.getName()?.removeFormatting() ?? "Aspect of the Void",
            block: false
        }

        if (type === "pearlclip") argsObject.pearlClipDistance = args.shift()
        else if (type === "command") return chat("you cant make this node using commands cause i cant be bothered to figure out how to fit the command args inside of this shit and i dont care use /cngui")

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
                    argsObject.awaitSecret = false
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
                case "ethercoordmode":
                    switch (args[i + 1]) {
                        case "raytrace":
                            argsObject.etherCoordMode = 0
                            break
                        case "yawpitch":
                            argsObject.etherCoordMode = 1
                            break
                        case "calcyawpitch":
                            argsObject.etherCoordMode = 2
                            break
                    }
                    break
            }
        }

        const node = this._newNode(type, argsObject)
        if (!node) return chat(`Failed to create node of type ${type}. Make sure you specified the arguments correctly.`)

        this.data.nodes.push(node)
    }
}

export default new NodeManager();
