"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
class LogNormaliser {
    constructor(logs, resolution, timezone) {
        this.logs = logs;
        this.resolution = resolution;
        this.timezone = timezone;
    }
    getNormalisedLogs() {
        let labelFormat = 'HH:MM';
        let loopFormat = 'YYYY-MM-DD HH:mm:ss';
        switch (this.resolution) {
            default:
            case 'lastHour':
            case 'last6Hours':
                loopFormat = 'YYYY-MM-DD HH:mm';
                labelFormat = 'HH:mm';
                break;
            case 'last24Hours':
            case 'yesterday':
            case 'today':
                loopFormat = 'YYYY-MM-DD HH';
                labelFormat = 'HH:00';
                break;
            case 'last14Days':
            case 'last31Days':
            case 'lastMonth':
            case 'thisMonth':
                loopFormat = 'YYYY-MM-DD';
                labelFormat = 'DD MMM';
                break;
            case 'last7Days':
            case 'thisWeek':
            case 'lastWeek':
                loopFormat = 'YYYY-MM-DD';
                labelFormat = 'ddd';
                break;
            case 'thisYear':
            case 'lastYear':
            case 'last2Years':
                loopFormat = 'YYYY-MM';
                labelFormat = 'MMM YYYY';
        }
        const combinedLogs = this.logs.values.reduce((acc, log) => {
            let date = (0, dayjs_1.default)(log.t);
            const dateFormatted = date.format(loopFormat);
            if (!acc[dateFormatted]) {
                acc[dateFormatted] = [];
            }
            acc[dateFormatted].push(log);
            return acc;
        }, {});
        // Get the highest values and format labels
        const values = [];
        Object.keys(combinedLogs).forEach((key) => {
            const logs = combinedLogs[key];
            const highestLog = logs.reduce((acc, log) => {
                if ((log.v ?? 0) > (acc.v ?? 0)) {
                    return log;
                }
                return acc;
            }, { t: '', v: -999999 });
            values.push({
                t: (0, dayjs_1.default)(highestLog.t).tz(this.timezone).format(labelFormat),
                v: highestLog.v
            });
        });
        return values;
    }
}
exports.default = LogNormaliser;
