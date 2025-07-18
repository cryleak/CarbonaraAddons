import Vector3 from "../../utils/Vector3";
import tpManager from "../AutoRoutes/TeleportManager";
import FreezeManager from "../AutoRoutes/FreezeManager";
import Tick from "../../events/Tick";

import { PostPacketReceive, UpdateWalkingPlayer } from "../../events/JavaEvents";
import { registerSubCommand } from "../../utils/commands";
import { swapFromName, sendAirClick, setPlayerPosition, itemSwapSuccess, scheduleTask, rotate, debugMessage } from "../../utils/utils";

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

class BloodRoomScanner {
    constructor() {
        this.coordinates = [
            [
                { x: 2, z: 2 },
                { x: 8, z: 2 },
                { x: 2, z: 6 },
                { x: 8, z: 6 },
            ],
            [
                { x: 2, z: 28 },
                { x: 6, z: 28 },
                { x: 2, z: 22 },
                { x: 6, z: 22 }
            ],
            [
                { x: 28, z: 2 },
                { x: 24, z: 2 },
                { x: 28, z: 8 },
                { x: 24, z: 8 }
            ],
            [
                { x: 28, z: 28 },
                { x: 22, z: 28 },
                { x: 28, z: 24 },
                { x: 22, z: 24 }
            ]
        ];

        this.found = null;
        Tick.Pre.register(() => {
            this._scan();
        }, 234999);

        register("worldUnload", () => {
            this.found = null;
        });
    }

    getRoom() {
        return this.found;
    }

    _checkFor(room) {
        return this.coordinates.some(rotation => {
            return !rotation.some(coord => {
                const at = room.copy().add(coord.x, 0, coord.z);
                const block = World.getBlockAt(new BlockPos(at.convertToBlockPos()))
                return block.type.getID() !== 35 || block.getMetadata() !== 5;
            });
        });
    }

    _scan() {
        if (this.found) {
            return;
        }

        for (let x = -200; x <= -8; x += 32) {
            for (let z = -200; z <= -8; z += 32) {
                let foundRoom = this._checkFor(new Vector3(x, 100, z));
                if (foundRoom) {
                    this.found = new Vector3(x + 16, 70, z + 16);
                    return;
                }
            }
        }
    }
}

const brScanner = new BloodRoomScanner();

class BloodRusher {
    setup() {
        this._teleportToTile({x: 3, z: 3}, () => {
            tpManager.sync(Player.yaw, -90, true);
            rotate(Player.yaw, -90);
            FreezeManager.setFreezing(true);
            const registered = PostPacketReceive.register(packet => {
                if (!(packet instanceof S08PacketPlayerPosLook)) {
                    return;
                }
                registered.unregister();

                FreezeManager.setFreezing(false);
                if (brScanner.getRoom()) {
                    scheduleTask(10, () => {
                        started = Date.now();
                        const to = this._tileFromCoords(brScanner.getRoom());
                        this._teleportToTile(to, (pos) => {
                            this._teleportRightBelowBlood(pos, () => {
                                debugMessage(`Got to blood in: ${Date.now() - started}ms`);
                                tpManager.sync(Player.yaw, -90, true);
                                this._preparePearl(-90, () => {
                                    sendAirClick();
                                    scheduleTask(2, () => {
                                        sendAirClick();
                                    });
                                });
                            });
                        });
                    });
                }
            }, 9999);
        });
    }

    _teleportToTile(tile, callback) {
        const currentTile = this._getCurrentTile();
        const offset = this._getOffset(currentTile, tile);
        if (offset.x === 0 && offset.z === 0) {
            return;
        }
        this._pearlClip(90, 62, () => {
            this._teleportDown(new Vector3(Player), 8, (pos) => {
                this._executeOffset(offset, pos, (pos) => {
                    callback(pos);
                });
            });
        });
    }

    _teleport(yaw, pitch, from, modifier, amount, result) {
        if (amount-- === 0) {
            result(from);
            return;
        }

        const to = modifier(from);
        tpManager.teleport(new Vector3(to), yaw, pitch, false, "Aspect of the Void", (toBlock) => {
            this._teleport(yaw, pitch, toBlock, modifier, amount, result);
        });
    }

