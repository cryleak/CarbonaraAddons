const callbacks = {};

export function registerCallback(name, fn) {
    console.log(`Registering callback: ${name}`);
    callbacks[name] = fn;
}

export function CancellableReturnableCallback(callback, cir, returnValueSet, returnValue, ...args) {
    if (!callbacks[callback]) {
        console.log(`Callback "${callback}" not found.`);
        console.log("Available callbacks:", Object.keys(callbacks));
        return;
        // throw new Error(`Callback "${callback}" is not registered.`);
    }

    const event = {
        cancel: () => cir.set(true),
        setReturnValue: (value) => {
            returnValueSet.set(true);
            returnValue.set(value);
        }
    }

    callbacks[callback](event, ...args);
}

export function CancellableCallback(callback, cir, ...args) {
    if (!callbacks[callback]) {
        console.log(`Callback "${callback}" not found.`);
        console.log("Available callbacks:", Object.keys(callbacks));
        return;
    }
    const event = {
        cancel: () => cir.set(true)
    }

    callbacks[callback](event, ...args);
}

export function Callback(callback, ...args) {
    if (!callbacks[callback]) {
        console.log(`Callback "${callback}" not found.`);
        console.log("Available callbacks:", Object.keys(callbacks));
        return;
        // throw new Error(`Callback "${callback}" is not registered.`);
    }
    callbacks[callback](...args);
}
