import Settings from "../config"
import Vector3 from "../utils/Vector3";
import Rotations from "../utils/Rotations";
import Dungeons from "../utils/Dungeons";
import FreezeManager from "./AutoRoutes/FreezeManager";
import ServerTeleport from "../events/ServerTeleport"

import { existsNorthDoor, existsWestDoor } from "./Doors";
import { setPlayerPosition, sendAirClick, debugMessage, swapFromName, swapToSlot, itemSwapSuccess } from "../utils/utils";
import { UpdateWalkingPlayer } from "../events/JavaEvents";

const MCBlock = Java.type("net.minecraft.block.Block");
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

const allowed = [73, 72.5, 72, 71];

let cooldown = Date.now()

let debug = true

class Doorless {
    constructor() {
        this.trigger = UpdateWalkingPlayer.Pre.register(event => {
            if (!Settings().doorlessEnabled || !Dungeons.isInDungeons()) {
                return;
            }

            this.check(event);
        });
    }

    check(event) {
        const data = event.data
        const { x, y, z } = data;

        if (y !== 69) return;
        if (!data.onGround) return
        if (Player.isSneaking()) return

        let yaw = data.yaw;
        let xOffset = 0, zOffset = 0;

        const pos = new Vector3(Math.ceil(Player.x), Player.y, Math.ceil(Player.z));

        const xNormalized = (pos.x + 201) % 32;
        const xNormalizedZ = (pos.z + 185) % 32;
        const zNormalized = (pos.z + 201) % 32;
        const zNormalizedX = (pos.x + 185) % 32;

        let direction = 0;
        if (xNormalizedZ < 3) {
            if (xNormalized === 31) {
                xOffset = 1;
                zOffset = 0;
                yaw = 270;
            } else if (xNormalized === 3) {
                xOffset = -1;
                zOffset = 0;
                yaw = 90;
            } else {
                return;
            }
        } else if (zNormalizedX < 3) {
            if (zNormalized === 31) {
                xOffset = 0;
                zOffset = 1;
                yaw = 0;
            } else if (zNormalized === 3) {
                xOffset = 0;
                zOffset = -1;
                yaw = 180;
            } else {
                return;
            }
        } else {
            return;
        }

        if (xOffset) {
            const remeinder = Player.x - Math.floor(Player.x);
            if (remeinder !== (xOffset === -1 ? 0.30000001192092896 : 0.699999988079071)) {
                return;
            }
        } else if (zOffset) {
            const remeinder = Player.z - Math.floor(Player.z);
            if (remeinder !== (zOffset === -1 ? 0.30000001192092896 : 0.699999988079071)) {
                return;
            }
        }

        if (xOffset && !zOffset) {
            const doorX = Math.floor(Player.x) + xOffset * 2;
            const doorZ = Math.floor(Player.z) - (xNormalizedZ - 1);
            if (!existsWestDoor(doorX, doorZ)) {
                return;
            }
        } else {
            const doorX = Math.floor(Player.x) - (zNormalizedX - 1);
            const doorZ = Math.floor(Player.z) + zOffset * 2;
            if (!existsNorthDoor(doorX, doorZ)) {
                return;
            }
        }

        if ((Date.now() - cooldown) < 500) return;
        if (Client.getMinecraft().field_71476_x == null) return;
        if (Client.getMinecraft().field_71476_x.field_72313_a.toString() == "ENTITY") return;

        offsetTimes = Settings().doorlessPacketAmount.split(",").reduce((acc, v) => {
            const value = parseFloat(v);
            if (!value || isNaN(value)) {
                return acc;
            }

            let last = acc.length ? acc[acc.length - 1] : 0;
            acc.push(value + last);
            return acc;
        }, []);

        if (offsetTimes.length < 3) {
            return;
        }

        this.trigger.unregister();

        cooldown = Date.now()
        event.cancelled = true;
        event.breakChain = true;
        let pitch = 0;
        if (World.getBlockAt(x - 1, y + 3, z - 1).type.getID() === 0) {
            pitch = -90;
        }

        if (xOffset != 0 && zOffset == 0) {
            Player.getPlayer().func_70107_b(x, y, Math.ceil(z) - 0.5);
            Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(x, 69, Math.ceil(z) - 0.5, yaw, pitch, true));
        }
        else {
            Player.getPlayer().func_70107_b(Math.ceil(x) - 0.5, y, z);
            Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(Math.ceil(x) - 0.5, 69, z, yaw, pitch, true));
        }

        FreezeManager.setFreezing(true);

        if (Player?.getHeldItem()?.getName()?.removeFormatting()?.toLowerCase() !== "ender pearl") {
            debugMessage(`You are not holding an ender pearl, swapping to slot`);
            const holding = Player.getHeldItemIndex();
            swapFromName("ender pearl", (result) => {
                switch (result) {
                    case itemSwapSuccess.SUCCESS:
                        UpdateWalkingPlayer.Pre.scheduleTask(0, () => {
                            this.doDoorless(xOffset, zOffset, offsetTimes, holding);
                        });
                        break;
                    case itemSwapSuccess.ALREADY_HOLDING:
                        this.doDoorless(xOffset, zOffset, offsetTimes, holding);
                        break;
                    case itemSwapSuccess.FAIL:
                        FreezeManager.setFreezing(false);
                        this.trigger.register();
                        break;
                }
            });
            return;
        }

        this.doDoorless(xOffset, zOffset, offsetTimes);
    }

    doDoorless(xOffset, zOffset, offsetTimes, holding = null) {
        const trigger = ServerTeleport.register(event => {
            const data = event.data;
            const frozenFor = FreezeManager.setFreezing(false);
            const { x, y, z } = data;
            trigger.unregister();
            if (!allowed.includes(y)) {
                this.trigger.register();
                return;
            }


            event.cancelled = true
            Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(x, y, z, data.yaw, data.pitch, true));

            let amount = 0;
            let done = false;

            const sendNextPacket = () => {
                const pos = [x + xOffset * offsetTimes[amount], 69, z + zOffset * offsetTimes[amount]];
                Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(...pos, Player.yaw, Player.pitch, true));
                if (++amount === offsetTimes.length) {
                    this.trigger.register();
                    setPlayerPosition(...pos, true);
                    done = true;
                }
            };

            const amountToSend = Math.min(frozenFor, offsetTimes.length);
            for (let i = 0; i < amountToSend; i++) {
                sendNextPacket();
            }

            if (!done) {
                const triggered = UpdateWalkingPlayer.Pre.register(event => {
                    event.cancelled = true;
                    event.breakChain = true;

                    sendNextPacket();
                    if (done) {
                        triggered.unregister();
                    }
                }, 10000002348);
            }

            debugMessage(`Gooned next to a door for ${amountToSend} blinked and ${offsetTimes.length - amountToSend} regular pos packets`);

            if (holding) {
                swapToSlot(holding);
            }
        }, 1000000000000000)

        sendAirClick();
    }
}

export default new Doorless();
