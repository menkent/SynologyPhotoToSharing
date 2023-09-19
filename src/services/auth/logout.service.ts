import { LogoutResponse } from "../../types";
import { BaseApiService } from "../base.service";


export class LogoutService extends BaseApiService<unknown, LogoutResponse> {
    url = 'webapi/auth.cgi'
    api = 'SYNO.API.Auth';
    method = 'logout';
    
    async send(): Promise<LogoutResponse> {
        return this.get({});
    }
}
