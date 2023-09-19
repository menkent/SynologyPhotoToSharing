import { Folder, FolderBrowseRequest, FolderBrowseResponse } from "../../types";
import { BasePhotoService } from "./base-photo.service";


export class BrowseFolderService extends BasePhotoService<FolderBrowseRequest, FolderBrowseResponse> {
    url = 'photo/webapi/entry.cgi';
    api = 'SYNO.Foto.Browse.Folder';
    method = 'get';
    foldersById: Record<number, Folder> = {}

    async send(id: number): Promise<Folder> {
        if (this.foldersById[id]) {
            return Promise.resolve(this.foldersById[id]);
        }

        return (await this.get({id})).folder;
    }
}
