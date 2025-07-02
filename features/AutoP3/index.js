import "./ConfigConverter"

import RenderLibV2 from "../../../RenderLibV2J"
import Settings from "../../config"
import AutoP3Config from "./AutoP3Management"
import Dungeons from "../../utils/Dungeons"
import fakeKeybinds from "../../utils/fakeKeybinds"
import Blink from "./Blink"
import Motion from "../../utils/Motion"
import LivingUpdate from "../../events/LivingUpdate"
import Vector3 from "../../../BloomCore/utils/Vector3"
import Rotations from "../../utils/Rotations"

import { Terminal, jump, getTermPhase } from "./autoP3Utils"
import { chat, scheduleTask, movementKeys, playerCoords, releaseMovementKeys, repressMovementKeys, rotate, setWalking, swapFromItemID, swapFromName, setVelocity, findAirOpening, leftClick, setPlayerPosition, checkIntersection, sendAirClick, removeCameraInterpolation, itemSwapSuccess } from "../../utils/utils"
import { onChatPacket } from "../../../BloomCore/utils/Events"
import { registerSubCommand } from "../../utils/commands"

const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
const activeBlinkRoutes = new Set()
let inP3 = false
let inBoss = false
let awaitingTerminal = false
let awaitingLeap = false
let awaitLeapExcludeClass = ""
let previousCoords = new Vector3(Player.x, Player.y, Player.z)

