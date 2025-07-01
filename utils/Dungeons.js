
import Vector3 from "../../BloomCore/utils/Vector3.js"

import { onScoreboardLine } from "../../BloomCore/utils/Events"
import { removeUnicode } from "../../BloomCore/utils/Utils"
import { clampYaw } from "./utils.js"

const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils").INSTANCE


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
        const roomRotation = currentRoom.rotation
        const clayPosition = this._convertBlockPosToVector3(currentRoom.clayPos)

        const relativeCoord = realCoords.copy().subtract(clayPosition)
        const relativeCoordNorth = rotateToNorth(relativeCoord, roomRotation)

        return relativeCoordNorth
    }

    /**
     * Convert a set of coordinates from relative room coordinates to real coordinates.
     * @param {Vector3} relativeCoords
     * @returns {Vector3} Converted coordinates
     */
    convertFromRelative(relativeCoords) {
        const currentRoom = this.getCurrentRoom()
        if (!currentRoom) return relativeCoords.copy()
        const roomRotation = currentRoom.rotation

        const relativeRotated = rotateFromNorth(relativeCoords, roomRotation)
        const clayPosition = this._convertBlockPosToVector3(currentRoom.clayPos)

        const realCoord = clayPosition.copy().add(relativeRotated)
        return realCoord
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
        return clampYaw(yaw + (rotationNumber.get(roomRotation.toString()) * 90))
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
        return clampYaw(yaw - (rotationNumber.get(roomRotation.toString()) * 90))
    }

    /**
     * (Internal use) rotates a set of real coordinates to face north.
     * @param {Vector3} vector 
     * @returns {Vector3} northFacingCoordinates
     */
    _rotateToNorth(vector) {
        const currentRotation = this.getCurrentRoom().rotation
        let output
        switch (currentRotation.toString()) {
            case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ())
                break
            case "WEST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX())
                break
            case "SOUTH": output = vector.copy()
                break
            case "EAST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX())
                break
        }
        return output
    }

    /**
     * (Internal use) Rotates a set of relative coordinates from north to the rotation of the room.
     * @param {Vector3} vector 
     * @returns {Vector3} rotatedCoordinates
     */
    _rotateFromNorth(vector) {
        const desiredRotation = this.getCurrentRoom().rotation
        let output
        switch (desiredRotation.toString()) {
            case "NORTH": output = new Vector3(-vector.getX(), vector.getY(), -vector.getZ())
                break
            case "WEST": output = new Vector3(-vector.getZ(), vector.getY(), vector.getX())
                break
            case "SOUTH": output = vector.copy()
                break
            case "EAST": output = new Vector3(vector.getZ(), vector.getY(), -vector.getX())
                break
        }
        return output
    }

    /**
     * (Internal use) Convert the Minecraft BlockPos class to a Vector3.
     * @param {MCBlockPos} MCBlockPos 
     * @returns {Vector3}
     */
    _convertBlockPosToVector3(MCBlockPos) {
        return new Vector3(MCBlockPos.func_177958_n(), MCBlockPos.func_177956_o(), MCBlockPos.func_177952_p())
    }
}