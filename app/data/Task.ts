export interface Task {
    id: string;
    name?: string;
    createdDate: string;
    deleted?: boolean;
    deletedDate?: string;
    completed?: boolean;
    completedDate?: string;
    order: number;
    listId: string;
}
