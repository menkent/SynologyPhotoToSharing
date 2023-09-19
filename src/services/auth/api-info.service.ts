import { ApiInfoData } from "../../types";
import { Settings } from "../../types/settings";
import { BaseApiService } from "../base.service";


export class ApiInfoService extends BaseApiService<object, ApiInfoData> {
    api = 'SYNO.API.Info';
    version = '1';
    method = 'query';
    apiInfoData: ApiInfoData = {};
    sid: string = '';
    deviceId: string = '';
    settings: Settings = { host: '', accounts: [] };

    constructor(settings: Settings) {
        super({} as any, settings.host);
        this.settings = settings;
        this.infoService = this;
    }

    async init(): Promise<ApiInfoData> {
        const apiInfoData = await this.get({});

        this.setApiDataInfo(apiInfoData);

        return apiInfoData;
    }

    getVersionMax(api: string): number {
        return this.apiInfoData[api]?.maxVersion || 1;
    }

    setApiDataInfo(apiInfoData: ApiInfoData) {
        this.apiInfoData = apiInfoData;
    }

    getSid(): string {
        return this.sid;
    }

    getDeviceId(): string {
        return this.deviceId;
    }

    setSid(sid: string) {
        this.sid = sid;
    }

    setDeviceId(deviceId: string) {
        this.deviceId = deviceId;
    }
}
