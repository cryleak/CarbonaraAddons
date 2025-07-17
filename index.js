import "./features/AutoP3"
import "./features/Simulation"
import "./features/FastLeap"
import "./features/Freecam"
import "./features/SecretAura"
import "./features/Relic"
import "./features/AutoRoutes"
import "./features/Doorless"
import "./features/BonzoSimulator"
import "./features/Doors"
import "./features/4thDevSimulator"
import "./features/Terminator"

import { registerSubCommand } from "./utils/commands"
import { rightClick, leftClick, syncCurrentPlayItem } from "./utils/utils"

registerSubCommand("testingstuff", () => {
    ChatLib.chat(Object.keys(Client.getMinecraft()).filter(key => {
        const lower = key.toLowerCase();
        return lower === "func_147116_af" || lower === "func_147121_ag";
    }).join(", "));
    syncCurrentPlayItem();
});
