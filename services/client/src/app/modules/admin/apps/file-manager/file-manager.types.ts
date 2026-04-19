export interface Items {
    folders: Item[];
    files: Item[];
    path: Item[];
}

export interface Item {
    id?: string;
    // null = root (no parent folder); string = parent folder id
    folderId?: string | null;
    name?: string;
    createdBy?: string;
    createdAt?: string;
    modifiedAt?: string;
    size?: string;
    type?: string;
    contents?: string | null;
    description?: string | null;
}
