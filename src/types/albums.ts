export interface AlbumBrowseResult {
    id: number;
    shared: boolean;
    type: 'conditional';
    name: string;
    passphrase: string;
    version: number;
}

export interface AlbumsBrowseResponse {
    list: Array<AlbumBrowseResult>;
}

export interface AlbumsBrowseRequest {
    offset: number;
    limit: number;
}