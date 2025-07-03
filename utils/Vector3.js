import Vector3 from "../../BloomCore/utils/Vector3"

export default class extends Vector3 {
    constructor(...args) {
        if (args.length === 1) {
            const obj = args[0]
            if (Array.isArray(obj)) super(...obj)
            else if (obj.x && obj.y && obj.z) super(obj.x, obj.y, obj.z)
        } else super(...args)
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
}
