import { registerSubCommand } from "../utils/commands"
import { chat } from "../utils/utils"

const MathHelper = Java.type("net.minecraft.util.MathHelper")


registerSubCommand("convertconfig", (args) => {
    const configType = args.shift().toLowerCase()
    if (configType === "pepi") {
        if (!args.length) return chat("§cSpecify the name of the file you want to convert!")
        const fileName = args.join(" ")
        const file = FileLib.read("CarbonaraAddons/configs", fileName)
        if (!file) return chat("Can't find the file. Put it in your configs folder. Note that this is also case sensitive.")
        const originalObj = JSON.parse(file)
        const newObj = []
        originalObj.forEach(node => {
            const type = node.type
            const nodeData = node.data

            const convertedNode = {}
            convertedNode.position = [node.x, node.y, node.z]
            convertedNode.yaw = nodeData?.yaw ?? null
            convertedNode.pitch = nodeData?.pitch ?? null
            convertedNode.radius = node.radius
            convertedNode.height = 1.5
            convertedNode.center = nodeData?.center ?? false
            convertedNode.stop = false
            if (nodeData?.stopMotion) {
                convertedNode.stop = false
                convertedNode.center = true
            }
            convertedNode.triggered = false
            convertedNode.delay = 0
            convertedNode.look = false
            switch (type) {
                case "rotate":
                    convertedNode.type = "look"
                    break
                case "hclip":
                    convertedNode.type = "hclip"
                    convertedNode.yaw = nodeData.dir
                    break
                case "stop":
                    convertedNode.type = "fullstop"
                    convertedNode.look = true
                    break
                case "jump":
                    convertedNode.type = "jump"
                    break
                case "shift":
                    return chat(`There is no node type the same as "Shift". This node has been skipped.`)
                    break
                case "walk":
                    convertedNode.type = "walk"
                    break
                case "wait":
                    return chat(`There is no node type the same as "Wait". This node has been skipped.`)
                    break
                case "clipjoemp":
                    return chat(`There is no node type the same as "clipjoemp". This node has been skipped.`)
                    break
                default:
                    return chat(`§cUnknown node type found! Type: ${type}`)
                    break
            }
            newObj.push(convertedNode)
        })
        FileLib.write("CarbonaraAddons/configs", fileName, JSON.stringify(newObj, null, "\t"))
        chat(`Overwritten the config with a converted one.`)
    } else if (configType === "cga") {
        if (!args.length) return chat("§cSpecify the name of the file you want to convert!")
        const fileName = args.join(" ")
        const file = FileLib.read("CarbonaraAddons/configs", fileName)
        if (!file) return chat("Can't find the file. Put it in your configs folder. Note that this is also case sensitive.")
        const originalObj = JSON.parse(file)
        const newObjs = {}

        originalObj.forEach(node => {
            const type = node.type

            const convertedNode = {}
            convertedNode.position = Object.values(node.location)
            convertedNode.yaw = MathHelper.func_76138_g(node.yaw)
            convertedNode.pitch = node.pitch
            convertedNode.radius = node.width / 2
            convertedNode.height = node.height
            convertedNode.center = false
            convertedNode.stop = node.arguments?.fullstop || node.arguments?.stop
            convertedNode.triggered = false
            convertedNode.delay = 0
            convertedNode.look = node.arguments?.look ?? false

            switch (type) {
                case "walk":
                    convertedNode.type = "walk"
                    break
                case "jump":
                    convertedNode.type = "jump"
                    break
                case "stop":
                    convertedNode.type = "fullstop"
                    break
                case "boom":
                    convertedNode.type = "superboom"
                    break
                case "hclip":
                    convertedNode.type = "hclip"
                    convertedNode.jumpOnHClip = true
                    break
                case "vclip":
                    return chat(`There is no node type the same as "vclip". This node has been skipped.`)
                    break
                case "bonzo":
                    convertedNode.type = "useitem"
                    convertedNode.itemName = "Bonzo's Staff"
                    break
                case "look":
                    convertedNode.type = "look"
                    break
                case "align":
                    return chat(`There is no node type the same as "align". This node has been skipped.`)
                    break
                case "block":
                    return chat(`There is no node type the same as "block". This node has been skipped.`)
                    break
                case "edge":
                    return chat(`There is no node type the same as "edge". This node has been skipped.`)
                    break
                case "command":
                    return chat(`There is no node type the same as "command". This node has been skipped.`)
                    break
                case "blink":
                    convertedNode.type = "blink"
                    break
                case "movement":
                    return chat(`There is no node type the same as "movement". This node has been skipped.`)
                    break
                case "velo":
                    convertedNode.type = "motion"
                    break
            }
            if (!newObjs[node.route]) newObjs[node.route] = []
            newObjs[node.route].push(convertedNode)
        })
        Object.keys(newObjs).forEach(route => {
            FileLib.write("CarbonaraAddons/configs", `cgaroute${route}.json`, JSON.stringify(newObjs[route], null, "\t"))
            chat(`Converted CGA route "${route}" to "cgaroute${route}.json"`)
        })

    }

    else return chat("Invalid config type.")
})