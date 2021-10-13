import {
  DeviceDiscoveryManager,
  DisplayTransition,
  NuimoControlDevice,
  RotationMode,
} from "rocket-nuimo";
import { fromEvent, Observable } from "rxjs";
import MQTT, { AsyncClient } from "async-mqtt";
import pino from "pino";
import { controlGlyphs, volumeGlyphs } from "./glyphs";

const logger = pino();

class Bootstrap {
  static run(): void {
    Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
      Bootstrap.setupMQTT().subscribe((mqtt) => {
        nuimo.connect().then(() => {
          nuimo.rotationMode = RotationMode.Continuous;
          mqtt.publish("nuimo/connected", nuimo.id);
          const topicPath = `nuimo/${nuimo.id}`;

          const hover = ["hover"];
          const rotate = ["rotate", "rotateLeft", "rotateRight"];
          const select = ["select", "selectUp", "selectDown"];
          const swipe = ["swipeUp", "swipeDown"];
          const hoverSwipe = ["swipeLeft", "swipeRight"];
          const touch = ["touchTop", "touchLeft", "touchRight", "touchBottom"];
          const longTouch = [
            "longTouchLeft",
            "longTouchRight",
            "longTouchBottom",
          ];
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

          mqtt.subscribe(`${topicPath}/reaction`).then(() => {
            mqtt.on("message", (topic, payload) => {
              logger.info(topic);
              logger.info(JSON.parse(payload.toString()));
              switch (JSON.parse(payload.toString()).status) {
                case "playing":
                  nuimo.displayGlyph(controlGlyphs.playing);
                  break;
                case "paused":
                  nuimo.displayGlyph(controlGlyphs.paused);
                  break;
                case "volumeChange":
                  this.displayVolumeGlyph(payload, nuimo);
                  break;
                default:
                  break;
              }
            });
          });
        });
      });
    });
  }

  private static displayVolumeGlyph(
    payload: Buffer,
    nuimo: NuimoControlDevice
  ) {
    const i = Math.floor(JSON.parse(payload.toString()).percentage / 10);
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

  private static setupMQTT(): Observable<AsyncClient> {
    const brokerUrl = "mqtts://dummy.mq.eu-west-2.amazonaws.com:8883";
    const options = {
      username: "dummy",
      password: "dummy",
    };

    return new Observable<AsyncClient>((subscriber) => {
      const now = new Date();
      MQTT.connectAsync(brokerUrl, options)
        .then((mqtt) => {
          mqtt.publish("nuimo/last_connected_at", now.toJSON());
          logger.info(`Connected to MQTT Broker at ${now.toISOString()}`);
          subscriber.next(mqtt);
        })
        .catch((e) => subscriber.error(e));
    });
  }

  private static startNuimoDiscovery(): Observable<NuimoControlDevice> {
    const manager = DeviceDiscoveryManager.defaultManager;
    manager.startDiscoverySession();
    return new Observable<NuimoControlDevice>((subscriber) => {
      manager.on("device", (device, _) => {
        subscriber.next(device);
      });
    });
  }
}

export { Bootstrap };
