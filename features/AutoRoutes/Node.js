import Dungeons from "../../utils/Dungeons"
import manager from "./NodeManager"
import Vector3 from "../../../BloomCore/utils/Vector3"

import { BatSpawnEvent, SecretEvent } from "../../events/SecretListener"
import { scheduleTask, releaseMovementKeys, rotate, chat, debugMessage, setPlayerPosition, setVelocity } from "../../utils/utils"

export class Node {
    static priority = 1000;

    constructor(name, args) {
        this.nodeName = name;

        this.lastTriggered = 0;

        this.position = Dungeons.convertToRelative(args.position)
        this.radius = args.radius;
        this.height = args.height;
        this.delay = args.delay;
        this.awaitBat = args.awaitBat;
        this.awaitSecret = args.awaitSecret;
        this.stop = args.stop;
        this.center = args.center;
        this.yaw = Dungeons.convertToRelativeYaw(args.yaw);
        this.pitch = args.pitch;
        this.block = args.block;
        this.defineTransientProperties();
    }

    setLocation(loc) {
        this.x = loc.x;
        this.y = loc.y;
        this.z = loc.z;
        return this;
    }

    command(args) {
        constructor();
    }

    canRun() {
        return true;
    }

    execute(execer) {
        if (!this._preArgumentTrigger(execer)) return execer.lowerConsumed();

        this.lastTriggered = Date.now();
        this.triggered = true
        this._debugChat();
        this._argumentTrigger(execer);
    }

    _argumentTrigger(execer, metadata = {}) {
        debugMessage(`Triggering node: ${this.nodeName}, metadata: ${JSON.stringify(metadata)}`);
        if (this.delay && !metadata.delay) {
            const delay = Math.ceil(parseInt(node.delay) / 50)
            scheduleTask(delay, () => {
                metadata.delay = true;
                this._argumentTrigger(execer, metadata);
            });
            return;
        }

        if (this.awaitBat && !metadata.awaitBat) {
            let done = false;

            scheduleTask(100, () => {
                if (done) {
                    return;
                }

                done = true;
                metadata.awaitBat = true;
                this._argumentTrigger(execer, metadata);
            });

            BatSpawnEvent.scheduleTask((bat) => {
                if (done) {
                    return;
                }

                done = true;
                metadata.awaitBat = true;
                this._argumentTrigger(execer, metadata);
            });

            return;
        }

        if (this.awaitSecret && !metadata.awaitSecret) {
            let done = false;
            const amount = parseInt(this.awaitSecret) || 1;

            scheduleTask(100, () => {
                if (done) {
                    return;
                }

                done = true;
                metadata.awaitSecret = true;
                this._argumentTrigger(execer, metadata);
            });

            SecretEvent.scheduleTask(amount, () => {
                if (done) {
                    return;
                }

                done = true;
                metadata.awaitSecret = true;
                this._argumentTrigger(execer, metadata);
            });

            return;
        }

        if (this.stop) {
            releaseMovementKeys();
            setVelocity(0, null, 0);
        }

        if (this.center) {
            setPlayerPosition(this.realPosition.x, this.realPosition.y, this.realPosition.z);
            releaseMovementKeys();
            setVelocity(0, null, 0);
        }

        this._handleRotate();

        this._trigger(execer);
    }

    _handleRotate() {
        if (this.yaw && this.pitch) {
            const yaw = this.realYaw;
            rotate(yaw, this.pitch);
        }
    }

    _preArgumentTrigger(execer) {
        return true;
    }

    _trigger(execer) {
        debugMessage(`Executing node: ${this.nodeName}`);
        execer.execute(this);
    }

    _debugChat() {
        debugMessage(`&7You stepped on &a${this.nodeName}&7${this.toString()}`);
    }

    validate() {
        return this.radius >= 0 && this.height >= 0;
    }

    toString() {
        return "";
    }

    defineTransientProperties() {
        const pos = Dungeons.convertFromRelative(this.position).add([0.5, 0, 0.5])
        Object.defineProperties(this, {
            realPosition: {
                value: pos,
                enumerable: false,
                writable: true,
                configurable: true
            },
            realYaw: {
                value: Dungeons.convertToRealYaw(this.yaw),
                enumerable: false,
                writable: true,
                configurable: true
            },
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
        })
    }
}

manager.registerNode(class NopNode extends Node {
    static identifier = "nop";
    static priority = 0;

    constructor(args) {
        super(this.constructor.identifier, args);
    }

    _trigger(execer) {
        debugMessage(`Executing NOP node: ${this.nodeName}`);
        execer.execute(this);
    }
});
