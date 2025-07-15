import { registerCallback } from "../mixins/Callback"

registerCallback("Terminator", (event, obj, itemStack, world, player) => {
    console.log("Terminator right-click detected.");
    if (itemStack.func_82833_r().toLowerCase().includes("terminator")) {
        console.log("Terminator right-click detected, cancelling action.");
        event.cancel();
        event.setReturnValue(itemStack);
    }
});
