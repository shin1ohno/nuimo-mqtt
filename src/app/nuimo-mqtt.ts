import { AsyncMqttClient } from "async-mqtt";
import { NuimoControlDevice, RotationMode } from "rocket-nuimo";
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
    this.exposeNuimoToMQTT(this.nuimo, this.mqtt).then(() =>
      this.subscribeToMQTTEvents(this.mqtt, this.nuimo)
    );
  }

  private subscribeToMQTTEvents(
    mqtt: AsyncMqttClient,
    nuimo: NuimoControlDevice
  ): void {
    const topicPath = `nuimo/${nuimo.id}`;

    mqtt.subscribe(`${topicPath}/reaction`).then(() => {
      mqtt.on("message", (topic, payload) => {
        let percentage;
        const p: {
          status: "playing" | "paused" | "volumeChange";
          percentage: string;
        } = JSON.parse(payload.toString());

        switch (p.status) {
          case "playing":
            return nuimo.displayGlyph(controlGlyphs.playing);
          case "paused":
            return nuimo.displayGlyph(controlGlyphs.paused);
          case "volumeChange":
            percentage = parseInt(p.percentage, 10);
            if (Number.isNaN(percentage)) {
              logger.error(
                `Unexpected percentage in payload: ${JSON.stringify(p)}`
              );
              percentage = 0;
            }
            return volumeGlyphs.display(percentage, nuimo);
          default:
            break;
        }
      });
    });
  }

  private exposeNuimoToMQTT(
    nuimo: NuimoControlDevice,
    mqtt: AsyncMqttClient
  ): Promise<void> {
    nuimo.rotationMode = RotationMode.Continuous;
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
          fromEvent(nuimo, eventName).subscribe((e) => {
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

export { NuimoMQTT };
