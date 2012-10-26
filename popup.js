
var moved = false;
var onclose = false;
var icons = {};

function getSepIndex() {
	var array = $("#tabs").find("li");

	for(var i = 0;i < array.length;i++) {
		if(array[i].id == "newTab") {
			return i;
		}
	}
	return -1;
}

function moveTab(tabId, tabIndex, pinned) {
	chrome.tabs.update(tabId,{pinned: pinned});
	chrome.tabs.move(tabId,{index: tabIndex});	
}

function createTabElem(tab) {
	var iconUrl = "";
	if(!tab.url.match(/^chrome-extension:\/\//)) {
		iconUrl = tab.favIconUrl;
	} else {
		var tmp = tab.url.substring(19);
		var extId = tmp.substring(0, tmp.indexOf("/"));

		iconUrl = icons[extId];
	}

	var title = $("<span>")
		.attr("class", "title")
		.text(tab.title);

	var close = $("<div>")
		.attr("src", "close.png")
		.attr("class", "close")
		.css("display", "none")
		.hover(function () {
			onclose = true;
		}, function () {
			onclose = false;
		})
		.click(function() {
			var selected = $(this).parent().attr("id") == "selected";
			var tabId = eval($(this).parent().attr("tabid"));
			
			chrome.tabs.remove(tabId,function () {
			});
			onclose = false;
			
			$(this).parent().remove();
		});
	
	var tabElem = $("<li>")
		.attr("class", "tab")
		.attr("id", tab.selected ? "selected" : "")
		.attr("tabId", tab.id)
		.append($("<img>")
				.attr("src", iconUrl)
				.attr("class", "icon")
				.attr("width", 16)
				.attr("height", 16))
		.append(title)
		.append(close)
		.click(function() {
			if(!moved && !onclose) {
				chrome.tabs.update(eval($(this).attr("tabId")), {selected: true});
			}})
		.hover(function() {
			$(this).find(".close")
				.css("display", "inline");
			$(this).find(".title")
				.css("width", "276px");
		}, function() {
			$(".close")
				.css("display", "none");
			$(".title")
				.css("width", "290px");
		});
	
	return tabElem;
}

chrome.management.getAll(function(extInfos) {
	for(var i = 0;i < extInfos.length;i++) {
		if(extInfos[i].isApp) {
			icons[extInfos[i].id] = extInfos[i].icons[0].url;
		}
	}
	
	chrome.tabs.getAllInWindow(null, function(tabs) {
		$("#tabs").sortable({
			start: function(event, ui) {
				moved = true;
			},
			update: function(event, ui) {
				var tabId = eval(ui.item.attr("tabid"));
				var tabIndex = ui.item.index();
				var sepIndex = getSepIndex();

				if(tabIndex < sepIndex) {
					moveTab(tabId, tabIndex, true);
				} else {
					tabIndex -= 1;
					moveTab(tabId, tabIndex, false);
				}

			},
			stop: function() {
				moved = false;
			},
			opacity: 0.5,
			cancel: "#newTab",
			placeholder: "placeholder",
			scroll: false,
			axis: "y",
			revert: 50,
			dropOnEmpty: true,
			tolerance: "pointer"
		});

		var newTab = $("<li>")
			.attr("class", "separator")
			.attr("id", "newTab")
			.append($("<div>")
					.attr("id", "plus"))
			.append($("<span>")
					.attr("class", "title")
					.append("New Tab"))
			.click(function() {
				chrome.tabs.create({
					selected: false,
					url: "chrome://newtab",
					index: 0
				}, function(tab) {
					var tabElem = createTabElem(tab);
					$("#newTab").after(tabElem);
				});
			})
			.hover(function() {
				$("#plus").css("background-position", "-16px 0px");
			}, function() {
				$("#plus").css("background-position", "0px 0px");
			});
		
		var pinned = true;
		for(var i = 0;i < tabs.length;i++) {
			if(tabs[i].pinned == false) {
				if(pinned) {
					$("#tabs").append(newTab);
				}
				pinned = false;
			}

			var tabElem = createTabElem(tabs[i]);
			$("#tabs").append(tabElem);
		}
		if(pinned) {
			$("#tabs").append(newTab);
		}
	});
});

chrome.tabs.onRemoved.addListener(
	function () {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			var selectedTabId = 0;
			for(var i = 0;i < tabs.length;i++) {
				if(tabs[i].selected) {
					selectedTabId = tabs[i].id;
					break;
				}
			}
			
			var chr = $("#tabs").children();
			for(var i = 0;i < chr.length;i++) {
				if(eval($(chr[i]).attr("tabid")) == selectedTabId) {
					$(chr[i]).attr("id", "selected");
					break;
				}
			}
		});
	});
