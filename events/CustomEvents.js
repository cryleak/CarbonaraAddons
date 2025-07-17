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
 * @class Event
 * @template T
 * @description Provides a custom event system for registering listeners and triggering events.
 * It supports listener prioritization and delayed, one-off tasks that execute after a certain
 * number of trigger calls.
 */

/**
 * @constructor
 * @description Creates an instance of an Event.
 */

/**
 * @description Checks if there are any registered listeners or scheduled tasks.
 * @returns {boolean} True if there are any active listeners or tasks, false otherwise.
 */

/**
 * @description Schedules a one-time task to be executed after a specified number of event triggers.
 * @param {number} delay The number of times the event must be triggered before the task executes. A delay of 0 means it runs on the next trigger.
 * @param {EventListenerCallback<T>} fn The function to execute when the delay is met.
 */

/**
 * @description Registers a listener function to this event.
 * @param {EventListenerCallback<T>} fn The function to be called when the event is triggered.
 * @param {number} [priority=1000] The priority of the listener. Listeners with higher numbers are executed first.
 * @returns {Event.Handler} A handler object that can be used to unregister the listener.
 */

/**
 * @description Triggers the event, calling all registered listeners and processing scheduled tasks.
 * @param {T} [data] Optional data to pass to each listener and task.
 */

/**
 * @class Event.Task
 * @memberof Event
 * @description Represents a task scheduled to run after a certain delay. For internal use.
 * @param {number} delay The remaining triggers before execution.
 * @param {EventListenerCallback<T>} fn The function to execute.
 */

/**
 * @class Event.Listener
 * @memberof Event
 * @description Represents a registered listener. For internal use.
 * @param {EventListenerCallback<T>} fn The listener's callback function.
 * @param {number} priority The execution priority.
 * @param {Event} event The parent event instance.
 */

/**
 * @class Event.Handler
 * @memberof Event
 * @abstract
 * @description A handle to control the registration of a single listener. It allows you
 * to register or unregister the listener it's associated with.
 */

/**
 * @description Whether the listener is currently registered.
 * @type {boolean}
 */

/**
 * @description Registers the associated listener to the event. If already registered, this has no effect.
 * @returns {Event.Handler} This handler instance for chaining.
 */

/**
 * @description Unregisters the associated listener from the event. If not registered, this has no effect.
 * @returns {Event.Handler} This handler instance for chaining.
 */
>>>>>>> e58e03c (added important documentation)
export const Event = Java.type("me.cryleak.carbonaraloader.event.Event");


/**
 * @template T
 * @callback CancellableEventListenerCallback
 * @param {CancellableEvent.Data<T>} eventData The wrapper object for the event, which can be modified by the listener.
 * @returns {any} The return value is ignored.
 */

/**
 * @class CancellableEvent
 * @template T
 * @extends Event<T>
 * @description An event that can be cancelled. Listeners for this event do not receive the raw data,
 * but instead a `CancellableEvent.Data` wrapper object. By modifying properties on this object,
 * a listener can prevent the default action associated with the event (`cancelled = true`) or
 * prevent subsequent listeners from running (`breakChain = true`).
 */

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
