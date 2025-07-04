import { CancellableEvent } from "./CustomEvents"

const LivingUpdate = new CancellableEvent();
export default LivingUpdate;

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    if (!LivingUpdate.trigger(event)) {
        cancel(event)
    }
})
