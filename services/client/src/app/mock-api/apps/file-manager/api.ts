import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api/mock-api.service';
import { items as itemsData } from 'app/mock-api/apps/file-manager/data';
import { Item } from 'app/modules/admin/apps/file-manager/file-manager.types';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class FileManagerMockApi {
    private _items: Item[] = itemsData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Items - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/file-manager')
            .reply(({ request }) => {
                // Clone the items
                let items = cloneDeep(this._items);

                // HttpParams.get() returns null when the param is absent,
                // which is exactly what root items have for folderId.
                const folderId = request.params.get('folderId');

                items = items.filter((item) => item.folderId === folderId);

                // Separate the items by folders and files
                const folders = items.filter((item) => item.type === 'folder');
                const files = items.filter((item) => item.type !== 'folder');

                // Sort the folders and files alphabetically by filename
                folders.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
                files.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

                // Figure out the path and attach it to the response
                const pathItems: Item[] = cloneDeep(this._items);
                const path: Item[] = [];
                let currentFolder: Item | undefined;

                // Get the current folder and add it as the first entry
                if (folderId) {
                    currentFolder = pathItems.find(
                        (item) => item.id === folderId
                    );
                    if (currentFolder) {
                        path.push(currentFolder);
                    }
                }

                // Start traversing and storing the folders as a path array
                // until we hit null on the folder id
                while (currentFolder?.folderId) {
                    const parentId = currentFolder.folderId;
                    currentFolder = pathItems.find(
                        (item) => item.id === parentId
                    );
                    if (currentFolder) {
                        path.unshift(currentFolder);
                    }
                }

                return [
                    200,
                    {
                        folders,
                        files,
                        path,
                    },
                ];
            });
    }
}
