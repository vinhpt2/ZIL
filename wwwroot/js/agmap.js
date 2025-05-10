export class AGMap {
	static token = null;
	static map = null;
	static view = null;
	static layers = {};
	static extent = null;
	static backStack = [];
	static nextStack = [];
	static grids = {};
	constructor(para) {
		NUT.loading(para.divMap);
		document.head.z(["script", {
			src: "https://js.arcgis.com/4.32/", onload: function () {
				require(["esri/config", "esri/identity/IdentityManager", "esri/WebMap", "esri/views/MapView", "esri/views/draw/Draw", "esri/Graphic", "esri/symbols/support/symbolUtils", "esri/widgets/Editor", "esri/widgets/Measurement", "esri/widgets/Print"], function (esriConfig, esriId, WebMap, MapView, Draw, Graphic, symbolUtils, Editor, Measurement, Print) {
					AGMap.Graphic = Graphic;
					AGMap.symbolUtils = symbolUtils;
					AGMap.Editor = Editor;
					(NUT.w2ui["tbrMap"] || new NUT.w2toolbar({
						name: "tbrMap",
						items: [
							/*{ type: 'radio', id: "zoomin", group: 1, icon: "zoomin-png", tooltip: "_ZoomIn" },
							{ type: 'radio', id: "zoomout", group: 1, icon: "zoomout-png", tooltip: "_ZoomOut" },*/
							{ type: 'radio', id: "pan", group: 1, icon: "hand-png", tooltip: "_Pan" },
							{ type: 'break' },
							{ type: 'radio', id: "identify", group: 1, icon: "info-png", tooltip: "_Identify" },
							{ type: 'radio', id: "select", group: 1, icon: "select-png", tooltip: "_Select" },
							{ type: 'button', id: "unselect", icon: "unselect-png", tooltip: "_ClearSelect" },
							{ type: 'break' },
							{ type: 'button', id: "fullextent", icon: "world-png", tooltip: "_FullExtent" },
							{ type: 'text', id: "scale" },
							{ type: 'button', id: "backextent", icon: "back-png", tooltip: "_BackExtent" },
							{ type: 'button', id: "nextextent", icon: "next-png", tooltip: "_NextExtent" },
							{ type: 'break' },
							{ type: 'radio', id: "measure", group: 1, icon: "ruler-png", tooltip: "_Measure" },
							{ type: 'button', id: "print", icon: "printer-png", tooltip: "_Print" }
						],
						onClick(evt) {
							var tool = evt.detail.item.id;
							AGMap.view.popupEnabled = (tool == "identify");
							var style = AGMap.view.container.style;
							var action = null;
							switch (tool) {
								case "pan":
									style.cursor = "grab";
									AGMap.draw.reset();
									break;
								case "identify":
									style.cursor = "help";
									AGMap.draw.reset();
									break;
								case "zoomin":
									style.cursor = "zoom-in";
									action = AGMap.draw.create("rectangle");
									break;
								case "zoomout":
									style.cursor = "zoom-out"
									action = AGMap.draw.create("rectangle");
									break;
								case "select":
									style.cursor = "default";
									action = AGMap.draw.create("rectangle");
									break;
								case "unselect":
									for(var key in AGMap.layers)if(AGMap.layers.hasOwnProperty(key)){
										var layer=AGMap.layers[key];
										if(layer.highlight)layer.highlight.remove();
									}
									break;
								case "fullextent":
									AGMap.view.goTo(n$.windowid ? AGMap.extent.expand(0.5) : AGMap.extent);
									break;
								case "backextent":
									var ext = AGMap.backStack.pop();
									if (ext) {
										AGMap.skipme = true;
										AGMap.nextStack.push(AGMap.view.extent);
										AGMap.view.goTo(ext);
									}
									break;
								case "nextextent":
									var ext = AGMap.nextStack.pop();
									if (ext) {
										AGMap.skipme = true;
										AGMap.view.goTo(ext);
									}
									break;
								case "measure":
									var a = NUT.createWindowTitle("measure", divTitle);
									var widget = new Measurement({
										container: a.div,
										view: AGMap.view,
										activeTool: "area"
									});
									widget.renderNow();
									a.innerHTML = "Measure";
									break;
								case "print":
									var a = NUT.createWindowTitle("print", divTitle);
									var widget = new Print({
										container: a.div,
										view: AGMap.view,
										printServiceUrl: "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
									});
									widget.renderNow();
									a.innerHTML = "Print";
									break;
							}
							if (action) {
								action.on("cursor-update", function (evt) {
									var p = evt.vertices;
									if (p.length == 2) {
										var lyr = AGMap.view.graphics;
										var g = lyr.getItemAt(0);
										var ext = {
											type: "extent",
											xmin: p[0][0], ymin: p[0][1], xmax: p[1][0], ymax: p[1][1],
											spatialReference: NUT.AGMap.view.spatialReference
										};
										if (g) g.geometry = ext;
										else {
											g = new Graphic({
												geometry: ext,
												symbol: {
													type: "simple-fill",
													style: "none",
													outline: { color: "lime", width: 1 }
												}
											});
											lyr.add(g);
										};
									}
								});
								action.on("draw-complete", function (evt) {
									if (AGMap.view.graphics.length) {
										var geometry = AGMap.view.graphics.getItemAt(0).geometry;
										switch (tool) {
											case "zoomin":
												AGMap.view.goTo(geometry);
												break;
											case "zoomout":
												AGMap.view.goTo(geometry.expand(AGMap.view.extent.width / geometry.width + AGMap.view.extent.height / geometry.height));
												break;
											case "select":
												style.cursor = "default";
												action = AGMap.draw.create("rectangle");
												AGMap.view.allLayerViews.forEach(function (lyrView) {
													var layer = lyrView.layer;
													var where = [];
													var selectable = layer.selectable;
													if (layer.type == "subtype-group") {
														for (var i = 0; i < layer.sublayers.length; i++) {
															var slyr = layer.sublayers.getItemAt(i);
															if (slyr.selectable) where.push(slyr.subtypeField + "=" + slyr.subtypeCode);
														}
														selectable = where.length;
													}
													if (selectable) {
														var query = {
															geometry: {
																type: "polygon",
																rings: [[[geometry.xmin, geometry.ymin], [geometry.xmin, geometry.ymax], [geometry.xmax, geometry.ymax], [geometry.xmax, geometry.ymin], [geometry.xmin, geometry.ymin]]],
																spatialReference: geometry.spatialReference
															}
														}
														if (where) query.where = where.join(" or ");
														lyrView.queryObjectIds(query).then(function (oid) {
															if (layer.highlight) layer.highlight.remove();
															layer.highlight = lyrView.highlight(oid);
															layer.highlight.oid = oid;
															var grid = AGMap.grids[layer.id];
															if (grid) {
																grid.selectNone(true);
																var conf = grid.box.parentNode.parentNode.tag;
																NUT.NWin.switchFormGrid(conf, grid.select(oid) == 1);
															}
														});
													}
												});
												break;
										}
										AGMap.view.graphics.removeAll();
									}
									NUT.w2ui["tbrMap"].onClick({ detail: { item: { id: tool } } });
								})
							}
						}
					})).render(para.divMap.nextSibling);
					esriId.registerToken({ server: para.url, token: para.token });
					esriConfig.portalUrl = para.url;
					AGMap.map = new WebMap({
						portalItem: { id: para.id },
						basemap: "topo-vector"
					});
					AGMap.map.load().then(function () {
						NUT.loading();
						AGMap.view = new MapView({
							container: divMap,
							map: AGMap.map,
							popupEnabled: false,
							ui: { components: ["zoom"] },
							constraints: { lods: [] }
						});
						AGMap.draw = new Draw({view: AGMap.view});
						if (NUT.isMobile) AGMap.view.ui.move("zoom", "bottom-right");

						AGMap.map.loadAll().then(AGMap.initMap);
					}).catch(function (err) {
						NUT.notify("⛔ " + err + ". <a onclick='NUT.AGMap.map.loadAll(NUT.AGMap.initMap)'>Reload</a>", "red");
					});
					AGMap.token = para.token;
				});
			}
		}]);
	}
static initMap () {
	for (var i = 0; i < AGMap.map.allLayers.length; i++) {
		var lyr = AGMap.map.allLayers.getItemAt(i);
		lyr.selectable = 0;
		if (lyr.type == "feature") {
			lyr.outFields = "*";
			AGMap.layers[lyr.id] = lyr;
			var node = NUT.w2ui.mnuMain.get(lyr.id);
			if (node) node.text = AGMap.genMenuText;
		}
		if (lyr.type == "subtype-group") {
			lyr.selectable = 1;
			for (var j = 0; j < lyr.sublayers.length; j++) {
				var slyr = lyr.sublayers.getItemAt(j);
				slyr.selectable = 0;
				AGMap.layers[slyr.id] = slyr;
			}
			//add submenu
			var parent = NUT.w2ui.mnuMain.get(lyr.id);
			if (parent) {
				parent.text = lyr.title;
				//parent.group = !NUT.isMobile;
				parent.expanded = !NUT.isMobile && parent.isopen;
				var nodes = [];
				for (var j = lyr.sublayers.length - 1; j >= 0; j--) {
					var slyr = lyr.sublayers.getItemAt(j);
					nodes.push({
						id: slyr.id, maplayer: slyr.id, where: [slyr.subtypeField, "=", slyr.subtypeCode], tag: parent.tag, layerTitle: slyr.title, text: AGMap.genMenuText
					});
				}
				NUT.w2ui.mnuMain.insert(parent.id, null, nodes);
			}
		}
	}
	NUT.w2ui.mnuMain.refresh();
	AGMap.extent = AGMap.view.extent;
	AGMap.view.watch("stationary", function (oldVal, newVal) {
		if (newVal) {
			if (AGMap.skipme) AGMap.skipme = false;
			else AGMap.backStack.push(AGMap.view.extent);
		}
	});
};
	static genMenuText(node) {
		var lyr = AGMap.layers[node.id];
		var text = lyr.title + "<input type='checkbox' style='float:left' name='" + lyr.id + "' onclick='event.stopPropagation();NUT.AGMap.layers[this.name].visible=this.checked' " + (lyr.visible ? "checked/>" : "/>");
		return NUT.w2ui.mnuMain.flat ? text : text+"<input type='range' style='float:right;width:30px;padding:0px' id='" + lyr.id + "' value=" + (lyr.selectable ? 1 : 0) + " min=0 max = 1 onclick = 'event.stopPropagation()' onchange = 'NUT.AGMap.showLegend(this.id,this.valueAsNumber)'/>";
	}
	static showLegend(id, show) {
		var lyr = AGMap.layers[id];
		if (!NUT.w2ui.mnuMain.flat && lyr.selectable != show) {
			var node = document.getElementById(id).parentNode.parentNode;
			if (show) {
				switch (lyr.renderer.type) {
					case "simple":
						AGMap.symbolUtils.renderPreviewHTML(lyr.renderer.symbol, { node: node.z(["div"]) });
						break;
					case "unique-value":
						var table = node.z(["table"]);
						//var cap = table.createCaption();
						//var field = lyr.renderer.field;
						//if (lyr.renderer.field2) field += ", " + lyr.renderer.field2;
						//cap.innerHTML = "<b>" + field + "</b>";
						var infos = lyr.renderer.uniqueValueInfos;
						infos.push({ symbol: lyr.renderer.defaultSymbol, label: lyr.renderer.defaultLabel })
						for (var i = 0; i < infos.length; i++) {
							var inf = infos[i];
							if (inf.value) {
								var row = table.insertRow();
								AGMap.symbolUtils.renderPreviewHTML(inf.symbol, { node: row.insertCell(0) });
								row.insertCell(1).innerHTML = inf.label;
							}
						}
						break;
				}
			} else node.lastElementChild.innerHTML = "";
		}
		lyr.selectable = show;
	}
	static zoomToSelect(maplayer) {
		var layer = AGMap.layers[maplayer];
		if (layer.highlight) {
			layer.queryFeatures({
				objectIds: layer.highlight.oid,
				returnGeometry: true
			}).then(function (res) {
				var features = res.features;
				var ext = features[0].geometry.extent;
				for (var i = 1; i < features.length; i++) {
					if (ext) ext.union(features[i].geometry.extent);
				}
				AGMap.view.goTo(ext ? ext.expand(1.5) : features[0].geometry);
			});
		}
	}
	static selectByOID(maplayer, oid) {
		var layer = AGMap.layers[maplayer];
		AGMap.view.whenLayerView(layer.subtypeCode?layer.parent:layer).then(function (lyrView) {
			if (layer.highlight) layer.highlight.remove();
			layer.highlight = lyrView.highlight(oid);
			layer.highlight.oid = oid;
		});
		layer.selectable = true;
		document.getElementById(maplayer).value = 1;
	}
	static selectByWhere(maplayer, where) {
		var layer = AGMap.layers[maplayer];
		if (layer.selectable) AGMap.view.whenLayerView(layer).then(function (lyrView) {
			lyrView.queryObjectIds({where: where}).then(function (oid) {
				if (layer.highlight) layer.highlight.remove();
				layer.highlight = lyrView.highlight(oid);
				layer.highlight.oid = oid;
			});
		});
	}
	static showEditor(maplayer) {
		var a = NUT.createWindowTitle("editor", divTitle);
		var widget = new AGMap.Editor({
			container:a.div,
			view: AGMap.view
		});
		widget.renderNow();
		a.innerHTML = "Editor";
	}
	static get(p, onok) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				if (this.status == 0 || (this.status >= 200 && this.status < 400)) {
					if (onok) onok(JSON.parse(this.response));
				} else this.onerror(this.status);
			}
		};
		xhr.onerror = this.onerror;
		xhr.open(p.method || "GET", p.url + (this.token ? "&token=" + this.token:""), true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		p.data ? xhr.send(JSON.stringify(p.data)) : xhr.send();
	}
	static post(p, onok) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				if (this.status == 0 || (this.status >= 200 && this.status < 400)) {
					if (onok) onok(JSON.parse(this.response));
				} else this.onerror(this.status);
			}
		};
		xhr.onerror = this.onerror;
		xhr.open("POST", p.url + (this.token ? "&token=" + this.token : ""), true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(p.data));
	}
	static submit(p, onok) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				if (this.status == 0 || (this.status >= 200 && this.status < 400)) {
					if (onok) onok(JSON.parse(this.response));
				} else this.onerror(this.status);
			}
		};
		xhr.onerror = this.onerror;
		xhr.open("POST", NUT.URL_PROXY+p.url + (this.token ? "&token=" + this.token : ""), true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
		xhr.send(new URLSearchParams(p.data));
	}
	static onerror(err) {
		alert("⛔ ERROR: " + err);
	}
}