"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* eslint-disable func-names */
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = __importDefault(require("ws"));
dotenv_1.default.config();
const debugMode = false;
const socket = new ws_1.default(`wss://misskey.io/streaming?i=${process.env.MISSKEY_API_KEY}`);
const regex = /(([\u3041-\u3096]|[\u30A1-\u30FA]|[々〇〻\u2E80-\u2FDF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]|[\uD840-\uD87F][\uDC00-\uDFFF]){3,})(?!\1).{2,}\1/g;
let eventData;
let result;
let detectionMessage;
socket.onopen = function () {
    console.log("[open] Connection established");
    console.log("Sending to server");
    socket.send(JSON.stringify({
        type: "connect",
        body: {
            channel: "homeTimeline",
            id: "home",
        },
    }));
    socket.send(JSON.stringify({
        type: "connect",
        body: {
            channel: "main",
            id: "main",
        },
    }));
};
socket.onmessage = function (event) {
    eventData = JSON.parse(event.data);
    if (!(eventData.type === "channel")) {
        console.log("[ignore] Event type is not channel.");
        return false;
    }
    if (!(eventData.body.type === "note")) {
        console.log("[ignore] Body type is not note.");
        return false;
    }
    if (eventData.body.body === undefined) {
        console.log("[ignore] Note hasn't body.");
        return false;
    }
    if (eventData.body.body.text === null || !eventData.body.body.text) {
        console.log("[ignore] Note body is null.");
        return false;
    }
    if (eventData.body.body.user.isBot === true) {
        console.log("[ignore] User is bot.");
        return false;
    }
    if (!(eventData.body.body.visibility === "public") &&
        !(eventData.body.body.visibility === "home")) {
        console.log("[ignore] Note is not visible in public or home.");
        return false;
    }
    console.log("[ignition] I received note.");
    console.log(eventData.body.body.text);
    if (eventData.body.body.text === "@dance_robot_dance ping") {
        socket.send(JSON.stringify({
            type: "api",
            body: {
                id: "hoge",
                endpoint: "notes/create",
                data: {
                    replyId: eventData.body.body.id,
                    text: "ぽん！",
                },
            },
        }));
        return false;
    }
    if (eventData.body.body.text === "@dance_robot_dance フォローミー" ||
        eventData.body.body.text === "@dance_robot_dance フォローして" ||
        eventData.body.body.text === "@dance_robot_dance follow me") {
        socket.send(JSON.stringify({
            type: "api",
            body: {
                id: "hoge",
                endpoint: "following/create",
                data: {
                    userId: eventData.body.body.userId,
                },
            },
        }));
        socket.send(JSON.stringify({
            type: "api",
            body: {
                id: "hoge",
                endpoint: "notes/create",
                data: {
                    replyId: eventData.body.body.id,
                    text: "フォローしたよ！",
                },
            },
        }));
        console.log(`[success] I followed ${eventData.body.body.user.name}`);
        return false;
    }
    if (eventData.body.body.mentions !== undefined) {
        console.log("[ignore] Note is reply.");
        return false;
    }
    if (!eventData.body.body.text.match(regex)) {
        console.log("[ignore] Note isn't dance robot dance.");
        return false;
    }
    result = regex.exec(eventData.body.body.text);
    if (eventData.body.body.text.match(/[『』（）「」。、a-zA-Z0-9!-/:-@¥[-`{-~]/g) !== null ||
        result === null) {
        console.log("[ignore] Note has punctuation character.");
        return false;
    }
    detectionMessage = `ダンスロボットダンス発見！\n> ${result[0]
        .replace(new RegExp(`^${result[1]}`), `**${result[1]}**`)
        .replace(new RegExp(`${result[1]}$`), `**${result[1]}**`)}`;
    console.log(detectionMessage);
    if (!debugMode) {
        socket.send(JSON.stringify({
            type: "api",
            body: {
                id: "hoge",
                endpoint: "notes/create",
                data: {
                    replyId: eventData.body.body.id,
                    text: detectionMessage,
                },
            },
        }));
        console.log("[success] I notice dance robot dance!");
    }
    return false;
};
socket.onclose = function (event) {
    socket.send(JSON.stringify({
        type: "disconnect",
        body: {
            id: "home",
        },
    }));
    socket.send(JSON.stringify({
        type: "disconnect",
        body: {
            id: "main",
        },
    }));
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    }
    else {
        console.log("[close] Connection died");
    }
};
socket.onerror = function () {
    console.log(`[error] An unexpected error has occurred`);
};
