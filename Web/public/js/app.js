/* GAwesomeBot by Gilbert - Available under the GPL V2 License - Some rights reserved - https://github.com/GilbertGobbels/GAwesomeBot */

const GAwesomeData = {};
const GAwesomeUtil = {};
const GAwesomePaths = {};

function saveFormState() {
	try {
		$("#builder-code-box").val(cm.getDoc().getValue());
	} catch (err) {}
	initial_form_state = $('#form').serialize();
	$("#form-submit span:nth-child(2)").html("Save")
}

GAwesomeData.activity = { guildData: {} };
GAwesomeData.blog = { editor: {} };
GAwesomeData.wiki = { bookmarks: JSON.parse(localStorage.getItem("wiki-bookmarks")) || [], editor: {} };
GAwesomeData.dashboard = {};
GAwesomeUtil.dashboard = {};

GAwesomeUtil.updateHeader = () => {
	const currentNavItem = $("#nav-" + window.location.pathname.split("/")[1]);
	if(currentNavItem) {
		currentNavItem.addClass("is-tab");
	}
};

GAwesomeUtil.switchActivityLayout = type => {
	if(!type) {
		type = localStorage.getItem("servers-layout");
		if(!type) {
			localStorage.setItem("servers-layout", "grid");
			type = localStorage.getItem("servers-layout");
		}
	} else {
		localStorage.setItem("servers-layout", type);
	}
	switch(type) {
		case "grid":
			$("#grid-layout-button").addClass("is-primary");
			$("#list-layout").addClass("is-hidden");
			$("#grid-layout").removeClass("is-hidden");
			$("#list-layout-button").removeClass("is-primary");
			break;
		case "list":
			$("#list-layout-button").addClass("is-primary");
			$("#list-layout").removeClass("is-hidden");
			$("#grid-layout-button").removeClass("is-primary");
			$("#grid-layout").addClass("is-hidden");
			break;
	}
};

GAwesomeUtil.activityBanGuild = svrid => {
	if (confirm("Are you sure you want to remove this guild from the activity page? It will no longer be visible on this page.")) {
		$.post("/dashboard/servers/server-list?svrid=maintainer", { removeFromActivity: svrid }).done(() => {
			const cardContent = $(`#cardContent-${svrid}`);
			GAwesomeData.activity.guildData[svrid] = cardContent.html();
			cardContent.html(`
				<a class="has-text-centered is-4" href="javascript:GAwesomeUtil.activityUnbanGuild('${svrid}')">
    			<span class="icon">
        		<i class="fa fa-refresh"></i>
    			</span>
    			Undo ban
				</a>
			`);
			cardContent.addClass("has-text-centered");
		});
	}
};

GAwesomeUtil.activityUnbanGuild = svrid => {
	$.post("/dashboard/servers/server-list?svrid=maintainer", { unbanFromActivity: svrid }).done(() => {
		const cardContent = $(`#cardContent-${svrid}`);
		cardContent.removeClass("has-text-centered");
		cardContent.html(GAwesomeUtil.activity.guildData[svrid]);
	});
};

GAwesomeUtil.activityViewportUpdate = mq => {
	if (window.location.pathname.split("/")[1] !== "activity" && window.location.pathname.split("/")[1] !== "extensions") return;
	if (mq.matches) {
		$(".header-search-box").removeClass("is-large");
		document.getElementById("frame").style.paddingLeft = "15px";
		document.getElementById("frame").style.paddingRight = "15px";
		if (document.getElementById("search-select").value === "servers") {
			switchLayout("list");
		}
	} else {
		$(".header-search-box").addClass("is-large");
		document.getElementById("frame").style.paddingLeft = "0px";
		document.getElementById("frame").style.paddingRight = "0px";
	}
};

GAwesomeUtil.uploadContent = (uploads, type) => {
	if(uploads) {
		const reader = new FileReader();
		reader.onload = function(event) {
			GAwesomeData[type].editor.value(event.target.result);
		};
		reader.readAsText(uploads[0]);
		document.getElementById("composer-content-upload").value = null;
	}
};

