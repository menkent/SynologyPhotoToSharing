import { AlbumItem, AlbumsBrowseItemsResponse, LabelItemsRequest } from "../../types";
import { BasePhotoService } from "./base-photo.service";

const DEFAULT_LIMIT = 100;

export class LabelItemsListService extends BasePhotoService<LabelItemsRequest, AlbumsBrowseItemsResponse> {
    url = 'photo/webapi/entry.cgi';
    api = 'SYNO.Foto.Browse.Item';
    method = 'list';

    generateUrl(isPost = false): string {
        return `${this.host}/${this.url}/${this.api}?additional=["thumbnail"]`;
    }

    async send(generalTagId: number, offset = 0, limit = DEFAULT_LIMIT): Promise<AlbumsBrowseItemsResponse> {
        return this.get({
            offset,
            limit,
            general_tag_id: generalTagId,
        });
    }

    async getItems(generalTagId: number): Promise<Array<AlbumItem>> {
        if (!generalTagId) {
            throw 'ERROR: general_tag_id is empty!';
        }

        let offset = 0;
        let returnedCount = 0;
        let result: Array<AlbumItem> = [];

        do {
            const list = (await this.send(generalTagId, offset, DEFAULT_LIMIT))?.list || [];

            result = result.concat(list);
            returnedCount = list.length;
            offset += list.length;
        } while (returnedCount === DEFAULT_LIMIT);

        return result.sort((a, b) => b.indexed_time - a.indexed_time);
    }
}
