import { Event } from "./CustomEvents"

const Tick = new Event()
export default Tick;

register("tick", () => {
    Tick.trigger()
})