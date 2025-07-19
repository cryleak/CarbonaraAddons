import { CancellableEvent } from "./CustomEvents"

const Mouse = new CancellableEvent();
export default Mouse;

register(net.minecraftforge.client.event.MouseEvent, (event) => {
    const data = {
        state: event.buttonstate,
        button: event.button
    };

    if (Mouse.trigger(data).cancelled) {
        cancel(event);
    }
});
