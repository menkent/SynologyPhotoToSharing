export interface AlbumCopySettings {
    id: number;
    shared_folder: string;
}

export interface PersonCopySettings {
    person_id: number;
    shared_folder: string;
}

export interface Settings {
    host: string;
    accounts: Array<{
        login: string;
        password: string;
        albums?: Array<AlbumCopySettings>,
        persons?: Array<PersonCopySettings>,
    }>;
}