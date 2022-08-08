import { BrokerConfig } from "../src/app/broker-config";
import { describe } from "mocha";
import { expect } from "chai";
import { faker } from "@faker-js/faker";

describe("Broker Configuration provider", () => {
  const url = faker.internet.url();
  const userName = faker.internet.userName();
  const password = faker.internet.password();
  const c = new BrokerConfig(url, userName, password);

  describe("URL", () => {
    it("should return URL", () => {
      expect(c.url).to.eql(url);
    });
  });

  describe("options", () => {
    it("should return options", () => {
      expect(c.options).to.eql({ username: userName, password: password });
    });
  });

  context("When initialise with empty values", () => {
    const c = new BrokerConfig();

    describe("default URL", () => {
      it("should return the localhost url", () => {
        expect(c.url).to.eql("mqtt://localhost:1833");
      });
    });

    describe("options", () => {
      it("should return empty object", () => {
        expect(c.options).to.eql({});
      });
    });
  });
});
