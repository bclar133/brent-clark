const MAP_WIDTH = 1000;
const MAP_HEIGHT = 560;
const WORLD_MAP_URL = "data/countries-110m.json";
const FLAG_URL = "https://flagcdn.com/w160/";
const SATELLITE_TILE_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
const SATELLITE_TILE_SIZE = 256;
const SATELLITE_MIN_ZOOM = 2;
const SATELLITE_MAX_ZOOM = 13;
const SATELLITE_MAX_TILES = 280;
const WEB_MERCATOR_MAX_LAT = 85.05112878;

const POINTS = {
  hemisphere: 1,
  continent: 1,
  country: 2,
  town: 5,
  flag: 2
};

const STEPS = [
  { key: "hemisphere", label: "Hemisphere", points: POINTS.hemisphere },
  { key: "continent", label: "Continent", points: POINTS.continent },
  { key: "country", label: "Country", points: POINTS.country },
  { key: "town", label: "Town", points: POINTS.town },
  { key: "flag", label: "Flag", points: POINTS.flag }
];

const TAP_CONFIRM_STAGES = new Set(["hemisphere", "continent", "country", "town"]);
const TAP_CONFIRM_QUERY = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 760px)");

const DIFFICULTY_RANK = {
  easy: 1,
  medium: 2,
  hard: 3
};

const CONTINENTS = [
  { key: "Africa", label: "Africa", color: "#d89945" },
  { key: "Asia", label: "Asia", color: "#c96458" },
  { key: "Europe", label: "Europe", color: "#7d88d8" },
  { key: "North America", label: "North America", color: "#42a7a5" },
  { key: "South America", label: "South America", color: "#4eaa62" },
  { key: "Oceania", label: "Oceania", color: "#b778d4" }
];

const CONTINENT_BY_KEY = new Map(CONTINENTS.map((continent) => [continent.key, continent]));
const TOWN_SPOT_LABELS = ["A", "B", "C", "D"];
const MIN_TOWN_CHOICE_SCREEN_DISTANCE = 62;
const MIN_TOWN_SPOT_DISPLAY_DISTANCE = 48;
const EXCLUDED_COUNTRY_ISO3 = new Set(["BHR", "HKG", "SGP"]);
// Main country answer shapes can exclude far-off overseas fragments while keeping nearby islands.
const COUNTRY_MAIN_PART_BOUNDS = new Map([
  ["FRA", [[-6, 41], [10, 52]]]
]);
const SUPPLEMENTAL_TOWN_CHOICES = new Map([
  ["BHS", [
    { name: "Marsh Harbour", ascii: "Marsh Harbour", lat: 26.5412, lng: -77.0636 }
  ]],
  ["BLZ", [
    { name: "San Ignacio", ascii: "San Ignacio", lat: 17.1588, lng: -89.0696 }
  ]],
  ["BRN", [
    { name: "Kuala Belait", ascii: "Kuala Belait", lat: 4.5836, lng: 114.2312 }
  ]],
  ["CYP", [
    { name: "Paphos", ascii: "Paphos", lat: 34.772, lng: 32.4297 }
  ]],
  ["DJI", [
    { name: "Tadjoura", ascii: "Tadjoura", lat: 11.7853, lng: 42.8844 },
    { name: "Obock", ascii: "Obock", lat: 11.9631, lng: 43.2906 },
    { name: "Dikhil", ascii: "Dikhil", lat: 11.1044, lng: 42.3739 },
    { name: "Yoboki", ascii: "Yoboki", lat: 11.5104, lng: 42.1167 }
  ]],
  ["SWZ", [
    { name: "Siteki", ascii: "Siteki", lat: -26.4525, lng: 31.9472 }
  ]],
  ["FLK", [
    { name: "Goose Green", ascii: "Goose Green", lat: -51.8295, lng: -58.9709 },
    { name: "Port Howard", ascii: "Port Howard", lat: -51.615, lng: -59.523 },
    { name: "Fox Bay", ascii: "Fox Bay", lat: -51.95, lng: -60.065 }
  ]],
  ["FJI", [
    { name: "Lautoka", ascii: "Lautoka", lat: -17.6167, lng: 177.4667 },
    { name: "Labasa", ascii: "Labasa", lat: -16.4333, lng: 179.3667 },
    { name: "Savusavu", ascii: "Savusavu", lat: -16.7787, lng: 179.3336 }
  ]],
  ["GMB", [
    { name: "Bakau", ascii: "Bakau", lat: 13.4781, lng: -16.6819 }
  ]],
  ["KWT", [
    { name: "Salmiya", ascii: "Salmiya", lat: 29.3339, lng: 48.0761 }
  ]],
  ["LUX", [
    { name: "Differdange", ascii: "Differdange", lat: 49.5217, lng: 5.8914 }
  ]],
  ["NCL", [
    { name: "Paita", ascii: "Paita", lat: -22.1333, lng: 166.3667 }
  ]],
  ["QAT", [
    { name: "Al Wakrah", ascii: "Al Wakrah", lat: 25.1715, lng: 51.6034 },
    { name: "Dukhan", ascii: "Dukhan", lat: 25.4297, lng: 50.7858 },
    { name: "Madinat ash Shamal", ascii: "Madinat ash Shamal", lat: 26.1293, lng: 51.2009 },
    { name: "Mesaieed", ascii: "Mesaieed", lat: 24.9906, lng: 51.5493 }
  ]],
  ["TLS", [
    { name: "Viqueque", ascii: "Viqueque", lat: -8.8575, lng: 126.3647 }
  ]],
  ["VUT", [
    { name: "Lakatoro", ascii: "Lakatoro", lat: -16.0999, lng: 167.4164 },
    { name: "Sola", ascii: "Sola", lat: -13.8761, lng: 167.5517 },
    { name: "Lenakel", ascii: "Lenakel", lat: -19.5258, lng: 169.2715 }
  ]]
]);

const EASY_CITY_KEYS = new Set([
  "ARG:Buenos Aires",
  "AUS:Canberra",
  "AUS:Sydney",
  "AUS:Melbourne",
  "AUS:Brisbane",
  "AUS:Perth",
  "BRA:Brasilia",
  "BRA:Rio de Janeiro",
  "BRA:Sao Paulo",
  "CAN:Montreal",
  "CAN:Ottawa",
  "CAN:Toronto",
  "CAN:Vancouver",
  "CHE:Zurich",
  "CHL:Santiago",
  "CHN:Beijing",
  "CHN:Guangzhou",
  "CHN:Shanghai",
  "COL:Bogota",
  "DEU:Berlin",
  "DEU:Hamburg",
  "DEU:Munich",
  "EGY:Cairo",
  "ESP:Barcelona",
  "ESP:Madrid",
  "FRA:Paris",
  "GBR:London",
  "GRC:Athens",
  "IDN:Jakarta",
  "IND:Delhi",
  "IND:Kolkata",
  "IND:Mumbai",
  "IRL:Dublin",
  "ITA:Milan",
  "ITA:Rome",
  "JPN:Osaka",
  "JPN:Tokyo",
  "KEN:Nairobi",
  "KOR:Seoul",
  "MAR:Casablanca",
  "MEX:Mexico City",
  "NLD:Amsterdam",
  "NGA:Lagos",
  "NOR:Oslo",
  "NZL:Auckland",
  "NZL:Wellington",
  "PER:Lima",
  "PHL:Manila",
  "POL:Warsaw",
  "PRT:Lisbon",
  "RUS:Moscow",
  "SAU:Riyadh",
  "SWE:Stockholm",
  "THA:Bangkok",
  "TUR:Istanbul",
  "UKR:Kyiv",
  "USA:Chicago",
  "USA:Los Angeles",
  "USA:New York",
  "USA:Washington",
  "VNM:Hanoi",
  "VNM:Ho Chi Minh City",
  "ZAF:Cape Town",
  "ZAF:Johannesburg",
  "ZAF:Pretoria",
  "ARG:Cordoba",
  "ARG:Rosario",
  "ARE:Abu Dhabi",
  "ARE:Dubai",
  "AUT:Vienna",
  "BEL:Antwerp",
  "BEL:Brussels",
  "BGR:Sofia",
  "BOL:La Paz",
  "BOL:Santa Cruz",
  "CHE:Geneva",
  "CHN:Chengdu",
  "CHN:Shenzhen",
  "CHN:Xi'an",
  "COL:Medellin",
  "CZE:Prague",
  "DEU:Frankfurt",
  "DNK:Copenhagen",
  "DZA:Algiers",
  "ECU:Guayaquil",
  "ECU:Quito",
  "EGY:Alexandria",
  "ESP:Sevilla",
  "ESP:Valencia",
  "ETH:Addis Ababa",
  "FIN:Helsinki",
  "FJI:Nadi",
  "FJI:Suva",
  "FRA:Lyon",
  "FRA:Marseille",
  "GBR:Birmingham",
  "GBR:Manchester",
  "GHA:Accra",
  "GRC:Thessaloniki",
  "HRV:Zagreb",
  "HUN:Budapest",
  "IDN:Denpasar",
  "IDN:Surabaya",
  "IND:Bangalore",
  "IND:Chennai",
  "IND:Hyderabad",
  "IND:New Delhi",
  "IRN:Tehran",
  "IRQ:Baghdad",
  "ISL:Reykjavik",
  "ISR:Jerusalem",
  "ISR:Tel Aviv-Yafo",
  "ITA:Florence",
  "ITA:Naples",
  "ITA:Turin",
  "JOR:Amman",
  "JPN:Kyoto",
  "JPN:Nagoya",
  "JPN:Sapporo",
  "JPN:Yokohama",
  "KEN:Mombasa",
  "LBN:Beirut",
  "LKA:Colombo",
  "MAR:Marrakech",
  "MAR:Rabat",
  "MEX:Guadalajara",
  "MEX:Monterrey",
  "MYS:Kuala Lumpur",
  "NGA:Abuja",
  "NLD:Rotterdam",
  "NOR:Bergen",
  "NPL:Kathmandu",
  "NZL:Christchurch",
  "PAK:Islamabad",
  "PAK:Karachi",
  "PAK:Lahore",
  "PHL:Cebu City",
  "PHL:Quezon City",
  "POL:Krakow",
  "PRT:Porto",
  "QAT:Doha",
  "ROU:Bucharest",
  "RUS:Saint Petersburg",
  "SEN:Dakar",
  "SRB:Belgrade",
  "TUN:Tunis",
  "TUR:Ankara",
  "TWN:Kaohsiung",
  "TWN:Taipei",
  "TZA:Dar es Salaam",
  "URY:Montevideo",
  "USA:Atlanta",
  "USA:Boston",
  "USA:Dallas",
  "USA:Houston",
  "USA:Miami",
  "USA:Philadelphia",
  "VEN:Caracas",
  "VUT:Luganville",
  "VUT:Port-Vila",
  "ZAF:Durban",
  "ZWE:Bulawayo",
  "ZWE:Harare"
]);