GAwesomeUtil.uploadCode = uploads => {
	if(uploads) {
		const reader = new FileReader();
		reader.onload = function(event) {
			GAwesomeData.builder.getDoc().setValue(event.target.result);
		};
		reader.readAsText(uploads[0]);
		document.getElementById("builder-code-upload").value = null;
	}
};

GAwesomeUtil.downloadContent = () => {
	const blob = new Blob([document.getElementById("composer-content").value], {type: "text/markdown;charset=utf-8"});
	saveAs(blob, (document.getElementById("composer-title").value || "Untitled") + ".md");
};

GAwesomeUtil.downloadCode = () => {
	const blob = new Blob([GAwesomeData.builder.getValue()], {type: "text/markdown;charset=utf-8"});
	saveAs(blob, (document.getElementById("builder-title").value || "Untitled") + ".gabext");
};

GAwesomeUtil.searchWiki = query => {
	Turbolinks.visit("/wiki?q=" + encodeURIComponent(query));
};

GAwesomeUtil.getBookmarkLink = id => {
	return window.location.pathname.split("/").slice(-1)[0] + "#" + id;
};

GAwesomeUtil.bookmarkWikiSection = elem => {
	const link = GAwesomeUtil.getBookmarkLink(elem.parentNode.id);
	if (GAwesomeData.wiki.bookmarks.indexOf(link) > -1) {
		GAwesomeData.wiki.bookmarks.splice(GAwesomeData.wiki.bookmarks.indexOf(link), 1);
	} else {
		GAwesomeData.wiki.bookmarks.push(link);
	}
	localStorage.setItem("wiki-bookmarks", JSON.stringify(GAwesomeData.wiki.bookmarks));

	$(elem).toggleClass("is-dark is-text");
	GAwesomeUtil.populateWikiBookmarks();
};

GAwesomeUtil.populateWikiSections = () => {
	let subMenu = "<ul>";
	const pageSections = document.getElementById("frame").querySelectorAll("h1, h2, h3");
	for (let i = 0; i < pageSections.length; i++) {
		if(i > 0 && pageSections[i].tagName !== "H3" && pageSections[i-1] && pageSections[i-1].tagName === "H3") {
			subMenu += "</ul>";
		}
		subMenu += "<li>";
		if (pageSections[i].tagName === "H3" && ((i > 0 && pageSections[i-1] && pageSections[i-1].tagName !== "H3") || i === 0)) {
			subMenu += "<ul>"
		}
		subMenu += "<a class='heading-shortcut-link' href='#" + pageSections[i].id + "' data-turbolinks='false'>" + pageSections[i].innerHTML + "</a></li>";

		pageSections[i].innerHTML += "&nbsp;<a class='button is-text " + (pageSections[i].tagName === "H3" ? "is-small" : "") + " heading-shortcut-link' style='text-decoration:none;' href='#" + pageSections[i].id + "' data-turbolinks='false'><i class='fa fa-link'></i></a>&nbsp;<a class='button " + (GAwesomeData.wiki.bookmarks.indexOf(GAwesomeUtil.getBookmarkLink(pageSections[i].id))>-1 ? "is-dark" : "is-text") + " " + (pageSections[i].tagName === "H3" ? "is-small" : "") + "' style='text-decoration:none;' onclick='GAwesomeUtil.bookmarkWikiSection(this);'><i class='fa fa-bookmark'></i></a>"
	}
	subMenu += "</ul>";
	if (pageSections[pageSections.length - 1] && pageSections[pageSections.length - 1].tagName === "H3") {
		subMenu += "</ul>";
	}
	$("#submenu").html(subMenu);
	$("table").addClass("table");

	$(".heading-shortcut-link").click(function() {
		$("html, body").animate({
			scrollTop: $("#" + this.href.substring(this.href.lastIndexOf("#")+1)).offset().top
		}, 172);
	});
};

