import Vector3 from "../utils/Vector3";
import Tick from "../events/Tick";
import tpManager from "./AutoRoutes/TeleportManager";

import { UpdateWalkingPlayer } from "../events/JavaEvents";
import { registerSubCommand } from "../utils/commands";
import { swapFromName, sendAirClick, setPlayerPosition, itemSwapSuccess, scheduleTask, rotate } from "../utils/utils";

function checkBlock(x, y, z) {
    const block = World.getBlockAt(x, y, z);
    const type = block.type.getID();
    return type === 173 || (type === 159 && block.getMetadata() === 14)
}

let north = [];
let west = [];
Tick.Pre.register(() => {
    north = [];
    west = [];

    for (let z = -185; z <= -25; z += 32) {
        for (let x = -169; x <= -9; x += 32) {
            if (!checkBlock(x - 1, 70, z - 1) || !checkBlock(x, 70, z) || !checkBlock(x + 1, 70, z + 1)) {
                continue;
            }

            west.push({ x, z });
        }
    }
    for (let z = -169; z <= -9; z += 32) {
        for (let x = -185; x <= -25; x += 32) {
            if (!checkBlock(x - 1, 70, z - 1) || !checkBlock(x, 70, z) || !checkBlock(x + 1, 70, z + 1)) {
                continue;
            }

            north.push({ x, z });
        }
    }
});

export function existsNorthDoor(x, z) {
    return north.some(door => door.x === x && door.z === z);
}

export function existsWestDoor(x, z) {
    return west.some(door => door.x === x && door.z === z);
}

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

class Doer {
    setup() {
        // I need to be on 64 when throwing pearls up
        this.pearlItem(90, 62, () => {
            this.teleportDown(new Vector3(Player), 8, (pos) => {
                this.teleportRoomLeft(pos, 1, (pos) => {
                    this.teleportRoomUp(pos, 4, (pos) => {
                        this.teleportRightBelowBlood(pos, () => {
                            tpManager.sync(Player.yaw, -90, true);
                            rotate(Player.yaw, -90);
                            this.pearlItem(-90, 68, () => { });
                        });
                    });
                });
            });
        });
    }

    teleport(yaw, pitch, from, modifier, amount, result) {
        if (amount-- === 0) {
            result(from);
            return;
        }

        const to = modifier(from);
        tpManager.teleport(new Vector3(to), yaw, pitch, false, "Aspect of the Void", (toBlock) => {
            this.teleport(yaw, pitch, toBlock, modifier, amount, result);
        });
    }

    teleportRightBelowBlood(from, result) {
        this.teleportUp(from, 6, (pos) => {
            this.teleport(Player.yaw, -90, pos, (v) => new Vector3(v.x, 64, v.z), 1, result);
        });
    }

    teleportRoomLeft(from, amount, result) {
        this.teleport(90, 5, from, (v) => v.copy().add(-8, 0, 0), 4 * amount, result);
    }

    teleportRoomRight(from, amount, result) {
        this.teleport(-90, 5, from, (v) => v.copy().add(8, 0, 0), 4 * amount, result);
    }

    teleportRoomUp(from, amount, result) {
        this.teleport(180, 5, from, (v) => v.copy().add(0, 0, -8), 4 * amount, result);
    }

    teleportRoomDown(from, amount, result) {
        this.teleport(0, 5, from, (v) => v.copy().add(0, 0, 8), 4 * amount, result);
    }

    teleportUp(from, amount, result) {
        const modifier = (v) => v.copy().add(0, 9, 0);
        this.teleport(Player.yaw, -90, from, modifier, amount, result);
    }

    teleportDown(from, amount, result) {
        const modifier = (v) => v.copy().add(0, -7, 0);
        this.teleport(Player.yaw, 90, from, modifier, amount, result);
    }

    pearlClip(yPos, callback) {
        sendAirClick()
        let listening = true
        const soundListener = register("soundPlay", (_, name, vol) => {
            if (name !== "mob.endermen.portal" || vol !== 1) return
            listening = false
            soundListener.unregister()
            const trigger = UpdateWalkingPlayer.Pre.register(event => {
                trigger.unregister();
                event.breakChain = true;
                event.cancelled = true;

                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Player.x, yPos, Player.z, Player.yaw, Player.pitch, Player.asPlayerMP().isOnGround()));
                setPlayerPosition(Player.x, yPos, Player.z, true)
                callback();
            }, 293428534);
        })

        scheduleTask(60, () => {
            if (!listening) return
            chat("Pearlclip timed out.")
        });
    }

    pearlItem(pitch, yPos, callback) {
        swapFromName("Ender Pearl", result => {
            if (result === itemSwapSuccess.FAIL) return
            UpdateWalkingPlayer.Pre.scheduleTask(1, () => {
                const registered = UpdateWalkingPlayer.Pre.register(event => {
                    registered.unregister();
                    if (event.cancelled) return;
                    event.cancelled = true;
                    event.breakChain = true;

                    const data = event.data;
                    Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(Player.yaw, pitch, data.onGround));
                    this.pearlClip(yPos, callback);
                }, 23984234);
            });
        })
    }
}
const coordinates = [
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

function checkFor(room) {
    return coordinates.some(rotation => {
        return !rotation.some(coord => {
            const at = room.copy().add(coord.x, 0, coord.z);
            const block = World.getBlockAt(new BlockPos(at.convertToBlockPos()))
            return block.type.getID() !== 35 || block.getMetadata() !== 5;
        });
    });
}

let found = null;
Tick.Pre.register(() => {
    for (let x = -200; x <= -8; x += 32) {
        for (let z = -200; z <= -8; z += 32) {
            let foundRoom = checkFor(new Vector3(x, 100, z));
            if (foundRoom) {
                found = new Vector3(x + 16, 70, z + 16);
                return;
            }
        }
    }

    found = null;
}, 234999);

registerSubCommand("do", () => {
    new Doer().setup();
});
