import { readFile, writeFileSync } from "fs";
import { ApiInfoService } from "./services/auth/api-info.service";
import { AuthService } from "./services/auth/auth.service";
import { AlbumItemDownloadService } from "./services/photo/album-item-download.service";
import { AlbumItemsListService } from "./services/photo/album-item-list.service";
import { PersonItemsListService } from "./services/photo/person-item-list.service";
import { LabelItemsListService } from "./services/photo/label-item-list.service";
import { ConditionalAlbumListService } from "./services/photo/conditional-album-list.service";
import { BrowseFolderService } from "./services/photo/browse-folder.service";
import { customDelay, destPath, logger, savedDataIndex, savedPersonDataIndex, savedLabelDataIndex, sourcePath, updateSavedData } from "./helpers";
import { CopyMoveFSService } from "./services/file-station/copy-move.service";
import { LogoutService } from "./services/auth/logout.service";
import { AlbumItem } from "./types";
import { AlbumCopySettings, LabelCopySettings, PersonCopySettings, Settings } from "./types/settings";
import { CopyMoveStatusFSService } from "./services/file-station/copy-move-waiting.service";
import { FSCreateFolderService } from "./services/file-station/create-folder.service";
import { RenameFSService } from "./services/file-station/rename.service";
import { ListFSService } from "./services/file-station/list.service";

const FILES_COUNT_IN_PACKAGE = 10;

// {album_id: list of files }, who has been copied to shared
let DATA: Record<string, string[]> = {};
// per-destination set of already-copied item ids, used to dedup across sources
// (person + label) within a single run so one photo isn't copied twice into the
// same shared folder
let COPIED_BY_DEST: Record<string, Set<string>> = {};
let DataChanged = false;
let PhotoAdded = 0;
const MaxAvailablePhotos: number = Number(process.env.MAX_PHOTO_COPIED) || 10;

interface AllServices {
    apiInfoService: ApiInfoService
    authService: AuthService;
    conditionalAlbumListService: ConditionalAlbumListService;
    albumItemsListService: AlbumItemsListService;
    personItemsListService: PersonItemsListService;
    labelItemsListService: LabelItemsListService;
    itemDownloadService: AlbumItemDownloadService;
    browseFolderService: BrowseFolderService;
    copyMoveFSService: CopyMoveFSService;
    logoutService: LogoutService;
    copyMoveStatusFSService: CopyMoveStatusFSService;
    fsCreateFolderService: FSCreateFolderService;
    renameFSService: RenameFSService;
    listFSService: ListFSService;
}

