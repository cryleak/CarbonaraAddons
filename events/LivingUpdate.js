import Motion from "../utils/Motion"

const CancellableEvent = com.chattriggers.ctjs.minecraft.listeners.CancellableEvent

export default new class LivingUpdate {
    constructor() {
        this.listeners = []
        this.scheduledTasks = []
        register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
            if (event.entity !== Player.getPlayer()) return
            this.onLivingUpdate(event)
        })
    }
    /**
     * Adds a listener that runs before every player update event.
     * @param {Function} func 
     */
    addListener(func) {
        this.listeners.push(func)
    }
    /**
     * Schedules a task to run in the specified amount of living updates.
     * @param {integer} ticks 
     * @param {function} func
     */
    scheduleTask(ticks, func) {
        this.scheduledTasks.push({ ticks, func })
    }

    /**
     * (Internal use) Ran when the player position updates.
     * @param {CancellableEvent} event The Event to use. If you don't specify this it will create a new event
     * @returns The event used. You can check if it is canceled.
     */
    onLivingUpdate(event) {
        if (!event) event = new CancellableEvent()
        for (let i = this.scheduledTasks.length - 1; i >= 0; i--) {
            let task = this.scheduledTasks[i]
            if (task.ticks === 0) {
                task.func(event)
                this.scheduledTasks.splice(i, 1)
            }
            task.ticks--
        }

        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](event)
        }
        if (!event.isCanceled()) Motion.onMotionUpdate()
        return event
    }
}