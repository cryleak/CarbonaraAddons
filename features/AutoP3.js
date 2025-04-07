import RenderLibV2 from "../../RenderLibV2"
import Settings from "../config"
import AutoP3Config from "./AutoP3Management"
import fakeKeybinds from "../utils/fakeKeybinds"

import { clickAt } from "../utils/serverRotations"
import { onMotionUpdate, playerCoords, releaseMovementKeys, rotate, setWalking, swapFromItemID, swapFromName } from "../utils/autoP3Utils"
import { chat, scheduleTask } from "../utils/utils"
import { getDistance2D, getDistanceToCoord } from "../../BloomCore/utils/Utils"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
let motionRunning = false
let motionYaw = Player.getYaw()
let movementPacketsSent = 0
let missingPackets = 0
let blinkEnabled = false
let awaitingMotionUpdate = false

register("renderWorld", () => {
    const settings = Settings()
    if (!settings.autoP3Enabled) return
    if (!World.isLoaded()) return
    for (let i = 0; i < AutoP3Config.config.length; i++) {
        let node = AutoP3Config.config[i]
        let position = node.position
        let color
        if (settings.displayIndex) Tessellator.drawString(`index: ${i}, type: ${node.type}`, ...position, 16777215, true, 0.02, false)


        if (AutoP3Config.config.triggered || Date.now() - AutoP3Config.config.lastTriggered < 1000) color = [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]
        if (AutoP3Config.config.triggered || Date.now() - AutoP3Config.config.lastTriggered < 1000) color = [1, 0, 0, 1]
        else color = [settings.nodeColor[0] / 255, settings.nodeColor[1] / 255, settings.nodeColor[2] / 255, settings.nodeColor[3] / 255]
        RenderLibV2.drawCyl(position[0], position[1] + 0.01, position[2], node.radius, node.radius, 0, 60, 1, 90, 0, 0, ...color, false, true)
    }
})

register("step", () => {
    const playerPosition = playerCoords().camera
    for (let i = 0; i < AutoP3Config.config.length; i++) { // Did you know for loops in Rhino are technically faster than forEach?
        let node = AutoP3Config.config[i]
        let nodePosition = node.position
        let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePosition[0], nodePosition[2])
        let yDistance = playerPosition[1] - nodePosition[1]
        if (distance < node.radius && yDistance <= node.height && yDistance >= 0) {
            if (node.triggered) continue
            if (Date.now() - node.lastTriggered < 1000) continue
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
                scheduleTask(0, () => {
                    if (node.look) rotate(node.yaw, node.pitch)
                    nodeTypes[node.type](node)
                })
            }
            if (node.delay) {
                let execDelay = Math.ceil(parseInt(node.delay) / 50) // Round to nearest tick
                scheduleTask(execDelay, () => {
                    playerPosition = playerCoords().player
                    let distance = getDistance2D(playerPosition[0], playerPosition[2], nodePosition[0], nodePosition[2])
                    let yDistance = playerPosition[1] - nodePosition[1]
                    if (distance < node.radius && yDistance <= node.height && yDistance >= 0) performNode()
                })
            } else performNode()
        } else node.triggered = false
    }
}).setFps(200)

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
        return
    },
    blinkvelo: args => {
        const awaitVeloPacket = register("packetReceived", (packet, event) => {
            if (Player.getPlayer().func_145782_y() !== packet.func_149412_c()) return
            if (packet.func_149410_e() !== 28000) return
            awaitVeloPacket.unregister()
            blink = true
        }).setFilteredClass(S12PacketEntityVelocity)

        const awaitLivingUpdate = register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
            if (event.entity !== Player.getPlayer()) return

            awaitLivingUpdate.unregister()
        })
    }
}

fakeKeybinds.onKeyPress("packetChargeKeybind", () => {
    blinkEnabled = !blinkEnabled
    if (blinkEnabled) {
        renderText.register()
        packetCollector.register()
    } else {
        renderText.unregister()
        packetCollector.unregister()
    }
})

register("tick", (ticks) => {
    if (ticks % 20 !== 0) return
    missingPackets += 20 - movementPacketsSent
    movementPacketsSent = 0
})

register("packetReceived", () => {
    movementPacketsSent--
}).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)

register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (!event.isCancelled()) movementPacketsSent++
    })
}).setFilteredClasses([C03PacketPlayer])

const renderText = register("renderOverlay", () => {
    Renderer.scale(1)
    const text = `${missingPackets}`
    Renderer.drawString(text, Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)
}).unregister()

const packetCollector = register("packetSent", (packet, event) => {
    if (!awaitingMotionUpdate) return
    awaitingMotionUpdate = false

    let cancelPacket = true

    const onGround = packet.func_149465_i()
    if (onGround !== lastPacketState.onGround) cancelPacket = false
    lastPacketState.onGround = onGround
    if (packet.func_149463_k() && Settings().allowRotations) { // If rotating
        const [yaw, pitch] = [packet.func_149462_g(), packet.func_149470_h()]
        if (lastPacketState.rotation.yaw !== yaw || lastPacketState.rotation.pitch !== pitch) cancelPacket = false
        lastPacketState.rotation.yaw = yaw
        lastPacketState.rotation.pitch = pitch
    }
    if (packet.func_149466_j()) {// If moving
        const currentPosition = { x: packet.func_149464_c(), y: packet.func_149467_d(), z: packet.func_149472_e() }
        if (Object.values(currentPosition).some((coord, index) => coord !== Object.values(lastPacketState.pos)[index])) cancelPacket = false
        lastPacketState.pos.x = currentPosition.x
        lastPacketState.pos.y = currentPosition.y
        lastPacketState.pos.z = currentPosition.z
    }

    if (!cancelPacket) return
    cancel(event)
}).setFilteredClass(C03PacketPlayer).unregister()

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    awaitingMotionUpdate = true
    if (!motionRunning) return
    onMotionUpdate(motionYaw)
})