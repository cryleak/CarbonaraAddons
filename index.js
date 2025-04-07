import Settings from "./config"

import "./features/AutoP3"

register("command", () => {
    Settings().getConfig().openGui()
}).setName("carbonara")