import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2J"
import { UpdatePlayer, UpdateWalkingPlayer } from "../events/JavaEvents"
import Dungeons from "../utils/Dungeons"
import Vector3 from "../utils/Vector3"
import SecretAura from "./SecretAura"
import TeleportManager from "./AutoRoutes/TeleportManager"
import { aotvFinder } from "../utils/TeleportItem"
import ZeroPing from "./ZeroPing"
import { chat, rotate, setVelocity } from "../utils/utils"

const BlockAir = Java.type("net.minecraft.block.BlockAir")
const WaterSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.WaterSolver").INSTANCE
const LeverBlock = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.WaterSolver$LeverBlock")

const positions = {
    "start": new Vector3(15, -40, 6),
    "right": new Vector3(10, -40, 15),
    "left": new Vector3(20, -40, 15),
};

const paths = {
    "start": {
        "right": 210,
        "left": 150
    },
    "left": {
        "start": 331,
        "right": 270
    },
    "right": {
        "start": 30,
        "left": 90
    }
};

const pitch = 8.5;

const middleYaws = {
    "right": 146,
    "left": 216
};

const wools = [
    new Vector3(14, -43, 15),
    new Vector3(14, -43, 16),
    new Vector3(14, -43, 17),
    new Vector3(14, -43, 18),
    new Vector3(14, -43, 19),

];

const chestPos = new Vector3(15, -44, 22);

const middlePitch = 16.5;
const middlePosition = new Vector3(15, -41, 22);

