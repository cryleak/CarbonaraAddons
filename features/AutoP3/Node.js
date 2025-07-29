import { chat, cuboidFromPoints } from "../../utils/utils";

export class Node extends Editable {
    constructor(name, args) {
        super();

        this.nodeName = name;

        /** @type {import("./Event").default[]} */
        this.events = [];

        this.cuboid = cuboidFromPoints(args.p1, args.p2);
        this.once = args.once;
        this.stop = args.stop;
        this.yaw = args.yaw;
        this.pitch = args.pitch;
        this.center = args.center;

        this.defineTransientProperties();
    }

    execute(execer) {
        this.lastTriggered = Date.now();
        this.triggered = true

        this._debugChat();
        this._argumentTrigger(execer);
    }

    _argumentTrigger(execer, metadata = { playerPosition: new Vector3(Player) }) {
        if (!metadata.awaitedEvents) {
            this._awaitEvents((results) => {
                metadata.awaitedEvents = true;
                metadata.eventResults = results;
                this._argumentTriggerCallback(execer, metadata);
            });
        }

        const playerPosition = new Vector3(Player);
        if (playerPosition != metadata.playerPosition) {
            chat(`&cYou moved away from the node &a${this.nodeName}&c!`);
            execer.lowerConsumed();
            return;
        }

        this._trigger(execer, metadata);
    }

    _trigger(execer) {
        execer.execute(this);
    }

    _awaitEvents(callback) {
        let awaiting = this.events.length;
        let results = {};
        this.events.forEach(event => {
            event.await((result) => {
                results[event.name] = result;
                awaiting--;
                if (awaiting <= 0) {
                    callback(results);
                }
            });
        });
    }

    _debugChat() {
        debugMessage(`&7You stepped on &a${this.nodeName}&7${this.toString()}`);
    }

    defineTransientProperties() {
        Object.defineProperties(this, {
            lastTriggered: {
                value: 0,
                enumerable: false,
                writable: true,
                configurable: true
            },
            triggered: {
                value: false,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    }
}
