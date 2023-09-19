export interface AlbumCopySettings {
    id: number;
    shared_folder: string;
}

export interface Settings {
    host: string;
    accounts: Array<{
        login: string;
        password: string;
        albums: Array<AlbumCopySettings>,
    }>;
}