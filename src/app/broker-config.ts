import dotenv from "dotenv";

declare type BrokerOptions =
  | { username: string; password: string }
  | Record<string, never>;

class BrokerConfig {
  private defaultURL = "mqtt://localhost:1833";
  private readonly brokerURL: string | undefined;
  private readonly userName: string | undefined;
  private readonly password: string | undefined;

  constructor(brokerURL?: string, userName?: string, password?: string) {
    this.brokerURL = brokerURL;
    this.userName = userName;
    this.password = password;
  }

  public get url(): string {
    return this.brokerURL || this.defaultURL;
  }

  public get options(): BrokerOptions {
    if (this.userName && this.password) {
      return {
        username: this.userName,
        password: this.password,
      };
    } else {
      return {};
    }
  }

  public static fromEnv(): BrokerConfig {
    dotenv.config();
    const brokerURL = process.env.BROKER_URL;
    const userName = process.env.BROKER_USER_NAME;
    const password = process.env.BROKER_PASSWORD;
    return new BrokerConfig(brokerURL, userName, password);
  }
}

export { BrokerConfig, BrokerOptions };
