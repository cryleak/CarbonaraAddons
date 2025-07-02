import { CancellableEvent } from "./CustomEvents"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

const ServerTeleport = new CancellableEvent();
export default ServerTeleport;

register("packetReceived", (packet, event) => {
    if (!ServerTeleport.trigger({packet})) {
        cancel(event);
    }
}).setFilteredClass(S08PacketPlayerPosLook);
