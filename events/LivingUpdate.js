import { CancellableEvent } from "./CustomEvents"

export default const LivingUpdate = new CancellableEvent();

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!LivingUpdate.trigger(event)) {
        cancel(event)
    }
})
