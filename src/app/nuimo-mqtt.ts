import { AsyncMqttClient } from "async-mqtt";
import { emptyGlyph, NuimoControlDevice, RotationMode } from "rocket-nuimo";
import { controlGlyphs, volumeGlyphs } from "./glyphs";
import { filter, fromEvent, interval, map, Observable, take, tap } from "rxjs";
import pino from "pino";

const logger = pino();

class NuimoMQTT {
  private readonly mqtt: AsyncMqttClient;
  private readonly nuimo: NuimoControlDevice;

  constructor(mqtt: AsyncMqttClient, nuimo: NuimoControlDevice) {
    this.mqtt = mqtt;
    this.nuimo = nuimo;
  }

  subscribe(): Promise<void> {
    const heartbeatObservable = interval(4000).pipe(
      take((20 * 60 * 1000) / 4000), //emit for 20 mins and then stop until next MQTT events
      filter((_) => !!this.nuimo.rssi && !!this.nuimo.batteryLevel),
      tap((_) =>
        this.mqtt.publish(
          `nuimo/${this.nuimo.id}/rssi`,
          this.nuimo.rssi!.toString()
        )
      ),
      tap((_) =>
        this.mqtt.publish(
          `nuimo/${this.nuimo.id}/batteryLevel`,
          this.nuimo.batteryLevel!.toString()
        )
      ),
      tap((_) => this.nuimo.displayGlyph(emptyGlyph, { brightness: 1 }))
    );

    let heartbeatSubscription = heartbeatObservable.subscribe();

    return this.exposeNuimoToMQTT(this.nuimo, this.mqtt).then(() =>
      this.subscribeToMQTTEvents(this.mqtt, this.nuimo).then((o) => {
        o.subscribe((p) => {
          p?.then((_) => {
            heartbeatSubscription.unsubscribe();
            heartbeatSubscription = heartbeatObservable.subscribe();
          });
        });
      })
    );
  }

  private subscribeToMQTTEvents(
    mqtt: AsyncMqttClient,
    nuimo: NuimoControlDevice
  ): Promise<Observable<Promise<NuimoControlDevice>>> {
    const topicPath = `nuimo/${nuimo.id}`;

    return mqtt.subscribe(`${topicPath}/reaction`).then(() => {
      return fromEvent(mqtt, "message").pipe(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        map(([_, payload]) => {
          let percentage;
          const p: {
            status: "playing" | "paused" | "volumeChange";
            percentage: string;
          } = JSON.parse(payload.toString());

          switch (p.status) {
            case "playing":
              return nuimo
                .displayGlyph(controlGlyphs.playing)
                .then((_) => nuimo);
            case "paused":
              return nuimo
                .displayGlyph(controlGlyphs.paused)
                .then((_) => nuimo);
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
              return nuimo
                .displayGlyph(controlGlyphs.loading)
                .then((_) => nuimo);
          }
        })
      );
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
