import axios, { AxiosHeaderValue, AxiosHeaders, AxiosResponse } from "axios";
import * as https from "https";
import { ApiInfoData, BaseApiResponse } from "../types";
import { ApiInfoService } from "./auth/api-info.service";

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});


export class BaseApiService<TRequest, TResponse> {
    host: string = '';
    url: string = 'webapi/entry.cgi';
    api: string = '';
    method: string = '';
    additionalData: Record<string, string | string[]> = {};
    infoService: ApiInfoService;

    constructor(infoService: ApiInfoService, host?: string) {
        this.infoService = infoService;
        this.host = host || this.infoService.settings.host;
    }

    generateUrl(isPost = false): string {
        return `${this.host}/${this.url}?api=${this.api}`;
    }

    generateHeaders(): AxiosHeaders {
        return new AxiosHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Cookie': `_SSID=${this.getSid()};did=${this.getDid()}`,
        })
    }

    generateRequestData(req: TRequest, isPost = false): { url: string, params: Record<string, any>, options:  Record<string, any>} {
        const url = this.generateUrl();
        const version = this.infoService.getVersionMax(this.api);
        const params = {
            api: this.api,
            version,
            method: this.method,
            _sid: this.getSid(),
            ...this.additionalData,
            ...req
        };
        const options = {
            httpsAgent, 
            headers: this.generateHeaders(),
        };

        return {url, params, options}
    }

    errorHandling(response: AxiosResponse<BaseApiResponse<TResponse>>) {
        if (!response.data?.success) {
            console.log('ERROR:', response.config.url, response.data);
            console.log('Response Info Params:', response.config);
        }
    }

    async post(req: TRequest): Promise<TResponse> {
        const {url, params, options} = this.generateRequestData(req, true);
        const response = await axios.post<BaseApiResponse<TResponse>>(url, params, options);

        this.errorHandling(response);

        return response.data.data;
    }

    async get(req: TRequest): Promise<TResponse> {
        const {url, params, options} = this.generateRequestData(req);
        const response = await axios.get<BaseApiResponse<TResponse>>(url, {
            ...options,
            params,
        });

        this.errorHandling(response);

        return response.data.data;
    }


    getSid(): string {
        return this.infoService.getSid();
    }

    getDid(): string {
        return this.infoService.getDeviceId();
    }
}
