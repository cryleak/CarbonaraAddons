<<<<<<< HEAD
<<<<<<< HEAD
export class Event {
	constructor() {
		this.listeners = [];
		this.tasks = [];
	}

	hasListeners() {
		return this.listeners.length > 0 || this.tasks.length > 0;
	}

	scheduleTask(delay, func) {
		this.tasks.push({ func, delay });
	}

	/**
	 * Registers a listener that runs before every player update event.
	 * @param {Function} func
	 */
	register(func, prio = 1000) {
		return this._register({ func, prio });
	}

	_listenerMap(l, registered) {
		return {
			unregister: () => this._unregister(l),
			register: () => this._register(l),
            registered
		};
	}

	_unregister(l) {
		const id = this.listeners.indexOf(l);
		if (id !== -1) this.listeners.splice(id, 1);
		return this._listenerMap(l, false);
	}

	_register(l) {
		this.listeners.push(l);
		this.listeners.sort((a, b) => b.prio - a.prio);
		return this._listenerMap(l, true);
	}

<<<<<<< HEAD
<<<<<<< HEAD
    _triggerTasks(data) {
        for (let i = this.tasks.length - 1; i >= 0; i--) {
            let curr = this.tasks[i];
            if (curr.delay-- > 0) {
                continue;
            }
=======
	_triggerTasks(data) {
		for (let i = this.tasks.length - 1; i >= 0; i--) {
			let curr = this.tasks[i];
			if (curr.delay-- > 0) {
				continue;
			}
>>>>>>> f3ef36b (fix unregister() method and refactored blink.js a bit)

			this.tasks.splice(i, 1);
			curr.func(data);
		}
	}

=======
>>>>>>> eff84a4 (added custom events for secret aura block click & player living update)
	/**
	 * (Internal use) Trigger this to trigger the event.
	 *
	 * @param { data } data - The arguments to pass to each listener callback.
	 */
	trigger(data) {
<<<<<<< HEAD
<<<<<<< HEAD
        this._triggerTasks(data);
=======
>>>>>>> eff84a4 (added custom events for secret aura block click & player living update)
=======
		this._triggerTasks(data);
>>>>>>> f3ef36b (fix unregister() method and refactored blink.js a bit)
		this.listeners.forEach(l => l.func(data));
	}
};

export class CancellableEvent extends Event {
	/**
	 * (Internal use) Trigger this to trigger the event.
	 *
	 * @param { data } data - The data in the event object to pass to all listeners.
	 */
<<<<<<< HEAD
    trigger(data) {
<<<<<<< HEAD
        this._triggerTasks(data);

=======
>>>>>>> eff84a4 (added custom events for secret aura block click & player living update)
        const event = {
            cancelled: false,
            break: false,
            data,
        };

        this.listeners.some(l => {
            l.func(event);
            return event.break;
<<<<<<< HEAD
        });
=======
        );
>>>>>>> eff84a4 (added custom events for secret aura block click & player living update)
=======
	trigger(data) {
		this._triggerTasks(data);

		const event = {
			cancelled: false,
			break: false,
			data,
		};

		this.listeners.some(l => {
			l.func(event);
			return event.break;
		});
>>>>>>> f3ef36b (fix unregister() method and refactored blink.js a bit)

		return !event.cancelled;
	}
};
=======
=======
/**
 * @template T
 * @callback EventListenerCallback
 * @param {T} [data] The data passed when the event is triggered.
 */

/**
 * @typedef {Object} EventHandler
 * @property {function(): EventHandler} register - Register an event listener.
 * @property {function(): EventHandler} unregister - Unregister the listener associated with this handler.
 * @property {boolean} registered - Indicates if the listener is currently registered.
 * @description A handle to control the registration of a single listener. It allows you
 * to register or unregister the listener it's associated with.
 */

/**
 * @template T
 * @typedef {Object} EventInstance
 * @property {function(): boolean} hasListeners - Check if the event has any listeners
 * @property {function(number, EventListenerCallback<T>): EventHandler} scheduleTask - Schedule a task with delay
 * @property {function(EventListenerCallback<T>, number): EventHandler} register - Register an event listener with priority
 * @property {function(T): void} trigger - Trigger the event with data
 */

/**
 * Event constructor imported from Java
 * @template T
 * @type {new <T>() => EventInstance<T>}
 */
>>>>>>> e58e03c (added important documentation)
export const Event = Java.type("me.cryleak.carbonaraloader.event.Event");

/**
 * @template T
 * @typedef {Object} Data
 * @property {boolean} cancelled - Indicates if the event has been cancelled.
 * @property {boolean} breakChain - If true, prevents further event propagation.
 * @property {any} returnValue - The value to return from the event listener.
 * @property {T} data - The data passed when the event is triggered.
 * @description A wrapper for the data passed to the event listener.
 */

/**
 * CancellableEvent constructor imported from Java
 * @template T
 * @type {new <T>() => Event<Data<T>>}
 */
<<<<<<< HEAD

/**
 * @class CancellableEvent.Data
 * @memberof CancellableEvent
 * @template T
 * @description A wrapper object passed to every listener of a `CancellableEvent`. It holds the event's state.
 */
// --- Properties for CancellableEvent.Data ---
/**
 * @property {boolean} cancelled - Set to `true` to cancel the event's resulting action. Defaults to `false`.
 */
/**
 * @property {boolean} breakChain - Set to `true` to prevent any subsequent listeners (with lower priority) from being called. Defaults to `false`.
 */
/**
 * @property {T} data - The original data passed to the `trigger` method.
 */


/**
 * @override
 * @description Triggers the event, passing a mutable data wrapper to each listener.
 * The loop may be stopped early if a listener sets `breakChain` to `true`.
 * @param {T} [data] - The original data to be wrapped and passed to listeners.
 * @returns {CancellableEvent.Data<T>} The final state of the data wrapper after all listeners have run.
 */
export const CancellableEvent = Java.type("me.cryleak.carbonaraloader.event.CancellableEvent");
>>>>>>> dc555aa (moved to using java event types)
=======
export const CancellableEvent = Java.type("me.cryleak.carbonaraloader.event.CancellableEvent");
>>>>>>> 1c22111 (better docs)
