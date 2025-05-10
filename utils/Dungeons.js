import { onScoreboardLine } from "../../BloomCore/utils/Events"
import { removeUnicode } from "../../BloomCore/utils/Utils"

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

        onScoreboardLine((lineNumber, text) => {
            if (ChatLib.removeFormatting(text).includes("The Catacombs")) this.inDungeon = true
        })

        register("worldUnload", () => {
            this.inDungeon = false
            this.teamMembers = {}
        })

        register("tick", (ticks) => {
            if (ticks % 40 !== 0) return
            if (!this.inDungeon) return

            const tabList = TabList.getNames().map(line => line.removeFormatting())

            tabList.forEach(line => {
                const match = line.match(/^.?\[(\d+)\] (?:\[\w+\] )*(\w+) (?:.)*?\((\w+)(?: (\w+))*\)$/)
                if (!match) return

                const [_, sbLevel, player, dungeonClass, classLevel] = match
                if (!Object.values(this.scoreboardClasses).includes(dungeonClass)) return
                if (Object.keys(this.teamMembers).includes(player)) return

                this.teamMembers[player] = { dungeonClass }
            })

            Scoreboard.getLines().map(line => removeUnicode(ChatLib.removeFormatting(line))).forEach(line => {
                const match = line.match(/\[(\w)\] (\w{3,16}) [\d,]+/)
                if (!match) return

                const dungeonClass = this.scoreboardClasses[match[1]]
                const player = match[2]
                if (Object.keys(this.teamMembers).includes(player)) return
                this.teamMembers[player] = { dungeonClass }
            })
        })

    }

}