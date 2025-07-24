import Module, { registerModule } from "./PhoenixModule";


registerModule(class AutoSS extends Module {
    constructor(phoenix) {
        super("AutoSS", phoenix);
        this._tryLoadConfig();
    }

    _defaultConfig() {
        return {
            startdelay: "0,125,250",
            delay: 110
        };
    }
});
