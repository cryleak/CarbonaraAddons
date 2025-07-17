import RenderLibV2 from "../../RenderLibV2";
import Vector3 from "../utils/Vector3";
import Dungeons from "../utils/Dungeons";
import Tick from "../events/Tick";

const validBlocks = [173, 159];

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

            west.push({x, z});
        }
    }
    for (let z = -169; z <= -9; z += 32) {
        for (let x = -185; x <= -25; x += 32) {
            if (!checkBlock(x - 1, 70, z - 1) || !checkBlock(x, 70, z) || !checkBlock(x + 1, 70, z + 1)) {
                continue;
            }

            north.push({x, z});
        }
    }
});

/*
register("renderWorld", () => {
    for (let i = 0; i < north.length; i++) {
        RenderLibV2.drawEspBoxV2(north[i].x + .5, 69, north[i].z + .5, 3, 4, 3, 1, 0, 0, 1, 1);
    }
    for (let i = 0; i < west.length; i++) {
        RenderLibV2.drawEspBoxV2(west[i].x + .5, 69, west[i].z + .5, 3, 4, 3, 1, 0, 0, 1, 1);
    }
});
*/

register("renderWorld", () => {
    const room = Dungeons.getCurrentRoom();
    if (!room || !room.roomComponents) return;

    room.roomComponents.forEach((component, i) => {
        const x = component.x + 0.5;
        const z = component.z + 0.5;
        Tessellator.drawString(`index: ${i} rotation: ${room.rotation.name()} type: ${Dungeons.roomType(room)}`, x, 75, z, 16777215, true, 0.02, false);
    });
    const components = Dungeons.sortComponents(room);

    const doors = Dungeons.getDoorLocations(room, components);
    doors.forEach((door, i) => {
        const x = door.x + 0.5;
        const z = door.z + 0.5;
        RenderLibV2.drawEspBoxV2(x, 69, z, 3, 4, 3, 1, 0, 0, 1, 1);
        Tessellator.drawString(i.toString(), x, 72, z, 16777215, true, 0.02, false);
    });

    /*
    const active = doors.reduce((acc, door, i) => {
        if (existsNorthDoor(door.x, door.z) || existsWestDoor(door.x, door.z)) {
            acc.push({ ...door, i });
        }

        return acc;
    }, []);

    active.forEach((door, i) => {
        const x = door.x + 0.5;
        const z = door.z + 0.5;
        RenderLibV2.drawEspBoxV2(x, 69, z, 3, 4, 3, 1, 0, 0, 1, 1);
        Tessellator.drawString(door.i.toString(), x, 72, z, 16777215, true, 0.02, false);
    });
    */
});

export function existsNorthDoor(x, z) {
    return north.some(door => door.x === x && door.z === z);
}

export function existsWestDoor(x, z) {
    return west.some(door => door.x === x && door.z === z);
}
