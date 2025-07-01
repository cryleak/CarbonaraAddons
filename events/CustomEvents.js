export class Event {
	constructor() {
		this.listeners = [];
	}

	/**
	 * Registers a listener that runs before every player update event.
	 * @param {Function} func
	 */
	register(func, prio = 1000) {
		return this._register({func, prio});
	}

	_listenerMap(l) {
		return {
			unregister: () => this._unregister(l),
			register: () => this._register(l)
		};
	}

	_unregister(l) {
		const id = this.listeners.indexOf(l);
		if (id !== -1) {
			this.listeners = this.listeners.splice(id, 1);
		}

		return this._listenerMap(l);
	}

	_register(l) {
        this.listeners.push(l);
        this.listeners.sort((a, b) => b.prio - a.prio);
		return this._listenerMap(l);
	}

	/**
	 * (Internal use) Trigger this to trigger the event.
	 *
	 * @param { data } data - The arguments to pass to each listener callback.
	 */
	trigger(data) {
		this.listeners.forEach(l => l.func(data));
	}
};

export class CancellableEvent extends Event {
	/**
	 * (Internal use) Trigger this to trigger the event.
	 *
	 * @param { data } data - The data in the event object to pass to all listeners.
	 */
    trigger(data) {
        const event = {
            cancelled: false,
            break: false,
            data,
        };

        this.listeners.some(l => {
            l.func(event);
            return event.break;
        );

        return !event.cancelled;
    }
};
