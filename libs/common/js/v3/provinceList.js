var PROVINCES = CACHE.get("PL", false);

window.top.document.addEventListener("PL.loaded", function(){
	PROVINCES = CACHE.get("PL", []);
}, false);

if(!PROVINCES){
	if(window.self == window.top){
		ajax("provinzen.php", null, function(text){
			text = text.replace(/<script[\s\S]*\/script>/g, "");
			doc = new DOMParser().parseFromString(text, 'text/html');
			
      let container = [];
			let links = DOM.byTag("a", doc);
			let pattern = /provinz=(\d+\/\d+)/;
			for(let i = 0; i < links.length; i++){
				let result = pattern.exec(links[i].href);
				if(result != null){
					let label = links[i].innerText;
					container.push({c:result[1], n:label.substring(0, label.lastIndexOf('(')).trim()});
				}
			}
			CACHE.set("PL", container);
			window.eval(String.format('window.PROVINCES = JSON.parse("{}")', JSON.stringify(container)));
			window.top.document.dispatchEvent(new Event("PL.loaded"));
		});
	}
}