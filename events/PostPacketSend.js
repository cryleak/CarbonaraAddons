import { registerCallback } from "../mixins/Callback";

registerCallback("PostPacketSend", (event, networkManager, packet) => {
    if (packet) {
        console.log("Packet sent: " + packet);
    }
})