export default new class AutoWaterboard {
    constructor() {
        this.solutionsField = WaterSolver.class.getDeclaredField("solutions")
        this.solutionsField.setAccessible(true)

        this.openedWaterTicksField = WaterSolver.class.getDeclaredField("openedWaterTicks")
        this.openedWaterTicksField.setAccessible(true)

        this.tickCounterField = WaterSolver.class.getDeclaredField("tickCounter")
        this.tickCounterField.setAccessible(true)


        this.leverIndexField = LeverBlock.class.getDeclaredField("i")
        this.leverIndexField.setAccessible(true)

        this.relativePositionField = LeverBlock.class.getDeclaredField("relativePosition")
        this.relativePositionField.setAccessible(true)

        this.started = false
        this.moving = false
        this.done = false;
        this.startPosition = null
        this.clicked = {}

        this.render = register("renderWorld", () => this._handleRender()).unregister()

        register("tick", () => this._handleTick())

        register("command", () => this._reset()).setName("testreset")
    }

    _handleTick() {
        if (this.moving) {
            return;
        }

        if (Dungeons.getRoomName() !== "Water Board") {
            this.render.unregister()
            this.startPosition = null
            this.started = false
            this.done = false;
            this.clicked = {};
            return
        }

        if (!this.started && !this.moving) {
            this.startPosition = Dungeons.convertFromRelative(new Vector3(15, -31, 6)).add(0.5, 0, 0.5)
            this.render.register()
            if (!new Vector3(Player).equals(this.startPosition) || !ZeroPing.isSynced()) {
                return
            }
            this.startedAt = Date.now()
            this.moving = true
            TeleportManager.teleport(Dungeons.convertFromRelative(new Vector3(15, -37, 16)).add(0.5, 0, 0.5), Dungeons.convertToRealYaw(181.05), 34.0498, false, aotvFinder(4), () => {
                TeleportManager.teleport(Dungeons.convertFromRelative(new Vector3(15, -40, 6)).add(0.5, 0, 0.5), Dungeons.convertToRealYaw(0.3), 23.549, false, aotvFinder(4), () => {
                    TeleportManager.sync(Player.yaw, Player.pitch, true)
                    Client.scheduleTask(1, () => {
                        this.moving = false
                        this.started = true
                    });
                })
            })
            return
        }


        const clickableLevers = []
        const solutions = this._getSolutions()
        const openedWaterTicks = this._getOpenedWaterTicks()
        const tickCounter = this._getTickCounter()
        solutions.forEach((lever, times) => {
            const leverIndex = this._getLeverIndex(lever)
            const leverTime = times[leverIndex]
            if (leverTime === undefined) {
                return;
            }

            if ((this.clicked[lever] || 0) > leverIndex) {
                return;
            }

            const time = openedWaterTicks ? openedWaterTicks + times[leverIndex] * 20 - tickCounter + 1 : times[leverIndex] * 20 - openedWaterTicks
            clickableLevers.push({ lever, time })
        })

        clickableLevers.sort((a, b) => a.time - b.time)
        const currentSide = this._currentPosition()
        const firstLever = clickableLevers[0]
        if (!firstLever) {
            const pos = Dungeons.convertFromRelative(middlePosition).add(0.5, 0, 0.5);
            if (!(new Vector3(Player)).equals(pos)) {
                const yaw = Dungeons.convertToRealYaw(middleYaws[currentSide]);
                if (!yaw) {
                    return;
                }
                this.moving = true;
                TeleportManager.teleport(pos, yaw, middlePitch, false, aotvFinder(4), () => {
                    TeleportManager.sync(Player.yaw, Player.pitch, true)
                    Client.scheduleTask(1, () => {
                        this.moving = false;
                    });
                });

                return;
            } else if (this.done && ZeroPing.isSynced()) {
                this.moving = true;
                const next = Dungeons.convertFromRelative(new Vector3(15, -32, 13)).add(0.5, 0, 0.5);
                const next2 = Dungeons.convertFromRelative(new Vector3(15, -31, 1)).add(0.5, 0, 0.5);
                TeleportManager.teleport(next, Dungeons.convertToRealYaw(0), -40, false, aotvFinder(4), () => {
                    TeleportManager.teleport(next2, Dungeons.convertToRealYaw(0), 0, false, aotvFinder(4), () => {
                        TeleportManager.sync(Player.yaw, Player.pitch, true);
                        Client.scheduleTask(3, () => {
                            chat(`Watered(no vv) everywhere in: ${Date.now() - this.startedAt}ms`);
                            this.moving = false;
                        });
                    });
                });
                return;
            }

            if (wools.some((wool) => {
                const blockState = World.getWorld().func_180495_p(Dungeons.convertFromRelative(wool).convertToBlockPos());
                const block = blockState.func_177230_c();
                return !(block instanceof BlockAir);
            })) {
                return;
            }

            const relativeChest = Dungeons.convertFromRelative(chestPos);
            const chest = World.getWorld().func_180495_p(relativeChest.convertToBlockPos()).func_177230_c();
            SecretAura.rightClickBlock(chest, relativeChest, true);
            this.done = true;
            return;
        }

        const leverSide = this._getLeverSide(firstLever.lever)
        if (!currentSide || !leverSide || !ZeroPing.isSynced()) {
            return;
        }


        if (leverSide !== currentSide) {
            this.moving = true;
            TeleportManager.teleport(Dungeons.convertFromRelative(positions[leverSide]).add(0.5, 0, 0.5), Dungeons.convertToRealYaw(paths[currentSide][leverSide]), pitch, false, aotvFinder(4), () => {
                TeleportManager.sync(Player.yaw, Player.pitch, true)
                Client.scheduleTask(1, () => {
                    this.moving = false;
                });
            });
            return
        }

        const firstLeverPosition = Dungeons.convertFromRelative(new Vector3(this._getRelativePosition(firstLever.lever))).add(0, -100, 0);
        const clickLever = () => {
            const javaBlockPos = firstLeverPosition.convertToBlockPos()
            const blockState = World.getWorld().func_180495_p(javaBlockPos)
            const block = blockState.func_177230_c()
            if (this.clicked[firstLever.lever] === undefined) this.clicked[firstLever.lever] = 0;
            if (firstLever.lever.toString() === "WATER") {
                ChatLib.chat("Watered");
            }
            this.clicked[firstLever.lever]++;
            SecretAura.rightClickBlock(block, firstLeverPosition, true)
        }
        if (firstLever.time <= 0) {
            clickLever();
        }
        /*
        ChatLib.chat(Object.keys(solutions.entrySet()).toString())
        const iterator = solutions.iterator()
        while (iterator.hasNext()) {
            let solutionEntry = iterator.next()
            let lever = solutionEntry.getKey()
            let times = solutionEntry.getValue()
        }
            */
    }

    _handleRender() {
        if (Dungeons.getRoomName() !== "Water Board") return
        const settings = Settings()
        const color = [settings.smallNodeColor[0] / 255, settings.smallNodeColor[1] / 255, settings.smallNodeColor[2] / 255, settings.smallNodeColor[3] / 255];
        const slices = isNaN(settings.nodeSlices) ? 2 : settings.nodeSlices;
        RenderLibV2.drawCyl(...this.startPosition.getPosition(), 0.5, 0.5, 0.01, slices, 1, 90, 45, 0, ...color, true, false)
    }

    _getSolutions() {
        return this.solutionsField.get(WaterSolver)
    }

    _getOpenedWaterTicks() {
        return Math.max(0, this.openedWaterTicksField.get(WaterSolver))
    }

    _getTickCounter() {
        return this.tickCounterField.get(WaterSolver)
    }

    _getLeverIndex(lever) {
        return this.leverIndexField.get(lever)
    }

    _getRelativePosition(lever) {
        return this.relativePositionField.get(lever)
    }

    _reset() {
        this.openedWaterTicksField.set(WaterSolver, new java.lang.Integer(-1))
        this.tickCounterField.set(WaterSolver, new java.lang.Integer(0))
    }

    _currentPosition() {
        return Object.keys(positions).find(key => {
            return Dungeons.convertFromRelative(positions[key]).add(0.5, 0, 0.5).equals(new Vector3(Player))
        })
    }

    _getLeverSide(lever) {
        switch (lever.toString()) {
            case "COAL":
            case "GOLD":
            case "QUARTZ":
                return "left"
            case "DIAMOND":
            case "EMERALD":
            case "CLAY":
                return "right"
            case "WATER":
                return "start"
            default:
                return null
        }
    }

}

function setShit() {
    Java.type("me.cryleak.carbonaraloader.CarbonaraLoader").instance.shit = true;
}
