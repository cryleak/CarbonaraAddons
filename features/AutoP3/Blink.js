import Settings from "../../config"
import fakeKeybinds from "../../utils/fakeKeybinds"
import PogObject from "../../../PogData"

import { chat, setPlayerPosition, setVelocity, debugMessage } from "../../utils/utils"
import { registerSubCommand } from "../../utils/commands"
import { packetCounterGui } from "../../config"
import Vector3 from "../../utils/Vector3"
import { UpdateWalkingPlayerPre } from "../../events/JavaEvents"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const File = Java.type("java.io.File")
global.carbonara ??= {}
global.carbonara.autop3 ??= {}
global.carbonara.autop3.lastBlink = Date.now()
global.carbonara.autop3.missingPackets = []
global.carbonara.autop3.blinkEnabled = false

class Blink {
    constructor() {
        this.lastC03PacketState = {
            position: new Vector3(Player),
            onGround: null,
            rotation: { yaw: null, pitch: null }
        }
        this.data = new PogObject("CarbonaraAddons", {
            packetCounter: {
                x: Renderer.screen.getWidth() / 2,
                y: Renderer.screen.getHeight() / 2,
                scale: 1,
            }
        }, "posData.json")

        this.movementPacketsSent = 0
        this.blinkRoutes = {}
        this.updateBlinkRoutes()

        register("tick", () => {
            const packetsGained = 1 - this.movementPacketsSent
            if (packetsGained < 0) for (let i = 0; i < Math.abs(packetsGained); i++) global.carbonara.autop3.missingPackets.pop()
            else for (let i = 0; i < packetsGained; i++) global.carbonara.autop3.missingPackets.push(Date.now())


            this.movementPacketsSent = 0
            while (Date.now() - global.carbonara.autop3.missingPackets[0] > 120000) global.carbonara.autop3.missingPackets.shift()
        })

        registerSubCommand("spawnpackets", () => {
            const time = Date.now() + 1000000000
            global.carbonara.autop3.missingPackets = new Array(100000).fill(time)
            chat("Spawned 100000 permanent packets. Is this enough?")
        })

        register("packetReceived", () => {
            this.movementPacketsSent--
        }).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)

        register("packetSent", (packet, event) => {
            Client.scheduleTask(0, () => {
                if (!event.isCancelled()) this.movementPacketsSent++
            })
        }).setFilteredClass(C03PacketPlayer)

        register("renderOverlay", () => {
            if (packetCounterGui.isOpen()) {
                Renderer.scale(this.data.packetCounter.scale)
                const text = 1000000
                Renderer.drawString(text, Renderer.screen.getWidth() * this.data.packetCounter.x, Renderer.screen.getHeight() * this.data.packetCounter.y)
                return
            }
            if (!global.carbonara.autop3.blinkEnabled) return
            Renderer.scale(this.data.packetCounter.scale)
            const text = `${global.carbonara.autop3.missingPackets.length}`
            Renderer.drawString(text, Renderer.screen.getWidth() * this.data.packetCounter.x, Renderer.screen.getHeight() * this.data.packetCounter.y)
        })

        register("dragged", (_0, _1, x, y, bn) => {
            if (!packetCounterGui.isOpen()) return
            if (bn === 2) return
            this.data.packetCounter.x = (x / this.data.packetCounter.scale) / Renderer.screen.getWidth()
            this.data.packetCounter.y = (y / this.data.packetCounter.scale) / Renderer.screen.getHeight()
            this.data.save()
        })

        register("scrolled", (_0, _1, dir) => {
            if (!packetCounterGui.isOpen()) return
            if (dir == 1) this.data.packetCounter.scale += 0.01
            else this.data.packetCounter.scale -= 0.01
            this.data.packetCounter.scale = Math.round(this.data.packetCounter.scale * 100) / 100
            ChatLib.clearChat(69427) // Prevent clogging chat by deleting the previous message
            new Message(`§0[§4Carbonara§0] §fCurrent scale: ${this.data.packetCounter.scale}`).setChatLineId(69427).chat()
            this.data.save()
        })

        fakeKeybinds.onKeyPress("packetChargeKeybind", () => this.toggleCharge(!global.carbonara.autop3.blinkEnabled))

        registerSubCommand(["togglecharge"], (args) => {
            if (args.length && args[0]) this.toggleCharge(args[0] === "true")
            else this.toggleCharge(!global.carbonara.autop3.blinkEnabled)
        })

        this.packetCollector = UpdateWalkingPlayerPre.register(event => {
            if (Settings().pauseCharging && Date.now() - global.carbonara.autop3.lastBlink < 1000) return
            if (this.recordingRouteName) return

            const data = event.data
            let cancelPacket = true

            if (data.onGround !== this.lastC03PacketState.onGround) cancelPacket = false
            this.lastC03PacketState.onGround = data.onGround
            if (Settings().allowRotations) { // If rotating
                if (this.lastC03PacketState.rotation.yaw !== data.yaw || this.lastC03PacketState.rotation.pitch !== data.pitch) cancelPacket = false
                this.lastC03PacketState.rotation.yaw = data.yaw
                this.lastC03PacketState.rotation.pitch = data.pitch
            }
            const currentPosition = new Vector3(data.x, data.y, data.z)
            if (!currentPosition.equals(this.lastC03PacketState.position)) cancelPacket = false
            this.lastC03PacketState.position = currentPosition

            if (cancelPacket) event.cancelled = true
        }, 10000).unregister()

        registerSubCommand(["playroute", "playblinkroute"], (args) => {
            const name = args.join(" ")
            this.executeBlink(name)
        }, () => Object.keys(this.blinkRoutes))

