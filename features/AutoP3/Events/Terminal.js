import Event from "../Event"

class TerminalHandler {
    constructor() {
        this.inTerminal = false
        this.currentWindowName = null
        this.lastMelodyClick = Date.now()

        register("packetReceived", (packet, event) => {
            const windowName = packet.func_179840_c().func_150254_d().removeFormatting()
            if (termNames.some(regex => windowName.match(regex))) this.inTerminal = true
            else this.inTerminal = false
            this.currentWindowName = packet.func_179840_c().func_150254_d().removeFormatting()
        }).setFilteredClass(S2DPacketOpenWindow)

        register("packetReceived", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(S2EPacketCloseWindow)

        register("packetSent", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(C0DPacketCloseWindow)

        register("packetSent", () => {
            if (this.currentWindowName === "Click the button on time!") this.lastMelodyClick = Date.now()
        }).setFilteredClass(C0EPacketClickWindow)

        register("worldUnload", () => {
            this.inTerminal = false
            this.currentWindowName = null
        })
    }
}

const handler = new TerminalHandler()

class TerminalOpenEvent extends Event {
    constructor() {
        super("termianlopen");

        let lastTermianl = handler.inTerminal;
        Tick.Pre.register(() => {
            if (handler.inTerminal === lastTermianl) {
                return;
            }

            lastTermianl = handler.inTerminal;
            if (handler.inTerminal) {
                this.trigger(handler.currentWindowName);
            }
        });
    }
}

class TerminalOpenEvent extends Event {
    constructor() {
        super("termianlopen");

        let lastTermianl = handler.inTerminal;
        Tick.Pre.register(() => {
            if (handler.inTerminal === lastTermianl) {
                return;
            }

            lastTermianl = handler.inTerminal;
            if (handler.inTerminal) {
                this.trigger(handler.currentWindowName);
            }
        });
    }
}

export { handler as TerminalHandler }
export { TerminalOpenEvent as TerminalOpenP3Event }
