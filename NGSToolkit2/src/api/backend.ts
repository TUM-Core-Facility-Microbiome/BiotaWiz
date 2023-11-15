import {byOS, platforms} from "../utils/platform";

const DOCKER = {
    name: "Docker",
    command: "docker",
    argsPrefix: ["run", "--rm"],
}

const WSL = {
    name: "Windows Subsystem for Linux",
    command: "wsl",
    argsPrefix: ["-l", "-v"],
}

export function getDefaultBackend(): IBackend {
    return byOS({
        [platforms.LINUX]: () => {return DOCKER},
        [platforms.WINDOWS]: () => {return WSL},
        [platforms.MAC]: () => {return DOCKER},
        default: () => {return DOCKER},
    })();
}