    _executeOffset(offset, pos, result) {
        if (offset.x > 0) {
            this._teleportRoomLeft(pos, offset.x, (pos) => this._executeOffset({x: 0, z: offset.z}, pos, result));
            return;
        } else if (offset.x < 0) {
            this._teleportRoomRight(pos, -offset.x, (pos) => this._executeOffset({x: 0, z: offset.z}, pos, result));
            return;
        }

        if (offset.z > 0) {
            this._teleportRoomUp(pos, offset.z, (pos) => this._executeOffset({x: offset.x, z: 0}, pos, result));
            return;
        } else if (offset.z < 0) {
            this._teleportRoomDown(pos, -offset.z, (pos) => this._executeOffset({x: offset.x, z: 0}, pos, result));
            return;
        }

        result(pos);
    }

    _teleportRightBelowBlood(from, result) {
        this._teleportUp(from, 6, (pos) => {
            this._teleport(Player.yaw, -90, pos, (v) => new Vector3(v.x, 64, v.z), 1, result);
        });
    }

    _teleportRoomLeft(from, amount, result) {
        this._teleport(90, 5, from, (v) => v.copy().add(-8, 0, 0), 4 * amount, result);
    }

    _teleportRoomRight(from, amount, result) {
        this._teleport(-90, 5, from, (v) => v.copy().add(8, 0, 0), 4 * amount, result);
    }

    _teleportRoomUp(from, amount, result) {
        this._teleport(180, 5, from, (v) => v.copy().add(0, 0, -8), 4 * amount, result);
    }

    _teleportRoomDown(from, amount, result) {
        this._teleport(0, 5, from, (v) => v.copy().add(0, 0, 8), 4 * amount, result);
    }

    _teleportUp(from, amount, result) {
        const modifier = (v) => v.copy().add(0, 9, 0);
        this._teleport(Player.yaw, -90, from, modifier, amount, result);
    }

    _teleportDown(from, amount, result) {
        const modifier = (v) => v.copy().add(0, -7, 0);
        this._teleport(Player.yaw, 90, from, modifier, amount, result);
    }

    _pearlLand(callback) {
        let listening = true
        const soundListener = register("soundPlay", (_, name, vol) => {
            if (name !== "mob.endermen.portal" || vol !== 1) return
            listening = false
            soundListener.unregister()
            callback();
        })

        scheduleTask(60, () => {
            if (!listening) return
            chat("Pearlclip timed out.")
        });
    }

    _pearlThrow(pitch, callback) {
        this._preparePearl(pitch, () => {
            sendAirClick();
            this._pearlLand(callback);
        });
    }

    _preparePearl(pitch, callback) {
        swapFromName("Ender Pearl", result => {
            if (result === itemSwapSuccess.FAIL) return
            const throwPearl = () => {
                const registered = UpdateWalkingPlayer.Pre.register(event => {
                    registered.unregister();
                    if (event.cancelled) return;
                    event.cancelled = true;
                    event.breakChain = true;

                    const data = event.data;
                    Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, pitch, data.onGround));
                    callback()
                }, 23984234);
            };
            if (result === itemSwapSuccess.SUCCESS) {
                UpdateWalkingPlayer.Pre.scheduleTask(1, _ => {
                    throwPearl();
                });
            } else if (result === itemSwapSuccess.ALREADY_HOLDING) {
                throwPearl();
            }
        });
    }

    _pearlClip(pitch, yPos, callback) {
        this._pearlThrow(pitch, () => {
            const trigger = UpdateWalkingPlayer.Pre.register(event => {
                trigger.unregister();
                event.breakChain = true;
                event.cancelled = true;

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, yPos, Player.z, Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));
                setPlayerPosition(Player.x, yPos, Player.z, true)
                callback();
            }, 293428534);
        });
    }

    _tileFromCoords(coords) {
        return { x: Math.floor((coords.x + 200) / 32), z: Math.floor((coords.z + 200) / 32) };
    }

    _getCurrentTile() {
        return this._tileFromCoords(new Vector3(Player));
    }

    _getOffset(from, to) {
        return { x: from.x - to.x,
                 z: from.z - to.z }
    }
}

registerSubCommand("do", (_) => {
    new BloodRusher().setup();
});
