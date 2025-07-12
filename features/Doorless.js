import Vector3 from "../utils/Vector3";
import OnUpdateWalkingPlayerPre from "../events/onUpdateWalkingPlayerPre";
import LivingUpdate from "../events/LivingUpdate";
import Rotations from "../utils/Rotations";
import FreezeManager from "./AutoRoutes/FreezeManager";

import { setPlayerPosition, sendAirClick, debugMessage, swapFromName, swapToSlot, itemSwapSuccess } from "../utils/utils";

const MCBlock = Java.type("net.minecraft.block.Block");
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

const validBlocks = [173, 159]
const offsetTimes = [1.23, 2.46, 3.7];
const allowed = [73, 72.5, 72, 71];

let cooldown = Date.now()

let debug = true

function doDoorless(xOffset, zOffset, holding = null) {
    const trigger = register("packetReceived", (packet, event) => {
        const frozenFor = FreezeManager.setFreezing(false);
        const [x, y, z] = [packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e()];
        console.log(`Received packet at ${x}, ${y}, ${z}`);
        if (!allowed.includes(y)) return;
        trigger.unregister();

        cancel(event);
        Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(x, y, z, packet.func_148931_f(), packet.func_148930_g(), true));

        let amount = 0;
        let done = false;

        const sendNextPacket = () => {
            ;
            const pos = [x + xOffset * offsetTimes[amount], 69, z + zOffset * offsetTimes[amount]];
            Client.sendPacket(new C03PacketPlayer.C06PacketPlayerPosLook(...pos, Player.yaw, Player.pitch, true));
            if (++amount === offsetTimes.length) {
                SkeletonKeyCheck.register();
                setPlayerPosition(...pos, true);
                done = true;
            }
        };

        const amountToSend = Math.min(frozenFor, offsetTimes.length);
        for (let i = 0; i < amountToSend; i++) {
            sendNextPacket();
        }

        if (!done) {
            const triggered = OnUpdateWalkingPlayerPre.register(event => {
                event.cancelled = true;
                event.break = true;

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
    }).setFilteredClass(S08PacketPlayerPosLook);

    sendAirClick();
}

const SkeletonKeyCheck = OnUpdateWalkingPlayerPre.register(event => {
    const data = event.data
    const [x, y, z] = [data.x, data.y, data.z];

    if (y !== 69) return;
    if (!data.onGround) return
    if (Player.isSneaking()) return


    let yaw = data.yaw
    let xOffset = 0, zOffset = 0;

    const direction = ((Math.round(yaw / 90) + 4) % 4);

    switch (direction) {
        case 0: // South
            xOffset = 0;
            zOffset = 1;
            yaw = 0;
            break;
        case 1: // West
            xOffset = -1;
            zOffset = 0;
            yaw = 90;
            break;
        case 2: // North
            xOffset = 0;
            zOffset = -1;
            yaw = 180;
            break;
        case 3: // East
            xOffset = 1;
            zOffset = 0;
            yaw = 270;
            break;
    }

    if (!((World.getBlockAt(x + xOffset - 1, y, z + zOffset - 1).type.getID() === 173 && World.getBlockAt(x + xOffset - 1, y + 3, z + zOffset - 1).type.getID() === 173) || (World.getBlockAt(x + xOffset - 1, y, z + zOffset - 1).type.getID() == 159 && World.getBlockAt(x + xOffset - 1, y + 3, z + zOffset - 1).type.getID() == 159 && World.getBlockAt(x + xOffset - 1, y, z + zOffset - 1).getMetadata() == 14 && World.getBlockAt(x + xOffset - 1, y + 3, z + zOffset - 1).getMetadata() == 14))) {
        return;
    }

    if ((Date.now() - cooldown) < 500) return;
    if (Client.getMinecraft().field_71476_x == null) return;
    if (Client.getMinecraft().field_71476_x.field_72313_a.toString() == "ENTITY") return;

    SkeletonKeyCheck.unregister();

    cooldown = Date.now()
    event.cancelled = true;
    event.break = true;
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
                    LivingUpdate.scheduleTask(0, () => {
                        doDoorless(xOffset, zOffset, holding);
                    });
                    break;
                case itemSwapSuccess.ALREADY_HOLDING:
                    doDoorless(xOffset, zOffset, holding);
                    break;
                case itemSwapSuccess.FAIL:
                    FreezeManager.setFreezing(false);
                    break;
            }
        });
        return;
    }

    doDoorless(xOffset, zOffset);
});

register("WorldUnload", () => {
    SkeletonKeyCheck.unregister()
})

register("Chat", () => {
    SkeletonKeyCheck.register()
    // inDoor = false
}).setCriteria("Starting in 1 second.")

register("Chat", () => {
    SkeletonKeyCheck.unregister();
}).setCriteria("[BOSS] Maxor: WELL WELL WELL LOOK WHO'S HERE!")

register("Command", () => {
    SkeletonKeyCheck.register()
    ChatLib.chat(`&8&lSkeletonKey &l&7> &r&7Fixed`)
}).setName("fixshit")

function isWithinTolerence(n1, n2) {
    return Math.abs(n1 - n2) < 1e-4;
}
