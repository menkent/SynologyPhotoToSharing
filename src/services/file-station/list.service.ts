import { FSListRequest, FSListResponse } from "../../types";
import { BaseApiService } from "../base.service";

const DEFAULT_LIMIT = 1000;

export class ListFSService extends BaseApiService<FSListRequest, FSListResponse> {
    api = 'SYNO.FileStation.List';
    method = 'list';

    async send(folder_path: string, offset = 0, limit = DEFAULT_LIMIT): Promise<FSListResponse> {
        return this.get({ folder_path, offset, limit });
    }

    async getNames(folder_path: string): Promise<Set<string>> {
        let offset = 0;
        let returnedCount = 0;
        const names = new Set<string>();

        do {
            const files = (await this.send(folder_path, offset, DEFAULT_LIMIT))?.files || [];

            files.forEach((file) => names.add(file.name));
            returnedCount = files.length;
            offset += files.length;
        } while (returnedCount === DEFAULT_LIMIT);

        return names;
    }
}
