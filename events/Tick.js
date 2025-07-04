import { CancellableEvent } from "./CustomEvents"

const Tick = new CancellableEvent();
export default Tick;

register("tick", (event) => {
    if (!Tick.trigger(event)) {
        cancel(event)
    }
})