GAwesomeUtil.populateWikiBookmarks = () => {
	if (GAwesomeData.wiki.bookmarks.length > 0) {
		$("#bookmarks-menu").removeClass("is-hidden");
		$("#menu-spacer").removeClass("is-hidden");

		GAwesomeData.wiki.bookmarks = GAwesomeData.wiki.bookmarks.sort();
		let subMenu = "<ul>";
		for(let i = 0; i < GAwesomeData.wiki.bookmarks.length; i++) {
			subMenu += "<li><a href='" + GAwesomeData.wiki.bookmarks[i] + "' data-turbolinks='false'>" + decodeURI(GAwesomeData.wiki.bookmarks[i]).replace("#", " &raquo; ") + "</a></li>";
		}
		subMenu += "</ul>";

		$("#bookmarks-submenu").html(subMenu);
	} else {
		$("#bookmarks-menu").addClass("is-hidden");
		$("#menu-spacer").addClass("is-hidden");
	}
};

GAwesomeUtil.publishExtension = extid => {
	if (confirm("Are you sure you want to publish this extension? Everyone will be able to view and use this extension!")) {
		NProgress.start();
		$(`#publish-${extid}`).remove();
		$.ajax({
			type: "POST",
			url: `/extensions/${extid}/publish`,
			data: {}
		})
			.always(() => {
				NProgress.done();
				NProgress.remove();
			});
	}
};

GAwesomeUtil.deleteExtension = extid => {
	if (confirm("Are you sure you want to remove this extension? This action is irreversible!")) {
		NProgress.start();
		$(`#delete-${extid}`).parent().parent().remove();
		$.ajax({
			type: "POST",
			url: `/extensions/${extid}/delete`,
			data: {},
		})
			.always(() => {
				NProgress.done();
				NProgress.remove();
			});
	}
};

GAwesomeUtil.saveExtension = (isGallery, URL) => {
	NProgress.start();
	hide_update_modal = true;
	const extensionData = $("#form").serializeArray();
	extensionData.find(a => a.name === "code").value = GAwesomeData.builder.getValue();
	$.ajax({
		method: "POST",
		url: URL,
		data: extensionData
	})
		.always(function(data) {
			const form = $("#form-submit");
			NProgress.done();
			NProgress.remove();
			saveFormState();
			if (data !== "OK" && data.status !== 200 && data.status !== 302) {
				form.find("span:nth-child(1)").html("<i class='fa fa-exclamation'></i>");
				form.find("span:nth-child(2)").html("Error");
			}
			else if (isGallery) Turbolinks.visit("/extensions/my");
			else Turbolinks.visit("");
		});
};

GAwesomeUtil.voteExtension = extid => {
	const voteButton = $(`#vote-${extid}`);
	const vote = voteButton.html().trim();
	voteButton.html(vote === "-1" ? "+1" : "-1");
	$.post(`/extensions/${extid}/upvote`);
	const pointCounter = $(`#points-${extid}`)
	pointCounter.html(vote === "-1" ? Number(pointCounter.html()) - 1 : Number(pointCounter.html()) + 1);
};

GAwesomeUtil.unpublishExtension = extid => {
	if (!confirm("Are you sure you want to unpublish this extension? It will no longer be usable or visible by guilds, points are preserved.")) return;
	NProgress.start();
	const card = $(`#card-${extid}`);
	$.post(`/extensions/${extid}/unpublish`);
	card.remove();
	NProgress.done();
	NProgress.remove();
};

GAwesomeUtil.rejectExtension = extid => {
	let reason = prompt("Reason to reject:");
	if (!reason) reason = "No reason given.";
	NProgress.start();
	$.ajax({
		method: "POST",
		url: `/extensions/${extid}/reject`,
		data: { reason }
	})
		.done(() => {
			$(`#card-${extid}`).remove();
			NProgress.done();
			NProgress.remove();
		});
};

GAwesomeUtil.removeExtension = extid => {
	let reason = prompt("Reason to remove:");
	if (!reason) reason = "No reason given.";
	NProgress.start();
	$.ajax({
		method: "POST",
		url: `/extensions/${extid}/remove`,
		data: { reason }
	})
		.done(() => {
			$(`#card-${extid}`).remove();
			NProgress.done();
			NProgress.remove();
		});
};

GAwesomeUtil.acceptExtension = extid => {
	NProgress.start();
	$.post(`/extensions/${extid}/accept`).done(() => {
		NProgress.done();
		NProgress.remove();
		Turbolinks.visit('/extensions/gallery');
	});
};

