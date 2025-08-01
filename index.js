import "./features/AutoP3"
import "./features/Simulation"
import "./features/Freecam"
import "./features/SecretAura"
import "./features/BarPhase"
// import "./features/AutoRoutes"
import "./features/Doorless"
import "./features/BonzoSimulator"
import "./features/Doors"
import "./features/4thDevSimulator"
import "./features/Terminator"
// import "./features/AutoBloodRush"
import "./features/ZeroPing"
import "./features/PhoenixTerminals"
import "./features/FastLeap"
import "./features/PhoenixSS"
import "./features/PhoenixTerminalAura"
import "./features/PhoenixIcefill"
// import "./features/AutoWaterboard"
import "./features/Mosquito"
import "./features/GUI/WardrobeToggle"
import "./features/Phoenix"
import { registerSubCommand } from "./utils/commands"
import { chat, setPlayerPosition, setVelocity } from "./utils/utils"

registerSubCommand("center", () => {
    setPlayerPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5, true)
    setVelocity(0, null, 0)
    chat("Centered the player.")
})
