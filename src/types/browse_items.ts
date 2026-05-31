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

export interface BrowseItemsRequest {
    offset: number;
    limit: number;
    type?: FileType;
}

export interface AlbumsBrowseItemsRequest extends BrowseItemsRequest {
    passphrase: string;
}

export interface PersonItemsRequest extends BrowseItemsRequest {
    person_id: number;
}

export interface LabelItemsRequest extends BrowseItemsRequest {
    general_tag_id: number;
}