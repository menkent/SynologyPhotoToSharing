import { CopyMoveFSResponse, CopyMoveFSRequest } from "../../types";
import { BaseApiService } from "../base.service";

export class CopyMoveFSService extends BaseApiService<CopyMoveFSRequest, CopyMoveFSResponse> {
    api = 'SYNO.FileStation.CopyMove';
    method = 'start';

    async send(path: string, dest_folder_path: string): Promise<CopyMoveFSResponse> {
        const search_taskid = `searchTaskId_${new Date().getTime()}`

        return this.get({
            path,
            dest_folder_path,
            overwrite: false,
            remove_src: false,
            accurate_progress: false,
            search_taskid,
        });
    }
}
