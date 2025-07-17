/**
 * @template T
 * @callback EventListenerCallback
 * @param {T} [data] The data passed when the event is triggered.
 */

import WrappedJavaEvent from "./WrappedJavaEvent"

/**
 * @typedef {Object} EventHandler
 * @property {() => EventHandler} register - Register an event listener.
 * @property {() => EventHandler} unregister - Unregister the listener associated with this handler.
 * @property {boolean} registered - Indicates if the listener is currently registered.
 * @description A handle to control the registration of a single listener. It allows you
 * to register or unregister the listener it's associated with.
 */

/**
 * @template T
 * @typedef {Object} EventInstance
 * @property {() => boolean} hasListeners - Check if the event has any listeners
 * @property {(delay: number, callback: EventListenerCallback<T>) => EventHandler} scheduleTask - Schedule a task with delay
 * @property {(callback: EventListenerCallback<T>, priority: number = 1000) => EventHandler} register - Register an event listener with priority
 * @property {(data: T) => void} trigger - Trigger the event with data
 */


export const JavaEvent = Java.type("me.cryleak.carbonaraloader.event.Event")

/**
 * Event constructor imported from Java
 * @template T
 * @type {new () => EventInstance<T>}
 */
export const Event = function () { // This is ltierally the only fucking way to have it be a constructor and return the correct shit
    return new WrappedJavaEvent(new JavaEvent())
}

/**
 * @template T
 * @typedef {Object} Data
 * @property {boolean} cancelled - Indicates if the event has been cancelled.
 * @property {boolean} breakChain - If true, prevents further event propagation.
 * @property {any} returnValue - The value to return from the event listener.
 * @property {T} data - The data passed when the event is triggered.
 * @description A wrapper for the data passed to the event listener.
 */


export const JavaCancellableEvent = Java.type("me.cryleak.carbonaraloader.event.CancellableEvent");

/**
 * CancellableEvent constructor imported from Java
 * @template T
 * @type {new () => EventInstance<Data<T>>}
 */
export const CancellableEvent = function () {
    return new WrappedJavaEvent(new JavaCancellableEvent())
}