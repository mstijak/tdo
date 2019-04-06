import {shallowEquals} from "cx/util";
import { HasId } from "./HasId";


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

    remove(id: string) {
        let existing = this.data[id];
        if (!existing)
            return false;
        delete this.data[id];
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
