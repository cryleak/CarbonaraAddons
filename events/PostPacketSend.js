import { registerCallback } from "../mixins/Callback";

registerCallback("PostPacketSend", (event, networkManager, packet) => {
    ChatLib.chat("pöacket")
})