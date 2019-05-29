import thumbUrl from "./Tutorial.png";

export default {
    name: 'Tutorial',
    description: 'A demo board that teaches you how to use the app.',
    thumbUrl,
    board: {
        name: 'Tutorial',
        lists: [{
            name: 'Keyboard',
            headerStyle: 'color: lightblue',
            tasks: [{
                name: 'Press ? to get Help. !important',
            }, {
                name: 'Use arrow keys to navigate lists and tasks',
            }, {
                name: 'Hit `Enter` to edit the selected task',
            }, {
                name: 'Hit `Space` to mark the task deleted',
            }, {
                name: 'Press the `Insert` key to insert a new task at cursor position',
            }, {
                name: 'Use `Ctrl` + `Up/Down/Left/Right` arrow keys to move the selected task around',
            }]
        }, {
            name: 'Formatting',
            headerStyle: 'color: lightgreen',
            tasks: [{
                name: `Use Markdown to make some text **bold** or *italic*`,
            }, {
                name: `You can also use other Markdown features such as [links](https://github.com/mstijak/tdo) or lists.`
            }, {
                name: `You can customize task highlighting in Settings. #idea`,
            }, {
                name: `Add some custom CSS and override background or text color of the whole application. #idea
        
Hint: \`body \{ color: lightblue \}\``
            }]
        }, {
            name: 'General',
            headerStyle: 'color: white',
            tasks: [{
                name: 'Double click on the list header to edit the list',
            }, {
                name: 'Double click on a task to edit it',
            }, {
                name: 'Hit Add Board (on the top) and enjoy **`tdo`**!',
            }]
        }]
    }
}
