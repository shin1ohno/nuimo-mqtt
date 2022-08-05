import { AsyncMqttClient } from "async-mqtt";
import {
  DisplayTransition,
  NuimoControlDevice,
  RotationMode,
} from "rocket-nuimo";
import { controlGlyphs, volumeGlyphs } from "./glyphs";
import { fromEvent } from "rxjs";
import pino from "pino";

const logger = pino();

class NuimoMQTT {
  private readonly mqtt: AsyncMqttClient;
  private readonly nuimo: NuimoControlDevice;

  constructor(mqtt: AsyncMqttClient, nuimo: NuimoControlDevice) {
    this.mqtt = mqtt;
    this.nuimo = nuimo;
  }

  subscribe(): void {
    this.exposeNuimoToMQTT(this.nuimo, this.mqtt);
    this.subscribeToMQTTEvents(this.mqtt, this.nuimo);
  }

  private subscribeToMQTTEvents(
    mqtt: AsyncMqttClient,
    nuimo: NuimoControlDevice
  ): void {
    const topicPath = `nuimo/${nuimo.id}`;

    mqtt.subscribe(`${topicPath}/reaction`).then(() => {
      mqtt.on("message", (topic, payload) => {
        const p = JSON.parse(payload.toString());
        logger.info(topic);
        logger.info(JSON.stringify(p));
        switch (p.status) {
          case "playing":
            nuimo.displayGlyph(controlGlyphs.playing);
            break;
          case "paused":
            nuimo.displayGlyph(controlGlyphs.paused);
            break;
          case "volumeChange":
            this.displayVolumeGlyph(p, nuimo);
            break;
          default:
            break;
        }
      });
    });
  }

  private displayVolumeGlyph(
    payload: Record<"percentage", number>,
    nuimo: NuimoControlDevice
  ): void {
    const i = Math.floor(payload.percentage / 10);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const g = volumeGlyphs[`volume${i}`];
    if (g) {
      nuimo.displayGlyph(g, {
        timeoutMs: 1000,
        transition: DisplayTransition.Immediate,
        brightness: 1,
      });
    }
  }

  private exposeNuimoToMQTT(
    nuimo: NuimoControlDevice,
    mqtt: AsyncMqttClient
  ): void {
    nuimo.rotationMode = RotationMode.Continuous;
    mqtt.publish("nuimo/connected", nuimo.id);
    const topicPath = `nuimo/${nuimo.id}`;

    const hover = ["hover"];
    const rotate = ["rotate", "rotateLeft", "rotateRight"];
    const select = ["select", "selectUp", "selectDown"];
    const swipe = ["swipeUp", "swipeDown"];
    const hoverSwipe = ["swipeLeft", "swipeRight"];
    const touch = ["touchTop", "touchLeft", "touchRight", "touchBottom"];
    const longTouch = ["longTouchLeft", "longTouchRight", "longTouchBottom"];
    const every = [
      hover,
      rotate,
      select,
      swipe,
      hoverSwipe,
      touch,
      longTouch,
    ].flat();

    every.flat().forEach((eventName) => {
      fromEvent(nuimo, eventName).subscribe((e) => {
        const ops = {
          subject: eventName,
          parameter: e,
        };
        logger.info(Object.assign({ nuimo: nuimo.id }, ops));
        mqtt.publish(`${topicPath}/operation`, JSON.stringify(ops));
      });
    });
  }
}

export { NuimoMQTT };
