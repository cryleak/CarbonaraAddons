import { Event } from "./CustomEvents";

const ServerTickEvent = new Event()
export default ServerTickEvent

const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");

register("packetReceived", (packet) => {
    if (packet.func_148890_d() > 0) return
    ServerTickEvent.trigger()
}).setFilteredClass(S32PacketConfirmTransaction)