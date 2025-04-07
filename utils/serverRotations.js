import { debugMessage, chat } from "./utils"
import { sendAirClick } from "./autop3utils"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

let lastTP = Date.now()
let yaw = 0
let pitch = 0
let clicking = false
let rotating = false
let awaitingMotionUpdate = false
let renderRotations = false

register("packetSent", (packet, event) => { // someone should totally teach me how to use ct asm or asm in general (im not learning that shit)
    if (!awaitingMotionUpdate) return
    awaitingMotionUpdate = false
    if (!rotating) return

    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return


    const packetPos = [packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e()]
    const onGround = packet.func_149465_i()

    let newPacket
    const packetClass = packet.class.getSimpleName()
    if (packetClass === "C04PacketPlayerPosition" || packetClass === "C06PacketPlayerPosLook") newPacket = new C03PacketPlayer.C06PacketPlayerPosLook(...packetPos, yaw, pitch, onGround)
    else newPacket = new C03PacketPlayer.C05PacketPlayerLook(yaw, pitch, onGround)

    // ChatLib.chat(`${newPacket ? newPacket.class.getSimpleName() : "null"} ${newPacket?.func_149462_g() ?? "null"} ${newPacket?.func_149470_h() ?? "null"}`)
    cancel(event)
    Client.sendPacket(newPacket)

    if (!clicking) return
    debugMessage(`clicked ${[yaw.toFixed(2), pitch.toFixed(2)].toString()} ${Player.asPlayerMP().isSneaking()}`)
    rotating = false
    clicking = false
    airClick()
}).setFilteredClass(C03PacketPlayer)

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => { // Only respond to C03s that were sent from a motion update event or osmething idk
    if (event.entity !== Player.getPlayer()) return
    awaitingMotionUpdate = true
})

// why the fuck is changing the pitch of the player in third person so complicated
let clientSidePitch = Player.getPitch()
register(net.minecraftforge.client.event.RenderPlayerEvent$Pre, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!renderRotations) return

    clientSidePitch = Player.getPitch()
    Player.getPlayer().field_70761_aq = yaw
    Player.getPlayer().field_70759_as = yaw
    Player.getPlayer().field_70125_A = pitch
    Player.getPlayer().field_70127_C = pitch
})

register(net.minecraftforge.client.event.RenderPlayerEvent$Post, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!renderRotations) return

    Player.getPlayer().field_70125_A = clientSidePitch
    Player.getPlayer().field_70127_C = clientSidePitch
})

export function clickAt(y, p) {
    if (!y && y !== 0 || !p && p !== 0) return chat(`Invalid rotation! How is this possible?\nyaw = ${y} pitch = ${p}`)
    yaw = parseFloat(y) // why is this not already a number what
    pitch = parseFloat(p)


    rotating = true
    clicking = true
    renderRotations = true
    Client.scheduleTask(0, () => renderRotations = false)
}

export function stopRotating() {
    rotating = false
    clicking = false
    renderRotations = false
}

const airClick = () => {
    debugMessage(`Time between this TP and last: ${Date.now() - lastTP}ms`); lastTP = Date.now()
    clicking = false
    sendAirClick()
}


register("worldUnload", stopRotating)

/*
register("packetSent", (packet, event) => {
    if (!packet.func_149466_j()) return
    if (!packet.func_149463_k()) return
    ChatLib.chat(`x: ${packet.func_149464_c()}, y: ${packet.func_149467_d()}, z: ${packet.func_149472_e()}, yaw: ${packet.func_149462_g()}, pitch: ${packet.func_149470_h()}`)
}).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer)
*/