import { Event } from "./CustomEvents";

export default BatSpawnEvent = new Event();

register("tick", () => {
    const bats = World.getAllEntitiesOfType(net.minecraft.entity.passive.EntityBat)

    for (let bat of bats) {
        if (getDistanceToEntity(bat) > 15) continue

        BatSpawnEvent.trigger(bat)
        break
    }
})