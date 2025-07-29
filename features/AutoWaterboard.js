import Settings from "../config"
import RenderLibV2 from "../../RenderLibV2J"
import { UpdateWalkingPlayer } from "../events/JavaEvents"
import Dungeons from "../utils/Dungeons"
import Vector3 from "../utils/Vector3"
import SecretAura from "./SecretAura"
import TeleportManager from "./AutoRoutes/TeleportManager"
import { aotvFinder } from "../utils/TeleportItem"
import ZeroPing from "./ZeroPing"

const WaterSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.WaterSolver").INSTANCE
const LeverBlock = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.WaterSolver$LeverBlock")

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
        this.startPosition = null

        this.render = register("renderWorld", () => this._handleRender()).unregister()

        register("tick", () => this._handleTick())

        register("command", () => this._reset()).setName("testreset")
    }

    _handleTick() {
        if (Dungeons.getRoomName() !== "Water Board") {
            this.render.unregister()
            this.startPosition = null
            this.started = false
            return
        }
        if (!this.started) {
            this.startPosition = Dungeons.convertFromRelative(new Vector3(15, 69, 6)).add(0.5, 0, 0.5)
            this.render.register()
            if (!new Vector3(Player).equals(this.startPosition) || !ZeroPing.isSynced()) return
            TeleportManager.teleport(Dungeons.convertFromRelative(new Vector3(15, 63, 16)).add(0.5, 0, 0.5), Dungeons.convertToRealYaw(181.05), 34.0498, false, aotvFinder(4), () => {
                TeleportManager.teleport(Dungeons.convertFromRelative(new Vector3(15, 60, 6)).add(0.5, 0, 0.5), Dungeons.convertToRealYaw(0.3), 23.549, false, aotvFinder(4), () => {
                    TeleportManager.sync(Player.yaw, Player.pitch, true)
                    this.started = true
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
            let time = openedWaterTicks ? openedWaterTicks + times[leverIndex] * 20 - tickCounter : times[leverIndex] * 20 - openedWaterTicks
            clickableLevers.push({ lever, time })
        })

        const leverPriority = clickableLevers.sort(lever => lever.toString() === "WATER" ? 1 : 0)
        const firstLever = leverPriority[0]
        if (!firstLever) return
        const firstLeverPosition = Dungeons.convertFromRelative(new Vector3(this._getRelativePosition(firstLever.lever)))
        const clickLever = () => {
            const javaBlockPos = firstLeverPosition.convertToBlockPos()
            const blockState = World.getWorld().func_180495_p(javaBlockPos)
            const block = blockState.func_177230_c()
            ChatLib.chat(`click ${firstLever}`)
            // SecretAura.rightClickBlock(block, firstLeverPosition, false)
        }
        if (new Vector3(Player).distance3D(firstLeverPosition) > 36) {
            if (this._getLeverSide(firstLever) === "LEFT") TeleportManager.teleport() // go die
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

    _getLeverSide(lever) {
        switch (lever.toString()) {
            case "COAL":
            case "GOLD":
            case "QUARTZ":
                return "LEFT"
            case "DIAMOND":
            case "EMERALD":
            case "CLAY":
                return "RIGHT"
            case "WATER":
                return "CENTER"
            default:
                return null
        }
    }

}