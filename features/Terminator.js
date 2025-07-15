import { registerCallback } from "../mixins/Callback"

registerCallback("Terminator", (event, obj, itemStack, world, player) => {
    return
    console.log("Terminator right-click detected.");
    const wrappedItem = new Item(itemStack)
    if (wrappedItem.getLore().some(thing => thing.removeFormatting() === "Shortbow: Instantly shoots!")) {
        console.log("Terminator right-click detected, cancelling action.");
        event.cancel();
        event.setReturnValue(itemStack);
    }
});


register("packetSent", (packet) => {
ChatLib.chat(packet.func_180762_c())
}).setFilteredClass(net.minecraft.network.play.client.C07PacketPlayerDigging)