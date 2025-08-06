// Auto-poblado de países (ES) para selects de país
(function(){
  const COUNTRIES_ES = [
"España",
"Afganistán",
"Albania",
"Alemania",
"Andorra",
"Angola",
"Antigua y Barbuda",
"Arabia Saudita",
"Argelia",
"Argentina",
"Armenia",
"Australia",
"Austria",
"Azerbaiyán",
"Bahamas",
"Bangladés",
"Barbados",
"Baréin",
"Bélgica",
"Belice",
"Benín",
"Bielorrusia",
"Birmania (Myanmar)",
"Bolivia",
"Bosnia y Herzegovina",
"Botsuana",
"Brasil",
"Brunéi",
"Bulgaria",
"Burkina Faso",
"Burundi",
"Bután",
"Cabo Verde",
"Camboya",
"Camerún",
"Canadá",
"Catar",
"Chad",
"Chile",
"China",
"Chipre",
"Colombia",
"Comoras",
"Corea del Norte",
"Corea del Sur",
"Costa de Marfil",
"Costa Rica",
"Croacia",
"Cuba",
"Dinamarca",
"Dominica",
"Ecuador",
"Egipto",
"El Salvador",
"Emiratos Árabes Unidos",
"Eritrea",
"Eslovaquia",
"Eslovenia",
"Estados Unidos",
"Estonia",
"Esuatini",
"Etiopía",
"Fiyi",
"Filipinas",
"Finlandia",
"Francia",
"Gabón",
"Gambia",
"Georgia",
"Ghana",
"Granada",
"Grecia",
"Guatemala",
"Guinea",
"Guinea-Bisáu",
"Guinea Ecuatorial",
"Guyana",
"Haití",
"Honduras",
"Hungría",
"India",
"Indonesia",
"Irak",
"Irán",
"Irlanda",
"Islandia",
"Islas Marshall",
"Islas Salomón",
"Israel",
"Italia",
"Jamaica",
"Japón",
"Jordania",
"Kazajistán",
"Kenia",
"Kirguistán",
"Kiribati",
"Kuwait",
"Laos",
"Lesoto",
"Letonia",
"Líbano",
"Liberia",
"Libia",
"Liechtenstein",
"Lituania",
"Luxemburgo",
"Madagascar",
"Malasia",
"Malaui",
"Maldivas",
"Malí",
"Malta",
"Marruecos",
"Mauricio",
"Mauritania",
"México",
"Micronesia",
"Moldavia",
"Mónaco",
"Mongolia",
"Montenegro",
"Mozambique",
"Namibia",
"Nauru",
"Nepal",
"Nicaragua",
"Níger",
"Nigeria",
"Noruega",
"Nueva Zelanda",
"Omán",
"Países Bajos",
"Pakistán",
"Palaos",
"Panamá",
"Papúa Nueva Guinea",
"Paraguay",
"Perú",
"Polonia",
"Portugal",
"Reino Unido",
"República Centroafricana",
"República Checa",
"República del Congo",
"República Democrática del Congo",
"República Dominicana",
"Ruanda",
"Rumanía",
"Rusia",
"Samoa",
"San Cristóbal y Nieves",
"San Marino",
"San Vicente y las Granadinas",
"Santa Lucía",
"Santo Tomé y Príncipe",
"Senegal",
"Serbia",
"Seychelles",
"Sierra Leona",
"Singapur",
"Siria",
"Somalia",
"Sri Lanka",
"Sudáfrica",
"Sudán",
"Sudán del Sur",
"Suecia",
"Suiza",
"Surinam",
"Tailandia",
"Tanzania",
"Tayikistán",
"Timor Oriental",
"Togo",
"Tonga",
"Trinidad y Tobago",
"Túnez",
"Turkmenistán",
"Turquía",
"Tuvalu",
"Ucrania",
"Uganda",
"Uruguay",
"Uzbekistán",
"Vanuatu",
"Vaticano",
"Venezuela",
"Vietnam",
"Yemen",
"Yibuti",
"Zambia",
"Zimbabue"
];

  function fillSelect(select, countries){
    const lang=(localStorage.getItem('lang')||'es');
    const t=(es,en)=>lang==='en'?en:es;
    if(!select) return;
    // Si el select es vCountry, ponemos España al principio; para otros, añadimos opción "Todos"
    const isMain = select.id === 'vCountry';
    let options = [];

    if(!isMain){
      options.push(new Option('Todos los países',''));
      const header = new Option(t('Listado de países','List of countries'), '');
      header.disabled = true;
      header.setAttribute('data-ss-header','1');
      options.push(header);
      }

    // Asegurar que España salga primero
    const sorted = countries.slice();
    const idxEs = sorted.indexOf('España');
    if(idxEs > 0){
      sorted.splice(idxEs,1);
      sorted.unshift('España');
    }

    sorted.forEach(name => options.push(new Option(name, name)));

    // Limpiar y añadir
    select.innerHTML = '';
    options.forEach(opt => select.add(opt));

    // Selección por defecto
    if(isMain){
      select.value = 'España';
    } else {
      // Por defecto en filtros: 'Todos los países'
      select.value = '';
    }
  }

  function refresh(){
    fillSelect(document.getElementById('vCountry'), COUNTRIES_ES);
    fillSelect(document.getElementById('countryFilter'), COUNTRIES_ES);
    const cf = document.getElementById('countryFilter'); if(cf) cf.dispatchEvent(new Event('change', {bubbles:true}));
  }
  document.addEventListener('DOMContentLoaded', refresh);
  window.refreshCountryOptions = refresh;
})();
