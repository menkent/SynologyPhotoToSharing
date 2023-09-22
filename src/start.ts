import { readFile, writeFileSync } from "fs";
import { ApiInfoService } from "./services/auth/api-info.service";
import { AuthService } from "./services/auth/auth.service";
import { AlbumItemDownloadService } from "./services/photo/album-item-download.service";
import { AlbumItemsListService } from "./services/photo/album-item-list.service";
import { ConditionalAlbumListService } from "./services/photo/conditional-album-list.service";
import { BrowseFolderService } from "./services/photo/browse-folder.service";
import { customDelay, destPath, logger, savedDataIndex, sourcePath, updateSavedData } from "./helpers";
import { CopyMoveFSService } from "./services/file-station/copy-move.service";
import { LogoutService } from "./services/auth/logout.service";
import { AlbumCopySettings, Settings } from "./types/settings";
import { CopyMoveStatusFSService } from "./services/file-station/copy-move-waiting.service";
import { FSCreateFolderService } from "./services/file-station/create-folder.service";

const FILES_COUNT_IN_PACKAGE = 10;

// {album_id: list of files }, who has been copied to shared
let DATA: Record<string, string[]> = {};
let PhotoAdded = 0;
const MaxAvailablePhotos: number = Number(process.env.MAX_PHOTO_COPIED) || 10;

interface AllServices {
    apiInfoService: ApiInfoService
    authService: AuthService;
    conditionalAlbumListService: ConditionalAlbumListService;
    albumItemsListService: AlbumItemsListService;
    itemDownloadService: AlbumItemDownloadService;
    browseFolderService: BrowseFolderService;
    copyMoveFSService: CopyMoveFSService;
    logoutService: LogoutService;
    copyMoveStatusFSService: CopyMoveStatusFSService;
    fsCreateFolderService: FSCreateFolderService;
}

const generateServices = (apiInfoService: ApiInfoService): AllServices => ({
    apiInfoService,
    authService: new AuthService(apiInfoService),
    conditionalAlbumListService: new ConditionalAlbumListService(apiInfoService),
    albumItemsListService: new AlbumItemsListService(apiInfoService),
    itemDownloadService: new AlbumItemDownloadService(apiInfoService),
    browseFolderService: new BrowseFolderService(apiInfoService),
    copyMoveFSService: new CopyMoveFSService(apiInfoService),
    logoutService: new LogoutService(apiInfoService),
    copyMoveStatusFSService: new CopyMoveStatusFSService(apiInfoService),
    fsCreateFolderService: new FSCreateFolderService(apiInfoService),
});

const handleAlbum = async (username: string, id: number, shared_folder: string, passphrase: string, services: AllServices) => {
    const items = await services.albumItemsListService.getItems(passphrase);
    const dest = destPath(shared_folder, username);
    const dataIndex = savedDataIndex(id, shared_folder);
    const itemsSaved: string[] = DATA[dataIndex] || [];
    let paths = [];
    let names = [];
    let countOfCopiedPhoto = 0;

    const createFolderResult = await services.fsCreateFolderService.send(destPath(shared_folder, ''), username);

    if (!createFolderResult?.folders?.[0].isdir) {
        throw 'Folder not created::' + dest;
    }

    const filtratedItems = items.filter(({filename}) => !itemsSaved.includes(filename));

    for (const [index, item] of filtratedItems.entries()) {
        const folder = await services.browseFolderService.send(item.folder_id);
        const fullSourcePath = sourcePath({username, folder: folder.name, filename: item.filename});

        paths.push(fullSourcePath);
        names.push(item.filename);

        if (paths.length >= FILES_COUNT_IN_PACKAGE || index >= (items.length - 1)) {
            const copyObj = await services.copyMoveFSService.send(JSON.stringify(paths), dest);

            await services.copyMoveStatusFSService.send(copyObj.taskid);
            DATA = updateSavedData(DATA, dataIndex, names);
            countOfCopiedPhoto += names.length;
            PhotoAdded += names.length;
            paths = [];
            names = [];
        }

        if (MaxAvailablePhotos && MaxAvailablePhotos <= PhotoAdded) {
            break;
        }
    }

    logger(`[${username}]: ${countOfCopiedPhoto} was added from album: ${id} / ${items.length}`);
}

const handleAccount = async (login: string, passwd: string, albums: Array<AlbumCopySettings>, apiInfoService: ApiInfoService) => {
    const services = generateServices(apiInfoService);

    await services.authService.send({account: login, passwd});

    const allUserAlbums = (await services.conditionalAlbumListService.send(0, 100))?.list || [];
    const albumsIds = albums.map(({id}) => id);
    const albumsIdToSharedFolder = albums.reduce((acc, el) => ({...acc, [el.id]: el.shared_folder}), {}) as Record<number, string>;
    const filtratedUserAlbums = allUserAlbums.filter(({id}) => albumsIds.includes(id));

    for (const albumElemet of filtratedUserAlbums) {
        await handleAlbum(login, albumElemet.id, albumsIdToSharedFolder[albumElemet.id], albumElemet.passphrase, services);
    }

    await services.logoutService.send();
}

async function main(settings: Settings) {
    logger('START');
    const apiInfoService = new ApiInfoService(settings);
    await apiInfoService.init();

    for (const account of settings.accounts) {
        await handleAccount(account.login, account.password, account.albums, apiInfoService);
        await customDelay(1000);
    }
}

const settingPath = process.env.config || './settings.local.json';
const dataPath = process.env.data || './data.local.json';

readFile(settingPath, async (err, data) => {
    if (err) {
        throw err;
    }
    const settings = JSON.parse(data as any) as Settings;

    readFile(dataPath, async (err, data) => {
        if (data) {
            DATA = JSON.parse(data as any) as Record<string, string[]>;
        }

        try {
            PhotoAdded = 0;
            await main(settings);
        } catch (e) {
            logger('ERROR::', e);
        } finally {
            if (PhotoAdded > 0) {
                writeFileSync(dataPath, JSON.stringify(DATA));
                logger(`DATA updated: ${PhotoAdded} was added`);
            } else {
                logger('DATA not updated');
            }
            
        }
    })
});
