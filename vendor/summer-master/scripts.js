/*
 * Summer html image map creator
 * http://github.com/summerstyle/summer
 *
 * Copyright 2013 Vera Lobacheva (summerstyle.ru)
 * Released under the GPL3 (GPL3.txt)
 *
 * Thu May 15 2013 15:15:27 GMT+0400
 */

"use strict";
function CloudmedJsonImgHtml5() {
	/* Utilities */
	var utils = {
		generateId : function(){
			return Math.random().toString(35).substr(2, 10);
		},
		offsetX : function(node) {
			var box = node.getBoundingClientRect(),
				scroll = window.pageXOffset;

			return Math.round(box.left + scroll);
		},
		offsetY : function(node) {
			var box = node.getBoundingClientRect(),
				scroll = window.pageYOffset;

			return Math.round(box.top + scroll);
		},
		rightX : function(x) {
			return x-app.getOffset('x');
		},
		rightY : function(y) {
			return y-app.getOffset('y');
		},
		trim : function(str) {
			return str.replace(/^\s+|\s+$/g, '');
		},
		id : function (str) {
			return document.getElementById(str);
		},
		hide : function(node) {

			node.style.display = 'none';

			return this;
		},
		show : function(node) {
			node.style.display = 'block';
			return this;
		},
		encode : function(str) {
			return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},
		foreach : function(arr, func) {
			for(var i = 0, count = arr.length; i < count; i++) {
				func(arr[i], i);
			}
		},

		foreachReverse : function(arr, func) {
			for(var i = arr.length - 1; i >= 0; i--) {
				func(arr[i], i);
			}
		},
		debug : (function() {
			var output = document.getElementById('debug');
			return function() {
				output.innerHTML = [].join.call(arguments, ' ');
			}
		})(),
		stopEvent : function(e) {
			e.stopPropagation();
			e.preventDefault();

			return this;
		},
		addClass : function(node, str) {
			// node.className.baseVal for SVG-elements
			// or
			// node.className for HTML-elements
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;

			utils.foreach(arr, function(x) {
				if(x === str) {
					isset = true;
				}
			});

			if (!isset) {
				arr.push(str);
				is_svg ? node.className.baseVal = arr.join(' ') : node.className = arr.join(' ');
			}

			return this;
		},
		removeClass : function(node, str) {
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;

			utils.foreach(arr, function(x, i) {
				if(x === str) {
					isset = true;
					arr.splice(i--, 1);
				}
			});

			if (isset) {
				is_svg ? node.className.baseVal = arr.join(' ') : node.className = arr.join(' ');
			}

			return this;
		},
		hasClass : function(node, str) {
			var is_svg = node.className.baseVal !== undefined ? true : false,
				arr = is_svg ? node.className.baseVal.split(' ') : node.className.split(' '),
				isset = false;

			utils.foreach(arr, function(x) {
				if(x === str) {
					isset = true;
				}
			});

			return isset;
		},
		extend : function(obj, options) {
			var target = {};

			for (name in obj) {
				if(obj.hasOwnProperty(name)) {
					target[name] = options[name] ? options[name] : obj[name];
				}
			}

			return target;
		},

		supportFileReader : (function() {
			return (typeof FileReader !== 'undefined');
		})()
	};


	/* Main object */
	var app = (function() {
		var body = document.getElementsByTagName('body')[0],
			wrapper = utils.id('wrapper'),
			window_name = window.location.pathname.split('/')[window.location.pathname.split('/').length-1],
			svg = utils.id('svg'),
			img = utils.id('img'),
			img_src = utils.id('img').src.split('/')[utils.id('img').src.split('/').length-1],
			localStorageNameShapes = "CloudmedJsonImgHtml5"+window_name,
			localStorageNamePencil = "CloudmedJsonImgHtml5-pencil"+window_name, //definito anche in bundle.js!
			container = utils.id('image'),
			about = utils.id('about'),
			coords_info = utils.id('coords'),
			offset = {x: 0, y: 0},
			shape = null,
			is_draw = false,
			mode = null, // drawing || editing
			objects = [],
			new_area = null,
			selected_area = null,
			edit_type,
			events = [],
			map,
			filename,
			hideNote = false,
			KEYS = {
				F1     : 112,
				ESC    : 27,
				TOP    : 38,
				BOTTOM : 40,
				LEFT   : 37,
				RIGHT  : 39,
				DELETE : 46,
				I      : 73,
				S      : 83,
				C      : 67
			};


		function recalcOffsetValues() {
			offset.x = utils.offsetX(container);
			offset.y = utils.offsetY(container);
		};

		/* Get offset value */
		window.addEventListener('resize', recalcOffsetValues, false);
		/* Disable selection */
		container.addEventListener('mousedown', function(e) { e.preventDefault();}, false);

		/* Disable image dragging */
		img.addEventListener('dragstart', function(e){
			e.preventDefault();
		}, false);

		/* Display cursor coordinates info */
		/*container.addEventListener('mousemove', function(e){
			coords_info.innerHTML = 'x: ' + utils.rightX(e.pageX) + ', ' + 'y: ' + utils.rightY(e.pageY);
		}, false);*/

		// container.addEventListener('mouseleave', function(){
		// 	coords_info.innerHTML = '';
		// }, false);

		/* Add mousedown event for svg */
		function onSvgMousedown(e) {
			if (mode === 'editing') {
				if(typeof(pencilOBJ) != 'undefined'){
					pencilOBJ.disable();
					}

				if (e.target.parentNode.tagName === 'g' && ($(e.target).prop("tagName")!='path')) {
					info.unload();
					selected_area = e.target.parentNode.obj;

					app.deselectAll();
					selected_area.select();
					selected_area.delta = {
						'x' : e.pageX,
						'y' : e.pageY
					};

					if (utils.hasClass(e.target, 'helper')) {
						var helper = e.target;
						edit_type = helper.action;

						if (helper.n >= 0) { // if typeof selected_area == polygon
							selected_area.selected_point = helper.n;
						}

						app.addEvent(container, 'mousemove', selected_area.onEdit)
						   .addEvent(container, 'mouseup', selected_area.onEditStop);

					} else if (e.target.tagName === 'rect' || e.target.tagName === 'circle' || e.target.tagName === 'polygon') {
						edit_type = 'move';

						app.addEvent(container, 'mousemove', selected_area.onEdit)
						   .addEvent(container, 'mouseup', selected_area.onEditStop);
					};
				} else {
					app.deselectAll();
					info.unload();
				};

			};
		}

		container.addEventListener('mousedown', onSvgMousedown, false);

		/* Add click event for svg */
		function onSvgClick(e) {
			if (mode === 'drawing' && !is_draw && shape) {
				// code.hide();
				switch (shape) {
				case 'rect':
					new_area = new Rect(utils.rightX(e.pageX), utils.rightY(e.pageY));

					app.addEvent(container, 'mousemove', new_area.onDraw)
					   .addEvent(container, 'click', new_area.onDrawStop);

					break;
				case 'circle':
					new_area = new Circle(utils.rightX(e.pageX), utils.rightY(e.pageY));
					app.addEvent(container, 'mousemove', new_area.onDraw)
					   .addEvent(container, 'click', new_area.onDrawStop);
					break;
				case 'polygon':
					new_area = new Polygon(utils.rightX(e.pageX), utils.rightY(e.pageY));
					app.addEvent(container, 'mousemove', new_area.onDraw)
					   .addEvent(container, 'click', new_area.onDrawAddPoint)
					   //.addEvent(document, 'keydown', new_area.onDrawStop)
					   .addEvent(new_area.helpers[0].helper, 'click', new_area.onDrawStop);
					break;
				};
			};
		};
		container.addEventListener('click', onSvgClick, false);



		/* Bug with keydown event for SVG in Opera browser
		   (when hot keys don't work after focusing on svg element) */

		function operaSvgKeydownBugFix() {
			window.focus();
		}
		/*if (window.navigator.appName === 'Opera') {
			container.addEventListener('mousedown', operaSvgKeydownBugFix, false);
			container.addEventListener('mouseup', operaSvgKeydownBugFix, false);
			container.addEventListener('click', operaSvgKeydownBugFix, false);
			container.addEventListener('dblclick', operaSvgKeydownBugFix, false);
		};*/



		/* Add dblclick event for svg */
		function onAreaDblClick(e) {
			if (mode != 'drawing' && mode != 'editing') {
				if (e.target.tagName === 'rect' || e.target.tagName === 'circle' || e.target.tagName === 'polygon') {
					$( "#slider" ).slider( "option", "min", 3 ); //imposta lo spessore minimo a 3px
					$('#demo_line').css("strokeWidth", $('#'+e.target.id).css('strokeWidth')); //setta lo spessore della linea "demo" a quello corrente
					$('#demo_line').css("stroke", $('#'+e.target.id).css('stroke'));//setta il colore della linea "demo" a quello corrente

					//calcoli per impostare la posizione dello slider allo stato di avanzamento corrente
					var min_slider = $( "#slider" ).slider( "option", "min" );
					var max_slider = $( "#slider" ).slider( "option", "max" );
					var current_thickness = parseInt($('#'+e.target.id).css('strokeWidth'));
					var slider_percentage = (((current_thickness - min_slider)/(max_slider - min_slider))*100);
					$( "#slider" ).find("span").css("left", slider_percentage+"%");

					selected_area = e.target.parentNode.obj;
					$("#note_list > div[id^='text_note_']").hide();
					$('#note_list > #text_note_'+e.target.id).show();

					//mostra/nascondi note
					// $("div[id^='text_note_']").hide();
					// $('#text_note_'+e.target.id).show();
					info.load(selected_area, e.pageX, e.pageY);
					//mostra/nascondi note
					// Caricare Json Pencil e
					//recupero note e tags della figura clcicata.
						//@Todo

					// if ($('#text_note_'+e.target.id).length){
					// 	$('#msg_nessuna_nota').hide();
					// }else{
					// 	$('#msg_nessuna_nota').show();
					// }

					// mostro modale
					// forse da gestire anche se si tratta di pencil o altro
						//@Todo
				}else if (e.target.tagName === 'path') {
					$( "#slider" ).slider( "option", "min", 6 ); //imposta lo spessore minimo a 6px
					$('#demo_line').css("strokeWidth", $('#'+e.target.id).css('strokeWidth'));//setta lo spessore della linea "demo" a quello corrente
					$('#demo_line').css("stroke", $('#'+e.target.id).css('stroke'));//setta il colore della linea "demo" a quello corrente

					//calcoli per impostare la posiione dello slider allo stato di avanzamento corrente
					var min_slider = $( "#slider" ).slider( "option", "min" );
					var max_slider = $( "#slider" ).slider( "option", "max" );
					var current_thickness = parseInt($('#'+e.target.id).css('strokeWidth'));
					var slider_percentage = (((current_thickness - min_slider)/(max_slider - min_slider))*100);
					$( "#slider" ).find("span").css("left", slider_percentage+"%");

					var idElement = e.target.id;
					var objElement = $(idElement);

					$("#note_list > div[id^='text_note_']").hide();
					$('#note_list > #text_note_'+idElement).show();

					note_attr.innerHTML = /*object.note ? object.note : */'';
					var str = window.localStorage.getItem(app.getLocalStorageNamePencil());
				  var obj = JSON.parse(str);
					if(obj != null){
						$.each(obj.areas, function(k, v){
							if(v.id == e.target.id){
									app.drawTagsFields(v.tags);
							}
						});
					}


					// Mostro modale dettaglio annotazione
					$('#edit_details #delete_annotation').attr('data-idannotation',idElement);
					$('#delete_annotation').attr('data-figura','pencil');
					$('#edit_details').modal();

				}
			}
		};

		container.addEventListener('dblclick', onAreaDblClick, false);
		function onAreaClick(e) {
			if (mode != 'drawing') {
				if (e.target.tagName === 'rect' || e.target.tagName === 'circle' || e.target.tagName === 'polygon' || e.target.tagName === 'path') {
					$("div[id^='text_note_']").removeClass('alert-info');
					$("div[id^='text_note_']").addClass('well');
					$('#text_note_'+e.target.id).removeClass('well');
					$('#text_note_'+e.target.id).addClass('alert-info');

				}else{
						$('#div_result_tag').hide();
						$("div[id^='text_note_']").removeClass('alert-info');
						$("div[id^='text_note_']").addClass('well');
					}
				}
			};
		document.addEventListener('click', onAreaClick, false);


		/* Add keydown event for document */
		function onDocumentKeyDown(e) {
			var ctrlDown = e.ctrlKey || e.metaKey // PC || Mac

			switch (e.keyCode) {
				/* case KEYS.F1: /* F1 key */ /*
					help.show();
					e.preventDefault();

					break;
				 */
				case KEYS.ESC: /* ESC key */
					help.hide();
					if (is_draw) {
						is_draw = false;
						new_area.remove();
						objects.pop();
						app.removeAllEvents();
					} else if (mode === 'editing') {
						selected_area.redraw();
						app.removeAllEvents();
					};

					break;

				case KEYS.TOP: /* Top arrow key */
					if (mode === 'editing' && selected_area) {
						selected_area.setParams(selected_area.dynamicEdit(selected_area['move'](0, -1)));
						e.preventDefault();
					}

					break;

				case KEYS.BOTTOM: /* Bottom arrow key */
					if (mode === 'editing' && selected_area) {
						selected_area.setParams(selected_area.dynamicEdit(selected_area['move'](0, 1)));
						e.preventDefault();
					}
					break;

				case KEYS.LEFT: /* Left arrow key */
					if (mode === 'editing' && selected_area) {
						selected_area.setParams(selected_area.dynamicEdit(selected_area['move'](-1, 0)));
						e.preventDefault();
					}

					break;

				case KEYS.RIGHT: /* Right arrow key */
					if (mode === 'editing' && selected_area) {
						selected_area.setParams(selected_area.dynamicEdit(selected_area['move'](1, 0)));
						e.preventDefault();
					}

					break;

				case KEYS.DELETE: /* DELETE key */
					if (mode === 'editing' && selected_area) {
						$('#text_note_'+selected_area.id).remove();
						app.removeObject(selected_area);
						selected_area = null;
						info.unload();
						app.saveInLocalStorage();
					}

					break;

				case KEYS.I: /* i (edit info) key */
					if (mode === 'editing' && selected_area) {
						var params = selected_area.params,
							x = params.x || params.cx || params[0],
							y = params.y || params.cy || params[1];

						info.load(selected_area, x + app.getOffset('x'), y + app.getOffset('y'));
					}

					break;

				case KEYS.S: /* s (save) key */
					app.saveInLocalStorage();

					break;

				case KEYS.C: /* CTRL+C copy */
					if (mode === 'editing' && selected_area && ctrlDown) {
						var Constructor = null,
							area_params = selected_area.toJSON(),
							area;

						switch (area_params.type) {
							case 'rect':
								Constructor = Rect;
								break;

							case 'circle':
								Constructor = Circle;
								break;

							case 'polygon':
								Constructor = Polygon;
								break;

						}

						if (Constructor) {
							Constructor.createFromSaved(area_params);
							selected_area.setParams(selected_area.move(10, 10));
							selected_area.redraw();
						}
					}

					break;
			}
		}

		document.addEventListener('keydown', onDocumentKeyDown, false);

		/* Returned object */
		return {
			saveInLocalStorage : function() {
				var data = new Date();
				var obj = {
					areas : [],
					img : img_src,
					id_patient: null,
					id_episode: null,
					datetime: data
				};
				var foo = null;
				var bar = null;

				utils.foreach(objects, function(x) {
					foo = x.toJSON();
					obj.areas.push(foo);
				});

				window.localStorage.setItem(app.getLocalStorageNameShapes(), JSON.stringify(obj));

				$('#saved').fadeIn('slow',function(){$('#saved').fadeOut('slow');});

				if(app.getMode()==='drawing'){
					app.HideHelper(true);
					app.setMode(null).setShape(null); // Elimino modalità di disegno
					$('#'+foo.type).toggleClass('selected'); // Rimuovere selected class sul bottone
				}

			//cambiamento di colore della barra

			if($('#navigation_bar').hasClass('navbar-drawing')){
				$('#navigation_bar').removeClass('navbar-drawing').addClass('navbar-inverse');
			}

			return this;

			},
			getLocalStorageNameShapes(){
				return localStorageNameShapes;
			},
			getLocalStorageNamePencil(){
				return localStorageNamePencil;
			},
			getObjects: function(){
				return objects;
			},
			setEnablePencil: function(bool){
				$('#pencil').attr('data-isenabled', bool);
			},
			getEnablePencil: function(bool){
				return $('#pencil').attr('data-isenabled');
			},

			loadFromLocalStorage : function() {
				$("div[id^='text_note_']").remove(); //cancello tutte le note o ogni volta che ricarico le accoda
				var emptyLocalStorage = true;
				//caricamento pencil
				if (localStorage.getItem(app.getLocalStorageNamePencil()) != null) {
					emptyLocalStorage = false;
			    var str = window.localStorage.getItem(app.getLocalStorageNamePencil());
			    var obj = JSON.parse(str);

			    $.each(obj.areas, function(k,v){
						var g = document.createElementNS('http://www.w3.org/2000/svg','g');
			      var pencil_draw = document.createElementNS('http://www.w3.org/2000/svg', 'path');
						pencil_draw.setAttribute('id', v.id);
			      pencil_draw.setAttribute('style', [
			          'fill:' + v.fill,
			          'stroke:' + v.stroke,
			          'stroke-width:' + v.strokeWidth
			      ].join(';'));
			      pencil_draw.setAttribute('d', 'M ' + v.coords.join(' L '));
						g.appendChild(pencil_draw);
			      $('#svg').append(g);
						app.drawNoteFields(v.note);
			    });
				}
				//caricamento altre forme
				if (localStorage.getItem(app.getLocalStorageNameShapes()) != null) {
					emptyLocalStorage = false;
					var str = window.localStorage.getItem(app.getLocalStorageNameShapes()),
						obj = JSON.parse(str),
						areas = obj.areas;

					utils.foreach(areas, function(x) {
						switch (x.type) {
							case 'rect':
								if (x.coords.length === 4) {
									Rect.createFromSaved({
										id : x.id,
										coords : x.coords,
										note   : x.note,
										tags   : x.tags,
										stroke : x.stroke,
										strokeWidth : x.strokeWidth,
									});
									$('#text_note_'+x.id).show();
								}
								break;

							case 'circle':
								if (x.coords.length === 3) {
									Circle.createFromSaved({
										id : x.id,
										coords : x.coords,
										note   : x.note,
										tags   : x.tags,
										stroke : x.stroke,
										strokeWidth : x.strokeWidth,
									});
									$('#text_note_'+x.id).show();
								}
								break;

							case 'polygon':
								if (x.coords.length >= 6 && x.coords.length % 2 === 0) {
									Polygon.createFromSaved({
										id : x.id,
										coords : x.coords,
										note   : x.note,
										tags   : x.tags,
										stroke : x.stroke,
										strokeWidth : x.strokeWidth,
									});
									$('#text_note_'+x.id).show();
								}
								break;
						}
					});
					app.HideHelper(true);
				}
				if(emptyLocalStorage) {
					$('#empty').fadeIn('slow',function(){$('#empty').fadeOut('slow');});
				}
				return this;
			},

			drawNoteFields : function(notes){
				if(notes.length != 0){
					//tolto display:none per mostra/nascondi note
					var html ='<div class="col-xs-12 well" id ="text_note_'+notes[0].id+'">'+
					 						'<table class="table table-condensed table-stripped"> '+
												' ID OGGETTO: '+ notes[0].id+
												' <thead> <tr>';

					$.each(notes[0], function(k,v){
						if(k != 'priorita' && k!='id')
							html += '<th>'+ k + '</th>';
					});
					html += '</tr> </thead> <tbody>';
					for(var i=notes.length-1 ; i>=0; i--){
						if(notes[i].priorita != ''){
							html += '<tr class="text-'+notes[i].priorita+'">';
						}else{
							html += '<tr>';
						}
						var foo = null;
						$.each(notes[i], function(kk,vv){
							if(kk != 'priorita' && kk != 'id' ){
								if(kk == 'datetime'){
									 foo = new Date(vv);
									 html += '<td><small>'+ foo.toString("d/M/yyyy HH:mm:ss") + '</small></td>';
								}else{
									vv = (vv == 'null' || vv == null) ? '' : vv;
									html += '<td><small>'+ vv + '</small></td>';
								}
							}
						});
						html+='</tr>';
				}


//creo l'html per la visualizzazione solo dell'ultima nota a lato

					var html_side ='<div class="col-xs-12 well" id ="text_note_'+notes[notes.length-1].id+'">'+
											'<table class="table table-condensed table-stripped"> '+
												' ID OGGETTO: '+ notes[notes.length-1].id+
												' <thead> <tr>';

						$.each(notes[notes.length-1], function(k,v){
								if(k != 'priorita' && k!='id'){
										html_side += '<th>'+ k + '</th>';
									}
						});
						html_side += '</tr> </thead> <tbody>';
						if(notes[notes.length-1].priorita != ''){
							html_side += '<tr class="text-'+notes[notes.length-1].priorita+'">';
						}else{
							html_side += '<tr>';
						}
						var foo = null;
						$.each(notes[notes.length-1], function(kk,vv){
							if(kk != 'priorita' && kk != 'id' ){
								if(kk == 'datetime'){
								 foo = new Date(vv);
								 html_side += '<td><small>'+ foo.toString("d/M/yyyy HH:mm:ss") + '</small></td>';
								}else{
									vv = (vv == 'null' || vv == null) ? '' : vv;
									html_side += '<td><small>'+ vv + '</small></td>';
								}
							}
						});
						html_side+='</tr>';

					$('div#note_list').append(html+'<br/>');
					$('div#note_list_side').append(html_side+'<br/>');

				}
			},
			drawTagsFields : function(tags){
				if(typeof(tags) != 'undefined'){
					if(tags.length != 0){
							$.each(tags,function(k,v){
								$('select[name="tag"]').val(v.contenuto).trigger("chosen:updated");
							});
					}else{
							$('select[name="tag"]').val('').trigger("chosen:updated");
					}
				}else{
					$('select[name="tag"]').val('').trigger("chosen:updated");
				}
			},
			clearElementFromLocalStorage : function(id, localStorageName){
				if(window.localStorage.getItem(localStorageName)){
					var dati_json = window.localStorage.getItem(localStorageName),
					oggetto_json = $.parseJSON(dati_json);
					var new_array = [];

					$.each(oggetto_json.areas, function(k,v){
						if(v.id != id)
						new_array.push(v);
					});

					oggetto_json.areas = new_array;
					window.localStorage.setItem(localStorageName, JSON.stringify(oggetto_json));
				}
			},

			setHideNoteAttr : function(val){
				this.hideNote = val;
				return this;
			},

			getHideNoteAttr: function(){
				return this.hideNote;
			},

			hide : function() {
				utils.hide(wrapper);
				return this;
			},
			show : function() {
				utils.show(wrapper);
				return this;
			},
			recalcOffsetValues: function() {
				recalcOffsetValues();
				return this;
			},
			setDimensions : function(width, height) {
				$('#note_list_side').attr('style','max-height:'+(height-60)); //setta la lunghezza massima del div delle note
				svg.setAttribute('width', width);
				svg.setAttribute('height', height);
				container.style.width = width + 'px';
				container.style.height = height + 'px';
				return this;
			},
			addNodeToSvg : function(node) {
				svg.appendChild(node);
				return this;
			},
			removeNodeFromSvg : function(node) {
				svg.removeChild(node);
				return this;
			},
			getOffset : function(arg) {
				switch(arg) {
				case 'x':
					return offset.x;
					break;
				case 'y':
					return offset.y;
					break;
				}
				return undefined;
			},
			clear : function(){
				//remove all areas
				objects.length = 0;
				while(svg.childNodes[0]) {
					svg.removeChild(svg.childNodes[0]);
				}
				// code.hide();
				info.unload();
				return this;
			},
			removeObject : function(obj) {
				utils.foreach(objects, function(x, i) {
					if(x === obj) {
						objects.splice(i, 1);
					}
				});
				obj.remove();
				return this;
			},
			deselectAll : function() {
				utils.foreach(objects, function(x) {
					x.deselect();
				});
				return this;
			},

			getIsDraw : function() {
				return is_draw;
			},
			setIsDraw : function(arg) {
				is_draw = arg;
				if(is_draw){
					app.setEnablePencil("false");
				}else{
					app.setEnablePencil("true");
				}
				return this;
			},
			setMode : function(arg) {
				mode = arg;
				return this;
			},
			getMode : function() {
				return mode;
			},
			setShape : function(arg) {
				shape = arg;
				return this;
			},
			getShape : function() {
				return shape;
			},
			addObject : function(object) {
				objects.push(object);
				return this;
			},
			getNewArea : function() {
				return new_area;
			},
			resetNewArea : function() {
				new_area = null;
				return this;
			},
			getSelectedArea : function() {
				return selected_area;
			},
			setSelectedArea : function(obj) {
				selected_area = obj;
				return this;
			},
			getEditType : function() {
				return edit_type;
			},
			setFilename : function(str) {
				filename = str;
				return this;
			},
			setEditClass : function() {
				utils.removeClass(container, 'draw')
					 .addClass(container, 'edit');
				return this;
			},
			setDrawClass : function() {
				utils.removeClass(container, 'edit')
					  .addClass(container, 'draw');
				return this;
			},
			setDefaultClass : function() {
				utils.removeClass(container, 'edit')
					 .removeClass(container, 'draw');
				return this;
			},
			addEvent : function(target, eventType, func) {
				events.push(new AppEvent(target, eventType, func));
				return this;
			},
			removeAllEvents : function() {
				utils.foreach(events, function(x) {
					x.remove();
				});
				events.length = 0;
				return this;
			},
			getHTMLCode : function(arg) {
				var html_code = '';
				if (arg) {
					if (!objects.length) {
						return '0 objects';
					}
					html_code += utils.encode('<img src="' + filename + '" alt="" usemap="#map" />') +
						'<br />' + utils.encode('<map name="map">') + '<br />';
					utils.foreachReverse(objects, function(x) {
						html_code += '&nbsp;&nbsp;&nbsp;&nbsp;' + utils.encode(x.toString()) + '<br />';
					});
					html_code += utils.encode('</map>');
				} else {
					utils.foreachReverse(objects, function(x) {
						html_code += x.toString();
					});
				}
				return html_code;
			},
			getThisObj: function(){
				return this;
			},
			HideHelper: function(bool){
				if(!bool){
					$('.helper').each(function(){
					  var classi = $(this).attr('class');
					  var rclass = classi.replace(new RegExp('(\\s|^)' + 'hide' + '(\\s|$)', 'g'), '$2');
					  $(this).attr('class',rclass);
					});
				}else{
					$('.helper').each(function(){
					  var classi = $(this).attr('class');
					  $(this).attr('class',classi+' hide');
					});
				}
			}
		};
	})();

    /* Edit selected area info */
	var info = (function() {
		var form = utils.id('edit_details'),
			header = form.querySelector('h5'),
			note_attr = utils.id('note_attr'),
			save_button = utils.id('save_details'),
			//close_button = utils.id('close_button'), //cambiato da form.querySelector('.close_button'),
			sections = form.querySelectorAll('p'),
			obj,
			x,
			y,
			temp_x,
			temp_y;



		function changedReset() {
			utils.removeClass(form, 'changed');
			utils.foreach(sections, function(x) {
				utils.removeClass(x, 'changed');
			});
		}

		function save(e) {
		//	$('#color_val').val()
			var date = new Date();
			var alldatas_note = {
				id : $('#delete_annotation').attr('data-idannotation'),
				datetime : date,
				autore : null,
				priorita: $('select[name="priorita"]').val(),
				contenuto: ( note_attr.innerHTML != '') ? note_attr.innerHTML : null
			};
			var tags = $('#note_attr').children();
			var tag_exists;
				if(tags.length>0){
					tag_exists = true;
				}else {
					tag_exists = false;
				}
			var alldatas_tags = {
				id : $('#delete_annotation').attr('data-idannotation'),
				datetime : date,
				autore : null,
				priorita: $('select[name="priorita"]').val(),
				contenuto: []
			};


		if($('#delete_annotation').attr('data-figura') != 'pencil'){

				//imposta il colore dal colorpicker
				if(($('#color_val').val()!="") && ($('#color_val').val()!="undefined")){
					$('svg').find('#'+alldatas_note.id).css('stroke',$('#color_val').val());
					obj.stroke = $('#color_val').val(); //salva il colore della forma nell'oggetto. sarà salvato nel localsotrage da saveInLocalStorage
					$('#color_val').val("undefined"); //resetta il valore del colore (per evitare che resti impostato nelle altre forme)
					$('.colorInner').removeAttr("style");//ricolora il pallino di grigio
				}
				//imposta lo spessore linea
				if(($('#line_thickness').attr('value') != undefined)&&($('#line_thickness').attr('value') != "")){
					$('svg').find('#'+alldatas_note.id).css('strokeWidth',$('#line_thickness').val());
					obj.strokeWidth  = $('#line_thickness').val();
					$('#line_thickness').val(undefined);
				}

			// Aggiungo note o TAGS solo se esistono
				if(alldatas_note.contenuto!=null){
					obj.note.push(alldatas_note);
					//to show notes
		 			if($('#text_note_'+obj.id).length){
					//if a note container already exists
						if($('select[name="priorita"]').val() != ''){
								var html = '<tr class="text-'+$('select[name="priorita"]').val()+'">';
							}else{
								var html = '<tr>';
							}
							$.each(alldatas_note, function(k,v){
								if(k != 'priorita' && k != 'id'){
									if(k == 'datetime'){
								 		foo = new Date(v);
								 		html += '<td><small>'+ foo.toString("d/M/yyyy HH:mm:ss") + '</small></td>';
									}else{
										v = (v == 'null' || v == null) ? '' : v;
										html += '<td><small>'+ v + '</small></td>';
									}
								}
							});
							$('#note_list > #text_note_'+obj.id).find( "tbody" ).prepend(html); //relativo allo storico
							$('#text_note_'+obj.id).find("tbody").find( "tr" ).remove();//toglie la nota precedente dal lato
							$('#text_note_'+obj.id).find( "tbody" ).append(html); //appende l'ultiima nota
						}else{
							//if doesn't exist any note container
							var foo = [];
							foo.push(alldatas_note);
							app.drawNoteFields(foo);
						}
						(obj.note.length > 0 && (app.getHideNoteAttr() == false || typeof(app.getHideNoteAttr()) == 'undefined')) ? obj.with_note() : obj.without_note();
					}
					//memorizzo il tag
					if(tag_exists){
						$.each(tags, function(kk,vv){
							if(vv.innerHTML != "<br>" && vv.innerHTML !=""){
								alldatas_tags.contenuto.push(vv.innerHTML);
							}
						});
						obj.tags.push(alldatas_tags);
					}

					app.saveInLocalStorage(); //SALVATAGGIO NOTA
					changedReset();
					unload();
					e.preventDefault();

			// Aggiungo nota per Pencil
		}else{
			
				var idElement = $('#delete_annotation').attr('data-idannotation');
				var jsonPencil = window.localStorage.getItem(app.getLocalStorageNamePencil());
				var new_array = [];
				if(jsonPencil != null){
					var parseJson = $.parseJSON(jsonPencil);
					$.each(parseJson.areas, function(k,v){
						if(v.id != idElement){
							new_array.push(v);
						}else{
							//salva colore
							if(($('#color_val').val()!="")&&($('#color_val').val()!="undefined") ){//salva il colore della linea
								$('svg').find('#'+alldatas_note.id).css('stroke',$('#color_val').val());
								v.stroke = $('#color_val').val();
								$('#color_val').val("undefined");//resetta il valore del colore (per evitare che resti impostato nelle altre forme)
								$('.colorInner').removeAttr("style");//ricolora il pallino di grigio
							}
							if(($('#line_thickness').attr('value')!="")&&($('#line_thickness').attr('value') != undefined) ){//salva il colore della linea
								$('svg').find('#'+alldatas_note.id).css('strokeWidth',$('#line_thickness').val());
								v.strokeWidth = $('#line_thickness').val();
							}
							//salva spessore linea

							if(alldatas_note.contenuto != null){
								v.note.push(alldatas_note);
								if($('#text_note_'+idElement).length){
									//if a note container already exists
									if($('select[name="priorita"]').val() != ''){
										var html = '<tr class="text-'+$('select[name="priorita"]').val()+'">';
									}else{
										var html = '<tr>';
									}
									$.each(alldatas_note, function(k,v){
										if(k != 'priorita' && k != 'id'){
											if(k == 'datetime'){
											 	foo = new Date(v);
											 	html += '<td><small>'+ foo.toString("d/M/yyyy HH:mm:ss") + '</small></td>';
											}else{
												v = (v == 'null' || v == null) ? '' : v;
												html += '<td><small>'+ v + '</small></td>';
											}
										}
									});
									$('#note_list > #text_note_'+idElement).find( "tbody" ).prepend(html);//appende allo storico
									$('#text_note_'+idElement).find("tbody").find( "tr" ).remove();//cancella la nota precedente dal lato
									$('#text_note_'+idElement).find( "tbody" ).append(html);//appende l'ultima nota
									}else{
										//if doesn't exist any note container
											var foo = [];
											foo.push(alldatas_note);
											app.drawNoteFields(foo);
									}
									new_array.push(v);
							}else{
									new_array.push(v);
							}
							//memorizzo il tag

							if(tag_exists){
									$.each($('#note_attr').children(), function(kk,vv){
										if(v.innerHTML != "<br>" && v.innerHTML !=""){
											alldatas_tags.contenuto.push(vv.innerHTML);
										}
									});
									v.tags.push(alldatas_tags);
							}
						}
					});
					parseJson.areas = new_array;
					window.localStorage.setItem(app.getLocalStorageNamePencil(), JSON.stringify(parseJson));
				}
					$('#edit_details').modal('hide');
			}

			// Azzero priorita
			$('select[name="priorita"]').val('').trigger("chosen:updated");
		};


		function unload() {
			obj = null;
			changedReset();
			$('#edit_details').modal('hide');
			//utils.hide(form);

		}

		function setCoords(x, y) {
			form.style.left = (x + 5) + 'px';
			form.style.top = (y + 5) + 'px';
		}

		function moveEditBlock(e) {
			setCoords(x + e.pageX - temp_x, y + e.pageY - temp_y);
		}

		function stopMoveEditBlock(e) {
			x = x + e.pageX - temp_x;
			y = y + e.pageY - temp_y;
			setCoords(x, y);

			app.removeAllEvents();
		}

		function change() {
			utils.addClass(form, 'changed');
			utils.addClass(this.parentNode, 'changed');
		}

		save_button.addEventListener('click', save, false);

		//note_attr.addEventListener('keydown', function(e) { e.stopPropagation(); }, false);

		//note_attr.addEventListener('change', change, false);

		//close_button.addEventListener('click', unload, false);

		header.addEventListener('mousedown', function(e) {
			temp_x = e.pageX,
			temp_y = e.pageY;

			app.addEvent(document, 'mousemove', moveEditBlock);
			app.addEvent(header, 'mouseup', stopMoveEditBlock);

			e.preventDefault();
		}, false);

		return {
				load : function(object, new_x, new_y) {
				obj = object;
				note_attr.innerHTML = /*object.note ? object.note : */''; //AZZERA IL CAMPO INPUT DELLA FORM

				// Carico TAGS in base all'oggetto selezionato
				app.drawTagsFields(obj.tags);

				// Mostro modale dettaglio annotazione
				$('#edit_details #delete_annotation').attr('data-idannotation',obj.id);
				$('#edit_details #delete_annotation').attr('data-figura',$('#'+obj.id).prop("tagName"));
				$('#edit_details').modal();
			},
			unload : unload
		};
	})();

	/* Buttons and actions */
	var buttons = (function() {
		var all = utils.id('navbar').getElementsByTagName('li'),
			//save = utils.id('save'),
			load = utils.id('load'),
			rectangle = utils.id('rect'),
			circle = utils.id('circle'),
			polygon = utils.id('polygon'),
			pencil = utils.id('pencil'),
			edit = utils.id('edit'),
			clear = utils.id('clear'),
			clearall = utils.id('clearall');
			//from_html = utils.id('from_html'),
			//to_html = utils.id('to_html'),
			//preview = utils.id('preview'),
			//new_image = utils.id('new_image'),
			//show_help = utils.id('show_help');

		function deselectAll() {
			utils.foreach(all, function(x) {
				utils.removeClass(x, 'selected');
			});
		}

		function selectOne(button) {
			deselectAll();
			utils.addClass(button, 'selected');
		}

		/* function onSaveButtonClick(e) {
			// Save in localStorage
			app.saveInLocalStorage();

			e.preventDefault();
		} */

		function onLoadButtonClick(e) {
			// Load from localStorage
			app.clear()
			   .loadFromLocalStorage();
			e.preventDefault();

		}
		function onPencilButtonClick(e) {
			if(!app.getEnablePencil()){
				app.setMode('drawing')
					 .setDrawClass()
					 .setShape(this.id)
					 .deselectAll();
				info.unload();
				selectOne(this);

				e.preventDefault();
			}else{
				app.setMode(null);
			}
		}

		function onShapeButtonClick(e) {



			$('#icona_modifica').removeClass('icon-toggle-on').addClass('icon-toggle-off');
			app.HideHelper(false);

			//cambiamento di colore della barra
			if($('#navigation_bar').hasClass('navbar-inverse')){
				$('#navigation_bar').removeClass('navbar-inverse');
				$('#navigation_bar').addClass('navbar-drawing');
			}else if($('#navigation_bar').hasClass('navbar-edit')){
				$('#navigation_bar').removeClass('navbar-edit');
				$('#navigation_bar').addClass('navbar-drawing');
			}
			// shape = rect || circle || polygon
			app.setMode('drawing')
			   .setDrawClass()
			   .setShape(this.id)
			   .deselectAll();
			info.unload();
			selectOne(this);

			if(typeof(pencilOBJ) != 'undefined'){
				pencilOBJ.disable();
			}

			e.preventDefault();
		}



		function onClearButtonClick(e) {
			$('#modal_pulisci').modal();
		}
		$('#ok_pulisci').click(function(e){
			$('#navigation_bar').removeClass('navbar-drawing');
			$('#navigation_bar').removeClass('navbar-edit');
			$('#navigation_bar').addClass('navbar-inverse');
			$('#icona_modifica').removeClass('icon-toggle-on').addClass('icon-toggle-off');
			//disabilita la matita se in uso
			if(typeof(pencilOBJ) != 'undefined'){
					pencilOBJ.disable();
			}

			e.preventDefault();
			app.setMode(null)
				.setDefaultClass()
				.setShape(null)
				.clear();
			deselectAll();
			$('#modal_pulisci').modal('hide');
				$("div[id^='text_note_']").hide();
		});

		function onClearAllButtonClick(e) {

			$('#modal_cancella_tutto').modal();
		}
		$('#ok_cancella_tutto').click(function(e){
			$('#navigation_bar').removeClass('navbar-drawing');
			$('#navigation_bar').removeClass('navbar-edit');
			$('#navigation_bar').addClass('navbar-inverse');
			$('#icona_modifica').removeClass('icon-toggle-on').addClass('icon-toggle-off');
			//disabilita la matita se in uso
			if(typeof(pencilOBJ) != 'undefined'){
				pencilOBJ.disable();
			}
			$("div[id^='text_note_']").remove();

			e.preventDefault();
			app.setMode(null)
				.setDefaultClass()
				.setShape(null)
				.clear();
			deselectAll();
			localStorage.removeItem(app.getLocalStorageNameShapes());
			localStorage.removeItem(app.getLocalStorageNamePencil());
			$('#modal_cancella_tutto').modal('hide');
		});
		function onEditButtonClick(e) {
			if(typeof(pencilOBJ) != 'undefined'){
				pencilOBJ.disable();
			}
			if (app.getMode() === 'editing') {
				app.HideHelper(true);
				// Cambio etichetta pulsante
				$('#icona_modifica').removeClass('icon-toggle-on').addClass('icon-toggle-off');
				// Azione pulsante
				app.setMode(null)
				   .setDefaultClass()
				   .deselectAll();
				deselectAll();
				utils.show(svg);
				app.setEnablePencil(true);
				// Cambiamento colore della barra
				if($('#navigation_bar').hasClass('navbar-edit')){
					$('#navigation_bar').toggleClass('navbar-edit');
					$('#navigation_bar').addClass('navbar-inverse');
				}
			}else {
				app.HideHelper(false);
				app.setEnablePencil(true);
				// Cambio etichetta pulsante
				$('#icona_modifica').removeClass('icon-toggle-off').addClass('icon-toggle-on');

				// Azione pulsante
				app.setShape(null)
				   .setMode('editing')
				   .setEditClass();
				selectOne(this);
				$('#ban').removeClass('hide'); //gestione dinamica pulsante modifica
				if($('#navigation_bar').hasClass('navbar-inverse')){
					$('#navigation_bar').toggleClass('navbar-inverse');
					$('#navigation_bar').addClass('navbar-edit');
				}else{
					$('#navigation_bar').toggleClass('navbar-drawing');
					$('#navigation_bar').addClass('navbar-edit');
				}
			}
			e.preventDefault();
		}

		//save.addEventListener('click', onSaveButtonClick, false);
		load.addEventListener('click', onLoadButtonClick, false);
		rectangle.addEventListener('click', onShapeButtonClick, false);
		circle.addEventListener('click', onShapeButtonClick, false);
		polygon.addEventListener('click', onShapeButtonClick, false);
		pencil.addEventListener('click', onPencilButtonClick, false);
		clear.addEventListener('click', onClearButtonClick, false);
		clearall.addEventListener('click', onClearAllButtonClick, false);
		//from_html.addEventListener('click', onFromHtmlButtonClick, false);
		//to_html.addEventListener('click', onToHtmlButtonClick, false);
		//preview.addEventListener('click', onPreviewButtonClick, false);
		edit.addEventListener('click', onEditButtonClick, false);
		// new_image.addEventListener('click', onNewImageButtonClick, false);
		//show_help.addEventListener('click', onShowHelpButtonClick, false);
	})();


	/* AppEvent constructor */
	function AppEvent(target, eventType, func) {
		this.target = target;
		this.eventType = eventType;
		this.func = func;

		target.addEventListener(eventType, func, false);
	};

	AppEvent.prototype.remove = function() {
		this.target.removeEventListener(this.eventType, this.func, false);
	};


	/* Helper constructor */
	function Helper(node, x, y) {
		this.helper = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		this.helper.setAttribute('class', 'helper');
		this.helper.setAttribute('height', 5);
		this.helper.setAttribute('width', 5);
		this.helper.setAttribute('x', x-3);
		this.helper.setAttribute('y', y-3);
		node.appendChild(this.helper);
	};

	Helper.prototype.setCoords = function(x, y) {
		this.helper.setAttribute('x', x-3);
		this.helper.setAttribute('y', y-3);

		return this;
	};

	Helper.prototype.setAction = function(action) {
		this.helper.action = action;

		return this;
	};

	Helper.prototype.setCursor = function(cursor) {
		utils.addClass(this.helper, cursor);

		return this;
	};

	Helper.prototype.setId = function(id) {
		this.helper.n = id;

		return this;
	};

	/* Rectangle constructor */
	var Rect = function (x, y){
		app.setIsDraw(true);

		//this.fill = 'rgba(255,255,255,0.3)';
		this.stroke = '#000';
		this.strokeWidth = '3px';

		this.id =  utils.generateId(); //create id

		this.params = {
			x : x, //distance from the left edge of the image to the left side of the rectangle
			y : y, //distance from the top edge of the image to the top side of the rectangle
			width : 0, //width of rectangle
			height : 0 //height of rectangle
		};

		this.note = [];			//note attribute - not required
		this.tags = [];		 //tags attribute - not required

		this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); //container
		this.rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); //rectangle
		app.addNodeToSvg(this.g);
		this.g.appendChild(this.rect);

		this.g.obj = this; /* Link to parent object */

		this.helpers = { //object with all helpers-rectangles
			center : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			top : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			bottom : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			left : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			right : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			top_left : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			top_right : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			bottom_left : new Helper(this.g, x-this.params.width/2, y-this.params.height/2),
			bottom_right : new Helper(this.g, x-this.params.width/2, y-this.params.height/2)
		};

		this.helpers.center.setAction('move').setCursor('move');
		this.helpers.left.setAction('editLeft').setCursor('e-resize');
		this.helpers.right.setAction('editRight').setCursor('w-resize');
		this.helpers.top.setAction('editTop').setCursor('n-resize');
		this.helpers.bottom.setAction('editBottom').setCursor('s-resize');
		this.helpers.top_left.setAction('editTopLeft').setCursor('nw-resize');
		this.helpers.top_right.setAction('editTopRight').setCursor('ne-resize');
		this.helpers.bottom_left.setAction('editBottomLeft').setCursor('sw-resize');
		this.helpers.bottom_right.setAction('editBottomRight').setCursor('se-resize');

		this.select().redraw();

		/* Add this object to array of all objects */
		app.addObject(this);
	};

	Rect.prototype.setCoords = function(params){
		this.rect.setAttribute('id', this.id); //set id attribute
		this.rect.setAttribute('x', params.x);
		this.rect.setAttribute('y', params.y);
		this.rect.setAttribute('width', params.width);
		this.rect.setAttribute('height', params.height);
		this.rect.setAttribute('style', [
        //'fill:' + this.fill,
        'stroke:' + this.stroke,
        'stroke-width:' + this.strokeWidth
    ].join(';'));

		this.helpers.center.setCoords(params.x + params.width/2, params.y + params.height/2);
		this.helpers.top.setCoords(params.x + params.width/2, params.y);
		this.helpers.bottom.setCoords(params.x + params.width/2, params.y + params.height);
		this.helpers.left.setCoords(params.x, params.y + params.height/2);
		this.helpers.right.setCoords(params.x + params.width, params.y + params.height/2);
		this.helpers.top_left.setCoords(params.x, params.y);
		this.helpers.top_right.setCoords(params.x + params.width, params.y);
		this.helpers.bottom_left.setCoords(params.x, params.y + params.height);
		this.helpers.bottom_right.setCoords(params.x + params.width, params.y + params.height);

		return this;
	};

	Rect.prototype.setParams = function(params){
		this.params.x = params.x;
		this.params.y = params.y;
		this.params.width = params.width;
		this.params.height = params.height;

		return this;
	};

	Rect.prototype.redraw = function() {
		this.setCoords(this.params);

		return this;
	};

	Rect.prototype.dynamicDraw = function(x1,y1,square){
		var x0 = this.params.x,
			y0 = this.params.y,
			new_x,
			new_y,
			new_width,
			new_height,
			delta,
			temp_params;

		new_width = Math.abs(x1-x0);
		new_height = Math.abs(y1-y0);

		if (square) {
			delta = new_width-new_height;
			if (delta > 0) {
				new_width = new_height;
			} else {
				new_height = new_width;
			}
		}

		if (x0>x1) {
			new_x = x1;
			if (square && delta > 0) {
				new_x = x1 + Math.abs(delta);
			}
		} else {
			new_x = x0;
		}

		if (y0>y1) {
			new_y = y1;
			if (square && delta < 0) {
				new_y = y1 + Math.abs(delta);
			}
		} else {
			new_y = y0;
		}

		temp_params = { /* params */
			x : new_x,
			y : new_y,
			width : new_width,
			height: new_height
		};

		this.setCoords(temp_params);

		return temp_params;
	};

	Rect.prototype.onDraw = function(e) {
		var _n_f = app.getNewArea(),
		    square = e.shiftKey ? true : false;

		_n_f.dynamicDraw(utils.rightX(e.pageX), utils.rightY(e.pageY), square);
	};

	Rect.prototype.onDrawStop = function(e) {

		var _n_f = app.getNewArea(),
		    square = e.shiftKey ? true : false;

		_n_f.setParams(_n_f.dynamicDraw(utils.rightX(e.pageX), utils.rightY(e.pageY), square)).deselect();

		// icona note
		var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
		iconObj.setAttribute('x',_n_f.params.x+_n_f.params.width-3)
		iconObj.setAttribute('y',_n_f.params.y+_n_f.params.height-3)
		iconObj.setAttribute('width',32)
		iconObj.setAttribute('height',32)
		iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
		_n_f.g.insertBefore(iconObj,_n_f.g.firstChild);

		app.removeAllEvents()
		   .setIsDraw(false)
		   .resetNewArea()
		   .saveInLocalStorage() //SALVATAGGIO AUTOMATICO
			 .setEnablePencil("true");
	};

	Rect.prototype.move = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.x += dx;
		temp_params.y += dy;

		return temp_params;
	};

	Rect.prototype.editLeft = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.x += dx;
		temp_params.width -= dx;

		return temp_params;
	};

	Rect.prototype.editRight = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.width += dx;

		return temp_params;
	};

	Rect.prototype.editTop = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.y += dy;
		temp_params.height -= dy;

		return temp_params;
	};

	Rect.prototype.editBottom = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.height += dy;

		return temp_params;
	};

	Rect.prototype.editTopLeft = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.x += dx;
		temp_params.y += dy;
		temp_params.width -= dx;
		temp_params.height -= dy;

		return temp_params;
	};

	Rect.prototype.editTopRight = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.y += dy;
		temp_params.width += dx;
		temp_params.height -= dy;

		return temp_params;
	};

	Rect.prototype.editBottomLeft = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.x += dx;
		temp_params.width -= dx;
		temp_params.height += dy;

		return temp_params;
	};

	Rect.prototype.editBottomRight = function(dx, dy) { //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.width += dx;
		temp_params.height += dy;

		return temp_params;
	};

	Rect.prototype.dynamicEdit = function(temp_params, save_proportions) {
		if (temp_params.width < 0) {
			temp_params.width = Math.abs(temp_params.width);
			temp_params.x -= temp_params.width;
		}

		if (temp_params.height < 0) {
			temp_params.height = Math.abs(temp_params.height);
			temp_params.y -= temp_params.height;
		}

		if (save_proportions) {
			var proportions = this.params.width / this.params.height,
				new_proportions = temp_params.width / temp_params.height,
				delta = new_proportions - proportions,
				x0 = this.params.x,
				y0 = this.params.y,
				x1 = temp_params.x,
				y1 = temp_params.y;

			if (delta > 0) {
				temp_params.width = Math.round(temp_params.height * proportions);
			} else {
				temp_params.height = Math.round(temp_params.width / proportions);
			}

		}

		this.setCoords(temp_params);

		return temp_params;

	};

	Rect.prototype.onEdit = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType(),
			save_proportions = e.shiftKey ? true : false;

		_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y), save_proportions);
	};

	Rect.prototype.onEditStop = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType(),
			save_proportions = e.shiftKey ? true : false;

		_s_f.setParams(_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y), save_proportions));
		app.removeAllEvents()
			.saveInLocalStorage(); //SALVATAGGIO AUTOMATICO

	};

	Rect.prototype.remove = function() {
		app.removeNodeFromSvg(this.g);
	};

	Rect.prototype.select = function() {
		utils.addClass(this.rect, 'selected');

		return this;
	};

	Rect.prototype.deselect = function() {
		utils.removeClass(this.rect, 'selected');

		return this;
	};

	Rect.prototype.with_note = function() {
		$('#'+this.id).parent('g').find('i[name="iconNote"]').each(function(){
			var classi = $(this).attr('class');
			var rclass = classi.replace(new RegExp('(\\s|^)' + 'hide' + '(\\s|$)', 'g'), '$2');
			$(this).attr('class',rclass);
		});
		return this;
	}

	Rect.prototype.without_note = function() {
		$('#'+this.id).parent('g').find('i[name="iconNote"]').each(function(){
		    var classi = $(this).attr('class');
		    $(this).attr('class',classi+' hide');
		  });
		return this;

	}

	Rect.prototype.toString = function() { //to html map area code
		var x2 = this.params.x + this.params.width,
			y2 = this.params.y + this.params.height;
		return '<area shape="rect" coords="'
			+ this.params.x + ', '
			+ this.params.y + ', '
			+ x2 + ', '
			+ y2
			+ '"'
			+ (this.note ? ' note="' + this.note + '"' : '')

			+ ' />';
	};

	Rect.createFromSaved = function(params) {
		var coords = params.coords,
		area = new Rect(coords[0], coords[1]);
		area.id = params.id;	//added to keep the same id
		area.note = params.note;
		area.tags = params.tags;
		area.stroke = params.stroke;
		area.strokeWidth = params.strokeWidth;

		area.setParams(area.dynamicDraw(coords[2], coords[3])).deselect();
		app.drawNoteFields(area.note);

		if(area.note.length > 0){
			// icona note
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',(coords[0]-3))
			iconObj.setAttribute('y',(coords[1]-3))
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}else{
			// icona note
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',(coords[0]-3))
			iconObj.setAttribute('y',(coords[1]-3))
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}

		app.setIsDraw(false)
		   .resetNewArea();
	};

	Rect.prototype.toJSON = function() {
		return {
			id : this.id,
			type   : 'rect',
			coords : [
				this.params.x,
				this.params.y,
				this.params.x + this.params.width,
				this.params.y + this.params.height
			],
			note   : this.note,
			tags   : this.tags,
			//fill	 : this.fill, //salva stile forma
			stroke : this.stroke,
			strokeWidth : this.strokeWidth,
		}
	};

	/* Circle constructor */
	var Circle = function (x, y){
		app.setIsDraw(true);

		//this.fill = 'rgba(255,255,255,0.3)';
		this.stroke = '#000';
		this.strokeWidth = '3px';

		this.id =  utils.generateId(); //create id

		this.params = {
			cx : x, //distance from the left edge of the image to the center of the circle
			cy : y, //distance from the top edge of the image to the center of the circle
			radius : 0 //radius of the circle
		};

		this.note = []; //note attribute - not required
		this.tags = []; //tags attribute - not required

		this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		app.addNodeToSvg(this.g);
		this.g.appendChild(this.circle);

		this.g.obj = this; /* Link to parent object */

		this.helpers = { //array of all helpers-rectangles
			center : new Helper(this.g, x, y),
			top : new Helper(this.g, x, y),
			bottom : new Helper(this.g, x, y),
			left : new Helper(this.g, x, y),
			right : new Helper(this.g, x, y)
		};

		this.helpers.center.setAction('move');
		this.helpers.top.setAction('editTop').setCursor('n-resize');
		this.helpers.bottom.setAction('editBottom').setCursor('s-resize');
		this.helpers.left.setAction('editLeft').setCursor('w-resize');
		this.helpers.right.setAction('editRight').setCursor('e-resize');

		this.select().redraw();



		app.addObject(this); //add this object to array of all objects
	};

	Circle.prototype.setCoords = function(params){

		this.circle.setAttribute('id', this.id); //set id attribute
		this.circle.setAttribute('cx', params.cx);
		this.circle.setAttribute('cy', params.cy);
		this.circle.setAttribute('r', params.radius);
		this.circle.setAttribute('style', [
        //'fill:' + this.fill,
        'stroke:' + this.stroke,
        'stroke-width:' + this.strokeWidth
    ].join(';'));

		this.helpers.center.setCoords(params.cx, params.cy);
		this.helpers.top.setCoords(params.cx, params.cy - params.radius);
		this.helpers.right.setCoords(params.cx + params.radius, params.cy);
		this.helpers.bottom.setCoords(params.cx, params.cy + params.radius);
		this.helpers.left.setCoords(params.cx - params.radius, params.cy);

		return this;
	};

	Circle.prototype.setParams = function(params){
		this.params.cx = params.cx;
		this.params.cy = params.cy;
		this.params.radius = params.radius;

		return this;
	};

	Circle.prototype.redraw = function() {
		this.setCoords(this.params);

		return this;
	};

	Circle.prototype.dynamicDraw = function(x1,y1){
		var x0 = this.params.cx,
			y0 = this.params.cy,
			dx,
			dy,
			radius,
			temp_params;

		x1 = x1 ? x1 : x0;
		y1 = y1 ? y1 : y0;

		dx = Math.abs(x0-x1);
		dy = Math.abs(y0-y1);
		radius = Math.round(Math.sqrt(dx*dx + dy*dy));

		temp_params = { /* params */
			cx : x0,
			cy : y0,
			radius : radius
		};

		this.setCoords(temp_params);

		return temp_params;
	};

	Circle.prototype.onDraw = function(e) {

		var _n_f = app.getNewArea();
		_n_f.dynamicDraw(utils.rightX(e.pageX), utils.rightY(e.pageY));
	};

	Circle.prototype.onDrawStop = function(e) {
		var _n_f = app.getNewArea();
		_n_f.setParams(_n_f.dynamicDraw(utils.rightX(e.pageX), utils.rightY(e.pageY))).deselect();
		// icona note
		var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
		iconObj.setAttribute('x',_n_f.params.cx+_n_f.params.radius-3)
		iconObj.setAttribute('y',_n_f.params.cy)
		iconObj.setAttribute('width',32)
		iconObj.setAttribute('height',32)
		iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
		_n_f.g.insertBefore(iconObj,_n_f.g.firstChild);

		app.removeAllEvents()
		   .setIsDraw(false)
		   .resetNewArea()
		   .saveInLocalStorage() //SALVATAGGIO AUTOMATICO
			 .setEnablePencil("true");
	};

	Circle.prototype.move = function(dx, dy){ //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.cx += dx;
		temp_params.cy += dy;

		return temp_params;
	};

	Circle.prototype.editTop = function(dx, dy){ //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.radius -= dy;

		return temp_params;
	};

	Circle.prototype.editBottom = function(dx, dy){ //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.radius += dy;

		return temp_params;
	};

	Circle.prototype.editLeft = function(dx, dy){ //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.radius -= dx;

		return temp_params;
	};

	Circle.prototype.editRight = function(dx, dy){ //offset x and y
		var temp_params = Object.create(this.params);

		temp_params.radius += dx;

		return temp_params;
	};

	Circle.prototype.dynamicEdit = function(temp_params) {
		if (temp_params.radius < 0) {
			temp_params.radius = Math.abs(temp_params.radius);
		}

		this.setCoords(temp_params);

		return temp_params;
	};

	Circle.prototype.onEdit = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType();

		_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y));
	};

	Circle.prototype.onEditStop = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType();

		_s_f.setParams(_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y)));

		app.removeAllEvents()
		   .saveInLocalStorage(); //SALVATAGGIO AUTOMATICO
	};

	Circle.prototype.remove = function(){
		app.removeNodeFromSvg(this.g);
	};

	Circle.prototype.select = function() {
		utils.addClass(this.circle, 'selected');

		return this;
	};

	Circle.prototype.deselect = function() {
		utils.removeClass(this.circle, 'selected');

		return this;
	};

	Circle.prototype.with_note = function() {
		//utils.addClass(this.circle, 'with_note');
		$('#'+this.id).parent('g').find('i[name="iconNote"]').removeClass('hide');
		return this;
	}

	Circle.prototype.without_note = function() {
		//utils.removeClass(this.circle, 'with_note');
		$('#'+this.id).parent('g').find('i[name="iconNote"]').addClass('hide');
		return this;
	}

	Circle.prototype.toString = function() { //to html map area code
		return '<area shape="circle" coords="'
			+ this.params.cx + ', '
			+ this.params.cy + ', '
			+ this.params.radius
			+ '"'
			+ (this.note ? ' note="' + this.note + '"' : '')
			+ ' />';
	};

	Circle.createFromSaved = function(params) {

		var coords = params.coords,
			area = new Circle(coords[0], coords[1]);
		area.id = params.id;//added to keep the same id
		area.note = params.note,
		area.tags = params.tags;
		area.stroke = params.stroke;
		area.strokeWidth = params.strokeWidth;

		area.setParams(area.dynamicDraw(coords[0], coords[1] + coords[2])).deselect();

		app.drawNoteFields(params.note);

		// icona note
		if(area.note.length > 0){
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',coords[0]+coords[2]-3)
			iconObj.setAttribute('y',coords[1])
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}else{
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',coords[0]+coords[2]-3)
			iconObj.setAttribute('y',coords[1])
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}

		app.setIsDraw(false)
		   .resetNewArea();

	};

	Circle.prototype.toJSON = function() {
		return {
			id : this.id,
			type   : 'circle',
			coords : [
				this.params.cx,
				this.params.cy,
				this.params.radius
			],
			note   : this.note,
			tags	 : this.tags,
			//fill	 : this.fill, //salva stile forma
			stroke : this.stroke,
			strokeWidth : this.strokeWidth,

		}
	};


	/* Polygon constructor */
	var Polygon = function(x, y){
		app.setIsDraw(true);

		//this.fill = 'rgba(255,255,255,0.3)';
		this.stroke = '#000';
		this.strokeWidth = '3px';

		this.id =  utils.generateId(); //create id

		this.params = [x, y]; //array of coordinates of polygon points

		this.note = []; //note attribute - not required

		this.tags = []; //tags attribute - not required

		this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		app.addNodeToSvg(this.g);
		this.g.appendChild(this.polygon);

		this.g.obj = this; /* Link to parent object */

		this.helpers = [ //array of all helpers-rectangles
			new Helper(this.g, this.params[0], this.params[1])
		];

		this.helpers[0].setAction('pointMove').setCursor('pointer').setId(0);

		this.selected_point = -1;

		this.select().redraw();

		app.addObject(this); //add this object to array of all objects
	};

	Polygon.prototype.setCoords = function(params){
		var coords_values = params.join(' ');
		this.polygon.setAttribute('id', this.id); //set id attribute
		this.polygon.setAttribute('points', coords_values);
		utils.foreach(this.helpers, function(x, i) {
			x.setCoords(params[2*i], params[2*i+1]);
		});
		this.polygon.setAttribute('style', [
        //'fill:' + this.fill,
        'stroke:' + this.stroke,
        'stroke-width:' + this.strokeWidth
    ].join(';'));

		return this;
	};

	Polygon.prototype.setParams = function(arr) {
		this.params = Array.prototype.slice.call(arr);

		return this;
	};

	Polygon.prototype.addPoint = function(x, y){
		var helper = new Helper(this.g, x, y);
		helper.setAction('pointMove').setCursor('pointer').setId(this.helpers.length);
		this.helpers.push(helper);
		this.params.push(x, y);
		this.redraw();

		return this;
	};

	Polygon.prototype.redraw = function() {
		this.setCoords(this.params);

		return this;
	};

	Polygon.prototype.right_angle = function(x, y){
		var old_x = this.params[this.params.length-2],
			old_y = this.params[this.params.length-1],
			dx = x - old_x,
			dy = - (y - old_y),
			tan = dy/dx; //tangens

		if (dx > 0 && dy > 0) {
			if (tan > 2.414) {
				x = old_x;
			} else if (tan < 0.414) {
				y = old_y;
			} else {
				Math.abs(dx) > Math.abs(dy) ? x = old_x + dy : y = old_y - dx;
			}
		} else if (dx < 0 && dy > 0) {
			if (tan < -2.414) {
				x = old_x;
			} else if (tan >  -0.414) {
				y = old_y;
			} else {
				Math.abs(dx) > Math.abs(dy) ? x = old_x - dy : y = old_y + dx;
			}
		} else if (dx < 0 && dy < 0) {
			if (tan > 2.414) {
				x = old_x;
			} else if (tan < 0.414) {
				y = old_y;
			} else {
				Math.abs(dx) > Math.abs(dy) ? x = old_x + dy : y = old_y - dx;
			}
		} else if (dx > 0 && dy < 0) {
			if (tan < -2.414) {
				x = old_x;
			} else if (tan >  -0.414) {
				y = old_y;
			} else {
				Math.abs(dx) > Math.abs(dy) ? x = old_x - dy : y = old_y + dx;
			}
		}

		return {
			x : x,
			y : y
		};
	};

	Polygon.prototype.dynamicDraw = function(x, y, right_angle){
		var temp_params = [].concat(this.params);

		if (right_angle) {
			var right_coords = this.right_angle(x, y);
			x = right_coords.x;
			y = right_coords.y;
		}

		temp_params.push(x, y);

		this.setCoords(temp_params);

		return temp_params;
	};

	Polygon.prototype.onDraw = function(e) {

		var _n_f = app.getNewArea();
		var right_angle = e.shiftKey ? true : false;

		_n_f.dynamicDraw(utils.rightX(e.pageX), utils.rightY(e.pageY), right_angle);
	};

	Polygon.prototype.onDrawAddPoint = function(e) {

		var x = utils.rightX(e.pageX),
			y = utils.rightY(e.pageY),

		_n_f = app.getNewArea();

		if (e.shiftKey) {
			var right_coords = _n_f.right_angle(x, y);
			x = right_coords.x;
			y = right_coords.y;
		}
		_n_f.addPoint(x, y);
	};

	Polygon.prototype.onDrawStop = function(e) {
		var _n_f = app.getNewArea();
		if (e.type == 'click' || (e.type == 'keydown' && e.keyCode == 13)) { // key Enter
			if (_n_f.params.length >= 6) { //>= 3 points for polygon
				_n_f.polyline = _n_f.polygon;
				_n_f.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
				_n_f.g.replaceChild(_n_f.polygon, _n_f.polyline);
				_n_f.setCoords(_n_f.params).deselect();
				delete(_n_f.polyline);

				var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
				iconObj.setAttribute('x',_n_f.params[0]-3)
				iconObj.setAttribute('y',_n_f.params[1]-3)
				iconObj.setAttribute('width',32)
				iconObj.setAttribute('height',32)
				iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
				_n_f.g.insertBefore(iconObj,_n_f.g.firstChild);

				app.removeAllEvents()
					.setIsDraw(false)
					.resetNewArea()
					.saveInLocalStorage() //SALVATAGGIO AUTOMATICO
					.setEnablePencil("true");
			}
		}
		e.stopPropagation();
	};

	Polygon.prototype.move = function(x, y){ //offset x and y
		var temp_params = Object.create(this.params);

		for (var i = 0, count = this.params.length; i < count; i++) {
			i % 2 ? this.params[i] += y : this.params[i] += x;
		}

		return temp_params;
	};

	Polygon.prototype.pointMove = function(x, y){ //offset x and y
		this.params[2 * this.selected_point] += x;
		this.params[2 * this.selected_point + 1] += y;

		return this.params;
	};

	Polygon.prototype.dynamicEdit = function(temp_params) {
		this.setCoords(temp_params);

		return temp_params;
	};

	Polygon.prototype.onEdit = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType();

		_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y));
		_s_f.delta.x = e.pageX;
		_s_f.delta.y = e.pageY;
	};

	Polygon.prototype.onEditStop = function(e) {
		var _s_f = app.getSelectedArea(),
			edit_type = app.getEditType();

		_s_f.setParams(_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y)));

		app.removeAllEvents()
		   .saveInLocalStorage(); //SALVATAGGIO AUTOMATICO
	};

	Polygon.prototype.remove = function(){
		app.removeNodeFromSvg(this.g);
	};

	Polygon.prototype.select = function() {
		utils.addClass(this.polygon, 'selected');

		return this;
	};

	Polygon.prototype.deselect = function() {
		utils.removeClass(this.polygon, 'selected');

		return this;
	};

	Polygon.prototype.with_note = function() {
		//utils.addClass(this.polygon, 'with_note');
		$('#'+this.id).parent('g').find('i[name="iconNote"]').removeClass('hide');
		return this;
	}

	Polygon.prototype.without_note = function() {
		//utils.removeClass(this.polygon, 'with_note');
		$('#'+this.id).parent('g').find('i[name="iconNote"]').addClass('hide');
		return this;
	}

	Polygon.prototype.toString = function() { //to html map area code
		for (var i = 0, count = this.params.length, str = ''; i < count; i++) {
			str += this.params[i];
			if (i != count - 1) {
				str += ', ';
			}
		}
		return '<area shape="poly" coords="'
			+ str
			+ '"'
			+ (this.note ? ' note="' + this.note + '"' : '')
			+ ' />';
	};

	Polygon.createFromSaved = function(params) {
		var coords = params.coords,
			area = new Polygon(coords[0], coords[1]);

		area.id = params.id; //added to keep the same id
		area.note = params.note;
		area.tags = params.tags;
		area.stroke = params.stroke;
		area.strokeWidth = params.strokeWidth;

		for (var i = 2, c = coords.length; i < c; i+=2) {
			area.addPoint(coords[i], coords[i+1]);
		}

		area.polyline = area.polygon;
		area.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
		area.g.replaceChild(area.polygon, area.polyline);
		area.setCoords(area.params).deselect();
		delete(area.polyline);

		// icona note
		if(area.note.length > 0){
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',coords[0])
			iconObj.setAttribute('y',coords[1])
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}else{
			var iconObj = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
			iconObj.setAttribute('x',coords[0])
			iconObj.setAttribute('y',coords[1])
			iconObj.setAttribute('width',32)
			iconObj.setAttribute('height',32)
			iconObj.innerHTML = '<i name="iconNote" class="fs1 icon-tag2 text-warning hide"></i>';
			area.g.insertBefore(iconObj,area.g.firstChild);
		}

		app.drawNoteFields(params.note);

		app.setIsDraw(false)
			.resetNewArea();

	};

	Polygon.prototype.toJSON = function() {
		return {
			id 	: this.id,
			type   : 'polygon',
			coords : this.params,
			note   : this.note,
			tags	 : this.tags,
			//fill	 : this.fill, //salva stile forma
			stroke : this.stroke,
			strokeWidth : this.strokeWidth,
		}
	};


	// init script
	app.setDimensions(utils.id('img').width, utils.id('img').height);
	app.recalcOffsetValues();
	app.loadFromLocalStorage();//CARICAMENTO AUTOMATICO DAL LOCAL STORAGE

	// Bottone mostra/nascondi icone note
	$('#icone_note').click(function(e){
		e.preventDefault();
		var azione = $(this).attr('data-azione');
		switch(azione){
			case 'nascondi':
				app.setHideNoteAttr(true);
				$('foreignobject i').each(function(){
					var classi = $(this).attr('class');
					$(this).attr('class',classi+' hide');
				});
				$(this).attr('data-azione','mostra');
				$(this).find('span').html('Mostra icone note');
				$(this).find('i').removeClass('icon-toggle-on').addClass('icon-toggle-off');
			break;
			case 'mostra':
				app.setHideNoteAttr(false);
				$('foreignobject i').each(function(){
					var classi = $(this).attr('class');
					var rclass = classi.replace(new RegExp('(\\s|^)' + 'hide' + '(\\s|$)', 'g'), '$2');
					$(this).attr('class',rclass);
				});
				$(this).attr('data-azione','nascondi');
				$(this).find('span').html('Nascondi icone note');
				$(this).find('i').addClass('icon-toggle-on').removeClass('icon-toggle-off');
			break;
		}
	});
	// Evento click bottone cancella del MODALE
	$('#edit_details #delete_annotation').click(function(e){
		e.preventDefault();
		var idObjDelete =  $(this).attr('data-idannotation');
		$('#'+$(this).attr('data-idannotation')).parent('g').remove();
		$(this).attr('data-idannotation','');
		//rimuove la nota dal localstorage in tutti i casi tranne pencil
		utils.foreach(app.getObjects(), function(k, v) {
			if(typeof(k) != 'undefined'){
					if(k.id == idObjDelete) {
						app.getObjects().splice(v, 1);
					}
				}
		});
		//rimuove la nota mostrata
		$('#text_note_'+idObjDelete).remove();
		$('#edit_details').modal('hide');
		//rimuove la nota dal localstorage nel caso pencil
		app.clearElementFromLocalStorage(idObjDelete, app.getLocalStorageNamePencil() );
		app.saveInLocalStorage();
	});
};

