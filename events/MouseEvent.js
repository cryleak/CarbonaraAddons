import { CancellableEvent } from "./CustomEvents"

const MouseEvent = new CancellableEvent();
export default MouseEvent;

register(net.minecraftforge.client.event.MouseEvent, (event) => {
    const data = {
        state: event.buttonstate,
        button: event.button
    };

    if (MouseEvent.trigger(data).cancelled) {
        cancel(event);
    }
});
