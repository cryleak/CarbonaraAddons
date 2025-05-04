import Settings from "../config"
import nodeCreation from "../nodeCreation"

import { registerSubCommand } from "../utils/commands"
import { playerCoords } from "../utils/autop3utils"
import { chat } from "../utils/utils"
import { getDistance3D } from "../../BloomCore/utils/Utils"
class AutoP3Config {
    constructor() {
        // this.yawRequiredTypes = ["look", "useitem", "walk", "superboom"]
        try {
            this.config = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName.toLowerCase() + ".json"))
            if (!Array.isArray(this.config)) throw new Error("boom")
        } catch (e) {
            this.config = []
        }
        this.nodeTypes = ["look", "walk", "useitem", "superboom", "motion", "stopvelocity", "fullstop", "blink", "blinkvelo", "jump", "hclip", "awaitterminal", "awaitleap", "lavaclip"]
        this.availableArgs = new Map([
            ["look", ["yaw", "pitch"]],
            ["walk", []],
            ["useitem", ["yaw", "pitch", "itemName"]],
            ["superboom", ["yaw", "pitch"]],
            ["motion", ["yaw", "pitch"]],
            ["stopvelocity", []],
            ["fullstop", []],
            ["blink", ["blinkRoute"]],
            ["blinkvelo", ["ticks"]],
            ["jump", []],
            ["hclip", ["yaw", "jumpOnHClip"]],
            ["awaitterminal", []],
            ["awaitleap", ["excludeClass"]],
            ["lavaclip", ["lavaClipDistance"]]
        ])
        this.nodeCoords = null
        this.editingNodeIndex = null
        this.editing = false
        this.dependencyChecks = { // sigma
            showBlinkRoute: data => data.type === 7,
            showTicks: data => data.type === 8,
            showItemName: data => data.type === 3,
            showYaw: data => this.availableArgs.get(this.nodeTypes[data.type]).includes("yaw") || data.look,
            showPitch: data => this.availableArgs.get(this.nodeTypes[data.type]).includes("pitch") || data.look,
            showLook: data => !this.availableArgs.get(this.nodeTypes[data.type]).includes("pitch") || data.type === 4,
            showExcludeClass: data => data.type === 12,
            showJumpOnHClip: data => data.type === 10,
            showLavaClipDistance: data => data.type === 13
        }

        register("guiClosed", (gui) => {
            if (!this.editing) return
            if (!(gui instanceof Java.type("gg.essential.vigilance.gui.SettingsGui"))) return
            this.editing = false
            this.addNode(nodeCreation, this.nodeCoords)
        })

        register("tick", () => {
            if (!this.editing) return
            let reopen = false
            Object.getOwnPropertyNames(this.dependencyChecks).forEach(value => {
                const state = this.dependencyChecks[value](nodeCreation)
                if (nodeCreation[value] !== state) {
                    reopen = true
                    nodeCreation[value] = state
                }
            })
            if (reopen) {
                this.editing = false
                nodeCreation.openGUI()
                Client.scheduleTask(1, () => this.editing = true)
            }
        })

        registerSubCommand(["editnode", "en"], args => {
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

            nodeCreation.blinkRoute = node.blinkRoute ?? ""
            nodeCreation.ticks = node.ticks?.toString() ?? "15"
            nodeCreation.center = node.center
            nodeCreation.stop = node.stop
            nodeCreation.radius = node.radius.toString()
            nodeCreation.height = node.height.toString()
            nodeCreation.type = this.nodeTypes.indexOf(node.type)
            nodeCreation.itemName = node.itemName ?? Player?.getHeldItem()?.getName()?.removeFormatting()
            nodeCreation.yaw = node.yaw?.toString() ?? Player.getYaw().toFixed(3)
            nodeCreation.pitch = node.pitch?.toString() ?? Player.getPitch().toFixed(3)
            nodeCreation.delay = node.delay.toString()
            nodeCreation.look = node.look ?? false
            nodeCreation.once = node.once ?? false
            nodeCreation.excludeClass = node.excludeClass
            nodeCreation.jumpOnHClip = node.jumpOnHClip ?? false
            nodeCreation.lavaClipDistance = node.lavaClipDistance?.toString() ?? "0"
            nodeCreation.openGUI()
            Client.scheduleTask(1, () => this.editing = true)
        })

        registerSubCommand(["createnode", "cn", "addnode", "an"], args => {
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
                type: this.nodeTypes.indexOf(type),
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
                lavaClipDistance: 0
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
                }
            }
            this.editingNodeIndex = null
            this.addNode(argsObject, playerCoords().camera)
        })

        registerSubCommand(["deletenode", "dn", "removenode", "rn"], args => {
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
        })
    }

    addNode(args, pos) {
        if (Settings().centerNodes) pos[0] = Math.floor(pos[0]) + 0.5, pos[2] = Math.floor(pos[2]) + 0.5
        const nodeType = this.nodeTypes[parseInt(args.type)]?.toLowerCase()
        if (!nodeType) return chat("what the fuck is your nodetype")


        const nodeSpecificArgs = this.availableArgs.get(nodeType) // Args specific to the current node type


        let node = { type: nodeType, position: pos, radius: parseFloat(args.radius), height: parseFloat(args.height), delay: parseInt(args.delay), stop: args.stop, center: args.center, lastTriggered: Date.now(), triggered: false, once: args.once }
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
        return this.config.map((node, i) => ({ distance: getDistance3D(...node.position, ...playerCoords().camera), i })).sort((a, b) => a.distance - b.distance)[0].i
    }

    saveConfig() {
        try {
            FileLib.write("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName.toLowerCase() + ".json", JSON.stringify(this.config, null, "\t"), true)
        } catch (e) {
            chat("Error saving config!")
            console.log(e)
        }
    }

    onConfigNameUpdate(newName) {
        try {
            this.config = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + newName.toLowerCase() + ".json"))
            if (!Array.isArray(this.config)) throw new Error("boom")
            chat(`Swapped to config ${newName}.`)
        } catch (e) {
            this.config = []
        }
    }
}

export default new AutoP3Config()

nodeCreation.blinkRoute = ""
nodeCreation.ticks = "15"
nodeCreation.center = false
nodeCreation.stop = false
nodeCreation.radius = "0.5"
nodeCreation.height = "0.1"
nodeCreation.type = 5
nodeCreation.itemName = "Bonzo's Staff"
nodeCreation.yaw = "0"
nodeCreation.pitch = "0"
nodeCreation.delay = "0"
nodeCreation.look = false
nodeCreation.once = true
nodeCreation.excludeClass = "Mage"
nodeCreation.jumpOnHClip = true