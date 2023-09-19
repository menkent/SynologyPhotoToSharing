import { AuthApiDataResponse, AuthApiRequest } from "../../types";
import { BaseApiService } from "../base.service";


export class AuthService extends BaseApiService<AuthApiRequest, AuthApiDataResponse> {
    url = 'webapi/auth.cgi'
    api = 'SYNO.API.Auth';
    method = 'login';
    additionalData = {
        session: 'webui',
        rememberme: '1',
        enable_device_token: 'no',
    };

    async send(req: AuthApiRequest): Promise<AuthApiDataResponse> {
        const result = await this.get(req);

        this.infoService.setSid(result.sid);
        this.infoService.setDeviceId(result.device_id);

        return result;
    }
}
