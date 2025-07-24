import PhoenixAuthEvent from "../events/PhoenixAuthEvent";

import { modules } from "./PhoenixModule";
import { registerSubCommand } from "../utils/commands";
import { chat } from "../utils/utils";
import { Collection } from "../utils/ObjectEditor";

// import Settings from "../config";
const S3FPacketCustomPayload = Java.type("net.minecraft.network.play.server.S3FPacketCustomPayload");
const C17PacketCustomPayload = Java.type("net.minecraft.network.play.client.C17PacketCustomPayload");

const Unpooled = Java.type("io.netty.buffer.Unpooled");
const PacketBuffer = Java.type("net.minecraft.network.PacketBuffer");
const InetAddress = Java.type("java.net.InetAddress");

const allowed = [
	"195.88.24.137",
	"195.88.25.128"
];

class Phoenix {
    constructor() {
        this._inPhoenix = false;
        this._modules = modules.map(m => new m(this));
        this._collection = new Collection(this._modules);
        this._subcommands = []

        this.authTrigger = register("chat", () => {
            this._handleAuthenticationRequest();
        }).setCriteria("[Phoenix] Please authenticate using phoenixclient-auth.");

        this.authDoneTrigger = register("packetReceived", (packet, event) => {
            this._handleModuleSync(packet, event);
        }).setFilteredClass(S3FPacketCustomPayload).unregister();

        this._checkInPhoenix();

        register(net.minecraftforge.fml.common.network.FMLNetworkEvent.ClientConnectedToServerEvent, (e) => {
            this._handleConnect(e);
        });

        register(net.minecraftforge.fml.common.network.FMLNetworkEvent.ClientDisconnectionFromServerEvent, () => {
            this._inPhoenix = false;
        });

        Client.scheduleTask(40, () => {
            registerSubCommand(["phoenix", "ph"], args => {
                const action = args.shift();
                if (!action) {
                    if (!this.isInPhoenix()) {
                        chat("Chilly attempt from a crippled man.");
                        return;
                    }
                    this._collection.openGui();
                    return;
                }
                for (let listener of this._subcommands) {
                    if (listener.args.some(arg => arg === action)) return listener.listener(args)
                }
                chat("Unknown subcommand!");
            });

            this.registerSubCommand("config", () => {
                if (!this.isInPhoenix()) {
                    chat("Chilly attempt from a crippled man.");
                    return;
                }
                this._collection.openGui();
            });
            this.registerSubCommand("reload", () => {
                if (!this.isInPhoenix()) {
                    chat("You are not in Phoenix!");
                    return;
                }
                this._hotReload();
            });
        });
    }

    registerSubCommand(args, listener, tabCompletions) {
        if (!Array.isArray(args)) args = [args]
        const subCommand = { args, listener }
        if (tabCompletions) subCommand.tabCompletions = tabCompletions
        this._subcommands.push(subCommand)
    }

    getModules() {
        return this._modules;
    }

    isInPhoenix() {
        return this._inPhoenix;
    }

    _handleAuthenticationRequest() {
        this.authTrigger.unregister();

        if (PhoenixAuthEvent.Pre.trigger().cancelled) {
            return;
        }

        this.authDoneTrigger.register();
        this._authenticate();
    }

    _authenticate() {
        if (!this.isInPhoenix()) {
            return;
        }

        const buffer = new PacketBuffer(Unpooled.buffer());
        buffer.func_180714_a(Client.getMinecraft().func_110432_I().func_111286_b());
        Client.sendPacket(new C17PacketCustomPayload("phoenixclient-auth", buffer));
        return true;
    }

    _hotReload() {
        if (!this.isInPhoenix()) {
            return;
        }

        Client.sendPacket(new C17PacketCustomPayload("phoenixclient-reload", new PacketBuffer(Unpooled.buffer())));
        return true;
    }

    customPayload(channel, buffer) {
        let buf = null;
        if (buffer) {
            buf = new PacketBuffer(Unpooled.buffer());
            if (typeof buffer === "string") {
                buf.func_180714_a(buffer);
            } else if (typeof buffer === "object") {
                buf.func_180714_a(JSON.stringify(buffer));
            }
        }

        Client.sendPacket(new C17PacketCustomPayload(channel, buf));
    }

    _handleModuleSync(packet, event) {
        if (packet.func_149169_c() === "p-auth-done" && this._inPhoenix) {
            cancel(event);

            const buf = packet.func_180735_b();
            if (buf.readableBytes() <= 3) {
                // no idea why but phoenix just sends an empty custom payload alongside
                // the one with the data...
                return;
            }
            const msg = buf.func_150789_c(32767);
            const ms = JSON.parse(msg);
            this._moduleList = ms;
            PhoenixAuthEvent.Post.trigger(ms);
            this.authDoneTrigger.unregister();

            this._modules.forEach(module => {
                if (module._config["toggle"]) {
                    module.toggle();
                }
            });
        }
    }

    _handleConnect(e) {
        let host = e.manager.func_74430_c();
        if (!host) {
            return;
        }

        const ip = host.toString().split("/")[1].split(":")[0];
        if (!allowed.includes(ip)) {
            ChatLib.chat("[PhoenixAuth] IP not in the phoenix whitelist.");
            return;
        }

        this._inPhoenix = true;
        this.authTrigger.register();
    }

    _checkInPhoenix() {
        const addr = Client.getMinecraft()?.func_147104_D()?.field_78845_b;
        if (addr) {
            const ipBytes = InetAddress.getByName(addr).getAddress().map(b => b & 0xFF);
            const ip = `${ipBytes[0]}.${ipBytes[1]}.${ipBytes[2]}.${ipBytes[3]}`;
            if (allowed.includes(ip)) {
                this._getList();
            }
        }
    }

    _getList() {
        const received = register("packetReceived", (packet, event) => {
            if (packet.func_149169_c() === "p-list") {
                received.unregister();
                cancel(event);
                const buf = packet.func_180735_b();
                if (buf.readableBytes() <= 3) {
                    // no idea why but phoenix just sends an empty custom payload alongside
                    // the one with the data...
                    return;
                }
                const msg = buf.func_150789_c(32767);
                const response = JSON.parse(msg);
                for (let i = 0; i < response.modules.length; i++) {
                    const found = this._modules.find(m => m.getName() === response.modules[i]);
                    found._toggled = true;
                }
                this._inPhoenix = true;
            }
        }).setFilteredClass(S3FPacketCustomPayload);
        this.customPayload("phoenixclient-list", {});
    }
}

console.log("importing this file");
const phoenix = new Phoenix();
export default phoenix;
