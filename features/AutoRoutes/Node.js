import Dungeons from "../../utils/Dungeons"
import manager from "./NodeManager"
import SecretEvent from "../../events/SecretListener"
import BatSpawnEvent from "../../events/BatSpawn"
import Vector3 from "../../utils/Vector3"
import { Editable } from "../../utils/ObjectEditor";
import tpManager from "./TeleportManager"

import { scheduleTask, releaseMovementKeys, rotate, debugMessage, setPlayerPosition, setVelocity, clampYaw, capitalizeFirst } from "../../utils/utils"
import FreezeManager from "./FreezeManager"

export class Node extends Editable {
    static priority = 1000;

    constructor(name, args) {
        super();

        this.nodeName = name;

        this.position = args.position;
        this.radius = args.radius;
        this.height = args.height;
        this.delay = args.delay;
        this.awaitBat = args.awaitBat;
        this.awaitSecret = args.awaitSecret;
        this.stop = args.stop;
        this.center = args.center;
        this.yaw = args.yaw;
        this.pitch = args.pitch;
        this.lineOfSight = args.lineOfSight;
        if (manager.currentRoom.type === "dungeons") {
            this.position = new Vector3(Dungeons.convertToRelative(this.position));
            this.yaw = Dungeons.convertToRelativeYaw(this.yaw);
        }
        this.defineTransientProperties(manager.currentRoom);
    }

    setLocation(loc) {
        this.x = loc.x;
        this.y = loc.y;
        this.z = loc.z;
        return this;
    }

    canRun() {
        return true;
    }

    execute(execer) {
        this.lastTriggered = Date.now();
        this.triggered = true
        if (!this._preArgumentTrigger(execer)) return execer.lowerConsumed();

        this._debugChat();
        this._argumentTrigger(execer);
    }

