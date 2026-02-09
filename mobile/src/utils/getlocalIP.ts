// run ipconfig getifaddr en0 to get the local IP
const CURRENT_IP = "192.168.86.27";

export function getLocalIp(): string | null {
    return CURRENT_IP;
}
