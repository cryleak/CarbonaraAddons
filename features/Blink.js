import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import RenderLibV2 from "../../RenderLibV2"

import { getBlinkRoutes, setVelocity, updateBlinkRoutes } from "../utils/autop3utils"
import { chat } from "../utils/utils"
import { registerSubCommand } from "../utils/commands"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const lastPacketState = {
    pos: { x: null, y: null, z: null },
    onGround: null,
    rotation: { yaw: null, pitch: null }
}
let movementPacketsSent = 0
let awaitingMotionUpdate = false
global.cryleak ??= {}
global.cryleak.autop3 ??= {}
global.cryleak.autop3.lastBlink = Date.now()
global.cryleak.autop3.missingPackets = 0
global.cryleak.autop3.blinkEnabled = false

register("tick", () => {
    global.cryleak.autop3.missingPackets += 1 - movementPacketsSent
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
    const text = `${global.cryleak.autop3.missingPackets}`
    Renderer.drawString(text, Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)
}).unregister()

fakeKeybinds.onKeyPress("packetChargeKeybind", () => {
    global.cryleak.autop3.blinkEnabled = !global.cryleak.autop3.blinkEnabled
    if (global.cryleak.autop3.blinkEnabled) {
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
    if (recordingRouteName) return

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
    const packets = getBlinkRoutes()[blinkroute + ".sereniblink"]
    if (!packets) return chat(`Can't find route "${blinkroute}".`)

    if (packets.length > global.cryleak.autop3.missingPackets) return chat(`Not enough packets saved! Required packets: ${packets.length}`)


    for (let i = 0; i < packets.length; i++) {
        let packet = packets[i]
        if (packet.length < 4 || !packet.length) return chat("Couldn't parse file! Is it invalid?")
        let [x, y, z, onGround] = [parseFloat(packet[0]), parseFloat(packet[1]), parseFloat(packet[2]), packet[3] === "true"]
        Client.sendPacket(new C03PacketPlayer.C04PacketPlayerPosition(x, y, z, onGround))
        if (packet.length === 7) {
            let motion = [parseFloat(packet[4]), parseFloat(packet[5]), parseFloat(packet[6])]
            setVelocity(...motion)
        }
    }
    const finalPacket = packets[packets.length - 1]
    Player.getPlayer().func_70107_b(parseFloat(finalPacket[0]), parseFloat(finalPacket[1]), parseFloat(finalPacket[2]))
    chat(`Blinked with ${packets.length} packets.`)
    global.cryleak.autop3.lastBlink = Date.now()
}

registerSubCommand(["playroute", "playblinkroute"], (args) => {
    const name = args.join(" ")
    blink(name)
})

// Recording

let recordingRouteName = null

registerSubCommand(["recordroute", "recordblinkroute"], (args) => {
    const name = args.join(" ")
    if (!name) return chat("Invalid name!")
    recordingRouteName = name
    chat(`Started recording route with name ${recordingRouteName}.`)
    FileLib.delete("CarbonaraAddons/blinkroutes", recordingRouteName + ".sereniblink")
    FileLib.append("CarbonaraAddons/blinkroutes", recordingRouteName + ".sereniblink", `Speed when this route was recorded: ${((Player.getPlayer().field_71075_bZ.func_75094_b()) * 1000).toFixed(0)}`)
    packetLogger.register()
})

const packetLogger = register("packetSent", (packet, event) => {
    let ignorePacket = true

    if (!packet.func_149466_j()) return

    const onGround = packet.func_149465_i()
    if (onGround !== lastPacketState.onGround) ignorePacket = false
    lastPacketState.onGround = onGround
    const currentPosition = { x: packet.func_149464_c(), y: packet.func_149467_d(), z: packet.func_149472_e() }
    if (Object.values(currentPosition).some((coord, index) => coord !== Object.values(lastPacketState.pos)[index])) ignorePacket = false
    lastPacketState.pos.x = currentPosition.x
    lastPacketState.pos.y = currentPosition.y
    lastPacketState.pos.z = currentPosition.z


    if (ignorePacket) return

    FileLib.append("CarbonaraAddons/blinkroutes", recordingRouteName + ".sereniblink", `\n${packet.func_149464_c()}, ${packet.func_149467_d()}, ${packet.func_149472_e()}, ${packet.func_149465_i()}, ${Player.getPlayer().field_70159_w}, ${Player.getPlayer().field_70181_x}, ${Player.getPlayer().field_70179_y}`)
    updateBlinkRoutes()
}).setFilteredClass(C03PacketPlayer).unregister()

fakeKeybinds.onKeyPress("stopRecordingKeybind", () => {
    if (!recordingRouteName) return chat("Not recording a route!")
    packetLogger.unregister()
    chat(`Stopped recording route ${recordingRouteName}. ${getBlinkRoutes()[recordingRouteName + ".sereniblink"].length} packets logged.`)
    recordingRouteName = null
})

register("worldUnload", () => {
    global.cryleak.autop3.missingPackets = 0
    recordingRouteName = null
    packetLogger.unregister()
    global.cryleak.autop3.blinkEnabled = false
    packetCollector.unregister()
    renderText.unregister()
})