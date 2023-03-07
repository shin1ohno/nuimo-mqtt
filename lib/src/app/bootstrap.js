"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrap = void 0;
const rocket_nuimo_1 = require("rocket-nuimo");
const rxjs_1 = require("rxjs");
const async_mqtt_1 = __importDefault(require("async-mqtt"));
const pino_1 = __importDefault(require("pino"));
const nuimo_mqtt_1 = require("./nuimo-mqtt");
const broker_config_1 = require("./broker-config");
const logger = (0, pino_1.default)();

class Bootstrap {
  static run() {
    Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
      Bootstrap.MQTTConnection(broker_config_1.BrokerConfig.fromEnv()).then(
        (mqtt) => {
          nuimo
            .connect()
            .then(() => new nuimo_mqtt_1.NuimoMQTT(mqtt, nuimo).subscribe())
            .then(() => nuimo.displayGlyph(rocket_nuimo_1.linkGlyph));
        }
      );
    });
  }

  static MQTTConnection(config) {
    return async_mqtt_1.default
      .connectAsync(config.url, config.options)
      .then((mqtt) => {
        logger.info(
          `Connected to MQTT Broker(${
            config.url
          }) at ${new Date().toISOString()}`
        );
        return mqtt;
      });
  }

  static startNuimoDiscovery() {
    return new rxjs_1.Observable((subscriber) => {
      rocket_nuimo_1.DeviceDiscoveryManager.defaultManager
        .startDiscoverySession()
        .on("device", (device, _) => {
          subscriber.next(device);
        });
    });
  }
}
exports.Bootstrap = Bootstrap;
