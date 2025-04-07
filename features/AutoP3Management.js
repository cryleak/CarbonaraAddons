import Settings from "../config"
import { playerCoords } from "../utils/autop3utils"
import { chat } from "../utils/utils"

class AutoP3Config {
    constructor() {
        // this.yawRequiredTypes = ["look", "useitem", "walk", "superboom"]
        try {
            this.config = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName + ".json"))
            if (!Array.isArray(this.config)) throw new Error("boom")
        } catch (e) {
            this.config = []
        }
        this.saveConfig()
        this.nodeTypes = ["look", "walk", "useitem", "superboom", "motion", "stopvelocity", "fullstop", "blink", "blinkvelo"]
        this.availableArgs = new Map([
            ["look", ["yaw", "pitch"]],
            ["walk", ["yaw", "pitch"]],
            ["useitem", ["yaw", "pitch", "itemName"]],
            ["superboom", ["yaw", "pitch"]],
            ["motion", ["yaw", "pitch"]],
            ["stopvelocity", []],
            ["fullstop", []],
            ["blink", ["blinkroute"]],
            ["blinkvelo", ["ticks"]]
        ])

        register("command", (...args) => { // this is terrible
            if (!args.length || !args[0]) return chat([
                `\n§0-§r /createnode §0<§rtype§0> §0<§rargs§0>`,
                `§0-§r List of node types: look, walk, useitem, superboom, motion, stopvelocity, fullstop`,
                `§0-§r List of args you can use:`,
                `§0-§r §rdelay §0<§fnumber§0>`,
                `§0-§r stop`,
                `§0-§r look`,
                `§0-§r center`,
                `§0-§r radius §0<§rnumber§0>`,
                `§0-§r height §0<§rnumber§0>`,
                `§0-§r yaw §0<§rnumber§0>`,
                `§0-§r pitch §0<§rnumber§0>`,
            ].join("\n"))

            const type = args.shift()
            const argsObject = {
                type: this.nodeTypes.indexOf(type),
                yaw: Player.getYaw(),
                pitch: Player.getPitch(),
                radius: 0.5,
                height: 0.1,
                delay: 0,
                stop: false,
                center: false,
                itemName: Player?.getHeldItem()?.getName()?.removeFormatting() ?? "Bonzo's Staff",
                block: false,
                look: false,
                ticks: 15
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
                        argsObject.yaw = parseFloat(args[i + 1])
                        break
                    case "pitch":
                        argsObject.pitch = parseFloat(args[i + 1])
                        break
                    case "look":
                        argsObject.look = true
                        break
                    case "blinkroute":
                    case "route":
                        argsObject.blinkRoute = args[i + 1]
                        break
                    case "ticks":
                        argsObject.ticks = parseInt(args[i + 1])
                        break
                }
            }

            this.addNode(argsObject, playerCoords().camera)
        }).setName("addnode").setAliases("an")
    }

    addNode(args, pos) {
        pos[0] = Math.floor(pos[0]) + 0.5
        pos[2] = Math.floor(pos[2]) + 0.5
        const nodeType = this.nodeTypes[parseInt(args.type)]?.toLowerCase()
        if (!nodeType) return chat("what the fuck is your nodetype")


        const nodeSpecificArgs = this.availableArgs.get(nodeType) // Args specific to the current node type


        let node = { type: nodeType, position: pos, radius: args.radius, height: args.height, delay: args.delay, stop: args.stop, center: args.center, lastTriggered: 0, triggered: false }
        for (let i = 0; i < nodeSpecificArgs.length; i++) {
            node[nodeSpecificArgs[i]] = args[nodeSpecificArgs[i]]
        }
        if (args.look) node.yaw = args.yaw, node.pitch = args.pitch, node.look = true
        this.config.push(node)
        this.saveConfig()
        let nodeString = "Added node: "
        const propertyNames = Object.getOwnPropertyNames(node)
        propertyNames.forEach((arg, index) => nodeString += `§b${arg}: §c${node[arg]}${index === propertyNames.length - 1 ? "." : ", "}§f`)
        chat(nodeString)
        ChatLib.command("updateroutes", true)
    }

    getConfig() {
        return this.config
    }

    saveConfig() {
        try {
            FileLib.write("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName + ".json", JSON.stringify(this.config), true)
        } catch (e) {
            ChatLib.chat("Error saving config!")
            console.log(e)
        }
    }

    onConfigNameUpdate() {
        try {
            this.config = JSON.parse(FileLib.read("./config/ChatTriggers/modules/CarbonaraAddons/configs/" + Settings().configName + ".json"))
        } catch (e) {
            this.config = []
        }
        this.saveConfig()
    }
}

export default new AutoP3Config()