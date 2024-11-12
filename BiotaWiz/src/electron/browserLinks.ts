import {shell} from "electron";
import {GITHUB_BASE_URL} from "../config";

export function openLink(url: string) {
    shell.openExternal(url);
}

export function openCommunityDiscussions() {
    openLink(`${GITHUB_BASE_URL}/discussions`);
}

export function openIssues() {
    openLink(`${GITHUB_BASE_URL}/issues`);
}
