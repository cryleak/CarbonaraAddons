export default class WrappedJavaEvent {
    constructor(event) {
        this.event = event
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) return Reflect.get(target, prop, receiver)
                const value = target.event[prop]
                if (typeof value === 'function') {
                    return value.bind(target.event)
                }
                return value
            }
        })
    }

    register(listener, priority = 1000) {
        return this.event.register(data => {
            try {
                listener(data)
            } catch (e) {
                console.error(`Error at: ${e.fileName}:${e.lineNumber}\n${e.message}`)
            }
        }, priority)
    }

    scheduleTask(delay, callback) {
        this.event.scheduleTask(delay, data => {
            try {
                callback(data)
            } catch (e) {
                console.error(`Error at: ${e.fileName}:${e.lineNumber}\n${e.message}`)
            }
        })
    }
}