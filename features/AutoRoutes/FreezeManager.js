import { UpdateWalkingPlayer} from "../../events/JavaEvents"
import Vector3 from "../../utils/Vector3"
import { setVelocity, setPlayerPosition } from "../../utils/utils"

export default new class FreezeManager {
    constructor() {
        this.freezing = false

        this.position = new Vector3(Player);
        this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()];
        this.amount = 0;
        UpdateWalkingPlayer.Pre.register(event => {
            if (!this.freezing) return

            this.amount++;
            setPlayerPosition(this.position.x, this.position.y, this.position.z, true);
            setVelocity(0, 0, 0)
            event.cancelled = true
            event.breakChain = true
        }, 100000)
    }

    setFreezing(state) {
        if (state) {
            this.previousVelocity = [Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()];
            setVelocity(0, 0, 0)
            this.position = new Vector3(Player);
            this.freezing = true;
        }
        else {
            setVelocity(...this.previousVelocity)
            const amount = this.amount;
            this.amount = 0;
            this.freezing = false;
            return amount;
        }
    }

}
