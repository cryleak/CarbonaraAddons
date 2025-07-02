import Dungeons from "../../utils/Dungeons"
import { BatSpawnEvent, SecretEvent } from "../../events/SecretListener"
import { scheduleTask, releaseMovementKeys, rotate, chat, debugMessage } from "../../utils/utils"
import manager from "./NodeManager"

export class Node {
    static priority = 1000;

	constructor(name, args) {
		this.nodeName = name;
		const {x, y, z} = Player;

        this.lastTriggered = 0;

		this.x = args.x;
		this.y = args.y;
		this.z = args.z;
        this.radius = args.radius;
        this.height = args.height;
        this.delay = args.delay;
        this.awaitBat = args.awaitBat;
        this.awaitSecret = args.awaitSecret;
        this.stop = args.stop;
        this.center = args.center;
        this.yaw = args.yaw;
        this.pitch = args.pitch;
        this.block = args.block;
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
        debugMessage(`Executing node: ${this.nodeName} at (${this.x}, ${this.y}, ${this.z})`);
        if (!this._preArgumentTrigger(execer)) return execer.lowerConsumed();

        this.lastTriggered = Date.now();
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
            Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0);
        }

        if (this.center) {
            Player.getPlayer().func_70107_b(this.loc.x, this.loc.y, this.loc.z);
            releaseMovementKeys();
            Player.getPlayer().func_70016_h(0, Player.getPlayer().field_70181_x, 0);
        }

        this._handleRotate();

        this._trigger(execer);
    }

    _handleRotate() {
        if (this.yaw && this.pitch) {
            const yaw = Dungeons.convertToRealYaw(this.yaw);
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
		return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z) && this.radius > 0.0;
	}

	toString() {
		return "";
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
