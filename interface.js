var eaglecanvas;

var itemHints = {
	'element:MCU' : 'The central processing unit. A NXP LPC 1343.',
	'element:X1' : 'A 12 MHz crystal. Provides a precise clock source in combination with C1 and C2. The processor has its own RC clock source, but a quartz is required to fulfill the strict timing requirements of USB.',
	'element:T1' : 'A MOSFET transistor that enables or disables the R3 pullup resistor by software, allowing the device to logically connect and disconnect from the USB. This feature is called "soft connect".',
	'element:R1' : 'A termination resistor (33Ω) for USB, preventing signal reflections in the USB wire.',
	'element:R2' : 'A termination resistor (33Ω) for USB, preventing signal reflections in the USB wire.',
	'element:R3' : 'A pullup resistor (1.5kΩ) that slightly pulls the USB D+ level towards 3.3V. This pullup signals the USB host that a device is connected to USB.',
	'element:R4' : 'A pullup resistor (10kΩ) for the programming pin, ensuring a HIGH level when the PGM button is not pressed.',
	'element:R5' : 'A pullup resistor (10kΩ) for the reset pin, ensuring a HIGH level when the PGM button is not pressed.',
	'element:R6' : 'The LED current limiting resistor(100Ω), ensuring that the LED current does not exceed 10mA.',
	'element:R7' : 'Forms a voltage divider (1.5kΩ) in combination with R8. Generates a signal for the MCU to detect a USB connection.',
	'element:R8' : 'Forms a voltage divider (10kΩ) in combination with R7. Generates a signal for the MCU to detect a USB connection.',
	'element:C1' : 'Crystal load capacitor (18pF). Tunes the capacitive load for the crystal to work properly.',
	'element:C2' : 'Crystal load capacitor (10pF). Tunes the capacitive load for the crystal to work properly.',
	'element:C3' : 'Input buffer capacitor (1µF) for the voltage regulator. Smoothes the voltage, prevents oscillation of the voltage regulator.',
	'element:C4' : 'Output buffer capacitor (1µF) for the voltage regulator. Smoothes the voltage, prevents oscillation of the voltage regulator.',
	'element:C5' : 'Power supply buffer (100nF) for the microcontroller. Stabilizes supply voltage, prevents digital noise from spreading.',
	'element:C6' : 'Power supply buffer (100nF) for the microcontroller. Stabilizes supply voltage, prevents digital noise from spreading.',
	'element:VREG' : '3.3V voltage regulator (LDO). Generates 3.3V for the microcontroller from 5V USB and higher voltages',
	'element:D1' : 'A double common cathode diode package. Prevents damage from reverse voltage, prevents current flow from higher voltage sources to lower voltage sources when more than one power supply is connected.',
	'element:RST' : "Reset button. Pulls the PIO0_0 pin low. Can be reconfigured as a user button (if you don't need a reset button).",
	'element:PGM' : 'Program button. Pulls the PIO0_1 pin low. At startup, this causes the microcontroller to boot into the bootloader in ROM. Can be used as an application button during normal operation.',
	'element:LED' : 'A light emitting diode. Emits light, controllable by software.',
	'element:USB' : 'Micro USB-B port. Power supply, host communication, programming.'

};

var fontLoaded = false;

function stupidWebfontTrick(eagle) {
	if (!fontLoaded) {
		// see http://stackoverflow.com/a/8223543/27408
		var i = new Image()
		i.src = "../fonts/osifont.woff"
		i.onerror = function() {
			eagle.draw()
			setTimeout(function(){eagle.draw()}, 50)
			fontLoaded = true;
		};
	}

	updateCheckboxes()
	selectItem(null)
}
function init (url) {

	var defaultUrl = 'lpcprog.kicad_pcb';

	eaglecanvas = new EagleCanvas('#canvas');

	EagleCanvas.prototype.loadText = function (text) {
		this.text = text;
		if (text.match (/\<\?xml/) && text.match (/\<eagle/)) {
			var parser = new DOMParser();
			this.boardXML = parser.parseFromString(this.text,"text/xml");
			this.parse()
		} else if (text.match (/\(kicad_pcb/)) {
			var kicadParser = new KicadNewParser (eaglecanvas);
			kicadParser.parse (text);
		}
		this.nativeBounds = this.calculateBounds();
		this.nativeSize   = [this.nativeBounds[2]-this.nativeBounds[0],this.nativeBounds[3]-this.nativeBounds[1]];
		this.scaleToFit();
	}
	eaglecanvas.setScaleToFit('#outer');
	eaglecanvas.loadURL(url || defaultUrl, stupidWebfontTrick);
}

function showFrontSide(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setBoardFlipped(false);
	document.getElementById('frontsidebutton').className = "button selected";
	document.getElementById('backsidebutton').className = "button";
}

function showBackSide(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setBoardFlipped(true);
	document.getElementById('frontsidebutton').className = "button";
	document.getElementById('backsidebutton').className = "button selected";
}

function zoomIn(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setScale(eaglecanvas.getScale()*1.2);
}

function zoomOut(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setScale(eaglecanvas.getScale()/1.2);
}

function toggleLayer(layer) {
	e = window.event;
	if (e) e.stopPropagation();
	var shown = eaglecanvas.isLayerVisible(layer);
	shown = !shown;
	eaglecanvas.setLayerVisible(layer,shown);
	updateCheckboxes();
}

function canvasClick(e) {
	e = e || window.event;
	if (!e) return;
	e.stopPropagation();
	var canvas = document.getElementById('canvas');
	var x = e.clientX - canvas.getBoundingClientRect().left - canvas.clientLeft + canvas.scrollLeft;
	var y = e.clientY - canvas.getBoundingClientRect().top - canvas.clientTop + canvas.scrollTop;
	var hit = eaglecanvas.hitTest(x,y);
	selectItem(hit);
}

function updateCheckboxes() {
	for (var layerKey in EagleCanvas.LayerId) {
		var layerId = EagleCanvas.LayerId[layerKey];
		var cbId = "SHOW_LAYER_CB_"+layerId;
		var cb = document.getElementById(cbId);
		if (!cb) continue;
		cb.checked = (eaglecanvas.isLayerVisible(layerId)) ? "checked" : "";
	}
}

function selectItem(hit) {
	eaglecanvas.setHighlightedItem(hit);
	var hintsbox = document.getElementById('hintsbox');
	hintsbox.style.display = (hit) ? 'block' : 'none';
	if (hit) {
		var hintstitle = document.getElementById('hintstitle');
		while (hintstitle.childNodes.length > 0) hintstitle.removeChild(hintstitle.firstChild);
		var title = "";
		if (hit.type=='element') title = "Element: "+hit.name;
		else if (hit.type=='signal') title = "Signal: "+hit.name;
		hintstitle.appendChild(document.createTextNode(title));

		var hintstext = document.getElementById('hintstext');
		while (hintstext.childNodes.length > 0) hintstext.removeChild(hintstext.firstChild);
		var desc = "";
		if (hit.description) {
			desc = hit.description;
		} else if (typeof itemHints !== "undefined") {
			desc = itemHints[hit.type+":"+hit.name];
		}
		if (!desc) desc = "";
		hintstext.appendChild(document.createTextNode(desc));
	}
}


