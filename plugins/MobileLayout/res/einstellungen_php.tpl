<div id="outer" style="width:100%;text-align:center;">
	<style type="text/css">
		/*#innerSetDiv {display:inline-block;width:75%;}*/
		.settingsHeader {background-color: #232323;text-align:center;padding:5px;}
		.settingsLine {background-color:#484848; text-align:left;padding:5px;margin-bottom:5px;}
	</style>
	<script type="text/javascript">
function updateDescription(select, target){
  target.innerText = select.options[select.selectedIndex].title;
}

function updateSlider(){
	var input = document.getElementById('staatsabgabenstatus');
	toSet = parseFloat(input.value) * 10;
	
	var slider = document.getElementById('abgabenSlider');
	if(toSet > parseInt(slider.max)){
		slider.max = Math.ceil(toSet);
		slider.nextElementSibling.innerText = Math.ceil(toSet/10)+"%";
	}
	slider.value = toSet;
}

function setUp(){
try{
var selects = document.getElementById('innerSetDiv').getElementsByTagName("select");
	for(var i = 0; i < selects.length; i++){
	  var current = selects[i];
	  if(current.getAttribute("onchange")){
		  updateDescription(current, current.nextElementSibling);
	  }
	}
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent("change", true, true);
	document.getElementById('staatsabgabenstatus').dispatchEvent(evt);
	} catch(e){
	console.log(e);
	}
}

setUp();
	</script>
	<div id="innerSetDiv" style="display:inline-block;">
		<form method="POST" action="einstellungen2.php">
			<div class="settingsHeader inboxh"><b>Verhalten der nichtzugewiesenen Arbeiter:</b><br>(Alle zur verf&uuml;gung stehende Arbeitskr&auml;fte die in keinem Geb&auml;ude arbeiten)</div>
			<div class="settingsLine inboxh">
				<select name="arbeitstatus" onchange="updateDescription(this, this.nextElementSibling);">
					<option value="-1" {{arbeitstatus-1}} title="Keine Besch&auml;ftigung / kein Lohn, Moralminus">Arbeitslos</option>
					<option value="0" {{arbeitstatus0}} title="Arbeitskr&auml;fte durchsuchen Provinz nach n&uuml;tzlichen Rohstoffen / 100% Lohn">Sammeln</option>
					<option value="1" {{arbeitstatus1}} title="Arbeitskr&auml;fte gehen auf die Tierjagd und versuchen Nutztiere einzufangen / 100% Lohn">Jagen</option>
					<option value="2" {{arbeitstatus2}} title="Keine Besch&auml;ftigung / 70% Lohn, kein Moralminus">Arbeitslosengeld</option>
				</select> - <span></span>
			</div>
			
			<div class="settingsHeader inboxh"><b>Verhalten der Rentner:</b><br>(Alle welche das Rentenalter erreicht haben)</div>
			<div class="settingsLine inboxh">
				<select name="rentestatus" onchange="updateDescription(this, this.nextElementSibling);">
					<option value="-1" {{rentestatus-1}} title="Keine Besch&auml;ftigung / kein Lohnersatz, Moralminus">keine Rente</option>
					<option value="0" {{rentestatus0}} title="Keine Besch&auml;ftigung / 70% Lohnersatz, kein Moralminus">Rentengeld</option>
				</select> - <span></span>
			</div>

			<div class="settingsHeader inboxh">
				<b>Steuers&auml;tze festlegen:</b>
			</div>
			<div class="settingsLine inboxh">
				Wenn Sie die Steuers&auml;tze &auml;ndern hat das sofortigen Einfluss auf die Provinzmoral.				
				<br>Aber auch zuk&uuml;nftig beeinflussen die Steuers&auml;tze die Provinzmoral weiter.
				<br><span class="hinweis">Achtung: Negative &Auml;nderungen wirken sich dauerhaft h&ouml;her auf die
				    <br>Moral aus als positive &Auml;nderungen.</span>
			</div>
			<div class="settingsLine inboxh">
				<div style="display:inline-block;">
					Einkommenssteuer: <select name="steuersatz">
						<option value="0" {{steuersatz0}} title="keine steuern">keine</option>
						<option value="1" {{steuersatz1}} title="sehr niedrig">sehr niedrig</option>
						<option value="2" {{steuersatz2}} title="niedrig">niedrig</option>
						<option value="3" {{steuersatz3}} title="normal">normal</option>
						<option value="4" {{steuersatz4}} title="hoch">hoch</option>
						<option value="5" {{steuersatz5}} title="sehr hoch">sehr hoch</option>
						<option value="6" {{steuersatz6}} title="unmenschlich">unmenschlich</option>
					</select>
				</div> &nbsp;
				<div style="display:inline-block;">
					Verm&ouml;genssteuer: <select name="steuersatzv">
						<option value="0" {{steuersatzv0}} title="keine steuern">keine</option>
						<option value="1" {{steuersatzv1}} title="sehr niedrig">sehr niedrig</option>
						<option value="2" {{steuersatzv2}} title="niedrig">niedrig</option>
						<option value="3" {{steuersatzv3}} title="normal">normal</option>
						<option value="4" {{steuersatzv4}} title="hoch">hoch</option>
						<option value="5" {{steuersatzv5}} title="sehr hoch">sehr hoch</option>
						<option value="6" {{steuersatzv6}} title="unmenschlich">unmenschlich</option>
					</select>
				</div>
			</div>
			
			<div class="settingsHeader inboxh"><b>Geburtenverhalten festlegen:</b></div>
			<div class="settingsLine inboxh">
				<select name="geburtenstatus" onchange="updateDescription(this, this.nextElementSibling);">
					<option value="-2" {{geburtenstatus-2}} title="max. 1 Kind pro Familie">starke Geburtenkontrolle</option>
					<option value="-1" {{geburtenstatus-1}} title="max. 2 Kinder pro Familie">geringe Geburtenkontrolle</option>
					<option value="0" {{geburtenstatus0}} title="">Keine Einmischung</option>
					<option value="1" {{geburtenstatus1}} title="1000 Mips/Kind">Kinderzulagen</option>
					<option value="2" {{geburtenstatus2}} title="2500 Mips/Kind">hohe Kinderzulagen</option>
				</select> - <span></span>
			</div>
			
			<div class="settingsHeader inboxh"><b>Verhalten von Techgeb&auml;uden:</b></div>
			<div class="settingsLine inboxh">
				<select name="laborstatus">
					<option value="0" {{laborstatus0}}>100% / 0%</option>
					<option value="1" {{laborstatus1}}>75% / 25%</option>
					<option value="2" {{laborstatus2}}>50% / 50%</option>
					<option value="3" {{laborstatus3}}>25% / 75%</option>
					<option value="4" {{laborstatus4}}>0% / 100%</option>
				</select> - <span>Verh&auml;ltnis Techproduktion / Geldproduktion in %</span>
			</div>
			
			<div class="settingsHeader inboxh"><b>Arbeiten bis (Alter):</b></div>
			<div class="settingsLine inboxh">
				<select name="alterstatus">
					<option value="-2" {{alterstatus-2}}>60. Lebensjahr</option>
					<option value="-1" {{alterstatus-1}}>65. Lebensjahr</option>
					<option value="0" {{alterstatus0}}>70. Lebensjahr</option>
					<option value="1" {{alterstatus1}}>75. Lebensjahr</option>
					<option value="2" {{alterstatus2}}>80. Lebensjahr</option>
				</select>
			</div>
			
			<div class="settingsHeader inboxh"><b>Sonstiges:</b></div>
			<div class="settingsLine inboxh"><input name="feiertag" value="1" class="formcenter" type="checkbox" {{feiertag}}> Heutigen Tag zum Feiertag erkl&auml;ren.<br>(Keiner muss arbeiten, wird aber trotzdem bezahlt. (Moralschub))</div>
			<div class="settingsLine inboxh">Prozentualer Einkommensanteil an Staatskasse:
				<input type="text" name="staatsabgabenstatus" id="staatsabgabenstatus" value="{{staatsabgabenstatus}}" 
					size="3" onchange="updateSlider()">%&nbsp&nbsp
				0%<input type="range" min="0" max="150" step="5" id="abgabenSlider"
					style="vertical-align:bottom;margin-left:3px;margin-right:3px;" 
					oninput="this.previousElementSibling.value = parseInt(this.value)/10"/><span>15%</span>
			</div>
			
			<div><input class="formcenter" type="submit" value="aktualisieren"></div>
		</form>
	</div>
</div>