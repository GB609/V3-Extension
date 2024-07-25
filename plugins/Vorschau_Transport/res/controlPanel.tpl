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
Es kann für jeden Rohstoffe einer von 5 Transportmodi verwendet werden. Dafür wird der eingegebenen Menge X jeweils ein bestimmtes Steuerzeichen vorangestellt:
<ul>
<li>&gt;X - Nur Export; aber nur soviel, dass immer mindestens X im Lager übrig bleibt. Ist weniger im Lager, passiert nichts</li>
<li>&lt;X - Nur Import; aber nur genug, um das Lager auf X aufzufüllen.</li>
<li>=X - Es wird versucht, den Lagerbestand konstant bei X zu halten. Ist mehr vorhanden, wird exportiert. Ist weniger vorhanden, importiert. Dies ist das Standardverhalten, wenn kein Steuerzeichen mit angegeben wird.</li>
<li>+X - Versuche, die Menge X von der anderen Provinz zu importieren, unabhängig von eventuellem Bestand im lokalen Provinzlager (begrenzt durch Lagerbestand der anderen Provinz).</li>
<li>-X - Exportiere bedingungslos die Menge X zur anderen Provinz</li>
</ul>
<p>Ein Transport wird erst beim Klick auf den Link "Transport" in der jeweiligen Spalte ausgelöst. Hier zeigt sich dann der Unterschied der Modi &gt;,&lt; gegen +,-: Erste werden bei einem zweiten Klick auf den gleichen Transportauftrag keinen Effekt mehr haben, letztere dagegen jedoch noch einmal die eingegebenen Mengen ex- bzw. importieren.</p>
<p>Die Berechnungen der real zu transportierenden Mengen finden auf der Transportseite statt, genauso so, als wäre die UI manuell bedient worden. Hier wird dann unabhängig von der Einstellungen auf vorhandene Mengen begrenzt. Beispiel: Die Angabe '-100' wird versuchen, genau 100 zu exportieren. Wenn aber nur 30 im Lager sind, werden diese 30 exportiert.<br>
Die Überschriften der Spalten zeigen nach jeder Änderung die derzeit berechnete Gesamtmenge an Waren, die transportiert werden als 'AP: X'. Dies ist KEINE Anzeige der verbrauchten AP, weil hier weder Entfernung, Transportpunkte noch die Gegenstandsgröße in die Berechnung einfließen. Diese Zahl dient der Orientierung und die Menge an wirklich verbrauchten AP wird in den allermeisten Fällen unter dieser Zahl liegen.<br>
Bei der Berechnung dieser Schätzzahlen werden lokal zwischengespeicherte Lagerwerte des Transportzieles verwendet. Diese können veraltet sein und falsche Zahlen enthalten, wodurch die Schätzungen von den realen Zahlen stärker abweichen können. Das passiert hauptsächlich dann, wenn über nicht überwachte Wege wie Handel, Routen oder manuelle Transporte (oder VZ3s eigenen automatischen Transport) Rohstoffe zu- oder abfließen. Das lässt sich durch kurzes öffnen der Vorschau des Zieles (und anschließendem Neuladen der Vorschau) korrigieren. Ein passender Link liegt in der Überschrift der entsprechenden Spalte.</p>
<span class="hinweis9">Rot markiert Rohstoffe, die wirklich transportiert werden m&uuml;ssen und können nach Einberechnung der Lagerbestände beider Provinzen und des jeweils eingestellten Transportmodus.</span>
</div>
<div id="shortReportDiv" onclick="this.style.display='none';"></div>
</div>