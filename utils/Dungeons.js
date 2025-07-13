
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
