export interface List {
    id: string;
    name: string;
    createdDate: string;
    deleted: boolean;
    deletedDate?: string;
    order: number;
    lastChangeDate?: string;
    edit?: boolean,
    boardId: string
}
