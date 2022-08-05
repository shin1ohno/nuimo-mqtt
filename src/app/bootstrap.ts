import { DeviceDiscoveryManager, NuimoControlDevice } from "rocket-nuimo";
import { Observable } from "rxjs";
import MQTT, { AsyncClient } from "async-mqtt";
import pino from "pino";
import { NuimoMQTT } from "./nuimo-mqtt";

const logger = pino();

class Bootstrap {
  static run(): void {
    Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
      Bootstrap.setupMQTT().subscribe((mqtt) => {
        const nuimoMQTT = new NuimoMQTT(mqtt, nuimo);
        nuimo.connect().then(() => nuimoMQTT.subscribe());
      });
    });
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
