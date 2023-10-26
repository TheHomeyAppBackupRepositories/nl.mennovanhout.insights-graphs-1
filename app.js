"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const homey_api_1 = require("homey-api");
const LogNormaliser_1 = __importDefault(require("./src/LogNormaliser"));
const chartjs_to_image_1 = __importDefault(require("chartjs-to-image"));
const Utils_1 = require("./src/Utils");
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
        // @ts-ignore
        this.imageManager = this.homeyApi.images;
        this.createGraphActionCard = this.homey.flow.getActionCard('create-graph-image');
        this.createGraphActionCard.registerArgumentAutocompleteListener('device', this.autocompleteListener.bind(this));
        this.createGraphActionCard.registerRunListener(this.runListenerCreateGraph.bind(this));
    }
    async runListenerCreateGraph(args, stats) {
        let filename = args.filename ?? 'temp.png';
        if (filename.endsWith('.png')) {
            filename = filename + '.png';
        }
        // Get logs
        const logs = await this.insightsManager.getLogEntries({ id: args.device.id, uri: args.device.uri, resolution: args.resolution });
        const logNormaliser = new LogNormaliser_1.default(logs, args.resolution, this.homey.clock.getTimezone());
        const values = logNormaliser.getNormalisedLogs();
        // Generate images
        const chart = new chartjs_to_image_1.default();
        chart.setConfig({
            type: args.type,
            data: {
                labels: values.map((log) => log.t),
                datasets: [{
                        label: `${args.device.name} - ${args.resolution}`,
                        data: values.map((log) => log.v),
                        borderColor: args.lineColor,
                        backgroundColor: `#${this.addAlpha(args.lineColor.replace('#', ''), 0.5)}`,
                        fill: true,
                        // cubicInterpolationMode: 'monotone',
                        borderWidth: 2,
                        lineTension: 0.4,
                        pointRadius: 0
                    }]
            },
            options: {
                layout: {
                    padding: {
                        left: 10,
                        right: 30,
                        top: 20,
                        bottom: 10
                    }
                },
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                            ticks: {
                            // autoSkip: true,
                            // maxTicksLimit: 6,
                            // maxRotation: 0
                            },
                            gridLines: {
                                display: false
                            }
                        }],
                    yAxes: [{
                            ticks: {
                                // autoSkip: true,
                                // maxTicksLimit: 6,
                                beginAtZero: false,
                            },
                            scaleLabel: {
                                display: true,
                                labelString: `${args.device.name}`,
                            },
                            gridLines: {
                                display: true,
                                borderDash: [4, 4],
                                color: 'rgba(127,127,127,0.2)'
                            }
                        }]
                }
            }
        })
            .setWidth(500)
            .setHeight(300)
            .setBackgroundColor((0, Utils_1.backgroundColor)(args.darkModeType))
            .setDevicePixelRatio('3.0');
        await chart.toFile(`/userdata/${filename}`);
        // try to update image
        const imageId = this.homey.settings.get(filename);
        const realImage = await this.getImage(imageId);
        if (realImage) {
            await realImage.update();
            return {
                graph: realImage,
            };
        }
        // Create image
        const image = await this.homey.images.createImage();
        image.setPath(`/userdata/${filename}`);
        this.homey.settings.set(filename, image.id);
        return {
            graph: image,
        };
    }
    async getImage(imageId) {
        let realImage;
        if (!imageId) {
            return undefined;
        }
        try {
            realImage = await this.homey.images.getImage(imageId);
        }
        catch (error) {
            realImage = undefined;
        }
        return realImage;
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
