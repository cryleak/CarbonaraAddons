const File = Java.type("java.io.File");
const Files = Java.type("java.nio.file.Files");
const Paths = Java.type("java.nio.file.Paths");
const StandardCopyOption = Java.type("java.nio.file.StandardCopyOption");

const modulePath = "./config/ChatTriggers/modules/carbonaraaddons/"

function assureFolder(path) {
    let folder = new File(`${modulePath}${path}`)
    if (!folder.exists()) {
        console.log(`Creating ${path} folder for Carbonara Addons...`);
        if (!folder.mkdirs()) {
            console.error(`Failed to create ${path} folder for Carbonara Addons.`);
            return false;
        }
    }
}

function moveToOld(folder) {
    const newPath = `${modulePath}data/old/${folder}`;
    const oldPath = `${modulePath}${folder}`;

    const oldFile = new File(oldPath);
    if (!oldFile.exists()) {
        return;
    }

    console.log(`Executing migration for ${folder}...`);
    try {
        Files.move(Paths.get(oldPath), Paths.get(newPath), StandardCopyOption.REPLACE_EXISTING);
        console.log(`Successfully moved ${folder} to old folder.`);
    } catch (e) {
        console.error(`Failed to move ${folder} to old folder:`, e);
    }
}

function moveSettingsFile() {
    const newFilePath = `${modulePath}data/settings.json`;
    const file = new File(newFilePath);

    if (file.exists()) {
        return;
    }

    const oldFilePath = `${modulePath}settings.json`;
    console.log("Executing settings file migration...");
    try {
        Files.move(Paths.get(oldFilePath), Paths.get(newFilePath), StandardCopyOption.REPLACE_EXISTING);
    } catch (e) {
        console.error("Failed to move settings file:", e);
        return;
    }
}

function moveAutoRoutesFile() {
    const newFilePath = `${modulePath}data/AutoRoutes.json`;
    const file = new File(newFilePath);

    if (file.exists()) {
        return;
    }

    const oldFilePath = `${modulePath}AutoRoutesConfig.json`;
    console.log("Executing AutoRoutes file migration...");
    try {
        Files.move(Paths.get(oldFilePath), Paths.get(newFilePath), StandardCopyOption.REPLACE_EXISTING);
    } catch (e) {
        console.error("Failed to move AutoRoutes file:", e);
        return;
    }
}

export default {
    execute: () => {
        assureFolder("data");
        moveSettingsFile();
        moveAutoRoutesFile();

        assureFolder("data/old");

        moveToOld("configs");
        moveToOld("blinkroutes");
        moveToOld("posData.json");

        assureFolder("data/modules");
        assureFolder("data/autop3");
    }
};
