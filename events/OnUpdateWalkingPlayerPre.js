

import { CancellableEvent } from "./CustomEvents";
import LivingUpdate from "./LivingUpdate";

const OnUpdateWalkingPlayerPre = new CancellableEvent()
export default OnUpdateWalkingPlayerPre
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
let awaitingC03 = false

register("packetSent", (packet, event) => {
    if (!awaitingC03) return
    awaitingC03 = false
    if (!OnUpdateWalkingPlayerPre.trigger({ packet })) cancel(event)
}).setFilteredClass(C03PacketPlayer)

LivingUpdate.register(event => {
    if (event.cancelled) return
    awaitingC03 = true
}, -1)