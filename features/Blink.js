import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import PogObject from "../../PogData"

import { getBlinkRoutes, setVelocity, updateBlinkRoutes } from "../utils/autop3utils"
import { chat } from "../utils/utils"
import { registerSubCommand } from "../utils/commands"
import { packetCounterGui } from "../config"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const lastPacketState = {
    pos: { x: null, y: null, z: null },
    onGround: null,
    rotation: { yaw: null, pitch: null }
}
const data = new PogObject("CarbonaraAddons", {
    packetCounter: {
        x: Renderer.screen.getWidth() / 2,
        y: Renderer.screen.getHeight() / 2,
        scale: 1,
    }
}, "posData.json")

let movementPacketsSent = 0
let awaitingMotionUpdate = false

global.cryleak ??= {}
global.cryleak.autop3 ??= {}
global.cryleak.autop3.lastBlink = Date.now()
global.cryleak.autop3.missingPackets = []
global.cryleak.autop3.blinkEnabled = false

register("tick", () => {
    const packetsGained = 1 - movementPacketsSent
    if (packetsGained < 0) for (let i = 0; i < Math.abs(packetsGained); i++) global.cryleak.autop3.missingPackets.shift()
    else for (let i = 0; i < packetsGained; i++) global.cryleak.autop3.missingPackets.push(Date.now())


    movementPacketsSent = 0
    while (Date.now() - global.cryleak.autop3.missingPackets[0] > 30000) global.cryleak.autop3.missingPackets.shift()
})

register("packetReceived", () => {
    movementPacketsSent--
}).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)

register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (!event.isCancelled()) movementPacketsSent++
    })
}).setFilteredClass(C03PacketPlayer)

register("renderOverlay", () => {
    if (packetCounterGui.isOpen()) {
        Renderer.scale(data.packetCounter.scale)
        const text = 1000000
        Renderer.drawString(text, data.packetCounter.x, data.packetCounter.y)
        return
    }
    if (!global.cryleak.autop3.blinkEnabled) return
    Renderer.scale(data.packetCounter.scale)
    const text = `${global.cryleak.autop3.missingPackets.length}`
    Renderer.drawString(text, data.packetCounter.x, data.packetCounter.y)
})

register("dragged", (_0, _1, x, y, bn) => {
    if (!packetCounterGui.isOpen()) return
    if (bn === 2) return
    data.packetCounter.x = x / data.packetCounter.scale
    data.packetCounter.y = y / data.packetCounter.scale
    data.save()
})

register("scrolled", (_0, _1, dir) => {
    if (!packetCounterGui.isOpen()) return
    if (dir == 1) data.packetCounter.scale += 0.01
    else data.packetCounter.scale -= 0.01
    data.packetCounter.scale = Math.round(data.packetCounter.scale * 100) / 100
    ChatLib.clearChat(69427) // Prevent clogging chat by deleting the previous message
    new Message(`§0[§4Carbonara§0] §fCurrent scale: ${data.packetCounter.scale}`).setChatLineId(69427).chat()
    data.save()
})

fakeKeybinds.onKeyPress("packetChargeKeybind", () => toggleCharge(!global.cryleak.autop3.blinkEnabled))

registerSubCommand(["togglecharge"], (args) => {
    if (args.length && args[0]) toggleCharge(args[0] === "true")
    else toggleCharge(!global.cryleak.autop3.blinkEnabled)
})

function toggleCharge(state) {
    global.cryleak.autop3.blinkEnabled = state
    if (global.cryleak.autop3.blinkEnabled) packetCollector.register()
    else packetCollector.unregister()
}

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
    if (!global.cryleak.autop3.blinkEnabled) return chat("Blink is disabled!")

    const packets = getBlinkRoutes()[blinkroute + ".sereniblink"]
    if (!packets) return chat(`Can't find route "${blinkroute}".`)

    if (packets.length > global.cryleak.autop3.missingPackets.length) return chat(`Not enough packets saved! Required packets: ${packets.length}`)


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

registerSubCommand("listblinkroutes", () => {
    chat(`Blink routes: ${Object.keys(getBlinkRoutes()).map(route => route.split(".sereniblink")[0]).toString()}`)
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
    global.cryleak.autop3.missingPackets = []
    recordingRouteName = null
    packetLogger.unregister()
    global.cryleak.autop3.blinkEnabled = false
    packetCollector.unregister()
})