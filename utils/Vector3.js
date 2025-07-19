import BumVector3 from "../../BloomCore/utils/Vector3"

const Vec3 = Java.type("net.minecraft.util.Vec3")
const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const MCVec3i = Java.type("net.minecraft.util.Vec3i")
export default class Vector3 extends BumVector3 {

    static fromCoords = (x0, y0, z0, x1, y1, z1) => new Vector3(x1 - x0, y1 - y0, z1 - z0)

    static fromPitchYaw = (pitch, yaw) => {
        const f = Math.cos(-yaw * 0.017453292 - Math.PI)
        const f1 = Math.sin(-yaw * 0.017453292 - Math.PI)
        const f2 = -Math.cos(-pitch * 0.017453292)
        const f3 = Math.sin(-pitch * 0.017453292)
        return new Vector3(f1 * f2, f3, f * f2).normalize()
    }

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

    /**
    * Normalizes the vector
    * @param {Number} length
    * @returns {Vector3}
    */
    normalize(length = this.getLength()) {
        this.x = this.x / length
        this.y = this.y / length
        this.z = this.z / length
        return this
    }

    /**
     * Returns the x,y,z of the Vector3 as an array.
     */
    getPosition() {
        return [this.x, this.y, this.z]
    }

    // I need to override all this bullshit so it keeps the methods of the extended Vector3 class.

    /**
     * Subtracts a vector from this vector.
     * @param {Vector3} vector3 
     */
    subtract(vector3) {
        return new Vector3(
            this.x - vector3.x,
            this.y - vector3.y,
            this.z - vector3.z
        )
    }

    /**
     * Returns the cross product of two vectors
     * @param {Vector3} vector3
     * @returns {Vector3}
     */
    crossProduct(vector3) {
        let [x1, y1, z1] = this.getComponents()
        let [x2, y2, z2] = vector3.getComponents()
        return new Vector3(
            (y1 * z2) - (z1 * y2),
            -((x1 * z1) - (z1 * x2)),
            (x1 * y2) - (y1 * x2)
        )
    }

    /**
    * Gets the equation for the plane from three points.
    * @param {Number[]} point1 
    * @param {Number[]} point2 
    * @param {Number[]} point3 
    * @returns {Number[]} - An array of numbers containing the [x, y, z, extra].
    */
    getPlaneEquation(point1, point2, point3) {
        let [p1x, p1y, p1z] = point1
        let [p2x, p2y, p2z] = point2
        let [p3x, p3y, p3z] = point3
        let d1 = new Vector3(p2x - p1x, p2y - p1y, p2z - p1z)
        let d2 = new Vector3(p3x - p1x, p3y - p1y, p3z - p1z)
        let normal = d1.crossProduct(d2)
        return [
            ...normal.getComponents(),
            -(new Vector3(...point1).dotProduct(normal))
        ]
    }

    /**
     * Creates a new Vector3 object identical to this one.
     * @returns {Vector3} - A new Vector3 with the same x, y and z component.
     */
    copy() {
        return new Vector3(this.x, this.y, this.z)
    }
}
