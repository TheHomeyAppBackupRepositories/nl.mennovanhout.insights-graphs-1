"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const homey_api_1 = require("homey-api");
const chart_js_image_1 = __importDefault(require("chart.js-image"));
const LogNormaliser_1 = __importDefault(require("./src/LogNormaliser"));
class InsightGraphs extends homey_1.default.App {
    constructor() {
        super(...arguments);
        this.resolutionSelection = ['lastHour', 'last6Hours', 'last24Hours', 'last7Days', 'last14Days', 'last31Days',
            'last2Years', 'today', 'thisWeek', 'thisMonth', 'thisYear', 'yesterday', 'lastWeek', 'lastMonth', 'lastYear'];
        this.homeyApi = undefined;
    }
    async onInit() {
        this.homeyApi = await homey_api_1.HomeyAPI.createAppAPI({
            homey: this.homey,
        });
        // @ts-ignore
        this.insightsManager = this.homeyApi.insights;
        // @ts-ignore
        this.deviceManager = this.homeyApi.devices;
        this.createGraphActionCard = this.homey.flow.getActionCard('create-graph-image');
        this.createGraphActionCard.registerArgumentAutocompleteListener('device', this.autocompleteListener.bind(this));
        this.createGraphActionCard.registerRunListener(this.runListener.bind(this));
    }
    async runListener(args, stats) {
        // Get logs
        const logs = await this.insightsManager.getLogEntries({ id: args.device.id, uri: args.device.uri, resolution: args.resolution });
        const logNormaliser = new LogNormaliser_1.default(logs, args.resolution);
        const values = logNormaliser.getNormalisedLogs();
        // Generate images
        // @ts-ignore
        const chart = new chart_js_image_1.default().chart({
            type: args.type,
            data: {
                labels: values.map((log) => log.t),
                datasets: [
                    {
                        label: `${args.device.name} - ${args.resolution}`,
                        data: values.map((log) => log.v),
                        borderColor: args.lineColor,
                        backgroundColor: `#${this.addAlpha(args.lineColor.replace('#', ''), 0.2)}`,
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{
                            ticks: {
                                beginAtZero: false
                            }
                        }]
                },
            }
        }).backgroundColor(args.darkMode ? '#1f2029' : '#ffffff');
        const image = await this.homey.images.createImage();
        image.setUrl(chart.toURL());
        return {
            graph: image,
        };
    }
    addAlpha(color, opacity) {
        // coerce values so ti is between 0 and 1.
        const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
        return color + _opacity.toString(16).toUpperCase();
    }
    async autocompleteListener(query, args) {
        const devices = await this.deviceManager.getDevices();
        const logs = await this.insightsManager.getLogs();
        const results = Object.keys(logs).map((key) => {
            let description = logs[key].id.replace('homey:device:', '').replace('homey:manager:apps:', '');
            Object.keys(devices).forEach((id) => {
                if (description.includes(id)) {
                    description = description.replace(id, devices[id]?.name ?? 'unknown');
                }
            });
            // @ts-ignore
            const title = logs[key].title;
            return {
                name: title,
                description: description.replaceAll(':', ' - '),
                id: logs[key].id,
                uri: logs[key].uri,
            };
        });
        return results.filter((result) => result.name.toLowerCase().includes(query.toLowerCase()));
    }
}
module.exports = InsightGraphs;
