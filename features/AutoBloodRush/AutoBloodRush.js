import Vector3 from "../../utils/Vector3";
import tpManager from "../AutoRoutes/TeleportManager";
import FreezeManager from "../AutoRoutes/FreezeManager";
import scanner from "./Tiles";
import ServerTickEvent from "../../events/ServerTick";
import Dungeons from "../../utils/Dungeons";
import Settings from "../../config"
import Tick from "../../events/Tick";

import { PostPacketReceive, UpdateWalkingPlayer } from "../../events/JavaEvents";
import { swapFromName, sendAirClick, setPlayerPosition, itemSwapSuccess, scheduleTask, rotate, debugMessage, chat } from "../../utils/utils";
import { findSlot, aotvFinder, nameFinder } from "../../utils/TeleportItem";

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

new class BloodRusher {
    constructor() {
        this.ticksFromDeathTick = null
        Dungeons.EnterDungeonEvent.register(() => {
            if (!Settings().schizoDoorsEnabled) return

            if (findSlot(aotvFinder(0)) === null) {
                chat("§cYou need to have an Aspect of the Void with 0 tuners in your hotbar to use this feature.");
                return;
            }

            if (findSlot(nameFinder("Ender Pearl")) === null) {
                chat("§cYou need to have a Ender Pearls in your hotbar to use this feature.");
                return;
            }

            const onGroundListener = Tick.Pre.register(() => {
                if (!Player.asPlayerMP().isOnGround()) return
                const tile = scanner.findTileNotL();
                if (!tile) {
                    return;
                }

                onGroundListener.unregister()
                this.setup(tile)
            })
        })

        ServerTickEvent.register(() => {
            if (this.ticksFromDeathTick !== null) this.ticksFromDeathTick++
        })
    }

    setup(tile, once = false) {
        tpManager.teleport(new Vector3(Player), Player.yaw, 90, false, aotvFinder(0), () => {
            tpManager.sync(Player.yaw, 90, false)

            this._teleportToTile(tile, () => {
                tpManager.sync(Player.yaw, -90, true);
                rotate(Player.yaw, -90);
                FreezeManager.setFreezing(true);
                const registered = PostPacketReceive.register(packet => {
                    if (!(packet instanceof S08PacketPlayerPosLook)) {
                        return;
                    }
                    this.ticksFromDeathTick = 0
                    registered.unregister();

                    FreezeManager.setFreezing(false);
                    const onGroundListener = Tick.Pre.register(() => {
                        if (!Player.asPlayerMP().isOnGround()) return
                        onGroundListener.unregister()
                        started = Date.now();
                        const to = scanner.getRoom();
                        tpManager.teleport(new Vector3(Player), Player.yaw, 90, false, aotvFinder(0), () => {
                            tpManager.sync(Player.yaw, 90, false)
                            this._teleportToTile(to, (pos) => {
                                this._teleportRightBelowBlood(pos, () => {
                                    debugMessage(`Got to blood in: ${Date.now() - started}ms`);
                                    tpManager.sync(Player.yaw, -90, true);
                                    this._pearlThrow(-90, () => {
                                        rotate(Player.yaw, 90)
                                        sendAirClick();
                                    });
                                });
                            });
                        })
                    }).unregister()
                    if (!Settings().schizoDoorsTacticalInsertion) {
                        if (scanner.getRoom()) {
                            const soundListener = register("packetReceived", (packet) => {
                                if (packet.func_149212_c() !== "mob.enderdragon.growl" || packet.func_149208_g() !== 1 || packet.func_149209_h() !== 1) return
                                soundListener.unregister()
                                const ticksToNextDeathTick = this.ticksFromDeathTick % 40
                                if (ticksToNextDeathTick > 15) ServerTickEvent.scheduleTask(40 - ticksToNextDeathTick, () => onGroundListener.register())
                                else onGroundListener.register()
                            }).setFilteredClass(net.minecraft.network.play.server.S29PacketSoundEffect)
                        } else if (!once) {
                            const onGroundListener = Tick.Pre.register(() => {
                                if (!Player.asPlayerMP().isOnGround()) return
                                onGroundListener.unregister()
                                this.setup(tile, true);
                            });
                        }
                    }
                }, 9999);
            });
        })
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
        tpManager.teleport(new Vector3(to), yaw, pitch, false, aotvFinder(0), (toBlock) => {
            this._teleport(yaw, pitch, toBlock, modifier, amount, result);
        });
    }

    _executeOffset(offset, pos, result) {
        if (offset.x > 0) {
            this._teleportRoomLeft(pos, offset.x, (pos) => this._executeOffset({ x: 0, z: offset.z }, pos, result));
            return;
        } else if (offset.x < 0) {
            this._teleportRoomRight(pos, -offset.x, (pos) => this._executeOffset({ x: 0, z: offset.z }, pos, result));
            return;
        }

        if (offset.z > 0) {
            this._teleportRoomUp(pos, offset.z, (pos) => this._executeOffset({ x: offset.x, z: 0 }, pos, result));
            return;
        } else if (offset.z < 0) {
            this._teleportRoomDown(pos, -offset.z, (pos) => this._executeOffset({ x: offset.x, z: 0 }, pos, result));
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
        const soundListener = PostPacketReceive.register(packet => {
            if (!(packet instanceof S08PacketPlayerPosLook)) {
                return;
            }
            listening = false
            soundListener.unregister()
            Client.scheduleTask(0, () => callback())
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
                let triggered = false
                const registered = UpdateWalkingPlayer.Pre.register(event => {
                    registered.unregister()
                    if (triggered) return
                    triggered = true
                    if (event.cancelled) return;
                    event.cancelled = true;
                    event.breakChain = true;

                    const data = event.data;
                    Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, pitch, data.onGround));
                    callback()
                }, 23984234)
            };
            if (result === itemSwapSuccess.SUCCESS) {
                UpdateWalkingPlayer.Pre.scheduleTask(1, () => {
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
        return {
            x: from.x - to.x,
            z: from.z - to.z
        }
    }
}