const MEDIUM_CITY_KEYS = new Set([
  "AFG:Kabul",
  "ALB:Tirana",
  "ARE:Abu Dhabi",
  "ARE:Dubai",
  "ARG:Cordoba",
  "ARG:Rosario",
  "ARM:Yerevan",
  "AUT:Vienna",
  "AUT:Salzburg",
  "AZE:Baku",
  "BEL:Brussels",
  "BEL:Antwerp",
  "BGR:Sofia",
  "BGD:Dhaka",
  "BGD:Chattogram",
  "BIH:Sarajevo",
  "BLR:Minsk",
  "BOL:La Paz",
  "BOL:Santa Cruz",
  "CHE:Geneva",
  "CHE:Basel",
  "CHL:Concepcion",
  "CHL:Antofagasta",
  "CHL:Vina del Mar",
  "CHN:Shenzhen",
  "CHN:Chengdu",
  "CHN:Xi'an",
  "CHN:Chongqing",
  "COL:Medellin",
  "COL:Cali",
  "CZE:Prague",
  "DEU:Frankfurt",
  "DEU:Cologne",
  "DNK:Copenhagen",
  "DZA:Algiers",
  "ECU:Quito",
  "ECU:Guayaquil",
  "EGY:Alexandria",
  "ESP:Valencia",
  "ESP:Sevilla",
  "ESP:Malaga",
  "ESP:Bilbao",
  "ETH:Addis Ababa",
  "FIN:Helsinki",
  "FJI:Suva",
  "FRA:Lyon",
  "FRA:Marseille",
  "GBR:Manchester",
  "GBR:Birmingham",
  "GHA:Accra",
  "GRC:Thessaloniki",
  "HRV:Zagreb",
  "HUN:Budapest",
  "IDN:Surabaya",
  "IDN:Medan",
  "IDN:Denpasar",
  "IND:New Delhi",
  "IND:Bangalore",
  "IND:Chennai",
  "IND:Hyderabad",
  "IND:Pune",
  "IND:Ahmedabad",
  "IRL:Cork",
  "IRN:Tehran",
  "IRQ:Baghdad",
  "ISL:Reykjavik",
  "ISR:Jerusalem",
  "ISR:Tel Aviv-Yafo",
  "ITA:Naples",
  "ITA:Turin",
  "ITA:Florence",
  "JOR:Amman",
  "JPN:Nagoya",
  "JPN:Yokohama",
  "JPN:Fukuoka",
  "JPN:Sapporo",
  "JPN:Kobe",
  "JPN:Kyoto",
  "KEN:Mombasa",
  "LBN:Beirut",
  "LKA:Colombo",
  "MAR:Rabat",
  "MAR:Fes",
  "MAR:Tangier",
  "MAR:Marrakech",
  "MEX:Guadalajara",
  "MEX:Monterrey",
  "MYS:Kuala Lumpur",
  "MYS:Putrajaya",
  "NGA:Abuja",
  "NGA:Kano",
  "NLD:Rotterdam",
  "NOR:Bergen",
  "NPL:Kathmandu",
  "NZL:Christchurch",
  "PAK:Karachi",
  "PAK:Lahore",
  "PER:Arequipa",
  "PHL:Quezon City",
  "PHL:Davao",
  "PHL:Cebu City",
  "POL:Krakow",
  "PRT:Porto",
  "QAT:Doha",
  "ROU:Bucharest",
  "RUS:Saint Petersburg",
  "RUS:Novosibirsk",
  "SEN:Dakar",
  "SRB:Belgrade",
  "SVN:Ljubljana",
  "TUN:Tunis",
  "TUR:Ankara",
  "TUR:Izmir",
  "TWN:Taipei",
  "TWN:Kaohsiung",
  "TZA:Dar es Salaam",
  "UKR:Odesa",
  "URY:Montevideo",
  "USA:Boston",
  "USA:Miami",
  "USA:Dallas",
  "USA:Houston",
  "USA:Philadelphia",
  "USA:Atlanta",
  "VEN:Caracas",
  "VEN:Maracaibo",
  "VNM:Haiphong",
  "VNM:Can Tho",
  "ZAF:Durban"
]);

