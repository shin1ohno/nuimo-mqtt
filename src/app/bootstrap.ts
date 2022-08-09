import { DeviceDiscoveryManager, NuimoControlDevice } from "rocket-nuimo";
import { Observable } from "rxjs";
import MQTT, { AsyncClient, AsyncMqttClient } from "async-mqtt";
import pino from "pino";
import { NuimoMQTT } from "./nuimo-mqtt";
import { BrokerConfig } from "./broker-config";

const logger = pino();

class Bootstrap {
  static run(): void {
    Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
      Bootstrap.MQTTConnection(BrokerConfig.fromEnv()).subscribe((mqtt) => {
        nuimo.connect().then(() => new NuimoMQTT(mqtt, nuimo).subscribe());
      });
    });
  }

  private static MQTTConnection(
    config: BrokerConfig
  ): Observable<AsyncMqttClient> {
    return new Observable<AsyncClient>((subscriber) => {
      const now = new Date();
      MQTT.connectAsync(config.url, config.options)
        .then((mqtt) => {
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
