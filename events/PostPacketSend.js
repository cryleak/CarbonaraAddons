import { registerCallback } from "../mixins/Callback";
import { Event } from "./CustomEvents";


const PostPacketSend = new Event()
export default PostPacketSend

registerCallback("PostPacketSend", (event, networkManager, packet) => {
    ChatLib.chat("Nig")
})