const CITY_FACTS = new Map([
  ["ARG:Buenos Aires", "Buenos Aires is strongly linked with tango, football, cafe culture, and beef-focused food traditions."],
  ["ARG:Cordoba", "Cordoba is a major university city in Argentina, which gives it a strong student and cultural scene."],
  ["ARG:Rosario", "Rosario sits on the Parana River and is famous in football history as Lionel Messi's birthplace."],
  ["AUS:Adelaide", "Adelaide is known for festivals, wine regions nearby, and a grid-like city centre planned around parklands."],
  ["AUS:Brisbane", "Brisbane has a subtropical climate and sits on a winding river close to the beaches of southeast Queensland."],
  ["AUS:Canberra", "Canberra was purpose-built as Australia's capital after Sydney and Melbourne both wanted the role."],
  ["AUS:Gold Coast", "The Gold Coast is famous for surf beaches, theme parks, and a skyline packed along a narrow coastal strip."],
  ["AUS:Melbourne", "Melbourne is known for coffee, trams, Australian rules football, and weather that can swing quickly in a day."],
  ["AUS:Perth", "Perth is one of the world's most isolated big cities, closer to parts of Asia than to Sydney."],
  ["AUS:Sydney", "Sydney's harbour shaped the city; the Opera House and Harbour Bridge sit right on that natural gateway."],
  ["AUT:Salzburg", "Salzburg is tied to Mozart, baroque streets, and Alpine scenery, making it a music and festival city."],
  ["AUT:Vienna", "Vienna is famous for classical music, coffee houses, and a public transport network that reaches deep into the city."],
  ["BEL:Antwerp", "Antwerp is a major diamond-trading centre and one of Europe's important port cities."],
  ["BEL:Brussels", "Brussels is both Belgium's capital and a major European Union hub, so politics is part of its daily rhythm."],
  ["BGR:Sofia", "Sofia sits near Mount Vitosha, so a capital city and a ski mountain are unusually close together."],
  ["BRA:Brasilia", "Brasilia was built as a planned capital in the 20th century, with a layout often compared to an aeroplane."],
  ["BRA:Rio de Janeiro", "Rio de Janeiro is famous for beaches, Carnival, football, and the 2016 Summer Olympics."],
  ["BRA:Sao Paulo", "Sao Paulo is Brazil's business powerhouse and one of the largest urban economies in the Southern Hemisphere."],
  ["CAN:Montreal", "Montreal is famous for bagels, festivals, ice hockey, and a strong French-speaking culture."],
  ["CAN:Ottawa", "Ottawa sits on the Ottawa River and freezes a canal into a famous winter skating route."],
  ["CAN:Toronto", "Toronto is Canada's biggest city and one of the world's most multicultural food cities."],
  ["CAN:Vancouver", "Vancouver's port, mountains, and mild rainy climate make it feel very different from inland Canada."],
  ["CHE:Geneva", "Geneva is known for diplomacy, watchmaking, and its position on a lake at the edge of the Alps."],
  ["CHE:Zurich", "Zurich is a global finance city, but it also has a strong lakeside swimming culture in summer."],
  ["CHL:Santiago", "Santiago sits in a basin beside the Andes, with mountains visible from many parts of the city."],
  ["CHN:Beijing", "Beijing is home to the Forbidden City and is a political centre with food traditions such as Peking duck."],
  ["CHN:Guangzhou", "Guangzhou is a Pearl River Delta trade city and one of the homes of Cantonese food culture."],
  ["CHN:Shanghai", "Shanghai sits where the Yangtze River Delta meets the sea, helping it become a huge port and finance city."],
  ["CHN:Shenzhen", "Shenzhen grew from a small border city into a major technology and manufacturing hub in just a few decades."],
  ["CHN:Chengdu", "Chengdu is famous for Sichuan food, teahouses, and being a gateway to giant panda conservation areas."],
  ["COL:Bogota", "Bogota sits high in the Andes, so its climate is cooler than many people expect near the Equator."],
  ["COL:Medellin", "Medellin is nicknamed the City of Eternal Spring because its valley climate stays mild year-round."],
  ["CZE:Prague", "Prague's old town, castle, and bridges grew around the Vltava River, which still shapes the historic centre."],
  ["DEU:Berlin", "Berlin is known for museums, street art, techno clubs, and the history of the Berlin Wall."],
  ["DEU:Frankfurt", "Frankfurt is one of Europe's busiest airport and finance hubs, with a skyline rare for German cities."],
  ["DEU:Hamburg", "Hamburg is a major port city, even though it sits inland on the Elbe River rather than directly on the open sea."],
  ["DEU:Munich", "Munich is famous for Oktoberfest, football, and its position close to the Bavarian Alps."],
  ["DNK:Copenhagen", "Copenhagen is famous for cycling, harbour swimming, and the bridge-and-tunnel link to Sweden."],
  ["EGY:Alexandria", "Alexandria faces the Mediterranean and was once home to one of the ancient world's most famous libraries."],
  ["EGY:Cairo", "Cairo sits beside the Nile and near the pyramids of Giza, placing the city close to one of the world's great ancient landscapes."],
  ["ESP:Barcelona", "Barcelona mixes Mediterranean beaches, football, and Gaudi architecture such as the Sagrada Familia."],
  ["ESP:Madrid", "Madrid sits high on Spain's central plateau, which helps explain its hot summers and cold winter nights."],
  ["ESP:Sevilla", "Sevilla is famous for flamenco, orange trees, very hot summers, and its position on the Guadalquivir River."],
  ["ESP:Valencia", "Valencia is the home of paella and sits on Spain's Mediterranean coast."],
  ["ETH:Addis Ababa", "Addis Ababa sits high in the Ethiopian Highlands, so its weather is cooler than its tropical latitude suggests."],
  ["FIN:Helsinki", "Helsinki faces the Baltic Sea, and winter ice shapes transport, sport, and daily life."],
  ["FRA:Lyon", "Lyon is one of France's great food cities and sits where the Rhone and Saone rivers meet."],
  ["FRA:Marseille", "Marseille is France's oldest major city and a Mediterranean port with strong North African food influences."],
  ["FRA:Paris", "Paris grew along the River Seine and is famous for cafes, fashion, museums, and dense metro travel."],
  ["GBR:Birmingham", "Birmingham grew through canals, metalwork, and industry, and today has one of Britain's most diverse food scenes."],
  ["GBR:London", "London's River Thames helped make it a trading port long before it became a global finance centre."],
  ["GBR:Manchester", "Manchester boomed during the Industrial Revolution and remains famous for music and football."],
  ["GHA:Accra", "Accra faces the Gulf of Guinea and is known for markets, music, beaches, and rapid coastal growth."],
  ["GRC:Athens", "Athens is one of the world's oldest capitals and hosted the first modern Olympic Games in 1896."],
  ["HKG:Hong Kong", "Hong Kong's deep natural harbour helped make it one of Asia's busiest trade and finance hubs."],
  ["HUN:Budapest", "Budapest is split by the Danube River, with hilly Buda on one side and flatter Pest on the other."],
  ["IDN:Jakarta", "Jakarta is a huge tropical megacity on Java, and flooding is a major issue because parts of it are sinking."],
  ["IDN:Surabaya", "Surabaya is a major port and trading city in eastern Java, with a name tied to a shark-and-crocodile legend."],
  ["IND:Delhi", "Delhi combines Old Delhi's markets with New Delhi's government buildings in one huge urban area."],
  ["IND:Kolkata", "Kolkata sits on the Hooghly River and is famous for Durga Puja, literature, and sweets."],
  ["IND:Mumbai", "Mumbai is India's finance and film capital, with Bollywood studios and a major Arabian Sea port."],
  ["IND:Bangalore", "Bangalore is known as a major technology hub and has a milder climate thanks to its elevation."],
  ["IRL:Dublin", "Dublin grew around the River Liffey and is famous for literature, pubs, and a fast-growing tech sector."],
  ["ITA:Milan", "Milan is Italy's fashion and finance centre, and its football rivalry fills the San Siro stadium."],
  ["ITA:Naples", "Naples is strongly tied to pizza, Mount Vesuvius, and one of the oldest city centres in Europe."],
  ["ITA:Rome", "Rome is famous for ancient ruins, Vatican City nearby, and food traditions such as carbonara."],
  ["JPN:Kyoto", "Kyoto is known for temples, gardens, and traditional festivals, because it was Japan's imperial capital for centuries."],
  ["JPN:Osaka", "Osaka is famous for street foods such as takoyaki and okonomiyaki, and has long been a merchant city."],
  ["JPN:Tokyo", "Tokyo's rail network is one of the world's busiest, and the city has hosted the Summer Olympics twice."],
  ["KEN:Mombasa", "Mombasa is Kenya's main Indian Ocean port, with Swahili, Arab, Indian, and Portuguese influences."],
  ["KEN:Nairobi", "Nairobi has a national park on its edge, so wildlife and skyscrapers sit unusually close together."],
  ["KOR:Seoul", "Seoul's street food, gaming, and K-pop scenes are global exports, and the city hosted the 1988 Summer Olympics."],
  ["MAR:Casablanca", "Casablanca is Morocco's biggest city and Atlantic port, known for business, seafood, and art deco streets."],
  ["MAR:Marrakech", "Marrakech is famous for markets, food stalls, gardens, and its red-toned old city walls."],
  ["MEX:Mexico City", "Mexico City sits high in a mountain basin, so its weather is cooler than many people expect for its latitude."],
  ["MEX:Guadalajara", "Guadalajara is strongly linked with mariachi music, tequila country nearby, and Mexican tech industries."],
  ["MYS:Kuala Lumpur", "Kuala Lumpur is known for the Petronas Towers, street food, and a tropical thunderstorm climate."],
  ["NGA:Lagos", "Lagos is one of Africa's biggest urban areas, with busy ports, Afrobeats, Nollywood, and huge traffic jams."],
  ["NGA:Abuja", "Abuja was planned as Nigeria's capital to sit more centrally than coastal Lagos."],
  ["NLD:Amsterdam", "Amsterdam's canals, bikes, and low-lying land make water management part of the city's identity."],
  ["NLD:Rotterdam", "Rotterdam is one of Europe's great port cities, rebuilt with bold modern architecture after World War II."],
  ["NOR:Oslo", "Oslo sits at the end of a fjord, so skiing, ferries, forests, and city life are packed close together."],
  ["NZL:Auckland", "Auckland is built on a volcanic field and between two harbours, giving it a very distinctive map shape."],
  ["NZL:Wellington", "Wellington is famous for wind, hills, film production, and a compact harbour setting."],
  ["PER:Lima", "Lima is a desert coastal capital where fog is common but heavy rain is rare."],
  ["PHL:Manila", "Manila sits on a huge bay and is known for Spanish-era history, jeepneys, and dense urban life."],
  ["POL:Krakow", "Krakow's old town survived much of World War II and remains one of Poland's best-known historic centres."],
  ["POL:Warsaw", "Warsaw rebuilt much of its Old Town after World War II and sits on the Vistula River."],
  ["PRT:Lisbon", "Lisbon is famous for trams, steep hills, custard tarts, and its harbour on the Tagus River."],
  ["PRT:Porto", "Porto gave port wine its name and grew around the Douro River in northern Portugal."],
  ["RUS:Moscow", "Moscow sits on the Moskva River and is known for the Kremlin, Red Square, metro stations, and winter sport."],
  ["RUS:Saint Petersburg", "Saint Petersburg was built as Russia's window to Europe, with canals, palaces, and long summer twilight."],
  ["SAU:Riyadh", "Riyadh is a desert capital where summer heat shapes daily life, buildings, and transport."],
  ["SEN:Dakar", "Dakar sits on a peninsula reaching into the Atlantic, making it an important West African port and music city."],
  ["SWE:Stockholm", "Stockholm spreads across islands, so bridges, ferries, ice, and water are central to the city."],
  ["THA:Bangkok", "Bangkok is famous for street food, canals, temples, and a hot monsoon climate."],
  ["TUR:Ankara", "Ankara replaced Istanbul as Turkey's capital and sits inland on the Anatolian plateau."],
  ["TUR:Istanbul", "Istanbul straddles Europe and Asia across the Bosporus, making it one of the world's great trade crossroads."],
  ["TWN:Taipei", "Taipei sits in a basin, is famous for night markets, and has hot humid summers with typhoon season."],
  ["UKR:Kyiv", "Kyiv sits on the Dnipro River and is one of Eastern Europe's oldest major cities."],
  ["USA:Atlanta", "Atlanta is a major airport hub and helped shape hip-hop, civil rights history, and Southern food culture."],
  ["USA:Boston", "Boston is famous for universities, the American Revolution, seafood, and some very intense sports fans."],
  ["USA:Chicago", "Chicago sits on Lake Michigan and is famous for architecture, rail links, deep-dish pizza, and windy winters."],
  ["USA:Dallas", "Dallas is a major inland business and airline hub, with hot summers and a huge sports culture."],
  ["USA:Houston", "Houston is tied to energy, ports, space exploration, and humid Gulf Coast weather."],
  ["USA:Los Angeles", "Los Angeles is tied to film, aerospace, ports, car culture, and a dry Mediterranean climate."],
  ["USA:Miami", "Miami is shaped by beaches, hurricanes, Cuban food, cruise ships, and its role as a gateway to Latin America."],
  ["USA:New York", "New York's natural harbour made it a major Atlantic trade gateway; today it is famous for finance, media, and pizza slices."],
  ["USA:Philadelphia", "Philadelphia is famous for early United States history, cheesesteaks, murals, and intense sports rivalries."],
  ["USA:Washington", "Washington was planned as a capital city, with wide avenues and monuments arranged around the National Mall."],
  ["VEN:Caracas", "Caracas sits in a mountain valley near the Caribbean coast, so steep terrain shapes the city."],
  ["VNM:Hanoi", "Hanoi is known for lakes, the Old Quarter, street food, and humid summers with cooler winters than southern Vietnam."],
  ["VNM:Ho Chi Minh City", "Ho Chi Minh City is Vietnam's biggest business city and a gateway to the Mekong Delta."],
  ["ARE:Abu Dhabi", "Abu Dhabi is the UAE's capital and mixes oil wealth, desert climate, mangroves, and the Sheikh Zayed Grand Mosque."],
  ["ARE:Dubai", "Dubai grew from creek trading into a huge air, port, tourism, and skyscraper hub on the Persian Gulf."],
  ["BOL:La Paz", "La Paz sits in a deep Andean bowl at very high altitude, with cable cars acting like public transport in the sky."],
  ["BOL:Santa Cruz", "Santa Cruz is Bolivia's lowland economic engine, tied to agriculture, trade, and a much warmer climate than La Paz."],
  ["CHN:Xi'an", "Xi'an was an ancient Chinese capital and is famous for the Terracotta Army near the old Silk Road starting point."],
  ["DZA:Algiers", "Algiers climbs hills above the Mediterranean, with a historic Casbah and a port linking North Africa to Europe."],
  ["ECU:Guayaquil", "Guayaquil is Ecuador's main Pacific port and a key gateway for trade, seafood, and trips toward the Galapagos."],
  ["ECU:Quito", "Quito is a high Andean capital close to the Equator, with volcanoes around it and a large historic centre."],
  ["FJI:Nadi", "Nadi is Fiji's main international gateway, so many visitors pass through it before heading to island resorts."],
  ["FJI:Suva", "Suva is Fiji's capital and a major South Pacific port, with markets, universities, rugby, and regional politics."],
  ["GRC:Thessaloniki", "Thessaloniki is a northern Greek port city known for Byzantine history, student life, and rich food culture."],
  ["HRV:Zagreb", "Zagreb has trams, cafe culture, and old Austro-Hungarian streets, with Adriatic coast trips not far away."],
  ["IDN:Denpasar", "Denpasar anchors Bali's urban life, linking Hindu temple culture, tourism, beaches, and volcanic landscapes nearby."],
  ["IND:Chennai", "Chennai sits on the Bay of Bengal and is known for Tamil film, car manufacturing, cricket, and hot coastal weather."],
  ["IND:Hyderabad", "Hyderabad is known for biryani, the Charminar, pearls, and a large technology industry on the Deccan Plateau."],
  ["IND:New Delhi", "New Delhi is India's planned capital district, with government buildings, monuments, and wide avenues from the early 1900s."],
  ["IRN:Tehran", "Tehran sits below the Alborz Mountains, where winter snow and summer heat can both shape city life."],
  ["IRQ:Baghdad", "Baghdad grew beside the Tigris River and was one of the great centres of learning during the Abbasid era."],
  ["ISL:Reykjavik", "Reykjavik is powered heavily by geothermal heat and has long summer daylight despite its cold North Atlantic setting."],
  ["ISR:Jerusalem", "Jerusalem's old city is sacred to Judaism, Christianity, and Islam, making religion central to its geography."],
  ["ISR:Tel Aviv-Yafo", "Tel Aviv-Yafo is known for Mediterranean beaches, nightlife, technology companies, and white Bauhaus-style buildings."],
  ["ITA:Florence", "Florence sits on the Arno River and is famous for Renaissance art, leather, food, and a compact historic centre."],
  ["ITA:Turin", "Turin sits near the Alps and is tied to Fiat cars, chocolate, football, and Italy's royal history."],
  ["JOR:Amman", "Amman spreads over hills and mixes Roman ruins, busy markets, and modern Levantine food culture."],
  ["JPN:Nagoya", "Nagoya is a major manufacturing city, especially for cars and aircraft, and sits between Tokyo and Osaka."],
  ["JPN:Sapporo", "Sapporo is famous for its snow festival, winter sport, ramen, and beer in Japan's northern island of Hokkaido."],
  ["JPN:Yokohama", "Yokohama grew as an international port beside Tokyo and is known for its waterfront and large Chinatown."],
  ["LBN:Beirut", "Beirut is a Mediterranean port city known for food, music, universities, and a long history of trade."],
  ["LKA:Colombo", "Colombo is Sri Lanka's biggest urban hub, with an Indian Ocean port, markets, cricket, and colonial-era streets."],
  ["MAR:Rabat", "Rabat is Morocco's Atlantic capital, with government districts, ocean air, and the old Kasbah of the Udayas."],
  ["MEX:Monterrey", "Monterrey is a major industrial city framed by steep mountains and known for business, grilling, and football."],
  ["NOR:Bergen", "Bergen is a rainy west-coast port surrounded by mountains and fjords, with a historic wooden wharf."],
  ["NPL:Kathmandu", "Kathmandu sits in a valley packed with temples and is a gateway for trekkers heading toward the Himalayas."],
  ["NZL:Christchurch", "Christchurch is the main city of New Zealand's South Island and rebuilt many areas after major earthquakes."],
  ["PAK:Islamabad", "Islamabad is a planned capital at the foot of the Margalla Hills, built to feel greener and calmer than Karachi."],
  ["PAK:Karachi", "Karachi is Pakistan's biggest city and main Arabian Sea port, with finance, food, cricket, and intense summer heat."],
  ["PAK:Lahore", "Lahore is famous for Mughal landmarks, food streets, gardens, cricket, and a deep Punjabi cultural identity."],
  ["PHL:Cebu City", "Cebu City is a Visayas trade hub known for Spanish-era history, lechon, and the Sinulog festival."],
  ["PHL:Quezon City", "Quezon City is part of Metro Manila and is known for universities, media networks, and busy urban sprawl."],
  ["QAT:Doha", "Doha grew rapidly with natural gas wealth and hosted the 2022 FIFA World Cup on the Persian Gulf coast."],
  ["ROU:Bucharest", "Bucharest is known for wide boulevards, parks, lively cafes, and the enormous Palace of Parliament."],
  ["SRB:Belgrade", "Belgrade sits where the Sava meets the Danube and is known for its fortress, nightlife, and Balkan crossroads role."],
  ["TUN:Tunis", "Tunis sits near the Mediterranean and ancient Carthage, with old markets and a long North African trade history."],
  ["TWN:Kaohsiung", "Kaohsiung is one of Taiwan's biggest port cities, with night markets, temples, and a warm southern climate."],
  ["TZA:Dar es Salaam", "Dar es Salaam is Tanzania's largest city and Indian Ocean business port, with ferries toward Zanzibar."],
  ["URY:Montevideo", "Montevideo faces the Rio de la Plata and is known for beaches, football, mate culture, and a relaxed waterfront."],
  ["VUT:Luganville", "Luganville sits on Espiritu Santo and is known for diving, World War II sites, and blue holes nearby."],
  ["VUT:Port-Vila", "Port-Vila is Vanuatu's harbour capital, with markets, tourism, French and English influences, and cyclone-season weather."],
  ["ZAF:Cape Town", "Cape Town sits below Table Mountain where Atlantic and Indian Ocean influences meet."],
  ["ZAF:Durban", "Durban is famous for warm beaches, a busy port, and bunny chow, a curry served in hollowed-out bread."],
  ["ZAF:Johannesburg", "Johannesburg grew from a gold rush and remains South Africa's biggest economic centre."],
  ["ZAF:Pretoria", "Pretoria is known for jacaranda-lined streets and is one of South Africa's capital cities."],
  ["ZWE:Bulawayo", "Bulawayo grew as a rail and industrial centre and sits near Matobo National Park's granite hills and rock art."],
  ["ZWE:Harare", "Harare is Zimbabwe's capital, set on a high plateau with jacaranda-lined streets and mild weather."]
]);

