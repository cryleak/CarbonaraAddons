import Vector3 from "../../utils/Vector3";
import tpManager from "../AutoRoutes/TeleportManager";
import FreezeManager from "../AutoRoutes/FreezeManager";
import scanner from "./Tiles";
import ServerTickEvent from "../../events/ServerTick";
import Dungeons from "../../utils/Dungeons";
import Settings from "../../config"
import Tick from "../../events/Tick";

import { PostPacketReceive, UpdateWalkingPlayer } from "../../events/JavaEvents";
import { swapFromName, sendAirClick, setPlayerPosition, itemSwapSuccess, scheduleTask, rotate, debugMessage, chat, findAirOpening } from "../../utils/utils";
import { findSlot, aotvFinder, nameFinder } from "../../utils/TeleportItem";
import Rotations from "../../utils/Rotations";
import ServerTeleport from "../../events/ServerTeleport";
import { onChatPacket } from "../../../BloomCore/utils/Events";

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

        register("worldUnload", () => {
            this.ticksFromDeathTick = null;
        });

        register("renderOverlay", () => {
            if (this.ticksFromDeathTick !== null && this.renderTicks) {
                Renderer.scale(2)
                Renderer.drawString(this.ticksFromDeathTick % 40, (Renderer.screen.getWidth() / 2) / 2, (Renderer.screen.getHeight() / 2) / 2)
            }
        })
    }

    setup(tile, once = false) {
        // tpManager.teleport(new Vector3(Player), Player.yaw, 0, false, aotvFinder(0), () => {
        const yaw = Dungeons.convertToRealYaw(90)
        const yawRadians = yaw * (Math.PI / 180)

        const oppositeYaw = Dungeons.convertToRealYaw(270)
        const oppositeYawRadians = oppositeYaw * (Math.PI / 180)
        this._teleport(yaw, 5, new Vector3(Player), (v) => v.copy().add(-Math.sin(yawRadians) * 8, 0, Math.cos(yawRadians) * 8), 1, () => {
            tpManager.sync(Player.yaw, 90, false)
            this._pearlClip(90, 62, (releaseMethod) => {
                releaseMethod();
                this._teleport(oppositeYaw, 5, new Vector3(Player), (v) => v.copy().add(-Math.sin(oppositeYawRadians) * 8, 0, Math.cos(oppositeYawRadians) * 8), 1, (pos) => {
                    this._teleportToTile(pos, tile, () => {
                        tpManager.sync(Player.yaw, -90, true);
                        rotate(Player.yaw, -90);
                        FreezeManager.setFreezing(true);
                        const registered = PostPacketReceive.register(packet => {
                            if (!(packet instanceof S08PacketPlayerPosLook)) {
                                return;
                            }
                            this.ticksFromDeathTick = 0
                            this.renderTicks = true
                            registered.unregister();

                            FreezeManager.setFreezing(false);

                            const x = packet.func_148932_c()
                            const y = packet.func_148928_d()
                            const z = packet.func_148933_e()
                            setPlayerPosition(x, y, z, true)

                            if (!scanner.getRoom() && !once) {
                                const onGroundListener = Tick.Pre.register(() => {
                                    if (!Player.asPlayerMP().isOnGround()) return
                                    onGroundListener.unregister()
                                    this.setup(tile, true);
                                });
                                return;
                            }

                            if (scanner.getRoom()) {
                                this.doBlood();
                            }
                        }, 9999);
                    });
                });
            });
        })
    }

    _goToBlood(to) {
        const yaw = Dungeons.convertToRealYaw(270)
        const yawRadians = yaw * (Math.PI / 180)

        started = Date.now();
        this._teleport(yaw, 5, new Vector3(Player), (v) => v.copy().add(-Math.sin(yawRadians) * 8, 0, Math.cos(yawRadians) * 8), 1, (pos) => {
            this._teleportToTile(pos, to, (pos) => {
                this._teleportRightBelowBlood(pos, () => {
                    tpManager.sync(Player.yaw, -90, true);
                    this._pearlThrow(-90, (releasePacket) => {
                        debugMessage(`DeathStreeks Blixten McQueen blood rush took: ${Date.now() - started}ms`);
                        this.renderTicks = false;
                        releasePacket(null)
                        rotate(Player.yaw, 90)
                        sendAirClick();
                    });
                });
            });
        });
    }

    doBlood() {
        if (!scanner.getRoom() || this.ticksFromDeathTick === null) {
            return;
        }

        let waitForMessage = false;
        const onGroundListener = Tick.Pre.register(() => {
            if (!Player.asPlayerMP().isOnGround()) return
            onGroundListener.unregister()
            const to = scanner.getRoom();

            const yaw = Dungeons.convertToRealYaw(90)
            const yawRadians = yaw * (Math.PI / 180)
            this._teleport(yaw, 5, new Vector3(Player), (v) => v.copy().add(-Math.sin(yawRadians) * 8, 0, Math.cos(yawRadians) * 8), 1, () => {
                tpManager.sync(Player.yaw, 90, false)
                this._pearlClip(90, 62, (releaseMethod) => {
                    if (!waitForMessage) {
                        releaseMethod()
                        this._goToBlood(to);
                        return;
                    }

                    const soundListener = register("packetReceived", (packet) => {
                        if (packet.func_149212_c() !== "mob.enderdragon.growl" || packet.func_149208_g() !== 1 || packet.func_149209_h() !== 1) return
                        soundListener.unregister()

                        if (this.ticksFromDeathTick % 40 > 30) {
                            ServerTickEvent.scheduleTask(40 - this.ticksFromDeathTick % 40, () => {
                                releaseMethod();
                                this._goToBlood(to);
                            });
                            return;
                        }

                        releaseMethod();
                        this._goToBlood(to);
                    }).setFilteredClass(net.minecraft.network.play.server.S29PacketSoundEffect);
                })
            })
        }).unregister()

        if (Settings().schizoDoorsTacticalInsertion) {
            onGroundListener.register()
        } else {
            onChatPacket(() => {
                ServerTickEvent.scheduleTask(7, () => {
                    waitForMessage = true;
                    onGroundListener.register();
                });
            }).setCriteria("Starting in 1 second.")
        }
    }

    _teleportToTile(pos, tile, callback) {
        const currentTile = this._getCurrentTile();
        const offset = this._getOffset(currentTile, tile);
        if (offset.x === 0 && offset.z === 0) {
            return;
        }

        this._teleportDown(pos, 8, (pos) => {
            this._executeOffset(offset, pos, (pos) => {
                callback(pos);
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
        const teleportListener = ServerTeleport.register(event => {
            teleportListener.unregister()
            listening = false
            event.cancelled = true
            event.breakChain = true
            callback(yPos => {
                FreezeManager.setFreezing(false)
                sendS08Response(event.data.packet)
                if (yPos !== null) {
                    Client.sendPacket(new C03PacketPlayer.C04PacketPlayerPosition(Player.x, yPos, Player.z, Player.asPlayerMP().isOnGround()))
                    setPlayerPosition(Player.x, yPos, Player.z, false)
                }
            })
        }, 0)

        scheduleTask(60, () => {
            if (!listening) return
            chat("Pearlclip timed out.")
        });
    }

    _pearlThrow(pitch, callback) {
        this._preparePearl(pitch, () => {
            sendAirClick();
            FreezeManager.setFreezing(true)
            this._pearlLand(callback);
        });
    }

    _preparePearl(pitch, callback) {
        swapFromName("Ender Pearl", result => {
            if (result === itemSwapSuccess.FAIL) return
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
        });
    }

    _pearlClip(pitch, yPos, callback) {
        this._pearlThrow(pitch, (releaseMethod) => {
            const trigger = UpdateWalkingPlayer.Pre.register(event => {
                trigger.unregister();
                event.breakChain = true;
                event.cancelled = true;

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, yPos, Player.z, Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));
                setPlayerPosition(Player.x, yPos, Player.z, true)
                callback(() => {
                    releaseMethod(yPos);
                });
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


function sendS08Response(packet) {
    const enumflags = Object.values(packet.func_179834_f())
    let [x, y, z, yaw, pitch] = [packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e(), packet.func_148931_f(), packet.func_148930_g()]
    if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.X)) x += Player.getPlayer().field_70165_t
    if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.Y)) y += Player.getPlayer().field_70163_u
    if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.Z)) z += Player.getPlayer().field_70161_v
    if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) yaw += Player.getYaw()
    if (enumflags.includes(S08PacketPlayerPosLook.EnumFlags.Y_ROT)) pitch += Player.getPitch()
    Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()))
    setPlayerPosition(x, y, z, true)
    rotate(yaw, pitch)
}
