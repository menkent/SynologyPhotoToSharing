# План: копирование фото/видео по label (general tag)

## Context

Сейчас инструмент умеет копировать медиа из библиотеки Synology Photos в общую
папку по `person_id` (распознавание лиц) — см. `handlePerson` в
`src/start.ts:101-153`. Нужно добавить аналогичное копирование по **label**.

«Label» в Synology Photos — это пользовательский **general tag**: при выборе по
метке в UI открывается URL вида `/photo/#/general_tag/personal_space/1`, где `1`
— это `general_tag_id`. Этот id и будет задаваться в настройках, точно так же как
сейчас задаётся `person_id`.

Ключевой факт: список элементов по тегу отдаёт тот же API, что и для person —
`SYNO.Foto.Browse.Item` / `method=list`, только вместо параметра `person_id`
передаётся `general_tag_id`. Поэтому новый поток — почти полное зеркало
существующего person-потока, новые внешние зависимости/эндпоинты не нужны.

## Изменения

### 1. `src/types/settings.ts`
Добавить интерфейс и поле `labels` в account (по аналогии с `PersonCopySettings`):
```ts
export interface LabelCopySettings {
    general_tag_id: number;
    shared_folder: string;
}
// в accounts[]:  labels?: Array<LabelCopySettings>,
```

### 2. `src/types/browse_items.ts`
Добавить тип запроса (зеркало `PersonItemsRequest`):
```ts
export interface LabelItemsRequest {
    offset: number;
    limit: number;
    type?: FileType;
    general_tag_id: number;
}
```

### 3. Новый сервис `src/services/photo/label-item-list.service.ts`
Зеркало `src/services/photo/person-item-list.service.ts`: тот же `url`/`api`/
`method` (`SYNO.Foto.Browse.Item` / `list`), `generateUrl` c `additional=["thumbnail"]`,
та же пагинация и сортировка по `indexed_time`. Отличие — параметр `general_tag_id`
вместо `person_id`.

### 4. `src/helpers.ts`
Добавить функцию индекса для data.local.json (зеркало `savedPersonDataIndex`):
```ts
export function savedLabelDataIndex(general_tag_id: number, shared_folder: string): string {
    return `label_${general_tag_id}_${shared_folder}`;
}
```

### 5. `src/start.ts`
- Импортировать `LabelItemsListService`, `LabelCopySettings`, `savedLabelDataIndex`.
- Добавить `labelItemsListService` в интерфейс `AllServices` и в `generateServices`.
- Выделить общий цикл копирования в `handleItems(username, items, shared_folder,
  dataIndex, sourceLabel, services)`. `handlePerson`/`handleLabel` — тонкие обёртки.
- В `handleAccount`: принять `labels`, после цикла persons обработать labels
  (persons первыми, labels вторыми).
- В `main` пробросить `account.labels || []`.

#### Кросс-источниковый dedup (одна папка — один раз)
Дедуп по `dest` (`dest = destPath(shared_folder, username)`):
- Модульный `let COPIED_BY_DEST: Record<string, Set<string>> = {}`, сброс рядом с `PhotoAdded = 0`.
- В `handleItems`: `const destSet = (COPIED_BY_DEST[dest] ??= new Set<string>());`
- В фильтр добавить `&& !destSet.has(String(item.id))`.
- После каждой записи id — `destSet.add(String(item.id))`.

### 6. `settings.template.json`
Добавить пример блока `labels` рядом с `persons`.

## Проверка
1. `npm run build` — компиляция без ошибок.
2. settings.local.json с реальным `general_tag_id`, запуск с `MAX_PHOTO_COPIED=2`.
3. Лог `[user]: N was added from label: <id> / <total>`, файлы `<id>_<filename>`,
   ключ `label_<id>_<shared_folder>` в data.local.json.
4. person+label в одну папку → копия одна; в разные папки → в обе.
