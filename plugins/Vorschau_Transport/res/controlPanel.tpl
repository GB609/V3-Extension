<div>
<style type="text/css">
.tp_option {padding: 0 10px;display: inline-block;border-right: 1px solid darkgrey;height:30px;vertical-align: top}
.tp_option input[type=checkbox] {transform: scale(1.2);}
.tp_option > * {display:inline-block; vertical-align:middle; height:30px; margin:0 5px;}
.tp_header {display:block;}
#shortReportDiv{display:none; border: 3px outset;}
</style>
<span class="tp_option" id="form-addSetting">Neues Transportziel: 
  <select id="add-list" style="width:200px;"><option value="" selected></option></select>
  <input id="add-note" placeholder="Notiz (optional)"/>
  <button id='add-confirm'>-&gt;</button>
</span>
<span id="control-options" class="tp_option"></span>
<span id="form-removeSetting" class="tp_option" style="display:none;">
  <select id="remove-list" style="width:200px;"><option value="" selected>Auswahl l&ouml;schen</option></select>
  <button id="remove-confirm">-&gt;</button>
</span>
<a href="javascript:;" 
	onclick="(function(st){st.display=='none' ? st.display='block' : st.display='none';})(this.nextElementSibling.style);"> ?</a>
<div style="display:none;" id="helpDiv">
Doppelklick auf Spalte l&ouml;scht Einstellung.<br/>
x&gt;: Exportiere x | x&lt;: Importiere x | x: halte konstant auf x (Import/Export nach Bedarf) | x+: Import nur wenn Lager &lt; x | x-: Export nur wenn Lager > x.<br />
Berechnete Transportmenge bei Transport auf max. m&ouml;glich reduziert.<br/>
<span class="hinweis5">Rohstoffe, die wirklich transportiert werden m&uuml;ssen nach Einberechnung des Lagerbestandes.</span>
</div>
<div id="shortReportDiv" onclick="this.style.display='none';"></div>
</div>