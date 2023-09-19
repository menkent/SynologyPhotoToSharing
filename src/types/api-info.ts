import { BaseApiResponse } from "./base"

export type ApiInfoData = Record<string, {
    maxVersion: number;
    minVersion: number;
    path: string;
}>;
