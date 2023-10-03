"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrokerConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const process = __importStar(require("process"));
class BrokerConfig {
    constructor(brokerURL, userName, password) {
        this.defaultURL = "mqtt://localhost:1833";
        this.brokerURL = brokerURL;
        this.userName = userName;
        this.password = password;
    }
    get url() {
        return this.brokerURL || this.defaultURL;
    }
    get options() {
        if (this.userName && this.password) {
            return {
                username: this.userName,
                password: this.password,
            };
        }
        else {
            return {};
        }
    }
    static fromEnv() {
        dotenv_1.default.config();
        const brokerURL = process.env.BROKER_URL;
        const userName = process.env.BROKER_USER_NAME;
        const password = process.env.BROKER_PASSWORD;
        return new BrokerConfig(brokerURL, userName, password);
    }
}
exports.BrokerConfig = BrokerConfig;
