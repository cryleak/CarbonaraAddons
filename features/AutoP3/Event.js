import { debugMessage } from "../../utils/utils";

export default class Event {
    constructor(name) {
        this.name = name;
        this.listeners = [];
    }

    // _callback to supress the warning about unused variables
    await(callback) {
        this.listeners.push(callback);
    }

    trigger(result) {
        debugMessage(`Event ${this.name} done!`);

        for (let listener of this.listeners) {
            listener(result);
        }

        this.listeners = [];
    }
}
