# CLAUDE.md

## Что это
CLI-инструмент на TypeScript (Node.js), который запускается в Docker на Synology NAS и
консолидирует фото из **личных пространств (Personal Space) нескольких аккаунтов** в общую папку
**Shared Space** (`/photo/<shared_folder>`), отбирая снимки по распознанным лицам (`person_id`) и
тегам/меткам (`general_tag_id`). Скопированные файлы попадают в заранее настроенный **conditional
album**, который шарится пользователям.

## Ключевое архитектурное ограничение (важно!)
Объединить фото из **разных аккаунтов** в один shared-альбом **без копирования файлов невозможно**:
- Альбом Synology принадлежит одному пользователю и может ссылаться только на фото, к которым у него
  есть доступ (его Personal Space + Shared Space). Чужой Personal Space недоступен.
- `person_id` / `general_tag_id` привязаны к Personal Space конкретного аккаунта.
- Поэтому единственный способ свести байты разных пользователей вместе — физически скопировать их в
  Shared Space. Это не недостаток, а вынужденное решение. Замена копирования на `NormalAlbum.add_item`
  здесь не сработает (проверено в мае 2026, решено оставить копирование как есть).

## Архитектура и поток
1. `src/start.ts` — оркестратор. Для каждого аккаунта: логин → обработка `persons` и `labels` → логаут.
2. `handlePerson` / `handleLabel` → `handleItems`: получают список элементов из Photos API, затем
   копируют каждый файл через FileStation в `/photo/<shared_folder>/<username>` и переименовывают в
   `<item.id>_<filename>` (защита от коллизий).
3. Дедуп: `data.local.json` хранит уже скопированные id (ключи `person_<id>_<folder>`,
   `label_<id>_<folder>`); `COPIED_BY_DEST` дедуплицирует в пределах одного запуска.
4. Лимит `MAX_PHOTO_COPIED` ограничивает число копий за запуск.
5. `handleAlbum` (копирование готовых альбомов по passphrase) реализован, но закомментирован в
   `handleAccount`.

## Используемые API Synology
- Auth: `SYNO.API.Auth` (login/logout), `SYNO.API.Info` (query версий).
- Photos (`photo/webapi/entry.cgi`): `SYNO.Foto.Browse.Item` (list по `person_id` /
  `general_tag_id` / `passphrase`), `SYNO.Foto.Browse.Folder` (get), `SYNO.Foto.Browse.ConditionAlbum`
  (list), `SYNO.Foto.Download`.
- FileStation (`webapi/entry.cgi`): `CopyMove` (start/status), `CreateFolder`, `Rename`, `List`.
- Доступно, но НЕ используется: `SYNO.Foto.Browse.NormalAlbum` (create/add_item/delete_item),
  `SYNO.Foto.Sharing.Passphrase` (set_shared) — это путь для no-copy альбомов в рамках одного аккаунта.

## Структура кода
- `src/services/base.service.ts` — базовый HTTP-клиент (axios, get/post, _sid, версии API).
- `src/services/auth/*` — api-info, auth, logout.
- `src/services/photo/*` — list по person/label/album, browse-folder, conditional-album, download.
- `src/services/file-station/*` — copy-move, copy-move-waiting, create-folder, list, rename.
- `src/types/*` — типы (settings, albums, items и т.д.).
- `src/helpers.ts` — построение путей (`sourcePath`, `destPath`), индексы данных, логгер.

## Конфигурация
- `settings.local.json` (шаблон: `settings.template.json`): `host`, `accounts[]` с `login`,
  `password`, и массивами `albums` (id), `persons` (`person_id`), `labels` (`general_tag_id`); у каждого
  свой `shared_folder` — папка внутри `/photo`.
- Env (см. `start.sh`): `MAX_PHOTO_COPIED`, `data` (=`data.local.json`), `config` (=`settings.local.json`).

## Сборка и запуск
- `npm run build` — webpack → `build/synology-photo-copying-tool.js`.
- `npm run start:dev` — nodemon (разработка).
- Прод: `start.sh` гоняет собранный скрипт в цикле каждые 12 часов; разворачивается через
  `docker-compose.yaml`.
