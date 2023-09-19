export type FileType = 'photo' | 'video' | 'live';

export interface Thumbnail {
    unit_id: number;
    cache_key: string;
}

export interface AlbumItem {
    id: number;
    folder_id: number;
    filename: string;
    type: FileType;
    indexed_time: number;
    additional: {
        thumbnail: Thumbnail;
    }
}

export interface AlbumsBrowseItemsResponse {
    list: Array<AlbumItem>;
}

export interface AlbumsBrowseItemsRequest {
    offset: number;
    limit: number;
    type?: FileType;
    passphrase: string;
}