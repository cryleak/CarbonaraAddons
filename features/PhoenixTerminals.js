import Module, { registerModule } from "./PhoenixModule";


registerModule(class AutoTerms extends Module {
    constructor(phoenix) {
        super("AutoTerms", phoenix);
        this._tryLoadConfig();
    }

    _defaultConfig() {
        return {
            firstDelay: 450,
            delay: 110,
            timeout: 600,
            awaitLast: false
        };
    }
});
