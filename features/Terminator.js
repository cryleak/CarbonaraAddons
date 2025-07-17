import { BowItemRightClick } from "../events/JavaEvents.js";

BowItemRightClick.register((event) => {
    const itemStack = event.data.itemStack;
    const wrappedItem = new Item(itemStack)
    if (wrappedItem.getLore().some(l => l.removeFormatting() === "Shortbow: Instantly shoots!")) {
        event.cancelled = true;
        event.returnValue = itemStack;
    }
});
