import Settings from "../config"

const fakeKeybinds = []

function onKeyPress(keyBindName, exec) {
    keyPressListener.register()
    fakeKeybinds.push({ keyBindName, exec })
}

export default { onKeyPress }

const keyPressListener = register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, () => {
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    const settings = Settings()
    const pressedKeybinds = fakeKeybinds.filter(keybind => settings[keybind.keyBindName] == keyCode)
    if (!pressedKeybinds.length) return

    pressedKeybinds.forEach(keybind => keybind.exec()) // Execute the code associated with the pressed keybinds. There can be multiple on the same key.
}).unregister()