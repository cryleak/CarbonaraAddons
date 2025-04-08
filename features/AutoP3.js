import RenderLibV2 from "../../RenderLibV2"
import Settings from "../config"
import AutoP3Config from "./AutoP3Management"
import fakeKeybinds from "../utils/fakeKeybinds"

import { clickAt } from "../utils/serverRotations"
import { hclip, jump, movementKeys, onMotionUpdate, playerCoords, releaseMovementKeys, rotate, setWalking, swapFromItemID, swapFromName, onLivingUpdate, parseBlinkFile, getBlinkRoutes } from "../utils/autoP3Utils"
import { chat, debugMessage, scheduleTask } from "../utils/utils"
import { getDistance2D, getDistanceToCoord } from "../../BloomCore/utils/Utils"
import { onChatPacket } from "../../BloomCore/utils/Events"
import { blink } from "./Blink"
import { registerSubCommand } from "../utils/commands"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")
let motionRunning = false
let motionYaw = Player.getYaw()
let inP3 = false
let inBoss = false
global.cryleak ??= {}
global.cryleak.autop3 ??= {}
global.cryleak.autop3.lastBlink = Date.now()

register("renderWorld", () => {
    const settings = Settings()
    if (!settings.autoP3Enabled) return
    if (!World.isLoaded()) return
    if (settings.onlyP3 && !inP3) return
    if (!inBoss) return
    if (!AutoP3Config.config) return
    for (let i = 0; i < AutoP3Config.config.length; i++) {
        let node = AutoP3Config.config[i]
        let position = node.position
        let color
        if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${node.type}`, ...position, 16777215, true, 0.02, false)


        if (node.triggered || Date.now() - node.lastTriggered < 1000) color = [1, 0, 0, 1]
        else color = [settings.nodeColor[0] / 255, settings.nodeColor[1] / 255, settings.nodeColor[2] / 255, settings.nodeColor[3] / 255]
        RenderLibV2.drawCyl(position[0], position[1] + 0.01, position[2], node.radius, node.radius, 0, 60, 1, 90, 0, 0, ...color, false, true)
    }
    if (settings.editMode) return
    executeNodes(playerCoords().camera)
})

function executeNodes(playerPosition) {
    for (let i = 0; i < AutoP3Config.config.length; i++) { // Did you know for loops in Rhino are technically faster than forEach?
        let node = AutoP3Config.config[i]
        let nodePosition = node.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePosition[0], nodePosition[2])
        let yDistance = playerPosition[1] - nodePosition[1]
        if (distance < node.radius && yDistance <= node.height && yDistance >= 0) {
            if (node.triggered) continue
            if (Date.now() - node.lastTriggered < 1000) continue
            if (blinking && node.delay) continue
            if (blinking && ["blink", "blinkvelo", "superboom", "useitem"].includes(node.type)) continue
            node.triggered = true
            if (node.center) {
                debugMessage(`Distance to center: ${getDistanceToCoord(...nodePosition, false)}`)
                Player.getPlayer().func_70107_b(nodePosition[0], nodePosition[1], nodePosition[2])
                releaseMovementKeys()
                Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
            } else if (node.stop) {
                motionRunning = false
                releaseMovementKeys()
                Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
            }
            let performNode = () => {
                node.lastTriggered = Date.now()
                if (node.look) rotate(node.yaw, node.pitch)
                nodeTypes[node.type](node)
            }
            if (node.delay) {
                let execDelay = Math.ceil(parseInt(node.delay) / 50) // Round to nearest tick
                scheduleTask(execDelay, () => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePosition[0], nodePosition[2])
                    let yDistance = playerPosition[1] - nodePosition[1]
                    if (distance < node.radius && yDistance <= node.height && yDistance >= 0) performNode()
                })
            } else {
                if (blinking) performNode()
                else scheduleTask(0, performNode)
            }
        } else if (!node.once) node.triggered = false
    }
}

const nodeTypes = {
    look: args => {
        rotate(args.yaw, args.pitch)
    },
    walk: args => {
        motionRunning = false
        rotate(args.yaw, args.pitch)
        setWalking(true)
    },
    useitem: args => {
        const success = swapFromName(args.itemName)
        if (success[0] === "CANT_FIND") return

        clickAt(args.yaw, args.pitch)
    },
    superboom: args => {
        const success = swapFromItemID(46)
        if (success[0] === "CANT_FIND") return chat("Can't find superboom in your hotbar!")

        rotate(args.yaw, args.pitch)
        scheduleTask(0, () => {
            if (success[1] !== Player.getHeldItemIndex()) return chat("You are somehow holding the wrong item...")
            leftClick()
        })
    },
    motion: args => {
        motionYaw = args.yaw
        motionRunning = true
    },
    stopvelocity: args => {
        motionRunning = false
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
    },
    fullstop: args => {
        motionRunning = false
        releaseMovementKeys()
        Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0)
    },
    blink: args => {
        blink(args.blinkRoute)
    },
    blinkvelo: args => {
        blinkVeloTicks = args.ticks
        awaitVelocity.register()
    },
    jump: args => {
        jump()
    },
    hclip: args => {
        hclip(args.yaw)
    }
}

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (!motionRunning) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (!movementKeys.includes(keyCode)) return
    motionRunning = false
})

onChatPacket(() => {
    inP3 = true
    if (Settings().activateConfigOnP3Start) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().p3StartConfig)
}).setCriteria("[BOSS] Goldor: Who dares trespass into my domain?")

onChatPacket(() => {
    if (Settings().activateConfigOnBoss) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().bossStartConfig)
}).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!")

registerSubCommand("startp3", () => {
    inP3 = true
    inBoss = true
    if (Settings().activateConfigOnP3Start) Settings().getConfig().setConfigValue("AutoP3", "configName", Settings().p3StartConfig)
    chat("Started P3!")
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
})

// blink velocity because for somer eason it just fucking breaks if i put it in the blink file
let blinkVelo = false
let blinkVeloTicks = 0
let blinking = false


register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (motionRunning) onMotionUpdate(motionYaw)
})


const awaitVelocity = register("packetReceived", (packet) => {
    if (Player.getPlayer().func_145782_y() !== packet.func_149412_c()) return
    if (packet.func_149410_e() !== 28000) return
    awaitVelocity.unregister()

    blinkVelo = true
}).setFilteredClass(S12PacketEntityVelocity).unregister()

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => { // The game fucking crashes if i don't perform this in a fresh scope, no idea why???
    if (event.entity !== Player.getPlayer()) return
    if (!blinkVelo) return

    cancel(event)
    blinkVelo = false
    blinking = true
    for (let i = 0; i < blinkVeloTicks; i++) {
        if (motionRunning) onMotionUpdate(motionYaw)
        onLivingUpdate()
        Player.getPlayer().func_70636_d()
        Player.getPlayer().func_175161_p()
        executeNodes(playerCoords().player)
    }
    global.cryleak.autop3.lastBlink = Date.now()
    blinking = false
})