    _argumentTrigger(execer, metadata = {}) {
        if (!metadata.playerPosition) metadata.playerPosition = new Vector3(Player)
        if (this.delay && !metadata.delay) {
            const delay = Math.ceil(parseInt(this.delay) / 50)
            FreezeManager.setFreezing(true)
            scheduleTask(delay, () => {
                FreezeManager.setFreezing(false)
                metadata.delay = true;
                this._argumentTrigger(execer, metadata);
            });
            return;
        }

        if (this.awaitSecret && !metadata.awaitSecret) {
            const amount = parseInt(this.awaitSecret) - 1 || 0

            FreezeManager.setFreezing(true)
            SecretEvent.scheduleTask(amount, () => {
                FreezeManager.setFreezing(false)
                metadata.awaitSecret = true;
                this._argumentTrigger(execer, metadata);
            });

            return;
        }

        if (this.awaitBat && !metadata.awaitBat) {
            FreezeManager.setFreezing(true)
            BatSpawnEvent.scheduleTask(0, () => {
                FreezeManager.setFreezing(false)
                metadata.awaitBat = true;
                this._argumentTrigger(execer, metadata);
            });

            return;
        }

        if (this.stop) {
            releaseMovementKeys();
            setVelocity(0, null, 0);
        }

        if (this.center) {
            setPlayerPosition(this.realPosition.x, this.realPosition.y, this.realPosition.z, true);
            releaseMovementKeys();
            setVelocity(0, null, 0);
        }

        const allowed2D = this.center ? 1.5 ** 2 - 1 : 0.01;
        if (metadata.playerPosition.distance2D(Player) > allowed2D || metadata.playerPosition.distanceY(Player) > 0.01) {
            this.triggered = false
            execer.lowerConsumed()
            return
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
        releaseMovementKeys();
        setVelocity(0, 0, 0);
        if (this.awaitSecret || this.awaitBat) {

            tpManager.sync(clampYaw(this.realYaw), clampYaw(this.pitch), true);
            this._handleRotate();
        }
        return true;
    }

    _trigger(execer) {
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

    _onUpdatedInConfig() {
        manager.saveConfig();
    }

    customIntersection() {
        return null;
    }

    createConfigValues() {
        return [
            {
                type: "addTextParagraph",
                configName: `Editing node: ${capitalizeFirst(this.nodeName)}`
            },
            {
                type: "addTextInput",
                configName: "position",
                registerListener: (obj, _, next) => {
                    const newPos = next.split(",").map((v) => parseFloat(v.trim()));
                    if (newPos.length !== 3) {
                        return;
                    }

                    if (newPos.some((v) => isNaN(v))) {
                        return;
                    }

                    obj.position = new Vector3(newPos);
                    obj.realPosition = Dungeons.convertFromRelative(obj.position).add([0.5, 0, 0.5]);
                },
                updator: (setter, obj) => {
                    const value = `${obj.position.x},${obj.position.y},${obj.position.z}`;
                    setter("position", value);
                }
            },
            {
                type: "addTextInput",
                configName: "yaw",
                registerListener: (obj, _, next) => {
                    const yaw = parseFloat(next);
                    if (isNaN(yaw)) {
                        return;
                    }

                    obj.yaw = Dungeons.convertToRelativeYaw(yaw);
                    obj.realYaw = yaw;
                    rotate(yaw, Player.pitch);
                },
                updator: (setter, obj) => {
                    setter("yaw", obj.realYaw.toString());
                }
            },
            {
                type: "addTextInput",
                configName: "pitch",
                registerListener: (obj, _, next) => {
                    const pitch = parseFloat(next);
                    if (isNaN(pitch)) {
                        return;
                    }

                    obj.pitch = pitch;
                    rotate(Player.yaw, obj.pitch);
                },
                updator: (setter, obj) => {
                    setter("pitch", obj.pitch.toString());
                }
            },
            {
                type: "addTextInput",
                configName: "radius",
                registerListener: (obj, _, next) => {
                    const radius = parseFloat(next);
                    if (isNaN(radius) || radius < 0) {
                        return;
                    }

                    obj.radius = radius;
                },
                updator: (setter, obj) => {
                    setter("radius", obj.radius.toString());
                }
            },
            {
                type: "addTextInput",
                configName: "height",
                registerListener: (obj, _, next) => {
                    const height = parseFloat(next);
                    if (isNaN(height) || height < 0) {
                        return;
                    }

                    obj.height = height;
                },
                updator: (setter, obj) => {
                    setter("height", obj.height.toString());
                }
            },
            {
                type: "addTextInput",
                configName: "delay",
                registerListener: (obj, _, next) => {
                    const amount = parseInt(next);
                    if (isNaN(amount) || amount < 0) {
                        return;
                    }

                    obj.delay = amount;
                },
                updator: (setter, obj) => {
                    setter("delay", obj.delay.toString() || "0");
                }
            },
            {
                type: "addSwitch",
                configName: "await Bat",
                registerListener: (obj, _, next) => {
                    obj.awaitBat = next;
                },
                updator: (setter, obj) => {
                    setter("await Bat", obj.awaitBat);
                }
            },
            {
                type: "addTextInput",
                configName: "await Secrets",
                registerListener: (obj, _, next) => {
                    const amount = parseInt(next);
                    if (amount < 0) {
                        obj.awaitSecret = 0;
                        return;
                    }

                    obj.awaitSecret = amount;
                },
                updator: (setter, obj) => {
                    setter("await Secrets", obj.awaitSecret?.toString() || "0");
                }
            }
        ];
    }

    defineTransientProperties(room) {
        if (!(this.position instanceof Vector3)) {
            console.log("Node position is not a Vector3, cannot define transient properties.");
            console.log(JSON.stringify(this.position, null, 2));
            return;
        }

        const pos = room.type === "dungeons" ? Dungeons.convertFromRelative(this.position) : this.position;
        Object.defineProperties(this, {
            realPosition: {
                value: pos.add([0.5, 0, 0.5]),
                enumerable: false,
                writable: true,
                configurable: true
            },
            realYaw: {
                value: room.type === "dungeons" ? Dungeons.convertToRealYaw(this.yaw) : this.yaw,
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