const state = {
  mapReady: false,
  mapError: false,
  config: {
    places: 5,
    difficulty: "easy",
    theme: "classroom"
  },
  countries: [],
  countryByMapId: new Map(),
  featureByMapId: new Map(),
  displayFeatureByMapId: new Map(),
  geoFeatures: [],
  displayGeoFeatures: [],
  targets: [],
  target: null,
  roundIndex: 0,
  score: 0,
  maxScore: 0,
  roundScore: 0,
  roundResults: {},
  roundOutcomes: [],
  currentOutcome: null,
  stage: "menu",
  activeBounds: null,
  revealBounds: null,
  townChoices: [],
  selectedContinent: null,
  countryRevealed: false,
  feedback: null,
  flagChoices: [],
  flagAnswered: false,
  selectedFlagIso2: null,
  mapLayer: null,
  zoom: null,
  zoomTransform: d3.zoomIdentity,
  currentProjection: null,
  satelliteLayer: null,
  targetCueTimer: null,
  pendingChoice: null
};

const els = {
  body: document.body,
  menuScreen: document.querySelector("#menuScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  setupForm: document.querySelector("#setupForm"),
  placesInput: document.querySelector("#placesInput"),
  placesOutput: document.querySelector("#placesOutput"),
  difficultyControl: document.querySelector("#difficultyControl"),
  themeControl: document.querySelector("#themeControl"),
  loadingNote: document.querySelector("#loadingNote"),
  startButton: document.querySelector("#startButton"),
  scoreLabel: document.querySelector("#scoreLabel"),
  possibleLabel: document.querySelector("#possibleLabel"),
  roundLabel: document.querySelector("#roundLabel"),
  targetName: document.querySelector("#targetName"),
  targetMeta: document.querySelector("#targetMeta"),
  stepList: document.querySelector("#stepList"),
  roundScoreLabel: document.querySelector("#roundScoreLabel"),
  newGameButton: document.querySelector("#newGameButton"),
  stageLabel: document.querySelector("#stageLabel"),
  stagePrompt: document.querySelector("#stagePrompt"),
  hoverLabel: document.querySelector("#hoverLabel"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  zoomResetButton: document.querySelector("#zoomResetButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  choicePanel: document.querySelector("#choicePanel"),
  touchAnswerBar: document.querySelector("#touchAnswerBar"),
  menuMap: d3.select("#menuMap"),
  worldMap: d3.select("#worldMap")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function setHover(text) {
  els.hoverLabel.textContent = text || (usesTapConfirm() ? "Tap a highlighted map choice." : "Hover over a highlighted map choice.");
}

function usesTapConfirm() {
  return TAP_CONFIRM_QUERY.matches;
}

function isTapConfirmStage() {
  return TAP_CONFIRM_STAGES.has(state.stage);
}

function clearTouchChoiceHighlight() {
  mapLayer().selectAll(".is-touch-selected").classed("is-touch-selected", false);
}

function clearPendingChoice({ render = true } = {}) {
  state.pendingChoice = null;
  clearTouchChoiceHighlight();
  if (render) renderTouchAnswerBar();
}

function resolveChoiceLabel(label, datum) {
  const rawLabel = typeof label === "function" ? label(datum) : label;
  return String(rawLabel || "this map choice")
    .replace(/^Choose\s+(the\s+)?/i, "")
    .trim();
}

function handleSvgChoice(event, datum, handler, label) {
  if (!usesTapConfirm() || !isTapConfirmStage()) {
    handler(datum);
    return;
  }

  event.preventDefault();
  clearTouchChoiceHighlight();
  d3.select(event.currentTarget).classed("is-touch-selected", true);
  state.pendingChoice = {
    stage: state.stage,
    datum,
    handler,
    label: resolveChoiceLabel(label, datum)
  };
  setHover(state.pendingChoice.label);
  renderTouchAnswerBar();
}

function submitPendingChoice() {
  const pending = state.pendingChoice;
  if (!pending || pending.stage !== state.stage) return;
  state.pendingChoice = null;
  clearTouchChoiceHighlight();
  pending.handler(pending.datum);
}

function touchFeedbackText() {
  if (state.stage === "flag" && state.flagAnswered) {
    const correct = state.roundResults.flag === true;
    const selectedFlag = state.flagChoices.find((country) => country.iso2 === state.selectedFlagIso2);
    return correct
      ? `Correct flag. +${POINTS.flag}`
      : `You chose ${selectedFlag?.name || "another flag"}. The flag was ${state.target.country.name}.`;
  }

  return state.feedback?.text || "";
}

function nextRoundLabel() {
  return state.roundIndex + 1 >= state.targets.length ? "See Results" : "Next Place";
}

function renderTouchAnswerBar() {
  if (!els.touchAnswerBar) return;

  const inGame = !els.gameScreen.classList.contains("hidden") && state.stage !== "summary";
  const shouldShow = usesTapConfirm() && inGame && (isTapConfirmStage() || state.stage === "reveal" || (state.stage === "flag" && state.flagAnswered));

  if (!shouldShow) {
    els.touchAnswerBar.className = "touch-answer-bar hidden";
    els.touchAnswerBar.innerHTML = "";
    els.body.classList.remove("has-touch-answer-bar");
    return;
  }

  const pending = state.pendingChoice?.stage === state.stage ? state.pendingChoice : null;
  const feedbackText = touchFeedbackText();
  const isFinalFeedback = state.stage === "reveal" || (state.stage === "flag" && state.flagAnswered);
  const showRoundAction = isFinalFeedback && !pending;
  const title = pending
    ? "Selected"
    : isFinalFeedback
      ? (state.feedback?.title || (state.stage === "flag" ? "Flag result" : "Turn ended"))
      : state.feedback?.type === "good"
        ? "Correct"
        : "Tap to choose";
  const message = pending?.label || feedbackText || "Tap a map choice, then submit it.";
  let feedbackClass = "";
  if (state.stage === "flag" && state.flagAnswered) {
    feedbackClass = state.roundResults.flag === true ? "is-good" : "is-bad";
  } else if (state.feedback?.type === "good") {
    feedbackClass = "is-good";
  } else if (state.feedback?.type === "bad" || isFinalFeedback) {
    feedbackClass = "is-bad";
  }

  els.touchAnswerBar.className = ["touch-answer-bar", feedbackClass, showRoundAction ? "has-round-action" : ""].filter(Boolean).join(" ");
  els.touchAnswerBar.innerHTML = `
    <div class="touch-answer-copy">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
    ${pending ? '<button class="touch-submit-button" type="button" data-touch-submit aria-label="Submit selected answer">✓</button>' : ""}
    ${showRoundAction ? `<button class="primary-action touch-next-button" type="button" data-touch-next>${escapeHtml(nextRoundLabel())}</button>` : ""}
  `;
  els.touchAnswerBar.querySelector("[data-touch-submit]")?.addEventListener("click", submitPendingChoice);
  els.touchAnswerBar.querySelector("[data-touch-next]")?.addEventListener("click", nextRound);
  els.body.classList.add("has-touch-answer-bar");
}

function continentForCountry(country) {
  if (country.region === "Americas") {
    return country.subregion === "South America" ? "South America" : "North America";
  }

  if (country.region === "Oceania") return "Oceania";
  if (CONTINENT_BY_KEY.has(country.region)) return country.region;
  return "Oceania";
}

function continentLabel(key) {
  return CONTINENT_BY_KEY.get(key)?.label || key;
}

function isSatelliteTheme() {
  return state.config.theme === "satellite";
}

function stageIndex(key) {
  return STEPS.findIndex((step) => step.key === key);
}

function currentStepLabel() {
  const step = STEPS.find((item) => item.key === state.stage);
  if (step) return step.label;
  if (state.stage === "reveal") return "Answer";
  if (state.stage === "summary") return "Results";
  return "Map";
}

function currentPrompt() {
  if (state.stage === "summary") return "Review the places from this game.";
  if (!state.target) return "Choose your game settings.";
  const city = state.target.city.name;

  if (state.stage === "hemisphere") return `Find ${city}. Choose the hemisphere.`;
  if (state.stage === "continent") return "Choose the continent.";
  if (state.stage === "country") return state.selectedContinent
    ? `Choose the country in ${continentLabel(state.selectedContinent)}.`
    : "Choose the country.";
  if (state.stage === "town") return "Choose the correct town or city spot.";
  if (state.stage === "flag") return `Bonus: choose the flag for ${state.target.country.name}.`;
  if (state.stage === "reveal") return "The turn is complete.";
  return "Use the map to narrow the location.";
}

function prepareCountries() {
  const source = window.INVINCIBLE_EARTH_DATA?.countries || [];
  state.countries = source
    .filter((country) => (
      country.iso2 &&
      country.iso2.length === 2 &&
      country.cities?.length &&
      !EXCLUDED_COUNTRY_ISO3.has(country.iso3)
    ))
    .map((country) => {
      const nextCountry = {
        ...country,
        continent: continentForCountry(country),
        cities: country.cities.map((city, index) => ({
          ...city,
          id: `${country.iso3}-${index}-${city.ascii}`,
          lat: Number(city.lat),
          lng: Number(city.lng),
          population: Number(city.population) || 0
        }))
      };
      return nextCountry;
    });

  rebuildCountryLookup();
}

function rebuildCountryLookup() {
  state.countryByMapId = new Map(state.countries.map((country) => [country.mapId, country]));
}

function keepCountriesWithMapFeatures() {
  state.countries = state.countries.filter((country) => state.featureByMapId.has(country.mapId));
  rebuildCountryLookup();
}

function buildDisplayMapFeatures() {
  state.displayGeoFeatures = state.geoFeatures.map((feature) => cleanedDisplayFeature(feature));
  state.displayFeatureByMapId = new Map(state.displayGeoFeatures.map((feature) => [feature.id, feature]));
}

function cleanedDisplayFeature(feature) {
  const country = state.countryByMapId.get(feature.id);
  const mainBounds = COUNTRY_MAIN_PART_BOUNDS.get(country?.iso3);

  if (!mainBounds || feature.geometry?.type !== "MultiPolygon") {
    return feature;
  }

  const coordinates = feature.geometry.coordinates.filter((polygonCoordinates) => {
    const polygon = polygonFeature(feature, polygonCoordinates);
    return boundsIntersect(normalizeBounds(d3.geoBounds(polygon)), mainBounds);
  });

  if (!coordinates.length || coordinates.length === feature.geometry.coordinates.length) {
    return feature;
  }

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates
    }
  };
}

function polygonFeature(feature, coordinates) {
  return {
    type: "Feature",
    id: feature.id,
    properties: feature.properties,
    geometry: {
      type: "Polygon",
      coordinates
    }
  };
}

function displayFeatures() {
  return state.displayGeoFeatures.length ? state.displayGeoFeatures : state.geoFeatures;
}

function displayFeatureForCountry(country) {
  if (!country) return null;
  return state.displayFeatureByMapId.get(country.mapId) || state.featureByMapId.get(country.mapId);
}

async function loadWorldMap() {
  try {
    const topology = await loadMapTopology();
    const featureCollection = topojson.feature(topology, topology.objects.countries);
    state.geoFeatures = featureCollection.features.filter((feature) => feature.id !== "010");
    state.featureByMapId = new Map(state.geoFeatures.map((feature) => [feature.id, feature]));
    keepCountriesWithMapFeatures();
    buildDisplayMapFeatures();
    state.mapReady = true;
    drawMenuPreview();
    els.loadingNote.textContent = `${state.countries.length} countries and territories ready.`;
    els.startButton.disabled = false;
  } catch (error) {
    state.mapError = true;
    els.loadingNote.textContent = "The border map could not load. Check the connection and reload.";
  }
}

async function loadMapTopology() {
  if (window.INVINCIBLE_EARTH_MAP) {
    return window.INVINCIBLE_EARTH_MAP;
  }

  const response = await fetch(WORLD_MAP_URL);
  if (!response.ok) throw new Error("Map request failed");
  return response.json();
}

function updateMenuSelection(container, attribute, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset[attribute] === value);
  });
}

function updateScore() {
  els.scoreLabel.textContent = String(state.score);
  els.possibleLabel.textContent = `/ ${state.maxScore}`;
  els.roundScoreLabel.textContent = String(state.roundScore);
}

function easyCityKey(country, city) {
  return `${country.iso3}:${city.ascii}`;
}

function isEasyCity(country, city) {
  return EASY_CITY_KEYS.has(easyCityKey(country, city));
}

