try{
	chrome.contextMenus.create({
		'id': 'launch_tdo_on_tab',
		'title': 'Launch on Tab',
		'contexts': ['browser_action'],
	});
	
	chrome.contextMenus.onClicked.addListener(function(info, tab){
		console.log(info);
		switch(info.menuItemId){
			case 'launch_tdo_on_tab':
				chrome.tabs.create({ url: 'index.html', active: true });
				break;
		}
	});
}catch(_err){
	console.error(_err);
}
