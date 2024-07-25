(function() {

  function Link(aTitle, aAltTitle, aFav, aUrl) {
    this.title = aTitle;
    this.altTitle = aAltTitle;
    this.isFav = aFav;
    this._url = aUrl;
    this._anchor = false;

    this.generateAnchorForProvinz = function(coord) {
      if (this._anchor) {
        return this._anchor;
      }

      this._anchor = DOM.li();
      var ele = DOM.a({
        "target": "main"
      });
      if (this._url != null) {
        ele.href = this._url.replace("{{coord}}", coord);
      } else {
        this._anchor.setAttribute("style", "display:none;");
      }
      ele.addText(this.altTitle || this.title);

      this._anchor.appendChild(ele);

      return this._anchor;
    };

    this.updateLink = function(aLink) {
      if (!this._anchor) {
        this.generateAnchorForProvinz();
      }
      this._anchor.firstChild.href = aLink.href;
      this._anchor.removeAttribute("style");
    };

    this.toString = function() {
      return this.title;
    };
  }

  function LinkSet(linkArr) {
    this._links = linkArr;
    this._data = {};
    this.container = null;

    this.containsLink = function(aTitle) {
      return (this._data[aTitle] instanceof Link);
    };

    this.add = function(aLink) {
      if (!this.containsLink(aLink.innerText)) {
        var newLink = new Link(aLink.innerText, null, false, aLink.href);
        this._links.push(newLink);
        this._data[aLink.innerText] = newLink;
        newLink.generateAnchorForProvinz();
      }
      this._data[aLink.innerText].updateLink(aLink);
    };

    for (var i = 0; i < linkArr.length; i++) {
      var newLink = linkArr[i];
      this._data[newLink] = newLink;
    }

    this.generateLinkContainer = function() {
      if (this.container == null) {
        this.container = DOM.ul({
          "style": "margin:0px;padding:0px;margin-left:25px;display:none;"
        });
      }
      for (var i = 0; i < this._links.length; i++) {
        var link = this._links[i];
        if (!link.isFav && !link.isContained) {
          this.container.appendChild(link.generateAnchorForProvinz(CFG.CURRENT_PROV));
          link.isContained = true;
        }
      }
      return this.container;
    };

    this.getAll = function() {
      return this._links;
    };

  }

  var OPTIONS = OptionGroup('PMEN', "Optionen: Provinzmenü",
    DOM.p().add("Organisiert das Provinzmenü (Navigation linke Seite) um.").br().add(
      "Bringt außerdem alles mit ausklappbaren Untermenüs auf einer Seite zusammen um überflüssige vor/zurück Navigation zu reduzieren."
    ),
    CheckOption('autoExpand', 'Gebäudelinks ausklappen', false)
    //,TextOption('importLinksLocation', 'Menüaufbau importieren', '', ValueType.STRING)
  );

  var MENU = [
    {
      "name": "Provinzdaten",
      "request": false,
      "underFav": false,
      "links": new LinkSet([
        new Link("Provinz Info", null, false, "provinzinfo.php?provinz={{coord}}"),
        new Link("Aktuelles", null, true, "aktuelles.php"), 
        new Link("Vorschau", null, true, "vorschau.php?provinz={{coord}}"),
        new Link("Provinzlager", null, false, "lager.php?p1={{coord}}"),
        new Link("Geb\u00e4udeliste", null, false, "bebauung.php?p1={{coord}}")])
    },
    {
      "name": "Zivil",
      "request": true,
      "underFav": false,
      "links": new LinkSet([
        new Link("Einstellungen", null, true, "einstellungen.php?provinz={{coord}}"),
        new Link("Bodensch\u00e4tze", null, false, "bodenschaetze.php?provinz={{coord}}"),
        new Link("Geldtransfer", "Mips -> Staatskonto", false, null),
        new Link("Provinz\u00fcbergabe", null, false, "provinzuebergabe.php?provinz={{coord}}"),
        new Link("umbenennen", null, false, "rename.php?provinz={{coord}}")])
    },

    {
      "name": "Geb\u00e4ude",
      "request": true,
      "underFav": true,
      "links": new LinkSet([])
    },

    {
      "name": "Arbeit",
      "request": false,
      "underFav": false,
      "links": new LinkSet([
        new Link("Spezielle Bauten", null, false, "spezbauen.php?provinz={{coord}}"),
        new Link("Bew\u00e4ssern", null, true, "bewaessern.php?provinz={{coord}}"),
        new Link("Wegsystem", null, true, "wegbau.php?provinz={{coord}}"),
        new Link("Tiere freilassen", null, false, "tierefreilassen.php?provinz={{coord}}")])
    },

    {
      "name": "Handel",
      "request": true,
      "underFav": false,
      "links": new LinkSet([
        new Link("Transport", null, true, null), new Link("Marktst\u00e4nde", null, true, null),
        new Link("Markt", null, true, null)])
    },

    {
      "name": "Milit\u00e4r",
      "request": true,
      "underFav": false,
      "links": new LinkSet([
        new Link("Rekruten ausbilden", null, true, null),
        new Link("Rekruten entlassen", null, false, null),
        new Link("Routen\u00fcbersicht", "M. Routen", true, null)])
    }];

  var sourceDiv = DOM.byTag("div", document)[0];
  var FAV_UL = DOM.ul({
    "style": "margin:0px;padding:0px;margin-left:25px;display:block;"
  });

  function buildMenu() {
    let shortLinks = document.querySelector('body .shortlinkborder').parentElement;
    document.head.add(new Style(/*TEMPLATE.asText('shortLinkTableStyle')*/)
      .addRule("body{height:100vh; overflow:hidden;}")
      .addRule(`#menuContainer{
        overflow-y: scroll;
        margin-right:-10px;
        width:100%; height:calc(100vh - ${shortLinks.clientHeight}px);
      }`)
    );
    let menuLinks = DOM.collectionAsMap(DOM.byTag("a", sourceDiv));

    let targetDiv = DOM.div({
      id: "menuContainer",
      "class": sourceDiv.getAttribute("class") + ' naviPanel'
    });

    let favorites = DOM.a({
      "href": "javascript:;",
      "style": "display:block;"
    }).addText("Favoriten");
    favorites.addEventListener('click', function() {
      toggleVisibility(this.nextElementSibling);
    }, true);

    targetDiv.add(favorites);
    targetDiv.add(FAV_UL);

    let provAnsicht = menuLinks["Provinzansicht"];
    targetDiv.add(provAnsicht);
    provAnsicht.setAttribute("class", "aSpacing");
    provAnsicht.style.display = "block";

    let REST_MARKER = DOM.span({
      "style": "display:block;",
      "class": "aSpacing"
    }).addText("Rest:");
    targetDiv.add(REST_MARKER);

    targetDiv.addBefore(
      targetDiv.firstChild,
      new Style(".aSpacing {margin:0;margin-top:10px;display:inline-block;} li {margin: 5px 0;}")
    );

    sourceDiv.style.display = "none";
    sourceDiv.parentElement.insertBefore(targetDiv, sourceDiv);
    for (var menuIdx = 0; menuIdx < MENU.length; menuIdx++) {
      var setting = MENU[menuIdx];
      var linkSet = setting.links.getAll();

      var origLink = menuLinks[setting.name];
      origLink.menuSetting = setting;
      origLink.setAttribute("class", "aSpacing");
      origLink.style.display = "block";
      var origContainer = setting.links.generateLinkContainer();

      // remaining menu
      if (setting.underFav) {
        targetDiv.insertBefore(origContainer, provAnsicht);
        targetDiv.insertBefore(origLink, origContainer);
      } else {
        targetDiv.appendChild(origLink);
        targetDiv.appendChild(origContainer);
      }

      origLink.ul = origContainer;
      origLink.addEventListener("click", function() {
        toggleVisibility(this.ul);
      }, true);

      linkSet.forEach(function(link) {
        if (link.isFav) {
          FAV_UL.appendChild(link.generateAnchorForProvinz(CFG.CURRENT_PROV));
        }
      });

      // request update
      if (setting.request) {
        getAsDom(origLink.href, null, function(doc, text, aLink) {
          var subLinks = DOM.byTag("a", DOM.byTag("div", doc)[0]);
          try {
            for (var subIdx = 0; subIdx < subLinks.length; subIdx++) {
              // "zurück" links ausfiltern
              if (subLinks[subIdx].href.search("open.php") > 0) {
                continue;
              }
              aLink.menuSetting.links.add(subLinks[subIdx]);
            }
            aLink.menuSetting.links.generateLinkContainer();
          } catch (e) {
            console.log(e);
          }

        }, origLink);
      }

      origLink.href = "javascript:;";
    }

    sourceDiv.parentElement.removeChild(sourceDiv);
  };

  let plugin_Menu = new Plugin("ProvinzMenu", {
    title: 'Provinzmenü',
    options: OPTIONS,
    execute: buildMenu
  });
  return plugin_Menu.run();
})();