        registerSubCommand("listblinkroutes", () => {
            chat(`Blink routes: ${Object.keys(this.blinkRoutes).map(route => route.split(".sereniblink")[0]).toString()}`)
        })


        registerSubCommand(["recordroute", "recordblinkroute"], (args) => {
            const name = args.join(" ")
            if (!name) return chat("Invalid name!")
            this.recordingRouteName = name
            chat(`Started recording route with name ${this.recordingRouteName}.`)
            FileLib.delete("CarbonaraAddons/blinkroutes", this.recordingRouteName + ".sereniblink")
            FileLib.append("CarbonaraAddons/blinkroutes", this.recordingRouteName + ".sereniblink", `Speed when this route was recorded: ${((Player.getPlayer().field_71075_bZ.func_75094_b()) * 1000).toFixed(0)}`)
            this.packetLogger.register()
        })

        this.packetLogger = UpdateWalkingPlayerPre.register(event => {
            const data = event.data
            let ignorePacket = true

            if (data.onGround !== this.lastC03PacketState.onGround) ignorePacket = false
            this.lastC03PacketState.onGround = data.onGround
            const currentPosition = new Vector3(data.x, data.y, data.z)
            if (!currentPosition.equals(this.lastC03PacketState.position)) ignorePacket = false
            this.lastC03PacketState.position = currentPosition


            if (ignorePacket) return

            FileLib.append("CarbonaraAddons/blinkroutes", this.recordingRouteName + ".sereniblink", `\n${data.x}, ${data.y}, ${data.z}, ${data.onGround}, ${Player.getMotionX()}, ${Player.getMotionY()}, ${Player.getMotionZ()}`)
            this.updateBlinkRoutes()
        }, 10001).unregister()

        fakeKeybinds.onKeyPress("stopRecordingKeybind", () => {
            if (!this.recordingRouteName) return chat("Not recording a route!")
            this.packetLogger.unregister()
            chat(`Stopped recording route ${this.recordingRouteName}. ${this.blinkRoutes[this.recordingRouteName + ".sereniblink"].length} packets logged.`)
            this.recordingRouteName = null
        })

        register("worldUnload", () => {
            global.carbonara.autop3.missingPackets = []
            this.recordingRouteName = null
            this.packetLogger.unregister()
            global.carbonara.autop3.blinkEnabled = false
            this.packetCollector.unregister()
        })


        register("step", () => {
            this.updateBlinkRoutes()
        }).setFps(1)
    }

    toggleCharge(state) {
        global.carbonara.autop3.blinkEnabled = state
        if (global.carbonara.autop3.blinkEnabled) this.packetCollector.register()
        else this.packetCollector.unregister()
    }


    executeBlink(blinkroute, ignoreToggleState = false) {
        if (!global.carbonara.autop3.blinkEnabled && !ignoreToggleState) return chat("Blink is disabled!")

        const packets = this.blinkRoutes[blinkroute + ".sereniblink"]
        if (!packets) return chat(`Can't find route "${blinkroute}".`)

        if (packets.length > global.carbonara.autop3.missingPackets.length) return chat(`Not enough packets saved! Required packets: ${packets.length}`)


        for (let i = 0; i < packets.length; i++) {
            let packet = packets[i]
            if (packet.length < 4 || !packet.length) return chat("Couldn't parse file! Is it invalid?")
            let [x, y, z, onGround] = packet
            Client.sendPacket(new C03PacketPlayer.C04PacketPlayerPosition(x, y, z, onGround))
            // if (i < packets.length - 1) { let previousPacket = i === 0 ? [Player.x, Player.y, Player.z] : packets[i - 1]; ChatLib.chat(getDistance3D(x, y, z, previousPacket[0], previousPacket[1]), previousPacket[2])); }
        }
        const finalPacket = packets[packets.length - 1]
        setPlayerPosition(finalPacket[0], finalPacket[1], finalPacket[2], true)
        if (finalPacket.length === 7) {
            let motion = [finalPacket[4], finalPacket[5], finalPacket[6]]
            setVelocity(...motion)
        }
        chat(`Blinked with ${packets.length} packets.`)
        global.carbonara.autop3.lastBlink = Date.now()
    }

    renameFile(oldname, newname) {
        const file = FileLib.read("CarbonaraAddons/blinkroutes", oldname)
        FileLib.write("CarbonaraAddons/blinkroutes", newname, file)
        FileLib.delete("CarbonaraAddons/blinkroutes", oldname)
    }

    updateBlinkRoutes() {
        const routes = {}
        new File("./config/ChatTriggers/modules/CarbonaraAddons/blinkroutes")?.list()?.forEach(file => {
            routes[file] = this.parseBlinkFile(file)
            if (file.endsWith(".json")) this.renameFile(file, file.split(".json")[0] + ".sereniblink")
        })
        if (!routes) return
        this.blinkRoutes = routes
    }

    parseBlinkFile(fileName) {
        try {
            const packets = FileLib.read("CarbonaraAddons/BlinkRoutes", fileName).split("\n").map(str => {
                const packetData = str.split(", ")
                const packet = [parseFloat(packetData[0]), parseFloat(packetData[1]), parseFloat(packetData[2]), packetData[3] === "true"]
                if (packetData.length === 7) packet.concat([parseFloat(packetData[4]), parseFloat(packetData[5]), parseFloat(packetData[6])])
                return packet
            })
            packets.shift() // First line is always empty and I cba to make a better solution
            return packets
        } catch (e) {
            return null
        }
    }
}

export default new Blink()
