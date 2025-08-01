import Module, { registerModule } from "./PhoenixModule"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

registerModule(class Teleport extends Module {
    constructor(phoenix) {
        super("Teleport", phoenix)
        this._tryLoadConfig();

        register("packetReceived", (packet, event) => {
            if (!this.isToggled()) return
            const enumflags = Object.values(packet.func_179834_f())
            if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.X) && enumflags.length === 1) {

                ChatLib.chat("proxy tp")
                cancel(event)
            }
        }).setFilteredClass(S08PacketPlayerPosLook)
    }
});
