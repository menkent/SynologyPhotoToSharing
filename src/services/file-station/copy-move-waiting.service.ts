import { customDelay } from "../../helpers";
import { CopyMoveStatusFSRequest, CopyMoveStatusFSResponse } from "../../types";
import { BaseApiService } from "../base.service";

const MAX_COUNT = 5;

export class CopyMoveStatusFSService extends BaseApiService<CopyMoveStatusFSRequest, CopyMoveStatusFSResponse> {
    api = 'SYNO.FileStation.CopyMove';
    method = 'status';

    async send(taskid: string): Promise<boolean> {
        let count = 0;

        do {
            const result = await this.get({taskid});

            if (result?.finished) {
                return true;
            }

            count++;
            await customDelay(3000);
        }
        while (count < MAX_COUNT);

        return true;
    }
}
