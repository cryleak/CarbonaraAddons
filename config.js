import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"

export const packetCounterGui = new Gui()
const config = new DefaultConfig("CarbonaraAddons", "settings.json")

config
    .addKeybind({
        configName: "hClipKeybind",
        title: "HClip Keybind",
        description: "Manual HClip",
        category: "AutoP3"
    })
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
    .addSwitch({
        configName: "triggerFromBelow",
        title: "Trigger nodes from below",
        description: "Triggers nodes if you are below them by less than the height of the node.",
        category: "AutoP3",
        value: false
    })
    .addSwitch({
        configName: "onlyP3",
        title: "Only activate in P3",
        description: "",
        category: "AutoP3",
        value: false
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
    .addTextInput({
        configName: "nodeSlices",
        title: "Node Slices",
        description: "The amount of triangles that makes up one ring. It becomes more circular with a higher value but will have worse performance.",
        category: "AutoP3",
        value: "3",
    })
    .addTextInput({
        configName: "configName",
        title: "Config name",
        description: "Name of the currently active config. You do not need to include .json in the name.",
        category: "AutoP3",
        subcategory: "Config",
        value: "Blink"
    })
    .addSwitch({
        configName: "activateConfigOnBoss",
        title: "Switch config on boss enter",
        description: "Selects the specified config on boss entry.",
        category: "AutoP3",
        subcategory: "Config",
        value: false
    })
    .addTextInput({
        configName: "bossStartConfig",
        title: "Boss Start Config name",
        description: "Name of the config to activate on boss enter",
        category: "AutoP3",
        subcategory: "Config",
        value: "Predev",
        shouldShow: data => data.activateConfigOnBoss
    })
    .addSwitch({
        configName: "activateConfigOnP3Start",
        title: "Switch config on P3 start",
        description: "Selects the specified config on P3 start.",
        category: "AutoP3",
        subcategory: "Config",
        value: false
    })
    .addTextInput({
        configName: "p3StartConfig",
        title: "P3 Start Config name",
        description: "Name of the config to activate on P3 start",
        category: "AutoP3",
        subcategory: "Config",
        value: "Blink",
        shouldShow: data => data.activateConfigOnP3Start
    })
    .addKeybind({
        configName: "freecamKeybind",
        title: "Freecam Keybind",
        description: "Liberates your camera.",
        category: "AutoP3",
        subcategory: "Config"
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
    .addButton({
        configName: "movePacketCounter",
        title: "Move Packet Counter",
        description: "",
        category: "Blink",
        title: "Move",
        onClick() {
            packetCounterGui.open()
        }
    })
    .addKeybind({
        configName: "packetChargeKeybind",
        title: "Toggle Packet Charging",
        description: "",
        category: "Blink"
    })
    .addSwitch({
        configName: "pauseCharging",
        title: "Stop charging packets after blinking",
        description: "Stops charging packets for 1 second after blinking. May do something probably does nothing idk",
        category: "Blink"
    })
    .addSwitch({
        configName: "allowRotations",
        title: "Allow Rotations",
        description: "Charges less packets but lets you rotate.",
        category: "Blink"
    })
    .addSwitch({
        configName: "renderBlinkRoutes",
        title: "Render Routes",
        description: "Absolutely annihilates performance but useful for configging.",
        category: "Blink"
    })
    .addSwitch({
        configName: "renderActiveBlinkRoutes",
        title: "Render Active Routes only",
        description: "",
        category: "Blink"
    })
    .addKeybind({
        configName: "stopRecordingKeybind",
        title: "Stop Recording Route",
        description: "Keybind to stop recording a route.",
        category: "Blink"
    })
    .addSwitch({
        configName: "fastLeap",
        title: "Fast Leap",
        description: "Leaps fast.",
        category: "Leap",
        subcategory: "Fast Leap"
    })
    .addSwitch({
        configName: "queueFastLeap",
        title: "Queue Fast Leap",
        description: "Queues fast leaps if you are in a terminal.",
        category: "Leap",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    })
    .addTextInput({
        configName: "fastLeapS1",
        title: "Player to leap to in S1",
        description: "You can either input the name of a class or a player name.",
        category: "Leap",
        value: "Archer",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    })
    .addTextInput({
        configName: "fastLeapS2",
        title: "Player to leap to in S2",
        description: "You can either input the name of a class or a player name.",
        category: "Leap",
        value: "Healer",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    }).addTextInput({
        configName: "fastLeapS3",
        title: "Player to leap to in S3",
        description: "You can either input the name of a class or a player name.",
        category: "Leap",
        value: "Mage",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    }).addTextInput({
        configName: "fastLeapS4",
        title: "Player to leap to in S4",
        description: "You can either input the name of a class or a player name.",
        category: "Leap",
        value: "Mage",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    })
    .addSwitch({
        configName: "pyFastLeap",
        title: "Fast Leap On Purple Pad",
        description: "",
        category: "Leap",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    }).addTextInput({
        configName: "fastLeapPP",
        title: "Player to leap to on Purple Pad",
        description: "You can either input the name of a class or a player name.",
        category: "Leap",
        subcategory: "Fast Leap",
        value: "Mage",
        shouldShow: data => data.fastLeap && data.pyFastLeap
    })
    .addSwitch({
        configName: "secretAuraEnabled",
        title: "Secret Aura Toggle",
        description: "CT secret aura...",
        category: "Block Aura"
    })
    .addSwitch({
        configName: "secretAuraDungeonsOnly",
        title: "Dungeons Only",
        description: "Only enable in dungeons",
        category: "Block Aura"
    })
    .addKeybind({
        configName: "secretAuraToggleKeybind",
        title: "Secret Aura Keybind",
        description: "Also resets clicked blocks when pressed. Also, using this option causes a fucking memory leak cause Amaterasu is extremely retarded so maybe allocate more ram or something idk",
        category: "Block Aura"
    })
    .addKeybind({
        configName: "secretAuraClearBlocksKeybind",
        title: "Clear BlocksKeybind",
        description: "Resets clicked blocks when pressed.",
        category: "Block Aura"
    })
    .addTextInput({
        configName: "secretAuraItem",
        title: "Item to swap to",
        description: "You can either set this to a number to choose a static hotbar slot or swap to an item with a specific name.",
        category: "Block Aura"
    })
    .addSwitch({
        configName: "secretAuraSwapBack",
        title: "Swap Back",
        description: "Swap back to previously held item after clicking",
        category: "Block Aura"
    })
    .addSwitch({
        configName: "randomColors",
        title: "Math.random() chat messages",
        description: "Changes the color of all chat messages printed by Carbonara",
        category: "Mod",
        value: true
    })
    .addSwitch({
        configName: "relicPickupAura",
        title: "Relic Pickup Aura",
        description: "Aura to pick up the relic",
        category: "Wither King"
    })
    .addSwitch({
        configName: "relicPlaceAura",
        title: "Relic Place Aura",
        description: "Aura to place up the relic",
        category: "Wither King"
    })
    .addSwitch({
        configName: "autoLeapOnRelic",
        title: "Auto Leap on Relic Pickup",
        description: "You need to open the menu yourself and use Relic Pickup Aura for this to work.",
        category: "Wither King"
    })
    .addTextInput({
        configName: "autoLeapOnRelicName",
        title: "Player to leap to after picking up the relic",
        description: "You can either input the name of a class or a player name.",
        category: "Wither King",
        value: "Healer",
        shouldShow: data => data.autoLeapOnRelic
    })
    .addTextInput({
        configName: "autoLeapOnRelicDelay",
        title: "Delay before clicking in the leap menu",
        description: "Milliseconds.",
        category: "Wither King",
        value: "150",
        shouldShow: data => data.autoLeapOnRelic
    })
    .addSwitch({
        configName: "blinkRelics",
        title: "Blink Relics",
        description: "More leniency than cgy for where you can stand.",
        category: "Wither King"
    })



const mySettings = new Settings("CarbonaraAddons", config, "ColorScheme.json")
export default () => mySettings.settings
