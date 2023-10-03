"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NuimoMQTT = void 0;
const rocket_nuimo_1 = require("rocket-nuimo");
const glyphs_1 = require("./glyphs");
const rxjs_1 = require("rxjs");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)();
class NuimoMQTT {
    constructor(mqtt, nuimo) {
        this.mqtt = mqtt;
        this.nuimo = nuimo;
    }
    subscribe() {
        const heartbeatObservable = (0, rxjs_1.interval)(4000).pipe((0, rxjs_1.take)((20 * 60 * 1000) / 4000), //emit for 20 mins and then stop until next MQTT events
        (0, rxjs_1.filter)((_) => !!this.nuimo.rssi && !!this.nuimo.batteryLevel), (0, rxjs_1.tap)((_) => this.mqtt.publish(`nuimo/${this.nuimo.id}/rssi`, this.nuimo.rssi.toString())), (0, rxjs_1.tap)((_) => this.mqtt.publish(`nuimo/${this.nuimo.id}/batteryLevel`, this.nuimo.batteryLevel.toString())), (0, rxjs_1.tap)((_) => this.nuimo.displayGlyph(rocket_nuimo_1.emptyGlyph, { brightness: 1 })));
        let heartbeatSubscription = heartbeatObservable.subscribe();
        return this.exposeNuimoToMQTT(this.nuimo, this.mqtt).then(() => this.subscribeToMQTTEvents(this.mqtt, this.nuimo).then((o) => {
            o.subscribe((p) => {
                p === null || p === void 0 ? void 0 : p.then((_) => {
                    heartbeatSubscription.unsubscribe();
                    heartbeatSubscription = heartbeatObservable.subscribe();
                });
            });
        }));
    }
    subscribeToMQTTEvents(mqtt, nuimo) {
        const topicPath = `nuimo/${nuimo.id}`;
        return mqtt.subscribe(`${topicPath}/reaction`).then(() => {
            return (0, rxjs_1.fromEvent)(mqtt, "message").pipe(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (0, rxjs_1.map)(([_, payload]) => {
                let percentage;
                const p = JSON.parse(payload.toString());
                switch (p.status) {
                    case "playing":
                        return nuimo
                            .displayGlyph(glyphs_1.controlGlyphs.playing)
                            .then((_) => nuimo);
                    case "paused":
                        return nuimo
                            .displayGlyph(glyphs_1.controlGlyphs.paused)
                            .then((_) => nuimo);
                    case "next":
                        return nuimo.displayGlyph(glyphs_1.controlGlyphs.next).then((_) => nuimo);
                    case "previous":
                        return nuimo
                            .displayGlyph(glyphs_1.controlGlyphs.previous)
                            .then((_) => nuimo);
                    case "volumeChange":
                        percentage = parseInt(p.percentage, 10);
                        if (Number.isNaN(percentage)) {
                            logger.error(`Unexpected percentage in payload: ${JSON.stringify(p)}`);
                            percentage = 0;
                        }
                        return glyphs_1.volumeGlyphs.display(percentage, nuimo);
                    default:
                        return nuimo.displayGlyph(rocket_nuimo_1.emptyGlyph).then((_) => nuimo);
                }
            }));
        });
    }
    exposeNuimoToMQTT(nuimo, mqtt) {
        nuimo.rotationMode = rocket_nuimo_1.RotationMode.Continuous;
        return mqtt.publish("nuimo/connected", nuimo.id).then(() => {
            const topicPath = `nuimo/${nuimo.id}`;
            const hover = ["hover"];
            const rotate = ["rotate", "rotateLeft", "rotateRight"];
            const select = ["select", "selectUp", "selectDown"];
            const swipe = ["swipeUp", "swipeDown"];
            const hoverSwipe = ["swipeLeft", "swipeRight"];
            const touch = ["touchTop", "touchLeft", "touchRight", "touchBottom"];
            const longTouch = ["longTouchLeft", "longTouchRight", "longTouchBottom"];
            [hover, rotate, select, swipe, hoverSwipe, touch, longTouch]
                .flat()
                .forEach((eventName) => {
                (0, rxjs_1.fromEvent)(nuimo, eventName).subscribe((e) => {
                    const ops = {
                        subject: eventName,
                        parameter: e,
                    };
                    mqtt
                        .publish(`${topicPath}/operation`, JSON.stringify(ops))
                        .then(() => logger.info(Object.assign({ nuimo: nuimo.id }, ops)));
                });
            });
        });
    }
}
exports.NuimoMQTT = NuimoMQTT;
