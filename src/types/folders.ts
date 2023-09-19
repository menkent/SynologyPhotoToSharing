
export interface Folder {
    id: number;
    name: string;
    passphrase: string;
}

export interface FolderBrowseResponse {
    folder: Folder;
}

export interface FolderBrowseRequest {
    id: number;
}
