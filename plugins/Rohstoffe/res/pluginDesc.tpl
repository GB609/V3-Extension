<p>
  Ergänzt in der globalen Rohstoffübersicht einen Button namens "Verbrauch"<br>
  Diese Funktion berechnet die Summe der Zu- und Abflüsse von Ressourcen in allen Provinzen<br>
  Zur Schonung des Servers wird dafür auf lokal zwischengespeicherte Daten aus der Vorschauanzeige zurückgegriffen.<br>
  Die Anzeige wird unter 3 Bedingungen ungenau bzw. nicht korrekt arbeiten:
  <ol>
    <li>Wenn der gesamte Verbrauch die Provinzlagermenge übersteigt, kann nicht ermittelt werden um wieviel, weil die Vorschau niemals im Verkauf/Verbrauch zeigen wird, also in Lager+Produktion zur Verfügung stehen.</li>
    <li>Da die nötigen Informationen direkt beim öffnen der Vorschauen ermittelt werden, muss seit dem letzten Login jede Vorschau einmal geöffnet worden sein. Fehlt dabei eine Provinz, wird sie auch bei der +/- Ermittlung der Gesamtübersicht nicht betrachtet.</li>
    <li>Die Funktionsweise der Autokauf-Funktion verfälscht hier den angezeigten Verbrauch durch Verkauf. Autokauf wird bis zu einer (nicht ganz klaren) Grenze immer deutlich mehr kaufen als wirklich verbraucht wird.<br>
    Die +/- Funktion ermittelt aber die 'zur Verfügung' stehenden Änderungen der Mengen beim/nach dem Spulen. Was auf dem Markt landet ist nicht verfügbar (z.B. zum Transport)</li>
  </ol>
  Diese Funktion eignet sich derzeit am besten dazu, an einer zentralen Stelle schnell und frühzeitig Tendenzen zu erkennen (bei ausreichenden Lagerbeständen) und die entsprechenden Industrien auszubauen. 
</p>