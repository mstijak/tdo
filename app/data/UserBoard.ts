export interface UserBoard {
    id: string;
    name?: string;
    createdDate: string;
    deleted?: boolean;
    deletedDate?: string;
    order: number;
}
