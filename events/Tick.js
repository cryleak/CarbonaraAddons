import { Event } from "./CustomEvents"

const PreTick = new Event()
const PostTick = new Event()
export default { Pre: PreTick, Post: PostTick };

register("tick", () => {
    PreTick.trigger(null)
})

register(net.minecraftforge.fml.common.gameevent.TickEvent.ClientTickEvent, (event) => {
    if (event.phase !== net.minecraftforge.fml.common.gameevent.TickEvent.Phase.END) return
    PostTick.trigger(null)
})
