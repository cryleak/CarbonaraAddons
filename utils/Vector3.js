import Vector3 from "../../BloomCore/utils/Vector3"

const Vec3 = Java.type("net.minecraft.util.Vec3")
const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const MCVec3i = Java.type("net.minecraft.util.Vec3i")
export default class extends Vector3 {

    constructor(...args) {
        if (args.length === 1) {
            const obj = args[0]
            if (obj instanceof Vec3) super(obj.field_72450_a, obj.field_72448_b, obj.field_72449_c)
            else if (obj instanceof MCBlockPos || obj instanceof MCVec3i) super(obj.func_177958_n(), obj.func_177956_o(), obj.func_177952_p())
            else if (Array.isArray(obj)) super(...obj)
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
        this.x = Math.floor(this.x)
        this.z = Math.floor(this.z)
        return this
    }

    floor3D() {
        this.x = Math.floor(this.x)
        this.y = Math.floor(this.y)
        this.z = Math.floor(this.z)
        return this
    }
}
