import { FSRenameRequest, FSRenameResponse } from "../../types";
import { BaseApiService } from "../base.service";

export class RenameFSService extends BaseApiService<FSRenameRequest, FSRenameResponse> {
    api = 'SYNO.FileStation.Rename';
    method = 'rename';

    async send(path: string, name: string): Promise<FSRenameResponse> {
        return this.get({ path, name });
    }
}
