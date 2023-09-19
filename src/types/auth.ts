import { BaseApiResponse } from "./base"

export interface AuthApiDataResponse {
    did: string;
    sid: string;
    device_id: string;
}

export interface AuthApiRequest {
    account: string;
    passwd: string;
}

export interface LogoutResponse {

}
