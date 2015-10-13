// Author: Diego Perini <dperini@nwbox.com>
var sb = new Array()

for (var i in sb) eval('var ' + sb[i] + ' = {}')

var os = 0
var oe = 0
function update(o) {
	var t = o.value,
			s = getSelectionStart(o),
			e = getSelectionEnd(o)

	if (s == os && e == oe) return s
	os = s
	oe = e
	return s
}

function setup() {
	for (var i in sb) eval(sb[i] + ' = document.getElementById(sb[i])')
	update(document.getElementById('note_attr'))
	//
	// $('#note_attr').on("click", function(){return (update(this))});
	// $('#note_attr').on("keyup", function(){ return (update(this))});
	// $('#note_attr').on("keydown", function(e){
	// 	var KeyID = e.keyCode;
	// 	switch(KeyID)
	// 	{
	// 		 case 8:
	// 		 var position = update(this)-1;
	// 		 if (position<0)position = 0;
	// 		 console.log(position);
	// 		 break;
	// 		 case 46:
	// 		 alert("delete");
	// 		 break;
	// 		 default:
	// 		 break;
	// 	}
	// });
	// $('#note_attr').on("keypress", function(){ return (update(this))});
	// $('#note_attr').on("mouseup", function(){ return (update(this))});
	// $('#note_attr').on("mousedown", function(){ return (update(this))});

}

function getSelectionStart(o) {
	if (o.createTextRange) {
		var r = document.selection.createRange().duplicate()
		r.moveEnd('character', o.value.length)
		if (r.text == '') return o.value.length
		return o.value.lastIndexOf(r.text)
	} else return o.selectionStart
}

function getSelectionEnd(o) {
	if (o.createTextRange) {
		var r = document.selection.createRange().duplicate()
		r.moveStart('character', -o.value.length)
		return r.text.length
	} else return o.selectionEnd
}
