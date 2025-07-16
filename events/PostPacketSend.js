import { registerCallback } from "../mixins/Callback";

registerCallback("PostPacketSend", (event, networkManager, packetIn) => {
    if (networkManager.func_150729_e() instanceof net.minecraft.client.network.NetHandlerPlayClient) {
        const packet = packetIn
        if (packet) {
            // Console.log is fucked for some reason idfk 
            console.testlog("Packet sent: " + packet);
        }
    }
})
