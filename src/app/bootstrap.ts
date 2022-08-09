import { DeviceDiscoveryManager, NuimoControlDevice } from "rocket-nuimo";
import { Observable } from "rxjs";
import MQTT, { AsyncMqttClient } from "async-mqtt";
import pino from "pino";
import { NuimoMQTT } from "./nuimo-mqtt";
import { BrokerConfig } from "./broker-config";

const logger = pino();

class Bootstrap {
  static run(): void {
    Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
      Bootstrap.MQTTConnection(BrokerConfig.fromEnv()).then((mqtt) => {
        nuimo.connect().then(() => new NuimoMQTT(mqtt, nuimo).subscribe());
      });
    });
  }

  private static MQTTConnection(
    config: BrokerConfig
  ): Promise<AsyncMqttClient> {
    return MQTT.connectAsync(config.url, config.options).then((mqtt) => {
      logger.info(
        `Connected to MQTT Broker(${config.url}) at ${new Date().toISOString()}`
      );
      return mqtt;
    });
  }

  private static startNuimoDiscovery(): Observable<NuimoControlDevice> {
    return new Observable<NuimoControlDevice>((subscriber) => {
      DeviceDiscoveryManager.defaultManager
        .startDiscoverySession()
        .on("device", (device, _) => {
          subscriber.next(device);
        });
    });
  }
}

export { Bootstrap };