function isMediumCity(country, city) {
  const key = easyCityKey(country, city);
  return EASY_CITY_KEYS.has(key) || MEDIUM_CITY_KEYS.has(key);
}

function eligibleCitiesForDifficulty(country, difficulty) {
  if (difficulty === "easy") {
    return country.cities.filter((city) => isEasyCity(country, city));
  }

  if (difficulty === "medium") {
    return country.cities.filter((city) => isMediumCity(country, city));
  }

  const allowedRank = DIFFICULTY_RANK[difficulty];
  return country.cities.filter((city) => DIFFICULTY_RANK[city.difficulty] <= allowedRank);
}

function selectTargets(count, difficulty) {
  const grouped = shuffle(
    state.countries
      .map((country) => ({
        country,
        cities: eligibleCitiesForDifficulty(country, difficulty)
      }))
      .filter((group) => group.cities.length)
  );

  const targets = [];
  const usedCities = new Set();
  let safety = 0;

  while (targets.length < count && safety < 12) {
    safety += 1;
    let added = false;

    grouped.forEach((group) => {
      if (targets.length >= count) return;
      const choices = shuffle(group.cities.filter((city) => !usedCities.has(city.id)));
      if (!choices.length) return;
      const city = choices[0];
      usedCities.add(city.id);
      targets.push({ country: group.country, city });
      added = true;
    });

    if (!added) break;
  }

  return targets.slice(0, count);
}

function startGame(event) {
  event.preventDefault();
  if (!state.mapReady) return;

  state.config.places = Number(els.placesInput.value);
  state.maxScore = state.config.places * Object.values(POINTS).reduce((sum, value) => sum + value, 0);
  state.targets = selectTargets(state.config.places, state.config.difficulty);

  if (state.targets.length < state.config.places) {
    els.loadingNote.textContent = "Not enough places are available for that setup yet.";
    return;
  }

  state.score = 0;
  state.roundOutcomes = [];
  state.currentOutcome = null;
  els.menuScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  startRound(0);
}

function startRound(index) {
  if (index >= state.targets.length) {
    finishGame();
    return;
  }

  state.roundIndex = index;
  state.target = state.targets[index];
  state.roundScore = 0;
  state.roundResults = {};
  state.currentOutcome = null;
  state.stage = "hemisphere";
  state.activeBounds = null;
  state.revealBounds = null;
  state.townChoices = [];
  state.selectedContinent = null;
  state.countryRevealed = false;
  state.feedback = null;
  state.flagChoices = [];
  state.flagAnswered = false;
  state.selectedFlagIso2 = null;
  clearPendingChoice({ render: false });
  renderStage();
  cueTargetName();
}

function cueTargetName() {
  const roundBlock = els.targetName.closest(".round-block");
  window.clearTimeout(state.targetCueTimer);
  els.targetName.classList.remove("target-name-cue");
  roundBlock?.classList.remove("target-panel-cue");
  void els.targetName.offsetWidth;
  els.targetName.classList.add("target-name-cue");
  roundBlock?.classList.add("target-panel-cue");
  state.targetCueTimer = window.setTimeout(() => {
    els.targetName.classList.remove("target-name-cue");
    roundBlock?.classList.remove("target-panel-cue");
  }, 1800);
}

function restartToMenu() {
  state.stage = "menu";
  state.target = null;
  state.targets = [];
  state.score = 0;
  state.maxScore = 0;
  state.roundScore = 0;
  state.roundOutcomes = [];
  state.currentOutcome = null;
  state.activeBounds = null;
  state.revealBounds = null;
  state.townChoices = [];
  state.selectedContinent = null;
  clearPendingChoice({ render: false });
  els.gameScreen.classList.add("hidden");
  els.menuScreen.classList.remove("hidden");
  state.selectedFlagIso2 = null;
  updateScore();
  renderTouchAnswerBar();
}

function renderHud() {
  updateScore();

  if (!state.target) {
    els.roundLabel.textContent = "";
    els.targetName.textContent = "";
    els.targetMeta.textContent = "";
    els.stepList.innerHTML = "";
    return;
  }

  els.roundLabel.textContent = `Round ${state.roundIndex + 1} of ${state.targets.length}`;
  els.targetName.textContent = state.target.city.name;

  const showCountry = state.countryRevealed || state.stage === "reveal" || state.stage === "summary";
  const admin = state.target.city.admin ? `, ${state.target.city.admin}` : "";
  els.targetMeta.textContent = showCountry
    ? `${state.target.country.name}${admin}`
    : "Country hidden";

  els.stepList.innerHTML = STEPS.map((step) => {
    const result = state.roundResults[step.key];
    const active = state.stage === step.key;
    const className = [
      active ? "is-active" : "",
      result === true ? "is-done" : "",
      result === false ? "is-missed" : ""
    ].filter(Boolean).join(" ");
    const pointText = result === true ? `+${step.points}` : `${step.points}`;

    return `
      <li class="${className}">
        <span class="step-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(step.label)}</strong>
        <span>${escapeHtml(pointText)}</span>
      </li>
    `;
  }).join("");
}

function renderStage() {
  if (state.pendingChoice && state.pendingChoice.stage !== state.stage) {
    state.pendingChoice = null;
  }

  renderHud();
  els.stageLabel.textContent = currentStepLabel();
  els.stagePrompt.textContent = currentPrompt();
  setHover();

  if (state.stage === "hemisphere") drawHemisphereStage();
  if (state.stage === "continent") drawContinentStage();
  if (state.stage === "country") drawCountryStage();
  if (state.stage === "town") drawTownStage();
  if (state.stage === "flag" || state.stage === "reveal") drawRevealStage();
  if (state.stage === "summary") drawSummaryStage();

  renderChoicePanel();
  renderTouchAnswerBar();
}

function renderChoicePanel() {
  if (!state.target && state.stage !== "summary") {
    els.choicePanel.innerHTML = "";
    return;
  }

  if (state.stage === "flag") {
    renderFlagPanel();
    return;
  }

  if (state.stage === "reveal") {
    const feedbackClass = state.feedback?.type === "good" ? "is-good" : "is-bad";
    els.choicePanel.innerHTML = `
      <h2>${escapeHtml(state.feedback?.title || "Answer")}</h2>
      <div class="feedback ${feedbackClass}">
        <p>${escapeHtml(state.feedback?.text || "")}</p>
      </div>
      <p>${escapeHtml(revealText())}</p>
      ${factCardMarkup()}
      <button class="primary-action" id="nextRoundButton" type="button">${state.roundIndex + 1 >= state.targets.length ? "See Results" : "Next Place"}</button>
    `;
    document.querySelector("#nextRoundButton").addEventListener("click", nextRound);
    return;
  }

  if (state.stage === "summary") {
    renderSummaryPanel();
    return;
  }

  const step = STEPS.find((item) => item.key === state.stage);
  const help = {
    hemisphere: "Use the city name to pick north or south of the Equator.",
    continent: "Hover over the map. Countries light up by continent.",
    country: "Only the selected continent is active. Hover over a country shape, then choose it.",
    town: "Choose one of the four map spots for the town or city."
  };

  els.choicePanel.innerHTML = `
    <h2>${escapeHtml(step.label)}</h2>
    <p>${escapeHtml(help[state.stage])}</p>
    <div class="feedback ${state.feedback?.type === "good" ? "is-good" : ""}">
      <p>${escapeHtml(state.feedback?.text || `Correct choice earns +${step.points}. A wrong choice ends this turn.`)}</p>
    </div>
  `;
}

function revealText() {
  const city = state.target.city;
  const country = state.target.country;
  const admin = city.admin ? ` in ${city.admin}` : "";
  return `${city.name} is${admin}, ${country.name}.`;
}

function formatPopulation(value) {
  const population = Number(value) || 0;
  if (!population) return "";
  if (population >= 1000000) {
    const millions = population / 1000000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(".0", "")} million`;
  }
  if (population >= 1000) return `${Math.round(population / 1000)} thousand`;
  return population.toLocaleString();
}

function formatDegrees(value) {
  const degrees = Math.abs(Number(value) || 0);
  return degrees.toFixed(degrees >= 10 ? 1 : 2).replace(/\.0+$/, "");
}

function formatArea(value) {
  const area = Number(value) || 0;
  if (!area) return "";
  if (area >= 1000000) {
    const millions = area / 1000000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(".0", "")} million square kilometres`;
  }
  return `${Math.round(area).toLocaleString()} square kilometres`;
}

function climateFact(city) {
  const latitude = `${formatDegrees(city.lat)} degrees ${city.lat >= 0 ? "north" : "south"}`;
  const absLatitude = Math.abs(Number(city.lat) || 0);

  if (absLatitude < 7) {
    return `${city.name} is close to the Equator, so day length changes much less through the year than it does in high-latitude cities.`;
  }

  if (absLatitude < 23.5) {
    return `${city.name} is in the tropics, where heat, humidity, and wet-season patterns shape the climate more than four distinct seasons.`;
  }

  if (city.lat < -30) {
    return `${city.name} is far enough south that July is winter and January is summer, the reverse of Northern Hemisphere cities.`;
  }

  if (absLatitude > 55) {
    return `${city.name} sits at about ${latitude}, so summer days can be very long and winter daylight can be short.`;
  }

  return `${city.name} sits at about ${latitude}, which strongly influences its daylight patterns and climate.`;
}

function regionalFact(city, country) {
  const subregion = country.subregion || country.region || "";

  if (subregion.includes("Caribbean")) {
    return `${city.name}'s Caribbean setting connects the city with ports, tourism, seafood, and hurricane-season weather.`;
  }

  if (subregion.includes("South-Eastern Asia")) {
    return `${city.name} sits in Southeast Asia, where monsoon weather, street food, and sea trade often shape major cities.`;
  }

  if (subregion.includes("Western Asia")) {
    return `${city.name} is in Western Asia, a region where desert climate, oil trade, pilgrimage routes, and crossroads cities matter.`;
  }

  if (subregion.includes("Western Europe")) {
    return `${city.name} sits in Western Europe, where rivers, ports, football clubs, and rail links often explain city growth.`;
  }

  if (subregion.includes("South America")) {
    return `${city.name} is in South America, where coasts, mountain ranges, football culture, and river systems shape many major cities.`;
  }

  if (subregion.includes("Australia and New Zealand")) {
    return `${city.name} is in Australasia, where coastal cities, sport, beaches, and Southern Hemisphere seasons are central to many urban identities.`;
  }

  return "";
}

function cityFact() {
  const city = state.target.city;
  const country = state.target.country;
  const key = easyCityKey(country, city);
  const customFact = CITY_FACTS.get(key);
  if (customFact) return customFact;

  const population = formatPopulation(city.population);
  const area = formatArea(country.area);

  if (population && city.population >= 10000000) {
    return `${city.name} has about ${population} people, which is larger than the population of many countries.`;
  }

  if (population && city.population >= 1000000) {
    return `${city.name} is a major urban centre, with about ${population} people.`;
  }

  const regionFact = regionalFact(city, country);
  if (regionFact) return regionFact;

  if (area && country.area <= 1500) {
    return `${country.name} covers only about ${area}, so ${city.name} sits within a very compact national territory.`;
  }

  if (city.capital === "primary") {
    return `${city.name} matters politically: as ${country.name}'s capital, it is where government, embassies, and national events cluster.`;
  }

  if (population) {
    return `${city.name} has about ${population} people, making it much smaller than the world's headline megacities.`;
  }

  return climateFact(city);
}

function factCardMarkup() {
  return `
    <div class="fact-card">
      <strong>Quick fact</strong>
      <p>${escapeHtml(cityFact())}</p>
    </div>
  `;
}