GAwesomeUtil.featureExtension = extid => {
	const featureButton = $(`#feature-${extid}`);
	const featured = featureButton.html().trim() !== "Feature";
	featureButton.html(featured ? "Feature" : "Unfeature");
	$.post(`/extensions/${extid}/feature`);
	const featuredTag = $(`#featured-${extid}`)
	featuredTag.html(featured ? "" : "<span class=\"tag is-primary\">Featured</span>&nbsp;");
};

GAwesomeUtil.installExtension = extid => {
	alert("In Progress");
};

GAwesomePaths["extensions"] = () => {
	if (window.location.pathname === "/extensions/builder") {
		setTimeout(function() {
			saveFormState();
		}, 0);
		GAwesomeData.builder = CodeMirror.fromTextArea(document.getElementById("builder-code-box"), {
			mode: "javascript",
			lineWrapping: true,
			lineNumbers: true,
			fixedGutter: true,
			styleActiveLine: true,
			theme: "monokai"
		});
		GAwesomeData.builder.refresh();
	}
};

GAwesomeUtil.dashboardWrapper = func => {
	if (window.location.pathname.split("/")[1] !== "dashboard") {
		return "This function can only be executed within the dashboard.";
	} else {
		return func();
	}
};

GAwesomeUtil.dashboard.connect = () => {
	return GAwesomeUtil.dashboardWrapper(() => {
		if (GAwesomeData.dashboard.socket) {
			GAwesomeData.dashboard.socket.close();
		}
		GAwesomeData.dashboard.socket = io(window.location.pathname, { transports: ["websocket"] });
		GAwesomeData.dashboard.socket.on("update", function(data) {
			if (!hide_update_modal && GAwesomeData.dashboard.svrid === data && localStorage.getItem("dashboardUpdates") !== "none") {
				$("html").addClass("is-clipped");
				$("#update-modal").addClass("is-active");
			}
		});
		GAwesomeData.dashboard.socket.on("logs", data => {
			let line = `[${data.timestamp}] [${data.level}] ${data.message}`;
			GAwesomeData.dashboard.terminal.print(line);
			$(".Terminal").animate({ scrollTop: $('.Terminal').prop("scrollHeight")}, 500);
		});
	});
};

GAwesomePaths["landing"] = () => {
	$(".section-shortcut-link").click(function() {
		$("html, body").animate({
			scrollTop: $("#" + this.href.substring(this.href.lastIndexOf("#")+1)).offset().top
		}, 172);
	});
};

GAwesomePaths["activity"] = () => {
	GAwesomeUtil.activityViewportUpdate(GAwesomeListeners.activityMQL);

	if (window.location.pathname === "/activity/users") {
		document.getElementById("search-button").href = "javascript:GAwesomeUtil.searchUsers(document.getElementById('search-input').value);";
		document.getElementById("search-input").onkeydown = function() {
			if(event.keyCode === 13) {
				GAwesomeUtil.searchUsers(this.value);
			}
		};
		$.getJSON("/userlist", function(data) {
			searchInputAutocomplete = new autoComplete({
				selector: "#search-input",
				minChars: 2,
				source: function(q, res) {
					q = q.toLowerCase();
					res(data.filter(function(a) {
						return a.toLowerCase().indexOf(q)>-1;
					}));
				}
			});
		});
	} else {
		GAwesomeData.activity.guildData = {};
		document.getElementById("search-button").href = "javascript:GAwesomeUtil.searchServers(document.getElementById('search-input').value);";
		document.getElementById("search-input").setAttribute("list", "servers");
		document.getElementById("search-input").onkeydown = function() {
			if (event.keyCode === 13) {
				GAwesomeUtil.searchServers(this.value);
			}
		};
		$.getJSON("/serverlist", function(data) {
			searchInputAutocomplete = new autoComplete({
				selector: "#search-input",
				minChars: 2,
				source: function(q, res) {
					q = q.toLowerCase();
					res(data.filter(function(a) {
						return a.toLowerCase().indexOf(q)>-1;
					}));
				}
			});
		});
		GAwesomeUtil.switchActivityLayout();
		GAwesomeUtil.showActivitySelections();
	}
};

