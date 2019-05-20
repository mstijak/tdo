import { FocusManager, History, registerKeyboardShortcut } from "cx/ui";

export function registerKeyboardShortcuts(store) {

    let u1 = registerKeyboardShortcut({ keyCode: 27 }, (e) => {
        if (document.activeElement.classList.contains("cxb-task"))
            return;
        e.preventDefault();
        e.stopPropagation();
        let els = document.getElementsByClassName("cxb-task");
        if (els && els.length > 0) FocusManager.focusFirst(els[0]);
    });

    let u2 = registerKeyboardShortcut({ keyCode: 191 }, (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
            return;
        e.preventDefault();
        e.stopPropagation();
        let searchEl = document.getElementById("search");
        FocusManager.focusFirst(searchEl);
    });

    //go to the previous board {
    let u3 = registerKeyboardShortcut({ keyCode: 219, ctrlKey: true }, (e) => {
        e.preventDefault();
        let { boards, $route } = store.getData();
        let boardInd = boards.findIndex(a => a.id == $route.boardId);
        if (boardInd < 1) return;
        let nextBoard = boards[boardInd - 1];
        History.pushState({}, null, `~/b/${nextBoard.id}`);
    });

    let u4 = registerKeyboardShortcut({ keyCode: 221, ctrlKey: true }, (e) => {
        e.preventDefault();
        let { boards, $route } = store.getData();
        let boardInd = boards.findIndex(a => a.id == $route.boardId);
        if (boardInd + 1 >= boards.length) return;
        let nextBoard = boards[boardInd + 1];
        History.pushState({}, null, `~/b/${nextBoard.id}`);
    });

    return () => {
        u1();
        u2();
        u3();
        u4();
    }
}
