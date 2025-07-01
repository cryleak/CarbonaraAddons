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
	_listenerMap(l) {
		return {
			unregister: () => this._unregister(l),
			register: () => this._register(l)
		};
	}

	_unregister(l) {
		const id = this.listeners.indexOf(l);
		if (id !== -1) this.listeners.splice(id, 1);


		return this._listenerMap(l);
	}

	_register(l) {
		this.listeners.push(l);
		this.listeners.sort((a, b) => b.prio - a.prio);
		return this._listenerMap(l);
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
