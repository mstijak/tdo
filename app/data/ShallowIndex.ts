import {shallowEquals} from "cx/util";

interface HasId {
    id: string;
}

export class ShallowIndex<T extends HasId> {

    data: { [key: string]: T } = {};

    index(item: T): boolean {
        let existing = this.data[item.id];

        if (item === existing)
            return false;

        if (existing && shallowEquals(item, existing))
            return false;

        this.data[item.id] = item;
        return true;
    }

    load(items: T[]) {
      items.forEach(item => {
        this.data[item.id] = item;
      })
    }

    remove(item: T) {
        let existing = this.data[item.id];
        if (!existing)
            return false;
        delete this.data[item.id];
        return true;
    }

    get(id: string): T {
        return this.data[id];
    }

    values(): T[] {
        return Object.values(this.data);
    }

    filter(condition) {
        return Object.values(this.data).filter(condition);
    }
}