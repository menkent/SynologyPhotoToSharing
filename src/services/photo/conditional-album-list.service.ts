import { AlbumsBrowseRequest, AlbumsBrowseResponse } from "../../types";
import { BasePhotoService } from "./base-photo.service";


export class ConditionalAlbumListService extends BasePhotoService<AlbumsBrowseRequest, AlbumsBrowseResponse> {
    url = 'photo/webapi/entry.cgi';
    api = 'SYNO.Foto.Browse.ConditionAlbum';
    method = 'list';
    additionalData = {};

    async send(offset = 0, limit = 0): Promise<AlbumsBrowseResponse> {
        return this.get({offset, limit});
    }
}
