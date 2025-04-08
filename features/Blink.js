import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import RenderLibV2 from "../../RenderLibV2"

import { getBlinkRoutes } from "../utils/autop3utils"
import { chat } from "../utils/utils"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const lastPacketState = {
    pos: { x: null, y: null, z: null },
    onGround: null,
    rotation: { yaw: null, pitch: null }
}
let movementPacketsSent = 0
let missingPackets = 0
let blinkEnabled = false
let awaitingMotionUpdate = false

register("tick", () => {
    missingPackets += 1 - movementPacketsSent
    movementPacketsSent = 0
})

register("packetReceived", () => {
    movementPacketsSent--
}).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)

register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (!event.isCancelled()) movementPacketsSent++
    })
}).setFilteredClass(C03PacketPlayer)

const renderText = register("renderOverlay", () => {
    Renderer.scale(1)
    const text = `${missingPackets}`
    Renderer.drawString(text, Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)
}).unregister()

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

const packetCollector = register("packetSent", (packet, event) => { // This only triggers on C03's sent from a Motion Update.
    if (!awaitingMotionUpdate) return
    awaitingMotionUpdate = false
    if (Settings().pauseCharging && Date.now() - global.cryleak.autop3.lastBlink < 1000) return

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

    if (cancelPacket) cancel(event)
}).setFilteredClass(C03PacketPlayer).unregister()

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    awaitingMotionUpdate = true
})

export function blink(blinkroute) {
    const packets = getBlinkRoutes()[blinkroute + ".json"]
    if (!packets) return chat(`Can't find route "${blinkroute}".`)

    if (packets.length > missingPackets) return chat(`Not enough packets saved! Required packets: ${packets.length}`)


    for (let i = 0; i < packets.length; i++) {
        let packet = packets[i]
        if (packet.length !== 4) return chat("Couldn't parse file! Is it invalid?")

        const [x, y, z, onGround] = [parseFloat(packet[0]), parseFloat(packet[1]), parseFloat(packet[2]), packet[3] === "true"]
        Client.sendPacket(new C03PacketPlayer.C04PacketPlayerPosition(x, y, z, onGround))
    }
    const finalPacket = packets[packets.length - 1]
    Player.getPlayer().func_70107_b(parseFloat(finalPacket[0]), parseFloat(finalPacket[1]), parseFloat(finalPacket[2]))
    chat(`Blinked with ${packets.length} packets. Packets remaining: ${missingPackets}`)
    global.cryleak.autop3.lastBlink = Date.now()
}

register("renderWorld", () => {
    if (!Settings().renderBlinkRoutes) return
    Object?.keys(getBlinkRoutes())?.forEach(name => {
        const packets = getBlinkRoutes()[name]
        for (let i = 0; i < packets.length; i++) {
            let Vec1 = packets[i]
            let Vec2 = packets[i + 1]
            if (!Vec1 || !Vec2) continue
            RenderLibV2.drawLine(parseFloat(Vec1[0]), parseFloat(Vec1[1]), parseFloat(Vec1[2]), parseFloat(Vec2[0]), parseFloat(Vec2[1]), parseFloat(Vec2[2]), 1, 1, 1, 1, 1, false)
        }
        let Vec1 = packets[0]
        let Vec2 = packets[packets.length - 1]
        if (!Vec1 || !Vec2) return
        RenderLibV2.drawInnerEspBox(parseFloat(Vec1[0]), parseFloat(Vec1[1]), parseFloat(Vec1[2]), 0.5, 0.5, 0, 1, 0, 0.25, true)
        RenderLibV2.drawEspBox(parseFloat(Vec1[0]), parseFloat(Vec1[1]), parseFloat(Vec1[2]), 0.5, 0.5, 0, 1, 0, 1, true)
        Tessellator.drawString(`Start of route "${name.split(".json")[0]}", route requires ${packets.length} packets`, Vec1[0], Vec1[1], Vec1[2], 16777215, true, 0.02, false)

        RenderLibV2.drawInnerEspBox(parseFloat(Vec2[0]), parseFloat(Vec2[1]), parseFloat(Vec2[2]), 0.5, 0.5, 1, 0, 0, 0.25, true)
        RenderLibV2.drawEspBox(parseFloat(Vec2[0]), parseFloat(Vec2[1]), parseFloat(Vec2[2]), 0.5, 0.5, 1, 0, 0, 1, true)
    })
})