GAwesomePaths["blog"] = () => {
	setTimeout(function() {
		saveFormState();
	}, 0);
	if (window.location.pathname !== "/blog/compose") return;
	const converter = new showdown.Converter({
		tables: true,
		simplifiedAutoLink: true,
		strikethrough: true,
		tasklists: true,
		smoothLivePreview: true,
		smartIndentationFix: true
	});
	GAwesomeData.blog.editor = new SimpleMDE({
		element: document.getElementById("composer-content"),
		forceSync: true,
		spellChecker: false,
		promptURLs: true,
		previewRender: function(text) {
			$(".editor-preview").addClass("content");
			$(".editor-preview-side").addClass("content");
			return converter.makeHtml(text);
		}
	});
};

GAwesomePaths["wiki"] = () => {
	setTimeout(function() {
		saveFormState();
	}, 0);
	GAwesomeData.wiki.bookmarks = JSON.parse(localStorage.getItem("wiki-bookmarks")) || [];
	GAwesomeUtil.populateWikiBookmarks();
	if (window.location.pathname !== "/wiki/edit") return;
	const converter = new showdown.Converter({
		tables: true,
		simplifiedAutoLink: true,
		strikethrough: true,
		tasklists: true,
		smoothLivePreview: true,
		smartIndentationFix: true
	});
	GAwesomeData.wiki.editor = new SimpleMDE({
		element: document.getElementById("composer-content"),
		forceSync: true,
		spellChecker: false,
		promptURLs: true,
		previewRender: function(text) {
			$(".editor-preview").addClass("content");
			$(".editor-preview-side").addClass("content");
			return converter.makeHtml(text);
		}
	});
};

GAwesomePaths["dashboard"] = () => {
	return GAwesomeUtil.dashboardWrapper(() => {
		$(".close-update-modal").unbind();
		$(".close-update-modal").click(() => {
			$("html").removeClass("is-clipped");
			$("#update-modal").removeClass("is-active");
		});
		GAwesomeUtil.dashboard.connect();
		const consoleSection = window.location.pathname.split("/")[2];
		const sectionPage = window.location.pathname.split("/")[3];
		if (sectionPage === "command-options") {
			$("#ban_gif").on("blur", () => {
				if ($("#ban_gif").val() === "Default") {
					$("#default_ban_gif").hide();
					$("#ban_gif_field").removeClass("has-addons");
					return $("#ban_gif_preview").attr("src", "https://imgur.com/3QPLumg.gif");
				}
				$("#ban_gif_field").addClass("has-addons");
				$("#default_ban_gif").show();
				$("#ban_gif_preview").attr("src", $("#ban_gif").val());
			});
		} else if (sectionPage === "name-display") {
			const example = $("#currentExample");
			const useNickname = $("#name_display-use_nick");
			const useDiscriminator = $("#name_display-show_discriminator");
			useNickname.click(() => {
				if (useNickname.is(":checked") && GAwesomeData.nickname !== "") {
					example.text(GAwesomeData.nickname);
				} else {
					example.text(GAwesomeData.username);
				}
				if (useDiscriminator.is(":checked")) {
					example.text(`${example.text().trim()}#${GAwesomeData.discriminator}`);
				}
			});
			useDiscriminator.click(() => {
				if (useDiscriminator.is(":checked")) {
					example.text(example.text() + `#${GAwesomeData.discriminator}`);
				} else {
					example.text(example.text().trim().slice(0, -5));
				}
			});
		}
	});
};

document.addEventListener("turbolinks:load", () => {
	GAwesomeUtil.updateHeader();
	bulma();
	$("html").removeClass("is-clipped");
	hide_update_modal = false;
	initial_form_state = $("#form").serialize();
	if (GAwesomeData.dashboard.socket) {
		GAwesomeData.dashboard.socket.close();
		delete GAwesomeData.dashboard.socket;
	}
	GAwesomeData.section = window.location.pathname.split("/")[1]
	let func = GAwesomePaths[GAwesomeData.section]
	if (GAwesomeData.section === "") func = GAwesomePaths["landing"];
	if (func) func();
});

