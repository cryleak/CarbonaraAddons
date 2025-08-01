import { CancellableEvent } from "./CustomEvents"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

const ServerTeleport = new CancellableEvent();
export default ServerTeleport;

register("packetReceived", (packet, event) => {
    if (global?.phoenixClassInstance?.isInPhoenix()) return
    const x = packet.func_148932_c()
    const y = packet.func_148928_d()
    const z = packet.func_148933_e()
    const yaw = packet.func_148931_f()
    const pitch = packet.func_148930_g()
    const enumFlags = packet.func_179834_f()
    if (ServerTeleport.trigger({ packet, x, y, z, yaw, pitch, enumFlags }).cancelled) {
        cancel(event);
    }
}).setFilteredClass(S08PacketPlayerPosLook);
