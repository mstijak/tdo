import {Toast} from "cx/widgets";

export function toast(options) {
    Toast
        .create({
            timeout: 3000,
            ...options,
        })
        .open();
}

export function showErrorToast(err) {
    toast({
        message: String(err),
        mod: 'error'
    })
}