import DefaultConfig from "../Amaterasu/core/DefaultConfig"
import Settings from "../Amaterasu/core/Settings"
import migration from "./settingMigration";

migration.execute();

export const packetCounterGui = new Gui()
const config = new DefaultConfig("CarbonaraAddons", "data/settings.json")

config
    .addSwitch({
        configName: "displayIndex",
        title: "Display index and type of nodes on screen",
        description: "Helpful for deleting and editing nodes.",
        category: "Node Rendering",
        value: false
    })
    .addSwitch({
        configName: "nodeRGB",
        title: "RGB Nodes",
        description: "Professional RGB nodes that change color.",
        category: "Node Rendering",
        value: false
    })
    .addSlider({
        configName: "nodeRGBSpeed",
        title: "RGB Speed",
        description: "",
        category: "Node Rendering",
        options: [1.001, 10],
        value: 1.0,
        shouldShow: data => data.nodeRGB
    })
    .addColorPicker({
        configName: "nodeColor",
        title: "Node Colors",
        description: "",
        category: "Node Rendering",
        value: [0, 255, 255, 255],
    })
    .addColorPicker({
        configName: "smallNodeColor",
        title: "Small Node Colors",
        description: "Colors for the 0 radius ones",
        category: "Node Rendering",
        value: [0, 0, 255, 255],
    })
    .addSlider({
        configName: "smallNodeRadius",
        title: "Small Node Radius",
        description: "Visual radius for nodes with zero radius (aka you need to stand exactly on it)",
        category: "Node Rendering",
        options: [0.001, 1],
        value: "0.2",
    })
    .addTextInput({
        configName: "nodeSlices",
        title: "Node Slices",
        description: "The amount of triangles that makes up one ring. It becomes more circular with a higher value but will have worse performance.",
        category: "Node Rendering",
        value: "3",
    })
    .addTextInput({
        configName: "lineWidth",
        title: "Line Width",
        description: "The width of the lines that connect nodes.",
        category: "Node Rendering",
        value: "6"
    })
    .addKeybind({
        configName: "hClipKeybind",
        title: "HClip Keybind",
        description: "Manual HClip",
        category: "AutoP3"
    })
    .addSwitch({
        configName: "goonMotion",
        title: "Retard motion",
        description: "Maybe works idk",
        category: "AutoP3",
        value: false
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
    .addSwitch({
        configName: "autoRoutesEnabled",
        title: "Toggle",
        description: "",
        category: "AutoRoutes"
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
        category: "Leap",
        configName: "defaultPlayerLeap",
        title: "Leap Name",
        description: "Name or class to default to.",
        value: "",
        placeHolder: "",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    })
    .addSwitch({
        category: "Leap",
        configName: "positionalLeap",
        title: "Toggle",
        description: "Whether to use custom boxes for leaps or not.",
        subcategory: "Fast Leap",
        shouldShow: data => data.fastLeap
    })
    .addSwitch({
        category: "Leap",
        configName: "drawPositionalLeap",
        title: "Draw",
        description: "Whether to draw positional leaps or not.",
        subcategory: "Fast Leap",
        shouldShow: data => data.positionalLeap && data.fastLeap
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
    .addDropDown({
        configName: "secretAuraSwapOn",
        title: "Swap on",
        description: "Select an option",
        category: "Block Aura",
        options: ["None", "Essence", "All"]
    })
    .addTextInput({
        configName: "secretAuraItem",
        title: "Item to swap to",
        description: "You can either set this to a number to choose a static hotbar slot or swap to an item with a specific name.",
        category: "Block Aura",
        shouldShow: data => data.secretAuraSwapOn !== 0
    })
    .addSwitch({
        configName: "secretAuraSwapBack",
        title: "Swap Back",
        description: "Swap back to previously held item after clicking",
        category: "Block Aura",
        shouldShow: data => data.secretAuraSwapOn !== 0
    })
    .addSwitch({
        configName: "randomColors",
        title: "Math.random() chat messages",
        description: "Changes the color of all chat messages printed by Carbonara",
        category: "Mod",
        value: true
    })
    .addSwitch({
        configName: "debugMessages",
        title: "Debug Messages",
        description: "Prints debug messages in chat",
        category: "Mod",
        value: false
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
        description: "Aura to place the relic",
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
    .addSwitch({
        configName: "zpewEnabled",
        title: "Toggle",
        description: "",
        category: "Zero Ping TP",
    })
    .addSwitch({
        configName: "singleplayer",
        title: "Singleplayer mode",
        description: "Detects Iron Sword and Diamond Shovel as teleport items. This mode also disables all failsafes so disable it before you log on Hypixel probably",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSlider({
        configName: "maxFails",
        title: "Max fails in last 20 seconds",
        description: "Note that you will probably get banned regardless of if you fail 1000 times in 20 minutes or 1 minute (on the same server) due to how timer balance works. You can try using the option to cancel movement packets in this mod.",
        category: "Zero Ping TP",
        options: [3, 20],
        value: 3,
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "aotv",
        title: "Toggle Instant Transmission",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "ether",
        title: "Toggle Etherwarp",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "hype",
        title: "Toggle Hyperion",
        description: "This will still trigger if you enable Zero Ping TP On All Items",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "etherLeftClick",
        title: "Etherwarp Left Click",
        description: "This makes left clicking an etherwarp teleport you without 0 ping, useful for starting routes.",
        category: "Zero Ping TP",
        shouldShow: data => data.zpewEnabled
    })
    .addSwitch({
        configName: "doorlessEnabled",
        title: "Toggle",
        description: "Allows you to go through doors without opening them.",
        category: "Doorless",
        value: false
    })
    .addTextInput({
        configName: "doorlessPacketAmount",
        title: "Amount of packets",
        description: "How many positions to use to go through the door.",
        category: "Doorless",
        value: "0.925,0.925",
        shouldShow: data => data.doorlessEnabled
    })
    .addSwitch({
        configName: "schizoDoorsEnabled",
        title: "Toggle",
        description: "Allows you to go blood instantly when the run starts.",
        category: "Doorless",
        value: false
    })
    .addSwitch({
        configName: "schizoDoorsTacticalInsertion",
        title: "Use tactical insertion",
        description: "this isnt added turn this shit off",
        category: "Doorless",
        value: false,
        shouldShow: data => data.schizoDoorsEnabled
    })
    .addKeybind({
        configName: "mosquitoShortbowSwapKeybind",
        title: "Mosquito Shortbow Swap Keybind",
        description: "Swaps to Mosquito Shortbow, and then swaps to Warden Helmet (if not in P2), and then to a Fabled End Sword",
        category: "Swaps"
    })
    .addSwitch({
        configName: "mosquitoSwapToHype",
        title: "Swap to Hyperion for P2 and P3",
        description: "Does this work? Yes. -1mi0",
        category: "Swaps",
        value: false,
        shouldShow: data => data.mosquitoShortbowSwapKeybind
    })
    .addSwitch({
        configName: "armorSetToggle",
        title: "Toggle between 2 armor sets",
        description: "",
        category: "Swaps",
        value: false
    })
    .addKeybind({
        configName: "armorSetToggleKeybind",
        title: "Armor Set Toggle Keybind",
        description: "DO NOT USE THIS IF YOUR ARMOR IS ON THE SECOND PAGE OF THE WARDROBE PROBABLY",
        category: "Swaps",
        shouldShow: data => data.armorSetToggle
    })
    .addSlider({
        configName: "armorSetToggleSlot1",
        title: "First Wardrobe slot for toggling",
        description: "",
        category: "Swaps",
        options: [0, 8],
        value: 0,
        shouldShow: data => data.armorSetToggle
    })
    .addSlider({
        configName: "armorSetToggleSlot2",
        title: "Second Wardrobe slot for toggling",
        description: "",
        category: "Swaps",
        options: [0, 8],
        value: 0,
        shouldShow: data => data.armorSetToggle
    })


const mySettings = new Settings("CarbonaraAddons", config, "ColorScheme.json")

export default () => mySettings.settings
