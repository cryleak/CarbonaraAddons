import Vector3 from "../../BloomCore/utils/Vector3"

export default class extends Vector3 {
    constructor(...args) {
        if (args.length === 1) {
            const obj = args[0]
            if (Array.isArray(obj)) super(...obj)
            else if (obj.x && obj.y && obj.z) super(obj.x, obj.y, obj.z)
        } else super(...args)
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y && this.z === vector.z
    }
}