const generateServices = (apiInfoService: ApiInfoService): AllServices => ({
    apiInfoService,
    authService: new AuthService(apiInfoService),
    conditionalAlbumListService: new ConditionalAlbumListService(apiInfoService),
    albumItemsListService: new AlbumItemsListService(apiInfoService),
    personItemsListService: new PersonItemsListService(apiInfoService),
    labelItemsListService: new LabelItemsListService(apiInfoService),
    itemDownloadService: new AlbumItemDownloadService(apiInfoService),
    browseFolderService: new BrowseFolderService(apiInfoService),
    copyMoveFSService: new CopyMoveFSService(apiInfoService),
    logoutService: new LogoutService(apiInfoService),
    copyMoveStatusFSService: new CopyMoveStatusFSService(apiInfoService),
    fsCreateFolderService: new FSCreateFolderService(apiInfoService),
    renameFSService: new RenameFSService(apiInfoService),
    listFSService: new ListFSService(apiInfoService),
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
        logger(`[${username}]: skip album ${id}, folder not ready (transient API error): ${dest}`);
        return;
    }

    const filtratedItems = items.filter(({filename}) => !itemsSaved.includes(filename));

    for (const [index, item] of filtratedItems.entries()) {
        const folder = await services.browseFolderService.send(item.folder_id);
        const fullSourcePath = sourcePath({username, folder: folder.name, filename: item.filename});

        paths.push(fullSourcePath);
        names.push(item.filename);

        if (paths.length >= FILES_COUNT_IN_PACKAGE || index >= (filtratedItems.length - 1)) {
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

const handleItems = async (username: string, items: Array<AlbumItem>, shared_folder: string, dataIndex: string, source: string, services: AllServices) => {
    const dest = destPath(shared_folder, username);
    const itemsSaved: string[] = DATA[dataIndex] || [];
    // ids already copied into this destination folder during this run (possibly
    // by another source, e.g. a person flow that targets the same folder) — used
    // so a photo tagged with both a label and a person isn't copied twice
    const destSet = (COPIED_BY_DEST[dest] ??= new Set<string>());
    let countOfCopiedPhoto = 0;

    const createFolderResult = await services.fsCreateFolderService.send(destPath(shared_folder, ''), username);

    if (!createFolderResult?.folders?.[0]?.isdir) {
        logger(`[${username}]: skip ${source}, folder not ready (transient API error): ${dest}`);
        return;
    }

    // dedup by item id; copy one-by-one + rename to `<id>_filename` so that
    // same-named photos from different folders don't collide in the flat dest
    const filtratedItems = items.filter((item) => !itemsSaved.includes(String(item.id)) && !destSet.has(String(item.id)));

    // list the dest only when there is new work — it is just a reconciliation
    // safety net for runs that copied but didn't persist data.local.json
    const existingNames = filtratedItems.length
        ? await services.listFSService.getNames(dest)
        : new Set<string>();

    for (const item of filtratedItems) {
        const targetName = `${item.id}_${item.filename}`;

        // already in dest from a previous (possibly interrupted) run that didn't
        // persist data.local.json — just record the id, don't copy again
        if (existingNames.has(targetName)) {
            DATA = updateSavedData(DATA, dataIndex, [String(item.id)]);
            destSet.add(String(item.id));
            DataChanged = true;
            continue;
        }

        const folder = await services.browseFolderService.send(item.folder_id);
        const fullSourcePath = sourcePath({username, folder: folder.name, filename: item.filename});

        const copyObj = await services.copyMoveFSService.send(JSON.stringify([fullSourcePath]), dest);
        await services.copyMoveStatusFSService.send(copyObj.taskid);
        await services.renameFSService.send(`${dest}/${item.filename}`, targetName);

        DATA = updateSavedData(DATA, dataIndex, [String(item.id)]);
        destSet.add(String(item.id));
        DataChanged = true;
        countOfCopiedPhoto += 1;
        PhotoAdded += 1;

        if (MaxAvailablePhotos && MaxAvailablePhotos <= PhotoAdded) {
            break;
        }
    }

    logger(`[${username}]: ${countOfCopiedPhoto} was added from ${source} / ${items.length}`);
}

const handlePerson = async (username: string, personId: number, shared_folder: string, services: AllServices) => {
    const items = await services.personItemsListService.getItems(personId);
    await handleItems(username, items, shared_folder, savedPersonDataIndex(personId, shared_folder), `person: ${personId}`, services);
}

const handleLabel = async (username: string, generalTagId: number, shared_folder: string, services: AllServices) => {
    const items = await services.labelItemsListService.getItems(generalTagId);
    await handleItems(username, items, shared_folder, savedLabelDataIndex(generalTagId, shared_folder), `label: ${generalTagId}`, services);
}

const handleAccount = async (login: string, passwd: string, albums: Array<AlbumCopySettings>, persons: Array<PersonCopySettings>, labels: Array<LabelCopySettings>, apiInfoService: ApiInfoService) => {
    const services = generateServices(apiInfoService);

    await services.authService.send({account: login, passwd});

    // if (albums?.length) {
    //     const allUserAlbums = (await services.conditionalAlbumListService.send(0, 100))?.list || [];
    //     const albumsIds = albums.map(({id}) => id);
    //     const albumsIdToSharedFolder = albums.reduce((acc, el) => ({...acc, [el.id]: el.shared_folder}), {}) as Record<number, string>;
    //     const filtratedUserAlbums = allUserAlbums.filter(({id}) => albumsIds.includes(id));
    //
    //     for (const albumElemet of filtratedUserAlbums) {
    //         await handleAlbum(login, albumElemet.id, albumsIdToSharedFolder[albumElemet.id], albumElemet.passphrase, services);
    //     }
    // }

    for (const person of (persons || [])) {
        await handlePerson(login, person.person_id, person.shared_folder, services);
    }

    for (const label of (labels || [])) {
        await handleLabel(login, label.general_tag_id, label.shared_folder, services);
    }

    await services.logoutService.send();
}

async function main(settings: Settings) {
    logger('START');
    const apiInfoService = new ApiInfoService(settings);
    await apiInfoService.init();

    for (const account of settings.accounts) {
        await handleAccount(account.login, account.password, account.albums || [], account.persons || [], account.labels || [], apiInfoService);
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
        if (data?.length) {
            DATA = JSON.parse(data as any) as Record<string, string[]>;
        }

        try {
            PhotoAdded = 0;
            DataChanged = false;
            COPIED_BY_DEST = {};
            await main(settings);
        } catch (e) {
            logger('ERROR::', e);
        } finally {
            if (DataChanged) {
                writeFileSync(dataPath, JSON.stringify(DATA));
                logger(`DATA updated: ${PhotoAdded} was added`);
            } else {
                logger('DATA not updated');
            }

        }
    })
});
