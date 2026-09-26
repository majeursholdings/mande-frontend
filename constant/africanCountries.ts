import type { SelectOption } from "@/components/form/types";

// ─────────────────────────────────────────────────────────────────────────────
// African countries and their first-level divisions (states, regions,
// provinces, counties…), for address fields. The platform only serves
// African businesses, so no other countries are offered. `code` is the ISO
// 3166-1 alpha-2 code, which is what forms store.
// ─────────────────────────────────────────────────────────────────────────────

export type AfricanCountry = {
    code: string;
    name: string;
    states: string[];
};

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
    {
        code: "DZ",
        name: "Algeria",
        states: ["Adrar", "Aïn Defla", "Aïn Témouchent", "Algiers", "Annaba", "Batna", "Béchar", "Béjaïa", "Béni Abbès", "Biskra", "Blida", "Bordj Badji Mokhtar", "Bordj Bou Arréridj", "Bouïra", "Boumerdès", "Chlef", "Constantine", "Djanet", "Djelfa", "El Bayadh", "El M'Ghair", "El Meniaa", "El Oued", "El Tarf", "Ghardaïa", "Guelma", "Illizi", "In Guezzam", "In Salah", "Jijel", "Khenchela", "Laghouat", "M'Sila", "Mascara", "Médéa", "Mila", "Mostaganem", "Naâma", "Oran", "Ouargla", "Ouled Djellal", "Oum El Bouaghi", "Relizane", "Saïda", "Sétif", "Sidi Bel Abbès", "Skikda", "Souk Ahras", "Tamanrasset", "Tébessa", "Tiaret", "Timimoun", "Tindouf", "Tipaza", "Tissemsilt", "Tizi Ouzou", "Tlemcen", "Touggourt"],
    },
    {
        code: "AO",
        name: "Angola",
        states: ["Bengo", "Benguela", "Bié", "Cabinda", "Cuando", "Cuanza Norte", "Cuanza Sul", "Cubango", "Cunene", "Huambo", "Huíla", "Icolo e Bengo", "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Moxico Leste", "Namibe", "Uíge", "Zaire"],
    },
    {
        code: "BJ",
        name: "Benin",
        states: ["Alibori", "Atacora", "Atlantique", "Borgou", "Collines", "Couffo", "Donga", "Littoral", "Mono", "Ouémé", "Plateau", "Zou"],
    },
    {
        code: "BW",
        name: "Botswana",
        states: ["Central", "Chobe", "Ghanzi", "Kgalagadi", "Kgatleng", "Kweneng", "North-East", "North-West", "South-East", "Southern"],
    },
    {
        code: "BF",
        name: "Burkina Faso",
        states: ["Boucle du Mouhoun", "Cascades", "Centre", "Centre-Est", "Centre-Nord", "Centre-Ouest", "Centre-Sud", "Est", "Hauts-Bassins", "Nord", "Plateau-Central", "Sahel", "Sud-Ouest"],
    },
    {
        code: "BI",
        name: "Burundi",
        states: ["Buhumuza", "Bujumbura", "Burunga", "Butanyerera", "Gitega"],
    },
    {
        code: "CV",
        name: "Cabo Verde",
        states: ["Boa Vista", "Brava", "Fogo", "Maio", "Sal", "Santiago", "Santo Antão", "São Nicolau", "São Vicente"],
    },
    {
        code: "CM",
        name: "Cameroon",
        states: ["Adamawa", "Centre", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West"],
    },
    {
        code: "CF",
        name: "Central African Republic",
        states: ["Bamingui-Bangoran", "Bangui", "Basse-Kotto", "Haut-Mbomou", "Haute-Kotto", "Kémo", "Lim-Pendé", "Lobaye", "Mambéré", "Mambéré-Kadéï", "Mbomou", "Nana-Grébizi", "Nana-Mambéré", "Ombella-M'Poko", "Ouaka", "Ouham", "Ouham-Fafa", "Ouham-Pendé", "Sangha-Mbaéré", "Vakaga"],
    },
    {
        code: "TD",
        name: "Chad",
        states: ["Bahr el Gazel", "Batha", "Borkou", "Chari-Baguirmi", "Ennedi-Est", "Ennedi-Ouest", "Guéra", "Hadjer-Lamis", "Kanem", "Lac", "Logone Occidental", "Logone Oriental", "Mandoul", "Mayo-Kebbi Est", "Mayo-Kebbi Ouest", "Moyen-Chari", "N'Djamena", "Ouaddaï", "Salamat", "Sila", "Tandjilé", "Tibesti", "Wadi Fira"],
    },
    {
        code: "KM",
        name: "Comoros",
        states: ["Anjouan", "Grande Comore", "Mohéli"],
    },
    {
        code: "CG",
        name: "Congo",
        states: ["Bouenza", "Brazzaville", "Cuvette", "Cuvette-Ouest", "Kouilou", "Lékoumou", "Likouala", "Niari", "Plateaux", "Pointe-Noire", "Pool", "Sangha"],
    },
    {
        code: "CD",
        name: "Congo (DRC)",
        states: ["Bas-Uélé", "Équateur", "Haut-Katanga", "Haut-Lomami", "Haut-Uélé", "Ituri", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe", "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi", "Sankuru", "Sud-Kivu", "Sud-Ubangi", "Tanganyika", "Tshopo", "Tshuapa"],
    },
    {
        code: "CI",
        name: "Côte d'Ivoire",
        states: ["Abidjan", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Yamoussoukro", "Zanzan"],
    },
    {
        code: "DJ",
        name: "Djibouti",
        states: ["Ali Sabieh", "Arta", "Dikhil", "Djibouti", "Obock", "Tadjourah"],
    },
    {
        code: "EG",
        name: "Egypt",
        states: ["Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia", "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor", "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez"],
    },
    {
        code: "GQ",
        name: "Equatorial Guinea",
        states: ["Annobón", "Bioko Norte", "Bioko Sur", "Centro Sur", "Djibloho", "Kié-Ntem", "Litoral", "Wele-Nzas"],
    },
    {
        code: "ER",
        name: "Eritrea",
        states: ["Anseba", "Central", "Gash-Barka", "Northern Red Sea", "Southern", "Southern Red Sea"],
    },
    {
        code: "SZ",
        name: "Eswatini",
        states: ["Hhohho", "Lubombo", "Manzini", "Shiselweni"],
    },
    {
        code: "ET",
        name: "Ethiopia",
        states: ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Central Ethiopia", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "South Ethiopia", "South West Ethiopia Peoples'", "Tigray"],
    },
    {
        code: "GA",
        name: "Gabon",
        states: ["Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"],
    },
    {
        code: "GM",
        name: "Gambia",
        states: ["Banjul", "Central River", "Kanifing", "Lower River", "North Bank", "Upper River", "West Coast"],
    },
    {
        code: "GH",
        name: "Ghana",
        states: ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"],
    },
    {
        code: "GN",
        name: "Guinea",
        states: ["Boké", "Conakry", "Faranah", "Kankan", "Kindia", "Labé", "Mamou", "Nzérékoré"],
    },
    {
        code: "GW",
        name: "Guinea-Bissau",
        states: ["Bafatá", "Biombo", "Bissau", "Bolama", "Cacheu", "Gabú", "Oio", "Quinara", "Tombali"],
    },
    {
        code: "KE",
        name: "Kenya",
        states: ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"],
    },
    {
        code: "LS",
        name: "Lesotho",
        states: ["Berea", "Butha-Buthe", "Leribe", "Mafeteng", "Maseru", "Mohale's Hoek", "Mokhotlong", "Qacha's Nek", "Quthing", "Thaba-Tseka"],
    },
    {
        code: "LR",
        name: "Liberia",
        states: ["Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount", "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland", "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"],
    },
    {
        code: "LY",
        name: "Libya",
        states: ["Al Butnan", "Al Jabal al Akhdar", "Al Jabal al Gharbi", "Al Jfara", "Al Jufrah", "Al Kufrah", "Al Marj", "Al Marqab", "Al Wahat", "An Nuqat al Khams", "Az Zawiyah", "Benghazi", "Derna", "Ghat", "Misrata", "Murzuq", "Nalut", "Sabha", "Sirte", "Tripoli", "Wadi al Hayaa", "Wadi al Shatii"],
    },
    {
        code: "MG",
        name: "Madagascar",
        states: ["Alaotra-Mangoro", "Amoron'i Mania", "Analamanga", "Analanjirofo", "Androy", "Anosy", "Atsimo-Andrefana", "Atsimo-Atsinanana", "Atsinanana", "Betsiboka", "Boeny", "Bongolava", "Diana", "Fitovinany", "Haute Matsiatra", "Ihorombe", "Itasy", "Melaky", "Menabe", "Sava", "Sofia", "Vakinankaratra", "Vatovavy"],
    },
    {
        code: "MW",
        name: "Malawi",
        states: ["Central", "Northern", "Southern"],
    },
    {
        code: "ML",
        name: "Mali",
        states: ["Bamako", "Gao", "Kayes", "Kidal", "Koulikoro", "Ménaka", "Mopti", "Ségou", "Sikasso", "Taoudénit", "Tombouctou"],
    },
    {
        code: "MR",
        name: "Mauritania",
        states: ["Adrar", "Assaba", "Brakna", "Dakhlet Nouadhibou", "Gorgol", "Guidimaka", "Hodh Ech Chargui", "Hodh El Gharbi", "Inchiri", "Nouakchott-Nord", "Nouakchott-Ouest", "Nouakchott-Sud", "Tagant", "Tiris Zemmour", "Trarza"],
    },
    {
        code: "MU",
        name: "Mauritius",
        states: ["Black River", "Flacq", "Grand Port", "Moka", "Pamplemousses", "Plaines Wilhems", "Port Louis", "Rivière du Rempart", "Rodrigues", "Savanne"],
    },
    {
        code: "MA",
        name: "Morocco",
        states: ["Béni Mellal-Khénifra", "Casablanca-Settat", "Dakhla-Oued Ed-Dahab", "Drâa-Tafilalet", "Fès-Meknès", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Marrakesh-Safi", "Oriental", "Rabat-Salé-Kénitra", "Souss-Massa", "Tanger-Tétouan-Al Hoceïma"],
    },
    {
        code: "MZ",
        name: "Mozambique",
        states: ["Cabo Delgado", "Gaza", "Inhambane", "Manica", "Maputo", "Maputo City", "Nampula", "Niassa", "Sofala", "Tete", "Zambezia"],
    },
    {
        code: "NA",
        name: "Namibia",
        states: ["Erongo", "Hardap", "//Karas", "Kavango East", "Kavango West", "Khomas", "Kunene", "Ohangwena", "Omaheke", "Omusati", "Oshana", "Oshikoto", "Otjozondjupa", "Zambezi"],
    },
    {
        code: "NE",
        name: "Niger",
        states: ["Agadez", "Diffa", "Dosso", "Maradi", "Niamey", "Tahoua", "Tillabéri", "Zinder"],
    },
    {
        code: "NG",
        name: "Nigeria",
        states: ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"],
    },
    {
        code: "RW",
        name: "Rwanda",
        states: ["Eastern", "Kigali", "Northern", "Southern", "Western"],
    },
    {
        code: "ST",
        name: "São Tomé and Príncipe",
        states: ["Príncipe", "São Tomé"],
    },
    {
        code: "SN",
        name: "Senegal",
        states: ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"],
    },
    {
        code: "SC",
        name: "Seychelles",
        states: ["Anse aux Pins", "Anse Boileau", "Anse Étoile", "Anse Royale", "Au Cap", "Baie Lazare", "Baie Sainte Anne", "Beau Vallon", "Bel Air", "Bel Ombre", "Cascade", "English River", "Glacis", "Grand'Anse Mahé", "Grand'Anse Praslin", "Île Perseverance I", "Île Perseverance II", "La Digue and Inner Islands", "Les Mamelles", "Mont Buxton", "Mont Fleuri", "Plaisance", "Pointe La Rue", "Port Glaud", "Roche Caïman", "Saint Louis", "Takamaka"],
    },
    {
        code: "SL",
        name: "Sierra Leone",
        states: ["Eastern", "North West", "Northern", "Southern", "Western Area"],
    },
    {
        code: "SO",
        name: "Somalia",
        states: ["Awdal", "Bakool", "Banaadir", "Bari", "Bay", "Galguduud", "Gedo", "Hiiraan", "Lower Juba", "Lower Shabelle", "Middle Juba", "Middle Shabelle", "Mudug", "Nugaal", "Sanaag", "Sool", "Togdheer", "Woqooyi Galbeed"],
    },
    {
        code: "ZA",
        name: "South Africa",
        states: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
    },
    {
        code: "SS",
        name: "South Sudan",
        states: ["Abyei Administrative Area", "Central Equatoria", "Eastern Equatoria", "Greater Pibor Administrative Area", "Jonglei", "Lakes", "Northern Bahr el Ghazal", "Ruweng Administrative Area", "Unity", "Upper Nile", "Warrap", "Western Bahr el Ghazal", "Western Equatoria"],
    },
    {
        code: "SD",
        name: "Sudan",
        states: ["Blue Nile", "Central Darfur", "East Darfur", "Gedaref", "Gezira", "Kassala", "Khartoum", "North Darfur", "North Kordofan", "Northern", "Red Sea", "River Nile", "Sennar", "South Darfur", "South Kordofan", "West Darfur", "West Kordofan", "White Nile"],
    },
    {
        code: "TZ",
        name: "Tanzania",
        states: ["Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pemba North", "Pemba South", "Pwani", "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", "Tanga", "Zanzibar North", "Zanzibar South", "Zanzibar West"],
    },
    {
        code: "TG",
        name: "Togo",
        states: ["Centrale", "Kara", "Maritime", "Plateaux", "Savanes"],
    },
    {
        code: "TN",
        name: "Tunisia",
        states: ["Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kebili", "Kef", "Mahdia", "Manouba", "Medenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"],
    },
    {
        code: "UG",
        name: "Uganda",
        states: ["Central", "Eastern", "Northern", "Western"],
    },
    {
        code: "ZM",
        name: "Zambia",
        states: ["Central", "Copperbelt", "Eastern", "Luapula", "Lusaka", "Muchinga", "North-Western", "Northern", "Southern", "Western"],
    },
    {
        code: "ZW",
        name: "Zimbabwe",
        states: ["Bulawayo", "Harare", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"],
    },
];

export const AFRICAN_COUNTRY_OPTIONS: SelectOption[] = AFRICAN_COUNTRIES.map((country) => ({
    label: country.name,
    value: country.code,
}));

/** "NG" → "Nigeria". Empty for an unset code; an unknown one is shown as-is. */
export function getCountryName(code: string): string {
    if (!code) return "";
    return AFRICAN_COUNTRIES.find((country) => country.code === code)?.name ?? code;
}

/** The country's states, A → Z, as select options (the state's name is its value). */
export function getStateOptions(countryCode: string): SelectOption[] {
    const country = AFRICAN_COUNTRIES.find((c) => c.code === countryCode);
    return [...(country?.states ?? [])]
        .sort((a, b) => a.localeCompare(b))
        .map((state) => ({ label: state, value: state }));
}