function renderFlagPanel() {
  if (state.flagAnswered) {
    const correct = state.roundResults.flag === true;
    const selectedFlag = state.flagChoices.find((country) => country.iso2 === state.selectedFlagIso2);
    const missedText = `You chose ${selectedFlag?.name || "another flag"}. The flag was ${state.target.country.name}.`;
    els.choicePanel.innerHTML = `
      <h2>${correct ? "Bonus earned" : "Bonus missed"}</h2>
      <div class="feedback ${correct ? "is-good" : "is-bad"}">
        <p>${escapeHtml(correct ? `Correct flag. +${POINTS.flag}` : missedText)}</p>
      </div>
      ${factCardMarkup()}
      <button class="primary-action" id="nextRoundButton" type="button">${state.roundIndex + 1 >= state.targets.length ? "See Results" : "Next Place"}</button>
    `;
    document.querySelector("#nextRoundButton").addEventListener("click", nextRound);
    return;
  }

  els.choicePanel.innerHTML = `
    <h2>Flag bonus</h2>
    <p>Choose the flag of ${escapeHtml(state.target.country.name)} for +${POINTS.flag}.</p>
    <div class="flag-grid">
      ${state.flagChoices.map((country, index) => `
        <button class="flag-choice" type="button" data-flag="${escapeHtml(country.iso2)}" aria-label="Choose flag option ${index + 1}">
          <img src="${FLAG_URL}${country.iso2.toLowerCase()}.png" alt="" loading="lazy">
          <span>Option ${index + 1}</span>
        </button>
      `).join("")}
    </div>
  `;

  els.choicePanel.querySelectorAll("[data-flag]").forEach((button) => {
    button.addEventListener("click", () => chooseFlag(button.dataset.flag));
  });
}

