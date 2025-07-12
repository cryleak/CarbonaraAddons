

import LivingUpdate from "./LivingUpdate"

import { CancellableEvent } from "./CustomEvents"

const OnUpdateWalkingPlayerPre = new CancellableEvent()
export default OnUpdateWalkingPlayerPre
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
let awaitingC03 = false

register("packetSent", (packet, event) => {
    if (!awaitingC03) return
    awaitingC03 = false
    const x = packet.func_149464_c()
    const y = packet.func_149467_d()
    const z = packet.func_149472_e()
    const yaw = packet.func_149462_g()
    const pitch = packet.func_149470_h()
    const isRotating = packet.func_149463_k()
    const isMoving = packet.func_149466_j()
    const onGround = packet.func_149465_i()
    if (!OnUpdateWalkingPlayerPre.trigger({ packet, x, y, z, yaw, pitch, isRotating, isMoving, onGround })) cancel(event)
}).setFilteredClass(C03PacketPlayer)

LivingUpdate.register(event => {
    if (event.cancelled) return
    awaitingC03 = true
}, -1)