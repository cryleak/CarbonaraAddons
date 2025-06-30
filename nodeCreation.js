import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

export const availableArgs = new Map([
    ["look", ["yaw", "pitch"]],
    ["walk", []],
    ["useitem", ["yaw", "pitch", "itemName"]],
    ["superboom", ["yaw", "pitch"]],
    ["motion", ["yaw"]],
    ["stopvelocity", []],
    ["fullstop", []],
    ["blink", ["blinkRoute"]],
    ["blinkvelo", ["ticks", "awaitLavaBounce"]],
    ["jump", []],
    ["hclip", ["yaw", "jumpOnHClip"]],
    ["awaitterminal", []],
    ["awaitleap", ["excludeClass"]],
    ["lavaclip", ["lavaClipDistance"]]
])
export const nodeTypes = ["look", "walk", "useitem", "superboom", "motion", "stopvelocity", "fullstop", "blink", "blinkvelo", "jump", "hclip", "awaitterminal", "awaitleap", "lavaclip"]

let config
let nodeCreationGUI
export function makeConfig() {
    config = new DefaultConfig("CarbonaraAddons", "NonexistentConfig.json")

    config
        .addSwitch({
            configName: "once",
            title: "Trigger Once",
            description: "Only trigger this node once until you reset it",
            category: "Route"
        })
        .addSwitch({
            configName: "center",
            title: "Center",
            description: "Puts you right in the center of where the NODE is located. Note that this also modifies your Y level, so it may not work and just lagback if your node is extremely tall. Useful to align yourself if you aren't starting in the middle of the block.",
            category: "Route"
        })
        .addSwitch({
            configName: "stop",
            title: "Stop",
            description: "Stops all velocity when you do this node, this doesn't release movement keys.",
            category: "Route"
        })
        .addTextInput({
            configName: "radius",
            title: "Radius",
            description: "Radius of the node.",
            category: "Route",
        })
        .addTextInput({
            configName: "height",
            title: "Height",
            description: "Height of the node.",
            category: "Route",
        })
        .addTextInput({
            configName: "blinkRoute",
            title: "Blink Route",
            description: "Name of the blink route. Should not include .json",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("blinkRoute")
        })
        .addTextInput({
            configName: "ticks",
            title: "Blink Velocity Ticks",
            description: "Ticks to blink.",
            category: "Route",
            shouldShow: data => {
                ChatLib.chat(availableArgs.get(nodeTypes[data.type]).includes("ticks"))
                return availableArgs.get(nodeTypes[data.type]).includes("ticks")
            }
        })
        .addSwitch({
            configName: "awaitLavaBounce",
            title: "Await Lava Bounce",
            description: "Only blink velocity after a lava bounce",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("awaitLavaBounce")
        })
        .addDropDown({
            configName: "type",
            title: "Node type",
            description: "Select an option",
            category: "Route",
            options: ["Look", "Walk", "Use Item", "Superboom", "Motion", "Stop Velocity", "Full Stop", "Blink", "Blink Velocity", "Jump", "HClip", "Await Terminal", "Await Leap", "Lavaclip"]
        })
        .addTextInput({
            configName: "lavaClipDistance",
            title: "Lavaclip distance",
            description: "Set it to 0 to automatically determine this.",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("lavaClipDistance")
        })
        .addTextInput({
            configName: "itemName",
            title: "Item name to use",
            description: "",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("itemName")
        })
        .addTextInput({
            configName: "excludeClass",
            title: "Player/Class to exclude",
            description: "(Case sensitive) Options: Mage, Berserk, Archer, Healer, Tank\nAlternatively, type a player name here.",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("excludeClass")
        })
        .addSwitch({
            configName: "look",
            title: "Look",
            description: "Rotate to specified Yaw/Pitch.",
            category: "Route",
            shouldShow: data => !availableArgs.get(nodeTypes[data.type]).includes("pitch") || !availableArgs.get(nodeTypes[data.type]).includes("yaw")
        })
        .addSwitch({
            configName: "jumpOnHClip",
            title: "Jump on HClip",
            description: "Jumps before HClipping if you are on the ground.",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("jumpOnHClip")
        })
        .addTextInput({
            configName: "yaw",
            title: "Yaw",
            description: "Number between -180 and 180.",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("yaw") || data.look
        })
        .addTextInput({
            configName: "pitch",
            title: "Pitch",
            description: "Number between -90 and 90.",
            category: "Route",
            shouldShow: data => availableArgs.get(nodeTypes[data.type]).includes("pitch") || data.look
        })
        .addTextInput({
            configName: "delay",
            title: "Node Delay",
            description: "If you are stacking multiple nodes together to perform multiple actions (e.g throwing 2 pearls), each individual node should have a delay of at least 150ms more than the last one to work properly. This only matters for nodes that use server rotations.",
            category: "Route"
        })

    nodeCreationGUI = new Settings("CarbonaraAddons", config, "ColorScheme.json")
}
makeConfig()
export default () => nodeCreationGUI.settings
