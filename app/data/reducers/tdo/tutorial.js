import uid from "uid";

export function getTutorial() {

    const createdDate = new Date().toISOString();

    var board = {
        id: uid(),
        name: 'Tutorial',
        createdDate
    };

    var formatting = {
        id: uid(),
        boardId: board.id,
        name: 'Formatting',
        headerStyle: 'color: lightgreen',
        createdDate
    };

    var keyboard = {
        id: uid(),
        boardId: board.id,
        name: 'Keyboard',
        headerStyle: 'color: lightblue',
        createdDate
    };

    var general = {
        id: uid(),
        boardId: board.id,
        name: 'General',
        headerStyle: 'color: white',
        createdDate
    };

    var tasks = [{
        id: uid(),
        listId: formatting.id,
        name: `Use Markdown to make some text **bold** or *italic*`,
        createdDate
    }, {
        id: uid(),
        listId: formatting.id,
        name: `You can also use other Markdown features such as [links](https://github.com/mstijak/tdo) or lists.
        
* Item 1
* Item 2
* Item 3
`,
        createdDate
    }, {
        id: uid(),
        listId: formatting.id,
        name: `You can customize task highlighting in Settings. #idea`,
        createdDate
    }, {
        id: uid(),
        listId: formatting.id,
        name: `Add some custom CSS and override background or text color of the whole application. #idea
        
Hint: \`body \{ color: lightblue \}\``,
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Press ? to get Help. !important',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Use arrow keys to navigate lists and tasks',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Hit `Enter` to edit the selected task',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Hit `Space` to mark the task deleted',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Press the `Insert` key to insert a new task at cursor position',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Press the `Delete` key to delete the selected task',
        createdDate
    }, {
        id: uid(),
        listId: keyboard.id,
        name: 'Use `Ctrl` + `Up/Down/Left/Right` arrow keys to move the selected task around',
        createdDate
    }, {
        id: uid(),
        listId: general.id,
        name: 'Double click on the list header to edit the list',
        createdDate
    }, {
        id: uid(),
        listId: general.id,
        name: 'Double click on a task to edit it',
        createdDate
    }, {
        id: uid(),
        listId: general.id,
        name: 'Hit Add Board (on the top) and enjoy **`tdo`**!',
        createdDate
    }, ];


    return {
        boards: [board],
        lists: [keyboard, formatting, general],
        tasks: tasks
    }
}
