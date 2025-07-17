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
export const CancellableEvent = Java.type("me.cryleak.carbonaraloader.event.CancellableEvent");