function renderSummaryPanel() {
  const total = state.maxScore;
  const percent = total ? (state.score / total) * 100 : 0;
  const title = resultTitle(percent);

  els.choicePanel.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    <p>You scored ${state.score} out of ${total}.</p>
    <div class="summary-list">
      ${state.roundOutcomes.map((outcome) => `
        <div class="summary-item" data-result-id="${escapeHtml(outcome.id)}" tabindex="0">
          <strong>${escapeHtml(outcome.city)}</strong>
          <span>${escapeHtml(outcome.country)} - ${outcome.found ? "Located" : "Turn ended"} - ${outcome.score} points</span>
        </div>
      `).join("")}
    </div>
    <button class="primary-action" id="playAgainButton" type="button">Play Again</button>
  `;
  document.querySelector("#playAgainButton").addEventListener("click", restartToMenu);
  wireSummaryHover();
}

function resultTitle(percent) {
  if (percent > 85) return "Invincible Explorer";
  if (percent >= 70) return "Veteran Explorer";
  if (percent >= 50) return "Experienced Explorer";
  if (percent >= 25) return "Young Explorer";
  return "Rookie";
}

function wireSummaryHover() {
  els.choicePanel.querySelectorAll("[data-result-id]").forEach((item) => {
    item.addEventListener("mouseenter", () => setSummaryHighlight(item.dataset.resultId));
    item.addEventListener("mouseleave", () => setSummaryHighlight(null));
    item.addEventListener("focus", () => setSummaryHighlight(item.dataset.resultId));
    item.addEventListener("blur", () => setSummaryHighlight(null));
  });
}

function setSummaryHighlight(resultId) {
  const isActive = Boolean(resultId);
  const outcome = state.roundOutcomes.find((item) => item.id === resultId);

  els.choicePanel.querySelectorAll("[data-result-id]").forEach((item) => {
    const matches = item.dataset.resultId === resultId;
    item.classList.toggle("is-linked-highlight", isActive && matches);
    item.classList.toggle("is-linked-dimmed", isActive && !matches);
  });

  mapLayer().selectAll(".summary-city")
    .classed("is-linked-highlight", (item) => isActive && item.id === resultId)
    .classed("is-linked-dimmed", (item) => isActive && item.id !== resultId);

  setHover(outcome ? `${outcome.city}, ${outcome.country}` : null);
}

function worldProjection() {
  if (isSatelliteTheme()) {
    return d3.geoMercator()
      .scale(MAP_WIDTH / (2 * Math.PI))
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
  }

  return d3.geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: "Sphere" });
}

function clearMap() {
  els.worldMap.selectAll("*").remove();
  state.mapLayer = els.worldMap.append("g").attr("class", "map-viewport");
  state.currentProjection = null;
  state.satelliteLayer = null;
  setupZoom();
}

function mapLayer() {
  return state.mapLayer || els.worldMap;
}

function setupZoom() {
  state.zoomTransform = d3.zoomIdentity;
  state.zoom = d3.zoom()
    .scaleExtent([1, 12])
    .translateExtent([[-MAP_WIDTH, -MAP_HEIGHT], [MAP_WIDTH * 2, MAP_HEIGHT * 2]])
    .on("zoom", (event) => {
      state.zoomTransform = event.transform;
      mapLayer().attr("transform", state.zoomTransform);
      refreshSatelliteTiles();
    });

  els.worldMap.call(state.zoom);
  els.worldMap.call(state.zoom.transform, d3.zoomIdentity);
}

function zoomBy(factor) {
  if (!state.zoom) return;
  els.worldMap.transition().duration(160).call(state.zoom.scaleBy, factor);
}

function resetZoom() {
  if (!state.zoom) return;
  els.worldMap.transition().duration(160).call(state.zoom.transform, d3.zoomIdentity);
}

function drawWorldBase(projection, path) {
  state.currentProjection = projection;

  mapLayer().append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere")
    .attr("d", path);

  if (isSatelliteTheme()) {
    state.satelliteLayer = mapLayer().append("g").attr("class", "satellite-layer");
    refreshSatelliteTiles();
    return;
  }

  state.satelliteLayer = null;
  drawGraticule(mapLayer(), path);
}

function drawGraticule(layer, path) {
  layer.append("path")
    .datum(d3.geoGraticule10())
    .attr("class", "graticule")
    .attr("d", path);
}

function refreshSatelliteTiles() {
  if (!isSatelliteTheme() || !state.satelliteLayer || !state.currentProjection) return;
  drawSatelliteTileLayer(state.satelliteLayer, state.currentProjection, state.zoomTransform);
}

function drawSatelliteTileLayer(layer, projection, transform = d3.zoomIdentity) {
  const bounds = satelliteGeoBounds(projection, transform);
  if (!bounds) {
    layer.selectAll("*").remove();
    return;
  }

  let zoom = satelliteZoomForBounds(bounds, transform.k || 1);
  let tiles = satelliteTilesForBounds(bounds, zoom, projection);

  while (tiles.length > SATELLITE_MAX_TILES && zoom > SATELLITE_MIN_ZOOM) {
    zoom -= 1;
    tiles = satelliteTilesForBounds(bounds, zoom, projection);
  }

  layer.selectAll("image")
    .data(tiles, (tile) => tile.key)
    .join(
      (enter) => enter.append("image")
        .attr("class", "satellite-tile")
        .attr("preserveAspectRatio", "none")
        .attr("href", (tile) => tile.href)
        .attr("x", (tile) => tile.x)
        .attr("y", (tile) => tile.y)
        .attr("width", (tile) => tile.width)
        .attr("height", (tile) => tile.height),
      (update) => update
        .attr("href", (tile) => tile.href)
        .attr("x", (tile) => tile.x)
        .attr("y", (tile) => tile.y)
        .attr("width", (tile) => tile.width)
        .attr("height", (tile) => tile.height),
      (exit) => exit.remove()
    );
}

function satelliteGeoBounds(projection, transform) {
  const padding = 80;
  const topLeft = transform.invert([-padding, -padding]);
  const bottomRight = transform.invert([MAP_WIDTH + padding, MAP_HEIGHT + padding]);
  const viewport = [
    [Math.min(topLeft[0], bottomRight[0]), Math.min(topLeft[1], bottomRight[1])],
    [Math.max(topLeft[0], bottomRight[0]), Math.max(topLeft[1], bottomRight[1])]
  ];
  const corners = [
    viewport[0],
    [viewport[1][0], viewport[0][1]],
    viewport[1],
    [viewport[0][0], viewport[1][1]]
  ]
    .map((point) => projection.invert(point))
    .filter(Boolean);

  if (!corners.length) return null;

  const longitudes = corners.map((point) => clampLongitude(point[0]));
  const latitudes = corners.map((point) => clampMercatorLatitude(point[1]));
  const west = Math.max(-180, Math.min(...longitudes));
  const east = Math.min(180, Math.max(...longitudes));
  const south = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(...latitudes));
  const north = Math.min(WEB_MERCATOR_MAX_LAT, Math.max(...latitudes));

  if (east <= west || north <= south) return null;
  return [[west, south], [east, north]];
}

function satelliteZoomForBounds(bounds, scale) {
  const [[west], [east]] = bounds;
  const lonSpan = Math.max(east - west, 0.02);
  const baseZoom = Math.ceil(Math.log2((MAP_WIDTH / SATELLITE_TILE_SIZE) * (360 / lonSpan)));
  const zoomBoost = scale > 1 ? Math.ceil(Math.log2(scale)) : 0;
  return Math.max(SATELLITE_MIN_ZOOM, Math.min(SATELLITE_MAX_ZOOM, baseZoom + zoomBoost));
}

function satelliteTilesForBounds(bounds, zoom, projection) {
  const [[west, south], [east, north]] = bounds;
  const maxTile = (2 ** zoom) - 1;
  const northWest = lonLatToTile(west, north, zoom);
  const southEast = lonLatToTile(east, south, zoom);
  const startX = Math.max(0, Math.floor(northWest.x) - 1);
  const endX = Math.min(maxTile, Math.floor(southEast.x) + 1);
  const startY = Math.max(0, Math.floor(northWest.y) - 1);
  const endY = Math.min(maxTile, Math.floor(southEast.y) + 1);
  const tiles = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      const tileBounds = tileToLonLatBounds(x, y, zoom);
      const topLeft = projection([tileBounds.west, tileBounds.north]);
      const bottomRight = projection([tileBounds.east, tileBounds.south]);
      if (!topLeft || !bottomRight) continue;
      const width = bottomRight[0] - topLeft[0];
      const height = bottomRight[1] - topLeft[1];
      if (width <= 0 || height <= 0) continue;

      tiles.push({
        key: `${zoom}-${x}-${y}`,
        href: `${SATELLITE_TILE_URL}/${zoom}/${y}/${x}`,
        x: topLeft[0],
        y: topLeft[1],
        width: width + 0.5,
        height: height + 0.5
      });
    }
  }

  return tiles;
}

function lonLatToTile(lng, lat, zoom) {
  const scale = 2 ** zoom;
  const clampedLat = clampMercatorLatitude(lat);
  const radians = clampedLat * Math.PI / 180;

  return {
    x: ((clampLongitude(lng) + 180) / 360) * scale,
    y: (1 - Math.log(Math.tan(radians) + (1 / Math.cos(radians))) / Math.PI) / 2 * scale
  };
}

function tileToLonLatBounds(x, y, zoom) {
  const scale = 2 ** zoom;
  const west = (x / scale) * 360 - 180;
  const east = ((x + 1) / scale) * 360 - 180;
  const north = tileYToLatitude(y, scale);
  const south = tileYToLatitude(y + 1, scale);
  return { west, east, south, north };
}

function tileYToLatitude(y, scale) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
}

function clampLongitude(value) {
  return Math.max(-180, Math.min(180, Number(value) || 0));
}

function clampMercatorLatitude(value) {
  return Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, Number(value) || 0));
}

function drawMenuPreview() {
  els.menuMap.selectAll("*").remove();
  const projection = worldProjection();
  const path = d3.geoPath(projection);
  const layer = els.menuMap.append("g").attr("class", "menu-map-layer");

  layer.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere")
    .attr("d", path);

  if (isSatelliteTheme()) {
    drawSatelliteTileLayer(layer.append("g").attr("class", "satellite-layer"), projection);
  } else {
    drawGraticule(layer, path);
  }

  layer.append("g")
    .selectAll("path")
    .data(displayFeatures())
    .join("path")
    .attr("class", "land country-muted")
    .attr("d", path);
}

function bindSvgChoice(selection, handler, label) {
  selection
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", label)
    .on("keydown", (event, datum) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSvgChoice(event, datum, handler, label);
      }
    })
    .on("click", (event, datum) => handleSvgChoice(event, datum, handler, label));
}

function continentFromDatum(datum) {
  return datum?.continent || state.countryByMapId.get(datum?.id)?.continent || null;
}

function setContinentHover(continent) {
  mapLayer().selectAll(".continent-choice")
    .classed("is-continent-hovered", (datum) => Boolean(continent && continentFromDatum(datum) === continent))
    .classed("is-continent-dimmed", (datum) => Boolean(continent && continentFromDatum(datum) !== continent));

  setHover(continent ? continentLabel(continent) : null);
}

function setCountryHover(country) {
  const mapId = country?.mapId || null;
  mapLayer().selectAll(".country-base")
    .classed("is-country-hovered", (feature) => Boolean(mapId && feature.id === mapId));

  setHover(country ? country.name : null);
}

function drawHemisphereStage() {
  clearMap();
  const projection = worldProjection();
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);

  mapLayer().append("g")
    .selectAll("path")
    .data(displayFeatures())
    .join("path")
    .attr("class", "land country-muted")
    .attr("d", path);

  const equatorY = projection([0, 0])[1];
  const choices = [
    { key: "north", label: "Northern Hemisphere", x: 0, y: 0, width: MAP_WIDTH, height: equatorY },
    { key: "south", label: "Southern Hemisphere", x: 0, y: equatorY, width: MAP_WIDTH, height: MAP_HEIGHT - equatorY }
  ];

  const rects = mapLayer().append("g")
    .selectAll("rect")
    .data(choices)
    .join("rect")
    .attr("class", "hemisphere-choice")
    .attr("x", (item) => item.x)
    .attr("y", (item) => item.y)
    .attr("width", (item) => item.width)
    .attr("height", (item) => item.height)
    .on("mouseenter", (event, item) => setHover(item.label))
    .on("mouseleave", () => setHover());

  bindSvgChoice(rects, (item) => chooseHemisphere(item.key), (item) => `Choose ${item.label}`);
}

function drawContinentStage() {
  clearMap();
  const projection = worldProjection();
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);

  const countryPaths = mapLayer().append("g")
    .selectAll("path")
    .data(displayFeatures())
    .join("path")
    .attr("class", (feature) => state.countryByMapId.has(feature.id) ? "continent-choice" : "land country-muted")
    .attr("d", path)
    .style("fill", (feature) => {
      const country = state.countryByMapId.get(feature.id);
      return country ? CONTINENT_BY_KEY.get(country.continent)?.color : "var(--country)";
    })
    .style("opacity", (feature) => state.countryByMapId.has(feature.id) ? 0.76 : 0.28)
    .on("mouseenter", (event, feature) => {
      const country = state.countryByMapId.get(feature.id);
      if (country) {
        setContinentHover(country.continent);
        return;
      }
      setHover(feature.properties?.name || "Map choice");
    })
    .on("mouseleave", () => setContinentHover(null));

  bindSvgChoice(
    countryPaths.filter((feature) => state.countryByMapId.has(feature.id)),
    (feature) => chooseContinent(state.countryByMapId.get(feature.id).continent),
    (feature) => `Choose ${continentLabel(state.countryByMapId.get(feature.id)?.continent || "")}`
  );
}

function isCountrySelectable(country) {
  return Boolean(country) && (!state.selectedContinent || country.continent === state.selectedContinent);
}

function drawCountryStage() {
  clearMap();
  const projection = worldProjection();
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);

  const countryPaths = mapLayer().append("g")
    .selectAll("path")
    .data(displayFeatures())
    .join("path")
    .attr("class", (feature) => isCountrySelectable(state.countryByMapId.get(feature.id)) ? "country-base" : "land country-muted")
    .attr("d", path)
    .on("mouseenter", (event, feature) => {
      const country = state.countryByMapId.get(feature.id);
      if (country) {
        setCountryHover(country);
        return;
      }
      setHover(feature.properties?.name || "Map choice");
    })
    .on("mouseleave", () => setCountryHover(null));

  bindSvgChoice(
    countryPaths.filter((feature) => isCountrySelectable(state.countryByMapId.get(feature.id))),
    (feature) => chooseCountry(state.countryByMapId.get(feature.id)),
    (feature) => `Choose ${state.countryByMapId.get(feature.id)?.name || "country"}`
  );
}

function drawTownStage() {
  clearMap();
  let bounds = state.activeBounds || getPlayableBounds(state.target.country);
  if (!state.townChoices.length) {
    state.townChoices = buildTownChoices();
    state.activeBounds = townChoiceBounds(state.townChoices, state.target.country);
    bounds = state.activeBounds;
  }

  const projection = localProjection(bounds);
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);
  drawLocalMapContext(path, bounds);
  drawLocalCountryBackdrop(path, bounds);

  const spots = state.townChoices
    .map((choice) => ({ ...choice, point: projection([choice.lng, choice.lat]) }))
    .filter((choice) => choice.point);
  const displaySpots = spreadTownSpots(spots);

  mapLayer().append("g")
    .selectAll("line")
    .data(displaySpots.filter((choice) => townSpotOffset(choice) > 6))
    .join("line")
    .attr("class", "town-leader-line")
    .attr("x1", (choice) => choice.point[0])
    .attr("y1", (choice) => choice.point[1])
    .attr("x2", (choice) => choice.displayPoint[0])
    .attr("y2", (choice) => choice.displayPoint[1]);

  const spotGroups = mapLayer().append("g")
    .selectAll("g")
    .data(displaySpots)
    .join("g")
    .attr("class", "town-choice")
    .attr("transform", (choice) => `translate(${choice.displayPoint[0]}, ${choice.displayPoint[1]})`);

  spotGroups.append("circle")
    .attr("class", "town-hit-area")
    .attr("r", 20);

  spotGroups.append("circle")
    .attr("class", "town-spot-ring")
    .attr("r", 11);

  spotGroups.append("circle")
    .attr("class", "town-spot")
    .attr("r", 5.8);

  bindSvgChoice(spotGroups, chooseTownChoice, (choice) => `Choose town option ${choice.label}`);
}

function spreadTownSpots(spots) {
  const next = spots.map((spot, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(spots.length, 1);
    return {
      ...spot,
      displayPoint: [
        spot.point[0] + Math.cos(angle) * 0.4,
        spot.point[1] + Math.sin(angle) * 0.4
      ]
    };
  });
  const margin = 26;

  for (let pass = 0; pass < 90; pass += 1) {
    next.forEach((spot) => {
      spot.displayPoint[0] += (spot.point[0] - spot.displayPoint[0]) * 0.035;
      spot.displayPoint[1] += (spot.point[1] - spot.displayPoint[1]) * 0.035;
    });

    for (let firstIndex = 0; firstIndex < next.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < next.length; secondIndex += 1) {
        const first = next[firstIndex];
        const second = next[secondIndex];
        let dx = second.displayPoint[0] - first.displayPoint[0];
        let dy = second.displayPoint[1] - first.displayPoint[1];
        let distance = Math.hypot(dx, dy);

        if (distance < 0.001) {
          const angle = ((firstIndex + secondIndex + 1) / next.length) * Math.PI * 2;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }

        if (distance >= MIN_TOWN_SPOT_DISPLAY_DISTANCE) continue;
        const push = (MIN_TOWN_SPOT_DISPLAY_DISTANCE - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        first.displayPoint[0] -= ux * push;
        first.displayPoint[1] -= uy * push;
        second.displayPoint[0] += ux * push;
        second.displayPoint[1] += uy * push;
      }
    }

    next.forEach((spot) => {
      spot.displayPoint[0] = Math.max(margin, Math.min(MAP_WIDTH - margin, spot.displayPoint[0]));
      spot.displayPoint[1] = Math.max(margin, Math.min(MAP_HEIGHT - margin, spot.displayPoint[1]));
    });
  }

  return next;
}

function townSpotOffset(choice) {
  return Math.hypot(choice.displayPoint[0] - choice.point[0], choice.displayPoint[1] - choice.point[1]);
}

function drawLocalMapContext(path, bounds) {
  const contextBounds = expandBounds(bounds, 1.2, 1);
  const contextFeatures = displayFeatures().filter((feature) => boundsIntersect(d3.geoBounds(feature), contextBounds));

  mapLayer().append("g")
    .selectAll("path")
    .data(contextFeatures)
    .join("path")
    .attr("class", "land local-context")
    .attr("d", path);
}

function drawLocalCountryBackdrop(path, bounds = getPlayableBounds(state.target.country)) {
  const country = state.target.country;
  const feature = displayFeatureForCountry(country);
  if (feature) {
    mapLayer().append("path")
      .datum(feature)
      .attr("class", "country-selected")
      .attr("d", path);
  }

  if (!feature || needsRegionalContext(country)) {
    mapLayer().append("path")
      .datum(boundsPolygon(cityFocusBounds(state.target.city, bounds)))
      .attr("class", "territory-outline")
      .attr("d", path);
  }
}

function drawRevealStage() {
  clearMap();
  const bounds = state.revealBounds || state.activeBounds || getPlayableBounds(state.target.country);
  const projection = localProjection(bounds);
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);

  drawLocalMapContext(path, bounds);
  drawLocalCountryBackdrop(path, bounds);

  mapLayer().append("path")
    .datum(boundsPolygon(cityFocusBounds(state.target.city, bounds)))
    .attr("class", "answer-focus")
    .attr("d", path);
  drawCityMarker(projection);
}

function drawSummaryStage() {
  clearMap();
  const projection = worldProjection();
  const path = d3.geoPath(projection);
  drawWorldBase(projection, path);

  mapLayer().append("g")
    .selectAll("path")
    .data(displayFeatures())
    .join("path")
    .attr("class", "land country-muted")
    .attr("d", path);

  const markers = state.roundOutcomes
    .map((outcome) => ({ ...outcome, point: projection([outcome.lng, outcome.lat]) }))
    .filter((item) => item.point);

  const markerGroups = mapLayer().append("g")
    .selectAll("g")
    .data(markers)
    .join("g")
    .attr("class", "summary-city")
    .attr("data-result-id", (item) => item.id)
    .attr("tabindex", 0)
    .attr("aria-label", (item) => `${item.city}, ${item.country}`)
    .attr("transform", (item) => `translate(${item.point[0]}, ${item.point[1]})`)
    .on("mouseenter", (event, item) => setSummaryHighlight(item.id))
    .on("mouseleave", () => setSummaryHighlight(null))
    .on("focus", (event, item) => setSummaryHighlight(item.id))
    .on("blur", () => setSummaryHighlight(null));

  markerGroups.append("circle")
    .attr("class", "summary-marker-hit")
    .attr("r", 22);

  markerGroups.append("circle")
    .attr("class", "summary-marker-ring")
    .attr("r", 13);

  markerGroups.append("circle")
    .attr("class", "city-marker summary-marker-dot")
    .attr("r", (item) => item.found ? 7.5 : 6.8)
    .style("fill", (item) => item.found ? "var(--good)" : "var(--bad)");
}

function drawCityMarker(projection) {
  const point = projection([state.target.city.lng, state.target.city.lat]);
  if (!point) return;

  const group = mapLayer().append("g")
    .attr("aria-label", `${state.target.city.name} location`);

  group.append("circle")
    .attr("class", "city-ring")
    .attr("cx", point[0])
    .attr("cy", point[1])
    .attr("r", 13);

  group.append("circle")
    .attr("class", "city-marker")
    .attr("cx", point[0])
    .attr("cy", point[1])
    .attr("r", 5.8);
}

function localProjection(bounds) {
  const feature = boundsPolygon(bounds);
  return d3.geoMercator().fitExtent([[34, 28], [MAP_WIDTH - 34, MAP_HEIGHT - 28]], feature);
}

function getPlayableBounds(country) {
  const feature = displayFeatureForCountry(country);
  let bounds = null;

  if (feature) {
    bounds = normalizeBounds(d3.geoBounds(feature));
  }

  const width = bounds ? bounds[1][0] - bounds[0][0] : 0;
  const height = bounds ? bounds[1][1] - bounds[0][1] : 0;

  if (needsRegionalContext(country)) {
    return regionalBoundsForCountry(country);
  }

  if (!bounds || width > 120 || height > 72 || country.area < 1000) {
    bounds = cityBounds(country.cities, country);
  }

  return padBounds(bounds, country);
}

function needsRegionalContext(country) {
  return !state.featureByMapId.has(country.mapId) || country.area < 1500;
}

function regionalBoundsForCountry(country) {
  const cityArea = cityBounds(country.cities, country);
  const [[west, south], [east, north]] = normalizeBounds(cityArea);
  const centerLng = Number.isFinite(country.lng) ? country.lng : (west + east) / 2;
  const centerLat = Number.isFinite(country.lat) ? country.lat : (south + north) / 2;
  const lonRadius = country.area < 500 ? 5.2 : 8;
  const latRadius = country.area < 500 ? 3.4 : 5;

  return normalizeBounds([
    [centerLng - lonRadius, centerLat - latRadius],
    [centerLng + lonRadius, centerLat + latRadius]
  ]);
}

function cityBounds(cities, country) {
  const lats = cities.map((city) => city.lat).filter(Number.isFinite);
  const lngs = cities.map((city) => city.lng).filter(Number.isFinite);

  if (!lats.length || !lngs.length) {
    return [[country.lng - 1, country.lat - 1], [country.lng + 1, country.lat + 1]];
  }

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

function cityFocusBounds(city, bounds) {
  const [[west, south], [east, north]] = bounds;
  const lonHalf = Math.max((east - west) * 0.045, 0.35);
  const latHalf = Math.max((north - south) * 0.045, 0.35);

  return [
    [Math.max(west, city.lng - lonHalf), Math.max(south, city.lat - latHalf)],
    [Math.min(east, city.lng + lonHalf), Math.min(north, city.lat + latHalf)]
  ];
}

function normalizeBounds(bounds) {
  let [[west, south], [east, north]] = bounds;
  if (east < west) {
    west = -180;
    east = 180;
  }
  return [
    [Math.max(-180, west), Math.max(-85, south)],
    [Math.min(180, east), Math.min(85, north)]
  ];
}

function expandBounds(bounds, lonPad, latPad) {
  const [[west, south], [east, north]] = normalizeBounds(bounds);
  return normalizeBounds([
    [west - lonPad, south - latPad],
    [east + lonPad, north + latPad]
  ]);
}

function boundsIntersect(firstBounds, secondBounds) {
  const [[firstWest, firstSouth], [firstEast, firstNorth]] = normalizeBounds(firstBounds);
  const [[secondWest, secondSouth], [secondEast, secondNorth]] = normalizeBounds(secondBounds);

  return firstEast >= secondWest &&
    firstWest <= secondEast &&
    firstNorth >= secondSouth &&
    firstSouth <= secondNorth;
}

function padBounds(bounds, country) {
  let [[west, south], [east, north]] = normalizeBounds(bounds);
  let width = east - west;
  let height = north - south;

  if (width < 0.8) {
    const center = (east + west) / 2 || country.lng;
    west = center - 0.4;
    east = center + 0.4;
    width = 0.8;
  }

  if (height < 0.8) {
    const center = (north + south) / 2 || country.lat;
    south = center - 0.4;
    north = center + 0.4;
    height = 0.8;
  }

  const lonPad = Math.max(width * 0.08, 0.28);
  const latPad = Math.max(height * 0.08, 0.28);

  return [
    [Math.max(-180, west - lonPad), Math.max(-85, south - latPad)],
    [Math.min(180, east + lonPad), Math.min(85, north + latPad)]
  ];
}

function boundsPolygon(bounds) {
  const [[west, south], [east, north]] = bounds;
  return {
    type: "Polygon",
    coordinates: [[
      [west, south],
      [west, north],
      [east, north],
      [east, south],
      [west, south]
    ]]
  };
}

function buildTownChoices() {
  const country = state.target.country;
  const targetCity = state.target.city;
  const choices = [townChoiceFromCity(targetCity, true)];
  const used = new Set([townChoiceKey(choices[0])]);
  const sameCountryCities = namedTownCandidates(targetCity, used);

  while (choices.length < 4 && sameCountryCities.length) {
    const ranked = sameCountryCities
      .map((choice) => ({
        choice,
        score: townChoiceSpacingScore(choice, choices, country)
      }))
      .sort((first, second) => second.score - first.score);
    const next = ranked.find((item) => item.score >= MIN_TOWN_CHOICE_SCREEN_DISTANCE) || ranked[0];
    const choice = next.choice;
    sameCountryCities.splice(sameCountryCities.indexOf(choice), 1);
    if (used.has(townChoiceKey(choice))) continue;
    used.add(townChoiceKey(choice));
    choices.push(choice);
  }

  return shuffle(choices).map((choice, index) => ({
    ...choice,
    label: TOWN_SPOT_LABELS[index]
  }));
}

function namedTownCandidates(targetCity, used) {
  const country = state.target.country;
  const dataCities = country.cities
    .filter((city) => city.id !== targetCity.id)
    .map((city) => townChoiceFromCity(city, false));
  const supplementalCities = supplementalTownChoicesForCountry(country)
    .map((city) => townChoiceFromSupplemental(city, country));

  return [...dataCities, ...supplementalCities]
    .filter((choice) => !used.has(townChoiceKey(choice)));
}

function townChoiceFromCity(city, correct) {
  return {
    id: city.id,
    name: city.name,
    lat: city.lat,
    lng: city.lng,
    correct,
    generated: false
  };
}

function townChoiceFromSupplemental(city, country) {
  return {
    id: `supplemental-${country.iso3}-${city.ascii}`,
    name: city.name,
    lat: Number(city.lat),
    lng: Number(city.lng),
    correct: false,
    generated: false,
    supplemental: true
  };
}

function supplementalTownChoicesForCountry(country) {
  return SUPPLEMENTAL_TOWN_CHOICES.get(country.iso3) || [];
}

function townChoiceSpacingScore(candidate, choices, country) {
  const bounds = townChoiceBounds([...choices, candidate], country);
  const projection = localProjection(bounds);
  const candidatePoint = projection([candidate.lng, candidate.lat]);
  if (!candidatePoint) return 0;

  return Math.min(...choices.map((choice) => {
    const point = projection([choice.lng, choice.lat]);
    if (!point) return 0;
    return Math.hypot(candidatePoint[0] - point[0], candidatePoint[1] - point[1]);
  }));
}

function townChoiceKey(choice) {
  return `${Number(choice.lng).toFixed(4)}:${Number(choice.lat).toFixed(4)}`;
}

function boundsForPoints(bounds, points, country) {
  let [[west, south], [east, north]] = normalizeBounds(bounds);

  points.forEach((point) => {
    if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat)) return;
    west = Math.min(west, point.lng);
    east = Math.max(east, point.lng);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  });

  return padBounds([[west, south], [east, north]], country);
}

function townChoiceBounds(points, country) {
  return padBounds(cityBounds(points, country), country);
}

function townChoiceName(choice) {
  if (!choice) return "that spot";
  return choice.name;
}

function hemisphereLabel(choice) {
  return choice === "north" ? "Northern Hemisphere" : "Southern Hemisphere";
}

function chooseHemisphere(choice) {
  const correct = state.target.city.lat >= 0 ? "north" : "south";
  if (choice !== correct) {
    failRound("hemisphere", `You chose the ${hemisphereLabel(choice)}. ${state.target.city.name} is in the ${hemisphereLabel(correct)}.`);
    return;
  }

  completeStep("hemisphere", `Correct hemisphere. +${POINTS.hemisphere}`);
  state.stage = "continent";
  renderStage();
}

function chooseContinent(choice) {
  const correct = state.target.country.continent;
  if (choice !== correct) {
    failRound("continent", `You chose ${continentLabel(choice)}. ${state.target.city.name} is in ${continentLabel(correct)}.`);
    return;
  }

  state.selectedContinent = correct;
  completeStep("continent", `Correct continent. +${POINTS.continent}`);
  state.stage = "country";
  renderStage();
}

function chooseCountry(country) {
  if (!country) return;
  if (country.iso3 !== state.target.country.iso3) {
    failRound("country", `You chose ${country.name}. ${state.target.city.name} is in ${state.target.country.name}.`);
    return;
  }

  state.countryRevealed = true;
  state.activeBounds = getPlayableBounds(state.target.country);
  state.townChoices = buildTownChoices();
  state.activeBounds = townChoiceBounds(state.townChoices, state.target.country);
  completeStep("country", `Correct country. +${POINTS.country}`);
  state.stage = "town";
  renderStage();
}

function chooseTownChoice(choice) {
  if (!choice) return;

  if (!choice.correct) {
    failRound("town", `You chose ${townChoiceName(choice)}. The correct answer was ${state.target.city.name}.`);
    return;
  }

  completeStep("town", `Correct town. +${POINTS.town}`);
  beginFlagBonus();
  renderStage();
}

function completeStep(key, message) {
  state.roundResults[key] = true;
  state.score += POINTS[key];
  state.roundScore += POINTS[key];
  state.feedback = { type: "good", text: message };
}

function failRound(key, message) {
  state.roundResults[key] = false;
  state.countryRevealed = true;
  state.feedback = {
    type: "bad",
    title: "Turn ended",
    text: message
  };
  state.revealBounds = boundsForPoints(state.activeBounds || getPlayableBounds(state.target.country), [state.target.city], state.target.country);
  state.currentOutcome = makeOutcome(false, false);
  state.stage = "reveal";
  renderStage();
}

function beginFlagBonus() {
  state.countryRevealed = true;
  state.stage = "flag";
  state.selectedFlagIso2 = null;
  state.flagChoices = buildFlagChoices();
}

function buildFlagChoices() {
  const target = state.target.country;
  const sameRegion = state.countries.filter((country) => (
    country.iso2 !== target.iso2 &&
    country.flag &&
    country.region === target.region
  ));
  const fallback = state.countries.filter((country) => country.iso2 !== target.iso2 && country.flag);
  const distractors = shuffle(sameRegion.length >= 3 ? sameRegion : fallback).slice(0, 3);
  return shuffle([target, ...distractors]);
}

function chooseFlag(iso2) {
  const correct = iso2 === state.target.country.iso2;
  state.selectedFlagIso2 = iso2;
  state.roundResults.flag = correct;
  state.flagAnswered = true;

  if (correct) {
    state.score += POINTS.flag;
    state.roundScore += POINTS.flag;
  }

  state.currentOutcome = makeOutcome(true, correct);
  renderStage();
}

function makeOutcome(found, flagCorrect) {
  return {
    id: `round-${state.roundIndex}`,
    city: state.target.city.name,
    country: state.target.country.name,
    lat: state.target.city.lat,
    lng: state.target.city.lng,
    score: state.roundScore,
    found,
    flagCorrect
  };
}

function nextRound() {
  if (state.currentOutcome) {
    state.roundOutcomes.push(state.currentOutcome);
    state.currentOutcome = null;
  }
  startRound(state.roundIndex + 1);
}

function finishGame() {
  state.stage = "summary";
  state.target = null;
  state.roundScore = 0;
  clearPendingChoice({ render: false });
  renderStage();
}

function initControls() {
  els.placesInput.addEventListener("input", () => {
    state.config.places = Number(els.placesInput.value);
    els.placesOutput.textContent = String(state.config.places);
  });

  els.difficultyControl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-difficulty]");
    if (!button) return;
    state.config.difficulty = button.dataset.difficulty;
    updateMenuSelection(els.difficultyControl, "difficulty", state.config.difficulty);
  });

  els.themeControl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-choice]");
    if (!button) return;
    state.config.theme = button.dataset.themeChoice;
    els.body.dataset.theme = state.config.theme;
    updateMenuSelection(els.themeControl, "themeChoice", state.config.theme);
    if (state.mapReady) drawMenuPreview();
  });

  els.setupForm.addEventListener("submit", startGame);
  els.newGameButton.addEventListener("click", restartToMenu);
  els.zoomOutButton.addEventListener("click", () => zoomBy(0.72));
  els.zoomResetButton.addEventListener("click", resetZoom);
  els.zoomInButton.addEventListener("click", () => zoomBy(1.38));

  const handleInputModeChange = () => {
    if (!usesTapConfirm()) clearPendingChoice({ render: false });
    setHover();
    renderTouchAnswerBar();
  };

  if (TAP_CONFIRM_QUERY.addEventListener) {
    TAP_CONFIRM_QUERY.addEventListener("change", handleInputModeChange);
  } else {
    TAP_CONFIRM_QUERY.addListener(handleInputModeChange);
  }
}

function init() {
  if (!window.d3 || !window.topojson || !window.INVINCIBLE_EARTH_DATA) {
    els.loadingNote.textContent = "Game files are still loading. Reload if this message stays here.";
    return;
  }

  prepareCountries();
  initControls();
  updateScore();
  loadWorldMap();
}

init();