register("renderWorld", () => {
    const settings = Settings()
    if (!settings.autoP3Enabled || !World.isLoaded() || settings.onlyP3 && !inP3 || !inBoss || !AutoP3Config.config) return
    const slices = isNaN(settings.nodeSlices) ? 2 : settings.nodeSlices
    for (let i = 0; i < AutoP3Config.config.length; i++) {
        let node = AutoP3Config.config[i]
        let position = node.position
        let color
        if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${node.type}`, ...position, 16777215, true, 0.02, false)


        if (node.triggered || Date.now() - node.lastTriggered < 1000 || awaitingTerminal || awaitingLeap) color = [1, 0, 0, 1]
        else color = [settings.nodeColor[0] / 255, settings.nodeColor[1] / 255, settings.nodeColor[2] / 255, settings.nodeColor[3] / 255]
        RenderLibV2.drawCyl(position[0], position[1] + 0.01, position[2], node.radius, node.radius, 0, slices, 1, 90, 45, 0, ...color, true, true)
        if (node.type === "blink") activeBlinkRoutes.add(node.blinkRoute)
    }
    if (settings.renderBlinkRoutes) {
        const routes = Object.keys(Blink.blinkRoutes)
        for (let i = 0; i < routes.length; i++) {
            let name = routes[i]
            if (settings.renderActiveBlinkRoutes && !activeBlinkRoutes.has(name.split(".sereniblink")[0])) continue
            let packets = Blink.blinkRoutes[name]
            for (let i = 0; i < packets.length; i++) {
                let packet1 = packets[i]
                let packet2 = packets[i + 1]
                if (!packet1 || !packet2) continue
                //     drawLine(double x1, double y1, double z1, double x2, double y2, double z2, float red, float green, float blue, float alpha, boolean phase) {
                RenderLibV2.drawLine(packet1[0], packet1[1], packet1[2], packet2[0], packet2[1], packet2[2], 1, 1, 1, 1, false, 2)
            }
            let packet1 = packets[0]
            let packet2 = packets[packets.length - 1]
            if (!packet1 || !packet2) continue
            RenderLibV2.drawInnerEspBox(packet1[0], packet1[1], packet1[2], 0.5, 0.5, 0, 1, 0, 0.25, true)
            RenderLibV2.drawEspBox(packet1[0], packet1[1], packet1[2], 0.5, 0.5, 0, 1, 0, 1, true)
            Tessellator.drawString(`Start of route "${name.split(".sereniblink")[0]}", route requires ${packets.length} packets`, packet1[0], packet1[1], packet1[2], 16777215, true, 0.02, false)

            RenderLibV2.drawInnerEspBox(packet2[0], packet2[1], packet2[2], 0.5, 0.5, 1, 0, 0, 0.25, true)
            RenderLibV2.drawEspBox(packet2[0], packet2[1], packet2[2], 0.5, 0.5, 1, 0, 0, 1, true)
        }
    }
})

register("tick", () => {
    const settings = Settings()
    if (!settings.autoP3Enabled || !World.isLoaded() || settings.onlyP3 && !inP3 || !inBoss || !AutoP3Config.config || settings.editMode) return
    executeNodes(playerCoords().player)
})

register("packetReceived", (packet, event) => { // Avoid checking for intersections when you get teleported by the server.
    previousCoords = new Vector3(packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e())
}).setFilteredClass(S08PacketPlayerPosLook)

function executeNodes(playerPosition) {
    if (!awaitingTerminal && !awaitingLeap) {
        // Sort this shit because I need to trigger await nodes first and I no longer care about performance
        const nodes = [...AutoP3Config.config].sort((a, b) => (a.type === "awaitterminal" || a.type === "awaitleap" ? -1 : (b.type === "awaitterminal" || b.type === "awaitleap" ? 1 : 0)))
        for (let i = 0; i < nodes.length; i++) { // Did you know for loops in Rhino are technically faster than forEach?
            let node = nodes[i]
            let nodePosition = node.position
            let hasPassedThroughRing = checkIntersection(previousCoords, new Vector3(...playerPosition), new Vector3(...nodePosition), node.radius, node.height)
            if (hasPassedThroughRing) {
                if (node.triggered) continue
                if (Date.now() - node.lastTriggered < 1000) continue
                if (blinkingVelo && node.delay) continue
                if (blinkingVelo && ["blink", "blinkvelo", "superboom", "useitem", "awaitterminal", "awaitleap"].includes(node.type)) continue
                node.triggered = true
                if (node.center) {
                    // debugMessage(`Distance to center: ${getDistanceToCoord(...nodePosition, false)}`)
                    Player.getPlayer().func_70107_b(nodePosition[0], nodePosition[1], nodePosition[2])
                    Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
                }
                if (node.stop) {
                    Motion.running = false
                    releaseMovementKeys()
                    Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
                }
                let performNode = () => {
                    if (awaitingTerminal || awaitingLeap) {
                        node.triggered = false
                        return
                    }
                    node.lastTriggered = Date.now()
                    if (node.look) rotate(node.yaw, node.pitch)
                    nodeTypes[node.type](node)
                }
                if (node.delay) scheduleTask(Math.round(parseInt(node.delay) / 50), performNode)
                else performNode()
            } else if (!node.once) node.triggered = false
        }
    }
    previousCoords = new Vector3(Player.x, Player.y, Player.z)
}

const nodeTypes = {
    look: args => {
        rotate(args.yaw, args.pitch)
    },
    walk: args => {
        Motion.running = false
        setWalking(true)
    },
    useitem: args => {
        const success = swapFromName(args.itemName)
        if (success === itemSwapSuccess.FAIL) return

        Rotations.rotate(args.yaw, args.pitch, () => {
            sendAirClick()
        })
    },
    superboom: args => {
        const success = swapFromItemID(46)
        if (success === itemSwapSuccess.FAIL) return chat("Can't find superboom in your hotbar!")

        rotate(args.yaw, args.pitch)
        scheduleTask(0, () => {
            if (success[1] !== Player.getHeldItemIndex()) return chat("You are somehow holding the wrong item...")
            leftClick()
        })
    },
    motion: args => {
        releaseMovementKeys()
        Motion.running = true
        Motion.yaw = args.yaw
        Motion.lastX = 0
        Motion.lastZ = 0
        Motion.airTicks = Settings().goonMotion ? -1 : 0 // Dumb fix to let you regain velocity midair with retard motion

        if (!Player.getPlayer().field_70122_E) {
            Motion.running = false
            setVelocity(0, null, 0)
            LivingUpdate.scheduleTask(1, () => {
                Motion.running = true
            })
        }
    },
    stopvelocity: args => {
        Motion.running = false
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
    },
    fullstop: args => {
        Motion.running = false
        releaseMovementKeys()
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
    },
    blink: args => {
        Motion.running = false
        Blink.executeBlink(args.blinkRoute)

        if (args.stop) {
            setVelocity(0, null, 0)
            releaseMovementKeys()
        }
    },
    blinkvelo: args => {
        blinkVeloTicks = args.ticks
        if (args.awaitLavaBounce || !args.awaitLavaBounce && args.awaitLavaBounce !== false) awaitVelocity.register()
        else {
            awaitingBlinkVelo = true

        }
    },
    jump: args => {
        jump()
    },
    hclip: args => {
        Motion.running = false
        const clip = () => {
            releaseMovementKeys()
            setVelocity(0, null, 0)
            LivingUpdate.scheduleTask(1, () => {
                const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * (43 / 15)
                const radians = args.yaw * Math.PI / 180
                setVelocity(-Math.sin(radians) * speed, null, Math.cos(radians) * speed)
            })
            LivingUpdate.scheduleTask(2, repressMovementKeys)
        }

        if (Player.getPlayer().field_70122_E && args.jumpOnHClip) {
            jump()
            scheduleTask(2, clip)
        } else clip()

    },
    awaitterminal: args => {
        Motion.running = false
        releaseMovementKeys()
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        awaitingTerminal = true
        chat("Awaiting terminal open. Blocking nodes.")
    },
    awaitleap: args => {
        Motion.running = false
        releaseMovementKeys()
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
        awaitingLeap = true
        awaitLeapExcludeClass = args.excludeClass
        chat("Waiting for party members to leap. Blocking nodes.")
    },
    lavaclip: args => {
        chat("VClipping when you enter lava.")

        const vclip = register("tick", () => {
            if (!Player.getPlayer().func_180799_ab()) return
            veloPacket.register()
            vclip.unregister()
            setPlayerPosition(Player.getX(), args.lavaClipDistance == 0 ? findAirOpening() : Player.getY() - args.lavaClipDistance, Player.getZ())
            removeCameraInterpolation()
        })
        scheduleTask(100, () => vclip.unregister())

        const veloPacket = register("packetReceived", (packet, event) => {
            if (Player.getPlayer().func_145782_y() !== packet.func_149412_c()) return
            if (packet.func_149410_e() !== 28000) return
            cancel(event)
            veloPacket.unregister()
            vclip.unregister()
        }).setFilteredClass(S12PacketEntityVelocity).unregister()
    }
}

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (!movementKeys.includes(keyCode)) return
    Motion.running = false
    awaitingTerminal = false
    awaitingLeap = false
})

fakeKeybinds.onKeyPress("hClipKeybind", () => nodeTypes["hclip"]({ yaw: Player.getYaw(), jumpOnHClip: true }))

onChatPacket(() => {
    inP3 = true
    if (Settings().activateConfigOnP3Start) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().p3StartConfig)
    Client.scheduleTask(1, resetTriggeredState)
}).setCriteria("[BOSS] Goldor: Who dares trespass into my domain?")

onChatPacket(() => {
    if (Settings().activateConfigOnBoss) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().bossStartConfig)
    Client.scheduleTask(1, resetTriggeredState)
}).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!")

registerSubCommand("start", (args) => {
    const phase = args[0]?.toLowerCase()
    if (phase === "p3") {
        inP3 = true
        inBoss = true
        chat("Started P3!")
        if (Settings().activateConfigOnP3Start) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().p3StartConfig)
    } else if (phase === "boss") {
        inP3 = false
        inBoss = true
        chat("Started Boss!")
        if (Settings().activateConfigOnBoss) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().bossStartConfig)
    } else return chat("Invalid phase!")
    Client.scheduleTask(1, resetTriggeredState)
}, () => ["p3", "boss"])

registerSubCommand(["resetroutes", "rr"], () => {
    resetTriggeredState()
    chat("Reset triggered state.")
})

registerSubCommand(["editmode", "em"], () => {
    Settings().getConfig().setConfigValue("AutoP3", "editMode", !Settings().editMode)
    chat(`Edit mode ${Settings().editMode ? "enabled" : "disabled"}.`)
})

onChatPacket(() => {
    inBoss = true
}).setCriteria(/^\[BOSS\] (?:Maxor|Storm|Goldor|Necron): .+$/)

register("worldLoad", () => {
    inP3 = false
    inBoss = false
})

Settings().getConfig().registerListener("configName", (previousValue, value) => {
    if (previousValue === value) return
    AutoP3Config.onConfigNameUpdate(value)
    activeBlinkRoutes.clear()
})

function resetTriggeredState() {
    for (let i = 0; i < AutoP3Config.config.length; i++) {
        let node = AutoP3Config.config[i]
        node.triggered = false
    }
}

register("step", () => {
    if (Terminal.inTerminal && awaitingTerminal) {
        chat("Terminal opened. No longer blocking nodes.")
        awaitingTerminal = false
    }
    if (awaitingLeap) {
        const players = World.getAllPlayers()
        const party = Dungeons.teamMembers
        const partyNames = Object.keys(party)
        if (partyNames.every(partyMember => {
            const teamMember = players.find(player => player.getName() === partyMember)
            if (!teamMember && party[partyMember].dungeonClass !== awaitLeapExcludeClass && partyMember !== awaitLeapExcludeClass) return false
            return Player.getName() === partyMember || party[partyMember].dungeonClass === awaitLeapExcludeClass || partyMember === awaitLeapExcludeClass || getTermPhase([teamMember.getX(), teamMember.getY(), teamMember.getZ()]) === getTermPhase(playerCoords().player)
        })) {
            chat("All players that are supposed to leap have leaped. No longer blocking nodes.")
            awaitingLeap = false
        }
    }
})

registerSubCommand(["simulateterminalopen", "simulatetermopen", "simtermopen"], () => {
    Terminal.inTerminal = true
    Client.scheduleTask(10, () => Terminal.inTerminal = false)
})

registerSubCommand("center", () => {
    setPlayerPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5)
    removeCameraInterpolation()
    setVelocity(0, null, 0)
    chat("Centered the player.")
})

register("worldUnload", () => {
    awaitingLeap = false
    awaitingTerminal = false
    Motion.running = false
    inP3 = false
    inBoss = false
    awaitVelocity.unregister()
    awaitingBlinkVelo = false
    blinkingVelo = false
})

// blink velocity because for some reason it just fucking breaks if i put it in the blink file
let awaitingBlinkVelo = false
let blinkVeloTicks = 0
let blinkingVelo = false

const awaitVelocity = register("packetReceived", (packet) => {
    if (Player.getPlayer().func_145782_y() !== packet.func_149412_c()) return
    if (packet.func_149410_e() !== 28000) return
    awaitVelocity.unregister()

    awaitingBlinkVelo = true
}).setFilteredClass(S12PacketEntityVelocity).unregister()

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!awaitingBlinkVelo) return
    awaitingBlinkVelo = false
    if (!global.carbonara.autop3.blinkEnabled) return chat("Blink is disabled!")
    if (blinkVeloTicks > global.carbonara.autop3.missingPackets.length) return chat("Not enough packets!")
    const start = System.nanoTime()

    cancel(event)
    blinkingVelo = true
    for (let i = 0; i < blinkVeloTicks; i++) {
        if (!LivingUpdate.trigger()) continue
        Player.getPlayer().func_70636_d()
        Player.getPlayer().func_175161_p()
        executeNodes(playerCoords().player)
    }
    setPlayerPosition(Player.getX(), Player.getY(), Player.getZ())
    removeCameraInterpolation()
    const end = System.nanoTime()
    chat(`Blinked ${blinkVeloTicks} physics ticks. (Took ${(end - start) / 1000000}ms to calculate physics)`)
    global.carbonara.autop3.lastBlink = Date.now()
    blinkingVelo = false
})