const GAwesomeListeners = {};

GAwesomeListeners.activityMQL = window.matchMedia("screen and (max-width: 768px)");
GAwesomeListeners.activityMQL.addListener(GAwesomeUtil.activityViewPortUpdate);

function setUserAutocomplete(svrid) {
	$.getJSON("/userlist" + (svrid ? ("?svrid=" + svrid) : ""), function(data) {
		new autoComplete({
			selector: ".user-autocomplete",
			minChars: 2,
			source: function(query, res) {
				query = query.toLowerCase();
				res(data.filter(function(a) {
					return a.toLowerCase().indexOf(query)>-1;
				}));
			}
		});
	});
}

$(window).scroll(function() {
	if($("#form-buttons") && $("#form-buttons").is(":visible")) {
		$("#scroll-top-button-container").css("padding-bottom", "75px");
	} else {
		$("#scroll-top-button-container").css("padding-bottom", "25px");
	}
	if($(this).scrollTop()>200 && $(this).scrollTop()<$(document).height()-1200) {
		$("#scroll-top-button-container").fadeIn(86);
	} else {
		$("#scroll-top-button-container").fadeOut(86);
	}
});

$(document).on('turbolinks:click', function() {
	NProgress.start();
});
$(document).on('turbolinks:render', function() {
	NProgress.done();
	NProgress.remove();
});

String.prototype.replaceAll = function(target, replacement) {
	return this.replace(new RegExp(target, "g"), replacement);
};

/* Down here are only easter eggs, pinky promise. You'll ruin all the fun if you don't find them for yourself! Turn back while you still can. */

let keys = [];
const konami = "38,38,40,40,37,39,37,39,66,65";
const dolphin = "68,69,76,73,71,72,84,69,68,32,68,79,76,80,72,73,78";
const unknown = "38c972419c82c3059933ecefee492ad2";
window.addEventListener("keydown", function(e) {
	if (e.keyCode !== 16) {
		keys.push(e.keyCode);
	}
	if(keys.toString().includes(konami)) {
		keys = [];
		document.body.innerHTML = document.body.innerHTML.replace(/GAwesomeBot/g,"TacoBot");
		document.body.innerHTML = document.body.innerHTML.split("/static/img/icon.png").join("/static/img/tinytaco.png");
		document.getElementById("header").style.backgroundImage = "url('/static/img/header-bg-taco.jpg')";
	}
	if(keys.toString().includes(dolphin)) {
		keys = [];
		$('*').contents().filter(function() {
			return this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== '';
		}).each(function() {
			let info = "";
			for(let i = 0; i < this.nodeValue.length; i++) {
				info += "🐬";
			}
			this.nodeValue = info;
		});
	}
	if (md5(keys.toString()) === unknown) {
		keys = [];
		document.body.innerHTML = document.body.innerHTML.split("/GilbertGobbels/GAwesomeBot").join("/BitQuote/AwesomeBot");
		document.body.innerHTML = document.body.innerHTML.replace(/GAwesomeBot/g, "AwesomeBot Neo");
		document.body.innerHTML = document.body.innerHTML.split("/static/img/icon.png").join("/static/img/NEO.png");
		$("#footerText").html('<strong>AwesomeBot NEO</strong> by BitQuote & <a href="https://github.com/BitQuote">BitQuote</a>. Made with <a href="https://github.com/BitQuote">BitQuote</a> and <a href="https://github.com/BitQuote">BitQuote</a>. Site made with <a href="https://github.com/BitQuote">BitQuote</a> and <a href="https://github.com/BitQuote">BitQuote</a>. Artwork by <a href="https://github.com/BitQuote">BitQuote</a> and <a href="https://github.com/BitQuote">BitQuote</a>. All rights reserved by BitQuote.');
		$(".developer-card-name").html("BitQuote").attr("ondblclick", "");
		$(".developer-card-icon").attr("src", "/static/img/bitquote.png");
		$(".developer-card-role").html("(Evil) Creator, Bot Killer");
	}
}, true);