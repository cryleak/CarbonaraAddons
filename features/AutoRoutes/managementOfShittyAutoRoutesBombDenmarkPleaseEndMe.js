import { nodeTypes, availableArgs } from "../../AutoRoutes/nodeCreation"
import { chat } from "../../AutoRoutes/utils/utils"
import { convertToRelative, convertFromRelative, getRoomName, convertToRelativeYaw, convertToRealYaw } from "./RoomUtils"
import { playerCoords, rayTraceEtherBlock } from "../../AutoRoutes/utils/RouteUtils"
import { data } from "../../AutoRoutes/utils/routesData"
import { getDistance3D } from "../../BloomCore/utils/utils"

register("command", (...args) => { // this is terrible
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
                argsObject.awaitSecret = true
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

    editingNodeIndex = null
    addNode(argsObject, playerCoords().camera)
}).setName("createnode").setAliases("cn")

register("command", (index) => {
    const roomNodes = data.nodes[getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let indexToDelete
    if (index) {
        if (isNaN(index)) return chat("Not a number!")
        indexToDelete = parseInt(index)
    }
    else {
        indexToDelete = getNearestNodeIndex()
    }
    if (!roomNodes[indexToDelete]) return chat("Node doesn't exist!")
    let nodeString = "Deleted node: "
    const propertyNames = Object.getOwnPropertyNames(roomNodes[indexToDelete])
    propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${roomNodes[indexToDelete][arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
    chat(nodeString)
    roomNodes.splice(indexToDelete, 1)
    data.save()
    ChatLib.command("updateroutes", true)
}).setName("removenode").setAliases("rn")

function addNode(args, pos) {
    let yOffset = pos[1] - Math.floor(pos[1]) // Allow for decimals on the Y Axis.
    pos = pos.map(coord => coord = Math.floor(parseFloat(coord)))
    const nodeType = nodeTypes[parseInt(args.type)]?.toLowerCase()
    if (!nodeType) return chat("what the fuck is your nodetype")
    const roomName = getRoomName()
    if (!roomName) return chat("No room detected!")
    if (!data.nodes[roomName]) data.nodes[roomName] = []


    const nodeSpecificArgs = availableArgs.get(nodeType) // Args specific to the current node type


    if (nodeType === "etherwarp") args.etherBlock = convertToRelative(args.etherBlock.split(",").map(coord => Math.floor(parseFloat(coord))))

    if (["look", "etherwarp", "useitem", "walk", "superboom"].includes(nodeType)) args.yaw = convertToRelativeYaw(args.yaw)


    pos = convertToRelative(pos)

    let node = { type: nodeType, position: pos, yOffset: yOffset, radius: parseFloat(args.radius), awaitSecret: args.awaitSecret, height: args.height, delay: parseInt(args.delay), stop: args.stop, center: args.center, chained: args.chained }
    for (let i = 0; i < nodeSpecificArgs.length; i++) {
        node[nodeSpecificArgs[i]] = args[nodeSpecificArgs[i]]
    }
    if (editingNodeIndex || editingNodeIndex === 0) data.nodes[roomName][editingNodeIndex] = node
    else data.nodes[roomName].push(node)
    data.save()
    let nodeString = "Added node: "
    const propertyNames = Object.getOwnPropertyNames(node)
    propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${node[arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
    chat(nodeString)
    ChatLib.command("updateroutes", true)
}

function getNearestNodeIndex() {
    const roomNodes = data.nodes[getRoomName()]
    if (!roomNodes || !roomNodes.length) return chat("No nodes found for this room!")

    let nodeDistances = []
    for (let i = 0; i < roomNodes.length; i++) {
        let realCoords = convertFromRelative(roomNodes[i].position)
        realCoords[1] += roomNodes[i].yOffset
        nodeDistances.push({
            distance: getDistance3D(...realCoords, ...playerCoords().camera),
            nodeIndex: i
        })
    }
    const sortedNodeDistances = nodeDistances.sort((a, b) => a.distance - b.distance)
    return sortedNodeDistances[0].nodeIndex
}