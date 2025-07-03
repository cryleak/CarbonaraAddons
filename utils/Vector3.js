import Vector3 from "../../BloomCore/utils/Vector3"

const Vec3 = Java.type("net.minecraft.util.Vec3")
const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
export default class extends Vector3 {

    /**
     * Convert the Minecraft Vec3i (BlockPos extends this) class to a Vector3.
     * @param {MCBlockPos} MCBlockPos 
     * @returns {Vector3}
     */
    static convertVec3iToVector3(MCBlockPos) {
        return new this(MCBlockPos.func_177958_n(), MCBlockPos.func_177956_o(), MCBlockPos.func_177952_p())
    }

    /**
     * Convert the Minecraft Vec3 class to a Vector3.
     * @param {Vec3} Vec3 
     * @returns {Vector3}
     */
    static convertVec3ToVector3(Vec3) {
        return new this(Vec3.field_72450_a, Vec3.field_72448_b, Vec3.field_72449_c)
    }

    constructor(...args) {
        if (args.length === 1) {
            const obj = args[0]
            if (Array.isArray(obj)) super(...obj)
            else if (obj.x && obj.y && obj.z) super(obj.x, obj.y, obj.z)
        } else super(...args)
    }

    add(...args) {
        if (args.length === 1) {
            return super.add(args[0])
        } else if (args.length === 3) {
            return super.add([args[0], args[1], args[2]])
        } else {
            throw new Error("Invalid arguments for Vector3.add. Expected either a single Vector3 or three numbers.")
        }
    }

    /**
     * Checks if this vector is equal to another vector in terms of coordinates.
     * @param {Vector3} vector The Vector3 to compare with this one
     * @returns {Boolean} equality
     */
    equals(vector) {
        return this.x === vector.x && this.y === vector.y && this.z === vector.z
    }

    distanceY(vector) {
        return (this.y - vector.y) ** 2
    }

    distance2D(vector) {
        return (this.x - vector.x) ** 2 + (this.z - vector.z) ** 2
    }

    distance3D(vector) {
        return (this.x - vector.x) ** 2 + (this.y - vector.y) ** 2 + (this.z - vector.z) ** 2
    }

    /**
     * Convert Vector3 to Vec3
     * @returns {Vec3}
     */
    convertToVec3() {
        return new Vec3(this.x, this.y, this.z)
    }

    convertToBlockPos() {
        return new MCBlockPos(this.x, this.y, this.z)
    }

    floor2D() {
        return new this.constructor(Math.floor(this.x), this.y, Math.floor(this.z))
    }
}
