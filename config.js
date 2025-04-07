import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

const config = new DefaultConfig("CarbonaraAddons", "settings.json")

config
    .addSwitch({
        configName: "autoP3Enabled",
        title: "Toggle AutoP3",
        description: "",
        category: "AutoP3",
        value: false
    })
    .addSwitch({
        configName: "editMode",
        title: "Edit Mode",
        description: "",
        category: "AutoP3",
        value: false
    })
    .addSwitch({
        configName: "centerNodes",
        title: "Center nodes",
        description: "Places all nodes that you create in the center of a block.",
        category: "AutoP3",
        value: false
    })
    .addTextInput({
        configName: "configName",
        title: "Config name",
        description: "Name of the config to load. You do not need to include .json in the name.",
        category: "AutoP3",
        value: "Blink"
    })
    .addSwitch({
        configName: "displayIndex",
        title: "Display index of nodes on screen",
        description: "Helpful for deleting and editing nodes.",
        category: "AutoP3",
        value: false
    })
    .addColorPicker({
        configName: "nodeColor",
        title: "Node Colors",
        description: "",
        category: "AutoP3",
        value: [0, 255, 255, 255],
    })
    .addKeybind({
        configName: "packetChargeKeybind",
        title: "Toggle Packet Charging",
        description: "",
        category: "Blink"
    })
    .addSwitch({
        configName: "simulateSpeed",
        title: "Simulate Speed In Singleplayer",
        description: "",
        category: "AutoP3",
        subcategory: "Simulation",
    })
    .addSwitch({
        configName: "simulateLavaBounce",
        title: "Simulate Lava Bounce In Singleplayer",
        description: "",
        category: "AutoP3",
        subcategory: "Simulation",
    })


const mySettings = new Settings("CarbonaraAddons", config, "ColorScheme.json")
export default () => mySettings.settings