// INIT
$(document).ready(function(){
	// Initialize colorpicker
	var $box = $('#colorPicker');
	$box.tinycolorpicker();

	// inizializzo slider
	$( "#slider" ).slider({
		range: false,
		max:20,
		slide: function (event, ui){
				$('#demo_line').css('stroke-width', ui.value);
				$('#line_thickness').val(ui.value);
		}
	});
	// Hover states on the static widgets
	$( "#dialog-link, #icons li" ).hover(
		function() {
			$( this ).addClass( "ui-state-hover" );
		},
		function() {
			$( this ).removeClass( "ui-state-hover" );
		}
	);


	// inizializzo SummerStyle
	CloudmedJsonImgHtml5();
	// Attivo chosen
	$(".chosen-select").chosen({width: "100%"});
	var stringa_ricerca = "";
	var original_query = "";
	var indexStartStrRicerca = null;
	var check =null;
	var stringTotal = "";
	//controlla se mentre sto scrivendo metto il cancelletto
	$('#note_attr').on("keypress", function(e){
		check = $('#note_attr').attr('data-istagging');
		var kc = e.keyCode?e.keyCode:e.which;
		if((kc == 35 && check=="false")){
			$('#note_attr').attr('data-istagging', "true") ;
			//var alltext = $('#note_attr').text()+String.fromCharCode(kc);
			indexStartStrRicerca = getCaretPosition($('#note_attr')); //indice del # partendo da 0
		}
		if(check == "true"){
			if((kc >= 65 && kc <= 90)||(kc >= 97 && kc <= 122) || kc == 32){
				var position =  getCaretPosition($('#note_attr'))-indexStartStrRicerca-1;
				stringa_ricerca = stringa_ricerca.substring(0,position)+String.fromCharCode(kc).toLowerCase()+stringa_ricerca.substring(position, stringa_ricerca.length);
				original_query = original_query.substring(0,position)+ String.fromCharCode(kc) +original_query.substring(position,original_query.length);
			}
			// Cerco nel JSON

			$.getJSON('icd9cm.json',function(data){
				$('#div_result_tag').html('');
				$.each(data,function(k,v){
					var foo = v.descrizione;
					var bar = foo.toLowerCase();
					if(bar.indexOf(stringa_ricerca) != -1){
						$('#div_result_tag').append('<span id="'+v.codice+'" name="tag_result" data-field="'+v.codice+'">'+foo.toLowerCase()+'</span></br>');
					}
				});

				if($('#div_result_tag').text() != ''){
					$('#div_result_tag').show();
					$('#div_result_tag span[name="tag_result"]').bind('click',function(e){
						//console.log(e.currentTarget.firstChild.data); PRENDE IL TAG
						// sistemo risultato
						stringTotal = $('#note_attr').html();
						$('#div_result_tag').hide();
						var bar = stringTotal.substring(0,stringTotal.indexOf('#'));
						bar += '<span contentEditable ="false"; class="tag_div" name="tag_div">'+$(this).text()+'</span>&nbsp;';

						$('#note_attr').html(bar);

						// Azzeramento
						$('#note_attr').attr('data-istagging', "false");
						stringa_ricerca = original_query = "";
						check = "false";
						indexStartStrRicerca = null;
						$('#div_result_tag').html('');
					});
				}else{
					$('#div_result_tag').hide();
					$('#nessun_risultato').fadeIn('slow',function(){$('#nessun_risultato').fadeOut('slow');});

					if(kc == 32){
						// Azzeramento
						$('#note_attr').attr('data-istagging', "false");
						stringa_ricerca = original_query = "";
						check = "false";
						indexStartStrRicerca = null;
						$('#div_result_tag').html
						$('#div_result_tag').hide();
					}
				}
			});
		}
	});

	$('#note_attr').on("keydown", function(e){
		if(check == "true"){
			var positionexit = getCaretPosition($('#note_attr'));
			var position = getCaretPosition($('#note_attr'))-indexStartStrRicerca-1;
			var KeyID = e.keyCode;
			switch(KeyID)
			{
				 case 8:
				 if(positionexit-1>indexStartStrRicerca){
					 stringa_ricerca= stringa_ricerca.substring(0, position-1)+stringa_ricerca.substring(position, stringa_ricerca.length);
					 original_query= original_query.substring(0, position-1)+original_query.substring(position, original_query.length);
				 }else{//se cacello tutto il tag o la maiuscola resetto
					 	$('#note_attr').attr('data-istagging', "false");
						stringa_ricerca = original_query = "";
						check = "false";
						indexStartStrRicerca = null;
						$('#div_result_tag').html
						$('#div_result_tag').hide();
				 }
				 break;
				 case 46:
					 if(positionexit>indexStartStrRicerca){
							stringa_ricerca= stringa_ricerca.substring(0, position)+stringa_ricerca.substring(position+1, stringa_ricerca.length);
							original_query= original_query.substring(0, position)+original_query.substring(position+1, original_query.length);
						}else{//se cacello tutto il tag o la maiuscola resetto
							 $('#note_attr').attr('data-istagging', "false");
							 stringa_ricerca = original_query = "";
							 check = "false";
							 indexStartStrRicerca = null;
							 $('#div_result_tag').html
							 $('#div_result_tag').hide();
						 }
				 break;
				 default:
				 break;
			}
		}
	});
});
