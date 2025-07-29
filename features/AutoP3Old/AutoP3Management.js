import Settings from "../../config"
import nodeCreation, { availableArgs, nodeTypes } from "./nodeCreation"

import { registerSubCommand } from "../../utils/commands"
import { chat, playerCoords } from "../../utils/utils"
import { getDistance3DSq } from "../../utils/utils"
import Vector3 from "../../utils/Vector3"
class AutoP3Config {
    constructor() {
        this._loadConfig(Settings().configName)
        this.defineTransientProperties()
        this._sortNodes()
        this.nodeCoords = null
        this.editingNodeIndex = null
        this.subcommands = []

        nodeCreation().getConfig().onCloseGui(() => this.onGuiClose())

        registerSubCommand("p3", args => {
            const action = args.shift()
            for (let listener of this.subcommands) {
                if (listener.args.some(arg => arg === action)) return listener.listener(args)
            }
            chat("Unknown subcommand!")
        })

        this.registerAutoP3Comamand(["editnode", "en"], args => {
            let nearestNodeIndex
            if (args && args.length) {
                const index = args.shift()
                if (!isNaN(index)) nearestNodeIndex = parseInt(index)
                else if (args.some(arg => arg.includes("resetrot"))) yaw = Player.getYaw().toString()
            }
            if (!nearestNodeIndex) nearestNodeIndex = this.getNearestNodeIndex()
            const node = this.config[nearestNodeIndex]
            if (!node) return chat("Node doesn't exist!")
            this.editingNodeIndex = nearestNodeIndex
            this.nodeCoords = node.position

            nodeCreation().getConfig().setConfigValue("Route", "blinkRoute", node.blinkRoute ?? "")
                .setConfigValue("Route", "ticks", node.ticks?.toString() ?? "15")
                .setConfigValue("Route", "center", node.center)
                .setConfigValue("Route", "stop", node.stop)
                .setConfigValue("Route", "radius", node.radius.toString())
                .setConfigValue("Route", "height", node.height.toString())
                .setConfigValue("Route", "type", nodeTypes.indexOf(node.type))
                .setConfigValue("Route", "itemName", node.itemName ?? Player?.getHeldItem()?.getName()?.removeFormatting())
                .setConfigValue("Route", "yaw", node.yaw?.toString() ?? Player.getYaw().toFixed(3))
                .setConfigValue("Route", "pitch", node.pitch?.toString() ?? Player.getPitch().toFixed(3))
                .setConfigValue("Route", "delay", node.delay.toString())
                .setConfigValue("Route", "look", node.look ?? false)
                .setConfigValue("Route", "once", node.once ?? false)
                .setConfigValue("Route", "excludeClass", node.excludeClass)
                .setConfigValue("Route", "jumpOnHClip", node.jumpOnHClip ?? false)
                .setConfigValue("Route", "lavaClipDistance", node.lavaClipDistance?.toString() ?? "0")
                .setConfigValue("Route", "awaitLavaBounce", node.awaitLavaBounce ?? true)
                .openGui()
        }, args => this.config.map((_0, index) => index.toString()))

        this.registerAutoP3Comamand(["createnode", "cn", "addnode", "an"], args => {
            if (!args.length || !args[0]) return chat([
                `\n§0-§r /createnode §0<§rtype§0> §0<§rargs§0>`,
                `§0-§r List of node types: look, walk, useitem, superboom, motion, stopvelocity, fullstop, blink, jump, hclip`,
                `§0-§r List of args you can use:`,
                `§0-§r §rdelay §0<§fnumber§0>`,
                `§0-§r stop`,
                `§0-§r look`,
                `§0-§r center`,
                `§0-§r look>`,
                `§0-§r once>`,
                `§0-§r radius §0<§rnumber§0>`,
                `§0-§r height §0<§rnumber§0>`,
                `§0-§r yaw §0<§rnumber§0>`,
                `§0-§r pitch §0<§rnumber§0>`,
                `§0-§r blinkroute §0<§rroutename§0>`,
                //`§0-§r blinkveloticks §0<§rnumber§0>`
            ].join("\n"))

            const type = args.shift()
            const argsObject = {
                type: nodeTypes.indexOf(type),
                yaw: Player.getYaw().toFixed(3),
                pitch: Player.getPitch().toFixed(3),
                radius: 0.5,
                height: 0.1,
                delay: 0,
                stop: false,
                center: false,
                itemName: Player?.getHeldItem()?.getName()?.removeFormatting() ?? "Bonzo's Staff",
                block: false,
                look: false,
                ticks: 15,
                blinkRoute: "",
                once: false,
                excludeClass: "",
                jumpOnHClip: true,
                lavaClipDistance: 0,
                awaitLavaBounce: true
            }

            for (let i = 0; i < args.length; i++) {
                switch (args[i].toLowerCase()) {
                    case "delay":
                        argsObject.delay = parseInt(args[i + 1])
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
                        argsObject.yaw = parseFloat(args[i + 1]).toFixed(3)
                        break
                    case "pitch":
                        argsObject.pitch = parseFloat(args[i + 1]).toFixed(3)
                        break
                    case "look":
                        argsObject.look = true
                        break
                    case "blinkroute":
                    case "route":
                        argsObject.blinkRoute = args[i + 1]
                        break
                    case "blinkveloticks":
                    case "ticks":
                        argsObject.ticks = parseInt(args[i + 1])
                        break
                    case "once":
                        argsObject.once = true
                        break
                    case "distance":
                        argsObject.lavaClipDistance = parseInt(args[i + 1])
                        break
                    case "awaitlava":
                    case "noawaitlava":
                    case "noawaitlavabounce":
                        argsObject.awaitLavaBounce = false
                        break
                }
            }
            this.editingNodeIndex = null
            this.addNode(argsObject, playerCoords().camera)
        }, args => {
            if (nodeTypes.includes(args[0])) return null
            return nodeTypes
        })

        this.registerAutoP3Comamand(["deletenode", "dn", "removenode", "rn"], args => {
            if (!this.config.length) return chat("No nodes found!")
            let indexToDelete
            const index = args[0]
            if (index) {
                if (isNaN(index)) return chat("Not a number!")
                indexToDelete = parseInt(index)
            }
            else indexToDelete = this.getNearestNodeIndex()

            if (!this.config[indexToDelete]) return chat("Node doesn't exist!")
            let nodeString = "Deleted node: "
            const propertyNames = Object.getOwnPropertyNames(this.config[indexToDelete])
            propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${this.config[indexToDelete][arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
            chat(nodeString)
            this.config.splice(indexToDelete, 1)
            this.saveConfig()
        }, args => this.config.map((_0, index) => index.toString()))
    }

    addNode(args, pos) {
        if (Settings().centerNodes) pos.floor2D().add(0.5, 0, 0.5)
        const nodeType = nodeTypes[parseInt(args.type)]?.toLowerCase()
        if (!nodeType) return chat("what the fuck is your nodetype")


        const nodeSpecificArgs = availableArgs.get(nodeType) // Args specific to the current node type


        let node = { type: nodeType, position: pos, radius: parseFloat(args.radius), height: parseFloat(args.height), delay: parseInt(args.delay), stop: args.stop, center: args.center, once: args.once }
        for (let i = 0; i < nodeSpecificArgs.length; i++) {
            node[nodeSpecificArgs[i]] = args[nodeSpecificArgs[i]]
        }
        if (args.look) node.yaw = args.yaw, node.pitch = args.pitch, node.look = true
        if (nodeType === "awaitterminal" || nodeType === "awaitleap" || nodeType === "lavaclip") node.once = true

        if (this.editingNodeIndex === null) this.config.push(node)
        else this.config[this.editingNodeIndex] = node
        this.saveConfig()
        let nodeString = "Added node: "
        const propertyNames = Object.getOwnPropertyNames(node)
        propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${node[arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
        chat(nodeString)
    }

    getNearestNodeIndex() {
        return this.config.map((node, i) => ({ distance: node.position.distance3D(playerCoords().camera), i })).sort((a, b) => a.distance - b.distance)[0].i
    }

    saveConfig() {
        this.defineTransientProperties()
        this._sortNodes()
        try {
            FileLib.write("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName.toLowerCase() + ".json", JSON.stringify(this.config, null, "\t"), true)
        } catch (e) {
            chat("Error saving config!")
            console.log(e)
        }
    }

    onConfigNameUpdate(newName) {
        this._loadConfig(newName.toLowerCase())
        chat(`Swapped to config ${newName}.`)
    }


    defineTransientProperties() {
        this.config.forEach(node => Object.defineProperties(node, {
            triggered: {
                value: false,
                enumerable: false,
                writable: true,
                configurable: true
            },
            lastTriggered: {
                value: 0,
                enumerable: false,
                writable: true,
                configurable: true
            }
        }))
    }

    onGuiClose() {
        try {
            this.addNode(nodeCreation(), this.nodeCoords)
        } catch (e) {
            console.log(e)
            chat("Error while editing node! Report this or something (/ct console js)")
        }
    }

    registerAutoP3Comamand(args, listener, tabCompletions) {
        if (!Array.isArray(args)) args = [args]
        const subCommand = { args, listener }
        if (tabCompletions) subCommand.tabCompletions = tabCompletions
        this.subcommands.push(subCommand)
    }

    _loadConfig(configName) {
        try {
            this.config = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + configName.toLowerCase() + ".json"), (key, value) => {
                if (key === "position" && value && Array.isArray(value)) return new Vector3(...value)
                if (value && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number") return new Vector3(value.x, value.y, value.z);
                return value
            })
            if (!Array.isArray(this.config)) throw new Error("boom")
        } catch (e) {
            console.log(e)
            this.config = []
        }
        this.defineTransientProperties()
        this._sortNodes()
    }

    _sortNodes() {
        const getPriority = (type) => {
            if (type === "awaitterminal" || type === "awaitleap") return 0
            if (type === "blinkvelo") return 2
            return 1
        }

        this.sortedNodes = [...this.config].sort((a, b) => getPriority(a.type) - getPriority(b.type))
    }
}

export default new AutoP3Config()

nodeCreation().getConfig().setConfigValue("Route", "blinkRoute", "")
    .setConfigValue("Route", "ticks", "15")
    .setConfigValue("Route", "center", false)
    .setConfigValue("Route", "stop", false)
    .setConfigValue("Route", "radius", "0.5")
    .setConfigValue("Route", "height", "0.1")
    .setConfigValue("Route", "type", 5)
    .setConfigValue("Route", "itemName", "Bonzo's Staff")
    .setConfigValue("Route", "yaw", "0")
    .setConfigValue("Route", "pitch", "0")
    .setConfigValue("Route", "delay", "0")
    .setConfigValue("Route", "look", false)
    .setConfigValue("Route", "once", true)
    .setConfigValue("Route", "excludeClass", "Mage")
    .setConfigValue("Route", "jumpOnHClip", true)
