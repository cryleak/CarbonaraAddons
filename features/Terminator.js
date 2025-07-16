import { registerCallback } from "../mixins/Callback"

registerCallback("Terminator", (event, obj, itemStack, world, player) => {
    const wrappedItem = new Item(itemStack)
    if (wrappedItem.getLore().some(thing => thing.removeFormatting() === "Shortbow: Instantly shoots!")) {
        event.cancel();
        event.setReturnValue(itemStack);
    }
});