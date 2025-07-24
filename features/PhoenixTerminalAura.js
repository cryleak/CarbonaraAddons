import Module, { registerModule } from "./PhoenixModule"

registerModule(class TerminalAura extends Module {
    constructor(phoenix) {
        super("TerminalAura", phoenix)
        this._tryLoadConfig();
    }
});
