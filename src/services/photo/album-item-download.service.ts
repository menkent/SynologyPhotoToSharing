import axios from "axios";
import { AlbumItem, AlbumsBrowseItemsRequest, AlbumsBrowseItemsResponse, FileType, Thumbnail } from "../../types";
import { BaseApiService } from "../base.service";
import { BasePhotoService } from "./base-photo.service";

// https://<IP_ADDRESS>/photo/webapi/entry.cgi?cache_key="40808_1633659236"&unit_id=[40808]&api="SYNO.FotoTeam.Download"&method="download"&version=1

export class AlbumItemDownloadService extends BaseApiService<any, any> {
    url = 'photo/webapi/entry.cgi';
    api = 'SYNO.Foto.Download';
    method = 'download';
    unit_id = 0;
    cache_key = '';

    generateUrl(): string {
        return `${this.host}/${this.url}?api=${this.api}&cache_key=${this.cache_key}&unit_id=[${this.unit_id}]&_sid=${this.getSid()}&method=${this.method}&version=1`;
    }

    async send({unit_id, cache_key}: Thumbnail): Promise<any> {
        this.unit_id = unit_id;
        this.cache_key = cache_key;
        return this.get({});
    }

    async get(req: any): Promise<any> {
        const {url, options} = this.generateRequestData(req);
        const response = await axios.get<any>(url, options);

        return response.data;
    }
}
