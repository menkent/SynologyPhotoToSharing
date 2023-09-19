import { FSFolderCreateRequest, FSFolderCreateResponse } from "../../types";
import { BaseApiService } from "../base.service";

export class FSCreateFolderService extends BaseApiService<FSFolderCreateRequest, FSFolderCreateResponse> {
    api = 'SYNO.FileStation.CreateFolder';
    method = 'create';

    async send(folder_path: string, name: string): Promise<FSFolderCreateResponse> {
        return this.get({
            folder_path,
            name,
            force_parent: true,
        });
    }
}
