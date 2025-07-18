
import Vector3 from "./Vector3.js"

import { onScoreboardLine } from "../../BloomCore/utils/Events"
import { removeUnicode } from "../../BloomCore/utils/Utils"
import { clampYaw, debugMessage } from "./utils.js"

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils").INSTANCE
const EtherWarpHelper = Java.type("me.odinmain.utils.skyblock.EtherWarpHelper").INSTANCE


export default new class Dungeons {
    constructor() {
        this.scoreboardClasses = {
            B: "Berserk",
            A: "Archer",
            M: "Mage",
            H: "Healer",
            T: "Tank"
        }
        this.inDungeon = Scoreboard.getLines().some(line => removeUnicode(ChatLib.removeFormatting(line)).includes("The Catacombs"))
        this.teamMembers = {}
        this.roomTypes = {
            "Unknown": "Unknown",
            "1x1": "1x1",
            "1x2": "1x2",
            "1x3": "1x3",
            "1x4": "1x4",
            "2x2": "2x2",
            "L": "L"
        }

        onScoreboardLine((_0, text) => {
            if (ChatLib.removeFormatting(text).includes("The Catacombs")) this.inDungeon = true
        })

        register("worldUnload", () => {
            this.inDungeon = false
            this.teamMembers = {}
        })

        register("tick", ticks => {
            if (ticks % 40 !== 0) return
            if (!this.inDungeon) return

            const tabList = TabList.getNames().map(line => line.removeFormatting())

            tabList.forEach(line => {
                const match = line.match(/^.?\[(\d+)\] (?:\[\w+\] )*(\w+) (?:.)*?\((\w+)(?: (\w+))*\)$/)
                if (!match) return

                const [_0, sbLevel, player, dungeonClass, classLevel] = match
                if (!Object.values(this.scoreboardClasses).includes(dungeonClass)) return
                if (Object.keys(this.teamMembers).includes(player)) return

                this.teamMembers[player] = { dungeonClass }
            })
        })

        this.rotationNumber = new Map([
            ["NORTH", 0],
            ["WEST", -1],
            ["SOUTH", 2],
            ["EAST", 1]
        ])
    }

    /**
     * Gets the current dungeon room.
     * @returns {idkWhatTypeThisIsImNotCheckingOdinsSourceCodeForThis} currentRoom
     */
    getCurrentRoom() {
        return dungeonUtils.currentRoom
    }

    /**
     * Gets the current dungeon room name. Returns "Unknown" if it is not a room in Odin or if you're not in Dungeons.
     * @returns {String} currentRoomName
     */
    getRoomName() {
        return dungeonUtils.currentRoomName
    }

    /**
     * Convert a set of coordinates from real coordinates to relative room coordinates.
     * @param {Vector3} realCoords
     * @returns {Vector3} convertedCoordinates
     */
    convertToRelative(realCoords) {
        const currentRoom = this.getCurrentRoom()
        if (!currentRoom) return realCoords.copy()
        const clayPosition = new Vector3(currentRoom.clayPos)

        const relativeCoord = realCoords.copy().subtract(clayPosition)
        const relativeCoordNorth = this._rotateToNorth(relativeCoord)

        return relativeCoordNorth
    }

    /**
     * Convert a set of coordinates from relative room coordinates to real coordinates.
     * @param {Vector3} relativeCoords
     * @returns {Vector3} Converted coordinates
     */
    convertFromRelative(relativeCoords) {
        if (!relativeCoords) ChatLib.chat("why is this undefine")
        const currentRoom = this.getCurrentRoom()
        if (!currentRoom) return relativeCoords.copy()

        const relativeRotated = this._rotateFromNorth(relativeCoords)
        const clayPosition = new Vector3(currentRoom.clayPos)

        return clayPosition.add([relativeRotated.x, relativeRotated.y, relativeRotated.z])
    }

    /**
     * Converts relative yaw to real yaw based on the current room's rotation.
     * @param {Number} yaw 
     * @returns {Number} realYaw
     */
    convertToRealYaw(yaw) {
        const currRoom = this.getCurrentRoom()
        if (!currRoom) return yaw
        const roomRotation = currRoom.rotation
        return clampYaw(yaw + (this.rotationNumber.get(roomRotation.toString()) * 90))
    }

    /**
     * Converts real yaw to relative yaw based on the current room's rotation.
     * @param {Number} yaw 
     * @returns {Number} relativeYaw
     */
    convertToRelativeYaw(yaw) {
        const currRoom = this.getCurrentRoom()
        if (!currRoom) return yaw
        const roomRotation = currRoom.rotation
        return clampYaw(yaw - (this.rotationNumber.get(roomRotation.toString()) * 90))
    }

    _isLongRoom(room) {
        if (room.roomComponents.length <= 1) {
            return false;
        }

        let long = true;
        let previousX = room.roomComponents[0].x;
        let previousZ = room.roomComponents[0].z;
        for (let i = 1; i < room.roomComponents.length; i++) {
            if (previousX === room.roomComponents[i].x) {
                previousZ = NaN;
            } else if (previousZ === room.roomComponents[i].z) {
                previousX = NaN;
            } else {
                long = false;
                break;
            }
        }

        return long;
    }

    roomType(room) {
        if (!this._isValidRoom(room)) {
            return this.roomTypes.Unknown;
        }

        if (room.roomComponents.length === 1) {
            return this.roomTypes["1x1"];
        }

        if (this._isLongRoom(room)) {
            switch (room.roomComponents.length) {
                case 2:
                    return this.roomTypes["1x2"];
                case 3:
                    return this.roomTypes["1x3"];
                case 4:
                    return this.roomTypes["1x4"];
            }
        }

        switch (room.roomComponents.length) {
            case 3:
                return this.roomTypes["L"];
            case 4:
                return this.roomTypes["2x2"];
        }

        return this.roomTypes.Unknown;
    }

    sortComponents(room) {
        if (!this._isValidRoom(room)) {
            return;
        }

        if (room.roomComponents.length <= 1) {
            return room.roomComponents;
        }

        const sort = (fn) => {
            return [...room.roomComponents].sort(fn);
        }

        const rotation = room.rotation.toString();

        if (this._isLongRoom(room)) {
            switch (rotation) {
                case "WEST":
                    return sort((a, b) => a.z - b.z);
                case "NORTH":
                    return sort((a, b) => a.x - b.x);
            }
        }

        if (room.roomComponents.length === 4) {
            const minX = Math.min(room.roomComponents[0].x, room.roomComponents[1].x, room.roomComponents[2].x);
            const maxX = Math.max(room.roomComponents[0].x, room.roomComponents[1].x, room.roomComponents[2].x);
            const minZ = Math.min(room.roomComponents[0].z, room.roomComponents[1].z, room.roomComponents[2].z);
            const maxZ = Math.max(room.roomComponents[0].z, room.roomComponents[1].z, room.roomComponents[2].z);
            return [
                { x: minX, z: minZ },
                { x: maxX, z: minZ },
                { x: minX, z: maxZ },
                { x: maxX, z: maxZ }
            ].map(vec => room.roomComponents.find(component => component.x === vec.x && component.z === vec.z));
        }

        if (room.roomComponents.length !== 3) {
            return room.roomComponents;
        }

        const first = room.roomComponents[0];
        const second = room.roomComponents[1];
        const third = room.roomComponents[2];
        const arr = [];
        switch (rotation) {
            case "NORTH":
                arr.push(first.z > second.z ? first : second.z > third.z ? second : third);
                arr.push(first.x === arr[0].x && first.z < arr[0].z ? first : second.x === arr[0].x && second.z < arr[0].z ? second : third);
                arr.push(!arr.includes(first) ? first : !arr.includes(second) ? second : third);
                break;
            case "EAST":
                arr.push(first.x < second.x ? first : second.x < third.x ? second : third);
                arr.push(first.z === arr[0].z && first.x > arr[0].z ? first : second.z === arr[0].z && second.x > arr[0].x ? second : third);
                arr.push(!arr.includes(first) ? first : !arr.includes(second) ? second : third);
                break;
            case "SOUTH":
                arr.push(first.z < second.z ? first : second.z < third.z ? second : third);
                arr.push(first.x === arr[0].x && first.z > arr[0].z ? first : second.x === arr[0].x && second.z > arr[0].z ? second : third);
                arr.push(!arr.includes(first) ? first : !arr.includes(second) ? second : third);
                break;
            case "WEST":
                arr.push(first.x > second.x ? first : second.x > third.x ? second : third);
                arr.push(first.z === arr[0].z && first.x < arr[0].x ? first : second.z === arr[0].z && second.x < arr[0].x ? second : third);
                arr.push(!arr.includes(first) ? first : !arr.includes(second) ? second : third);
                break;
        }

        return arr;
    }

    getDoorLocations(room, components = null) {
        const components = components ?? this.sortComponents(room);
        const rotation = room.rotation.toString();

        if (components.length === 1) {
            const component = components[0];
            switch (rotation) {
                case "NORTH":
                    return [
                        new Vector3(component.x, 69, component.z + 16),
                        new Vector3(component.x, 69, component.z - 16),
                        new Vector3(component.x + 16, 69, component.z),
                        new Vector3(component.x - 16, 69, component.z)
                    ];
                case "WEST":
                    return [
                        new Vector3(component.x + 16, 69, component.z),
                        new Vector3(component.x - 16, 69, component.z),
                        new Vector3(component.x, 69, component.z - 16),
                        new Vector3(component.x, 69, component.z + 16)
                    ];
                case "SOUTH":
                    return [
                        new Vector3(component.x, 69, component.z - 16),
                        new Vector3(component.x, 69, component.z + 16),
                        new Vector3(component.x - 16, 69, component.z),
                        new Vector3(component.x + 16, 69, component.z)
                    ];
                case "EAST":
                    return [
                        new Vector3(component.x - 16, 69, component.z),
                        new Vector3(component.x + 16, 69, component.z),
                        new Vector3(component.x, 69, component.z + 16),
                        new Vector3(component.x, 69, component.z - 16)
                    ];
            }
        }

        if (this._isLongRoom(room)) {
            let doors = [];
            switch (rotation) {
                case "WEST":
                    doors = components.reduce(
                        (acc, component) => {
                            acc.push(new Vector3(component.x - 16, 69, component.z));
                            acc.push(new Vector3(component.x + 16, 69, component.z));
                            return acc;
                        },
                        []
                    );
                    doors.push(new Vector3(components[0].x, 69, components[0].z - 16));
                    doors.push(new Vector3(components[components.length - 1].x, 69, components[components.length - 1].z + 16));
                    break;
                case "NORTH":
                    doors = components.reduce(
                        (acc, component) => {
                            acc.push(new Vector3(component.x, 69, component.z - 16));
                            acc.push(new Vector3(component.x, 69, component.z + 16));
                            return acc;
                        },
                        []
                    );
                    doors.push(new Vector3(components[0].x - 16, 69, components[0].z));
                    doors.push(new Vector3(components[components.length - 1].x + 16, 69, components[components.length - 1].z));
                    break;
            }
            return doors;
        }

        if (components.length === 4) {
            return [
                new Vector3(components[0].x - 16, 69, components[0].z),
                new Vector3(components[0].x, 69, components[0].z - 16),
                new Vector3(components[1].x, 69, components[1].z - 16),
                new Vector3(components[1].x + 16, 69, components[1].z),
                new Vector3(components[3].x + 16, 69, components[3].z),
                new Vector3(components[3].x, 69, components[3].z + 16),
                new Vector3(components[2].x, 69, components[2].z + 16),
                new Vector3(components[2].x - 16, 69, components[2].z)
            ];
        }

        if (components.length !== 3) {
            return [];
        }

        const first = components[0];
        const second = components[1];
        const third = components[2];
        switch (rotation) {
            case "NORTH":
                return [
                    new Vector3(first.x - 16, 69, first.z),
                    new Vector3(first.x, 69, first.z + 16),
                    new Vector3(first.x + 16, 69, first.z),
                    new Vector3(second.x + 16, 69, second.z),
                    new Vector3(second.x, 69, second.z - 16),
                    new Vector3(third.x, 69, third.z - 16),
                    new Vector3(third.x - 16, 69, third.z),
                    new Vector3(third.x, 69, third.z + 16)
                ];
            case "WEST":
                return [
                    new Vector3(first.x, 69, first.z + 16),
                    new Vector3(first.x + 16, 69, first.z),
                    new Vector3(first.x, 69, first.z - 16),
                    new Vector3(second.x, 69, second.z - 16),
                    new Vector3(second.x - 16, 69, second.z),
                    new Vector3(third.x - 16, 69, third.z),
                    new Vector3(third.x, 69, third.z + 16),
                    new Vector3(third.x + 16, 69, third.z)
                ];
            case "SOUTH":
                return [
                    new Vector3(first.x + 16, 69, first.z),
                    new Vector3(first.x, 69, first.z - 16),
                    new Vector3(first.x - 16, 69, first.z),
                    new Vector3(second.x - 16, 69, second.z),
                    new Vector3(second.x, 69, second.z + 16),
                    new Vector3(third.x, 69, third.z + 16),
                    new Vector3(third.x + 16, 69, third.z),
                    new Vector3(third.x, 69, third.z - 16)
                ];
            case "EAST":
                return [
                    new Vector3(first.x, 69, first.z - 16),
                    new Vector3(first.x - 16, 69, first.z),
                    new Vector3(first.x, 69, first.z + 16),
                    new Vector3(second.x, 69, second.z + 16),
                    new Vector3(second.x + 16, 69, second.z),
                    new Vector3(third.x + 16, 69, third.z),
                    new Vector3(third.x, 69, third.z - 16),
                    new Vector3(third.x - 16, 69, third.z)
                ];
        }

        return [];
    }

    _isValidRoom(room) {
        return room && room.roomComponents;
    }

    /**
     * Gets the block an etherwarp from a specified position and yaw/pitch will land on. Uses Odin for RayTracing for vastly higher performance.
     * @param {Vector3} startPosition
     * @param {Number} yaw
     * @param {Number} pitch
     * @returns {Vector3} endPos
     */
    rayTraceEtherBlock(startPosition, yaw, pitch, checkSuccess = true) {
        // Correct the Y Level because Odin is black and doesn't let you specify eye level yourself so it will be wrong if you're sneaking.
        const prediction = EtherWarpHelper.getEtherPos(new net.minecraft.util.Vec3(startPosition.x, startPosition.y - (Player.isSneaking() ? 0.0000000381469727 : 0.0800000381469727), startPosition.z), yaw, pitch, 61, false)
        if (!prediction.succeeded && checkSuccess) return null
        const pos = prediction.pos
        if (!pos) return null
        return new Vector3(pos.func_177958_n(), pos.func_177956_o(), pos.func_177952_p())
    }

    /**
     * Returns true if in F7/M7 boss, otherwise returns false.
     */
    isIn7Boss() {
        ChatLib.chat(`${dungeonUtils.floor.floorNumber} ${dungeonUtils.inBoss}`);
        return dungeonUtils.floor.floorNumber === 7 && dungoenUtils.inBoss;
    }

    /**
     * Returns true if in dungeons and false if not
     */
    isInDungeons() {
        return dungeonUtils.inDungeons;
    }

    /**
     * (Internal use) rotates a set of real coordinates to face north.
     * @param {Vector3} coords
     * @returns {Vector3} northFacingCoordinates
     */
    _rotateToNorth(coords) {
        const currentRotation = this.getCurrentRoom().rotation
        let output
        switch (currentRotation.toString()) {
            case "NORTH": output = new Vector3(-coords.x, coords.y, -coords.z)
                break
            case "WEST": output = new Vector3(coords.z, coords.y, -coords.x)
                break
            case "SOUTH": output = coords.copy()
                break
            case "EAST": output = new Vector3(-coords.z, coords.y, coords.x)
                break
        }
        return output
    }

    /**
     * (Internal use) Rotates a set of relative coordinates from north to the rotation of the room.
     * @param {Vector3} coords
     * @returns {Vector3} rotatedCoordinates
     */
    _rotateFromNorth(coords) {
        const desiredRotation = this.getCurrentRoom().rotation
        let output
        switch (desiredRotation.toString()) {
            case "NORTH": output = new Vector3(-coords.x, coords.y, -coords.z)
                break
            case "WEST": output = new Vector3(-coords.z, coords.y, coords.x)
                break
            case "SOUTH": output = new Vector3(coords.x, coords.y, coords.z)
                break
            case "EAST": output = new Vector3(coords.z, coords.y, -coords.x)
                break
        }
        return output
    }
}
